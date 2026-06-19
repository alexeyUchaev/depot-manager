import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { stripe, assertStripeConfigured, appBaseUrl } from '@/lib/stripe'
import { orderService } from './order.service'
import type { ActionResult } from '@/types/user.types'

export const paymentService = {
  
  async createOrderCheckoutSession(
    tenantId: string,
    orderId: string
  ): Promise<ActionResult<{ url: string }>> {
    try {
      assertStripeConfigured()

      const order = await prisma.order.findFirst({
        where: { id: orderId, orgId: tenantId },
        include: { items: { include: { product: true } } },
      })
      if (!order) return { success: false, error: 'Order not found' }
      if (order.paidAt) return { success: false, error: 'Order already paid' }

      const currency = order.currency ?? 'usd'
      const line_items = order.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency,
          unit_amount: Math.round(Number(item.price) * 100),
          product_data: {
            name: item.product.name,
            metadata: { sku: item.product.sku, productId: item.productId },
          },
        },
      }))

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items,
        client_reference_id: order.id,
        metadata: { kind: 'order', orderId: order.id, tenantId },
        success_url: `${appBaseUrl()}/orders?paid=1&order=${order.id}`,
        cancel_url: `${appBaseUrl()}/orders?canceled=1&order=${order.id}`,
      })

      await prisma.order.update({
        where: { id: order.id },
        data: { stripeCheckoutSessionId: session.id, currency },
      })

      if (!session.url) {
        return { success: false, error: 'Stripe did not return a checkout URL' }
      }
      return { success: true, data: { url: session.url } }
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : 'Failed to start checkout'
      return { success: false, error }
    }
  },

  
  async createSubscriptionCheckoutSession(
    tenantId: string
  ): Promise<ActionResult<{ url: string }>> {
    try {
      assertStripeConfigured()
      const priceId = process.env.STRIPE_PRICE_PRO
      if (!priceId) {
        return { success: false, error: 'STRIPE_PRICE_PRO is not set' }
      }

      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
      if (!tenant) return { success: false, error: 'Tenant not found' }

      const customerId = await ensureStripeCustomer(tenant.id)

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { kind: 'subscription', tenantId },
        success_url: `${appBaseUrl()}/company?upgraded=1`,
        cancel_url: `${appBaseUrl()}/company?canceled=1`,
      })

      if (!session.url) {
        return { success: false, error: 'Stripe did not return a checkout URL' }
      }
      return { success: true, data: { url: session.url } }
    } catch (e: unknown) {
      const error =
        e instanceof Error ? e.message : 'Failed to start subscription'
      return { success: false, error }
    }
  },

  async createBillingPortalSession(
    tenantId: string
  ): Promise<ActionResult<{ url: string }>> {
    try {
      assertStripeConfigured()
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
      if (!tenant?.stripeCustomerId) {
        return { success: false, error: 'No Stripe customer for this tenant' }
      }
      const session = await stripe.billingPortal.sessions.create({
        customer: tenant.stripeCustomerId,
        return_url: `${appBaseUrl()}/company`,
      })
      return { success: true, data: { url: session.url } }
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : 'Failed to open portal'
      return { success: false, error }
    }
  },

  async handleEvent(event: Stripe.Event): Promise<void> {
    const already = await prisma.processedStripeEvent.findUnique({
      where: { id: event.id },
    })
    if (already) return

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.metadata?.kind === 'order' && session.metadata.orderId) {
          const res = await orderService.finalizePaidOrder({
            orderId: session.metadata.orderId,
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : (session.payment_intent?.id ?? undefined),
            amountTotal: session.amount_total,
            currency: session.currency,
          })
          // Не глотаем ошибку: иначе событие пометится обработанным,
          // вебхук вернёт 200, Stripe не повторит, а заказ навсегда
          // останется в AWAITING_PAYMENT.
          if (!res.success) {
            throw new Error(`finalizePaidOrder failed: ${res.error}`)
          }
        }
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.metadata?.kind === 'order' && session.metadata.orderId) {
          const res = await orderService.cancelUnpaidOrder(
            session.metadata.orderId
          )
          if (!res.success) {
            throw new Error(`cancelUnpaidOrder failed: ${res.error}`)
          }
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await applySubscriptionState(sub)
        break
      }

      default:
        break
    }

    await prisma.processedStripeEvent.create({
      data: { id: event.id, type: event.type },
    })
  },
}

async function ensureStripeCustomer(tenantId: string): Promise<string> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) throw new Error('Tenant not found')
  if (tenant.stripeCustomerId) return tenant.stripeCustomerId

  const customer = await stripe.customers.create({
    name: tenant.name,
    metadata: { tenantId: tenant.id },
  })
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { stripeCustomerId: customer.id },
  })
  return customer.id
}

async function applySubscriptionState(sub: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof sub.customer === 'string' ? sub.customer : sub.customer.id

  const tenant = await prisma.tenant.findFirst({
    where: { stripeCustomerId: customerId },
  })
  if (!tenant) return

  const active = sub.status === 'active' || sub.status === 'trialing'
  const periodEndUnix = (sub as unknown as { current_period_end?: number })
    .current_period_end

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      stripeSubscriptionId: sub.id,
      subscriptionStatus: sub.status,
      plan: active ? 'PRO' : 'FREE',
      currentPeriodEnd: periodEndUnix
        ? new Date(periodEndUnix * 1000)
        : undefined,
    },
  })
}
