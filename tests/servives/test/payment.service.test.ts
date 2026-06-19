import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { findFirst: vi.fn(), update: vi.fn() },
    tenant: { findUnique: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
    processedStripeEvent: { findUnique: vi.fn(), create: vi.fn() },
  },
}))

vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: { sessions: { create: vi.fn() } },
    customers: { create: vi.fn() },
    billingPortal: { sessions: { create: vi.fn() } },
  },
  assertStripeConfigured: vi.fn(),
  appBaseUrl: () => 'http://localhost:3000',
}))

vi.mock('@/services/order.service', () => ({
  orderService: {
    finalizePaidOrder: vi.fn(),
    cancelUnpaidOrder: vi.fn(),
  },
}))

import { paymentService } from '@/services/payment.service'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { orderService } from '@/services/order.service'

const orderFindFirst = prisma.order.findFirst as Mock
const orderUpdate = prisma.order.update as Mock
const tenantFindUnique = prisma.tenant.findUnique as Mock
const tenantUpdate = prisma.tenant.update as Mock
const tenantFindFirst = prisma.tenant.findFirst as Mock
const eventFindUnique = prisma.processedStripeEvent.findUnique as Mock
const eventCreate = prisma.processedStripeEvent.create as Mock
const sessionCreate = stripe.checkout.sessions.create as Mock
const customerCreate = stripe.customers.create as Mock
const portalCreate = stripe.billingPortal.sessions.create as Mock
const finalize = orderService.finalizePaidOrder as Mock
const cancel = orderService.cancelUnpaidOrder as Mock

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createOrderCheckoutSession', () => {
  it('returns error when order not found', async () => {
    orderFindFirst.mockResolvedValue(null)
    const res = await paymentService.createOrderCheckoutSession('t1', 'o1')
    expect(res).toEqual({ success: false, error: 'Order not found' })
    expect(sessionCreate).not.toHaveBeenCalled()
  })

  it('returns error when order already paid', async () => {
    orderFindFirst.mockResolvedValue({ id: 'o1', paidAt: new Date(), items: [] })
    const res = await paymentService.createOrderCheckoutSession('t1', 'o1')
    expect(res).toEqual({ success: false, error: 'Order already paid' })
  })

  it('builds line items, persists the session id and returns the url', async () => {
    orderFindFirst.mockResolvedValue({
      id: 'o1',
      paidAt: null,
      currency: 'usd',
      items: [
        {
          quantity: 2,
          price: 19.99,
          productId: 'p1',
          product: { name: 'Widget', sku: 'W-1' },
        },
      ],
    })
    sessionCreate.mockResolvedValue({
      id: 'cs_test_1',
      url: 'https://checkout.stripe.com/pay/cs_test_1',
    })
    orderUpdate.mockResolvedValue({})

    const res = await paymentService.createOrderCheckoutSession('t1', 'o1')

    expect(sessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        client_reference_id: 'o1',
        metadata: { kind: 'order', orderId: 'o1', tenantId: 't1' },
        success_url: 'http://localhost:3000/orders?paid=1&order=o1',
        cancel_url: 'http://localhost:3000/orders?canceled=1&order=o1',
        line_items: [
          {
            quantity: 2,
            price_data: {
              currency: 'usd',
              unit_amount: 1999, // round(19.99 * 100)
              product_data: {
                name: 'Widget',
                metadata: { sku: 'W-1', productId: 'p1' },
              },
            },
          },
        ],
      }),
    )
    expect(orderUpdate).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: { stripeCheckoutSessionId: 'cs_test_1', currency: 'usd' },
    })
    expect(res).toEqual({
      success: true,
      data: { url: 'https://checkout.stripe.com/pay/cs_test_1' },
    })
  })

  it('returns error when Stripe returns no url', async () => {
    orderFindFirst.mockResolvedValue({ id: 'o1', paidAt: null, currency: 'usd', items: [] })
    sessionCreate.mockResolvedValue({ id: 'cs_test_2', url: null })
    orderUpdate.mockResolvedValue({})
    const res = await paymentService.createOrderCheckoutSession('t1', 'o1')
    expect(res).toEqual({ success: false, error: 'Stripe did not return a checkout URL' })
  })

  it('catches Stripe errors and returns them', async () => {
    orderFindFirst.mockResolvedValue({ id: 'o1', paidAt: null, currency: 'usd', items: [] })
    sessionCreate.mockRejectedValue(new Error('Stripe down'))
    const res = await paymentService.createOrderCheckoutSession('t1', 'o1')
    expect(res).toEqual({ success: false, error: 'Stripe down' })
  })
})

describe('createSubscriptionCheckoutSession', () => {
  it('returns error when STRIPE_PRICE_PRO is unset', async () => {
    delete process.env.STRIPE_PRICE_PRO
    const res = await paymentService.createSubscriptionCheckoutSession('t1')
    expect(res).toEqual({ success: false, error: 'STRIPE_PRICE_PRO is not set' })
  })

  it('returns error when tenant not found', async () => {
    process.env.STRIPE_PRICE_PRO = 'price_pro'
    tenantFindUnique.mockResolvedValue(null)
    const res = await paymentService.createSubscriptionCheckoutSession('t1')
    expect(res).toEqual({ success: false, error: 'Tenant not found' })
  })

  it('reuses an existing Stripe customer', async () => {
    process.env.STRIPE_PRICE_PRO = 'price_pro'
    tenantFindUnique.mockResolvedValue({ id: 't1', name: 'Acme', stripeCustomerId: 'cus_1' })
    sessionCreate.mockResolvedValue({ id: 'cs_sub', url: 'https://checkout.stripe.com/sub' })

    const res = await paymentService.createSubscriptionCheckoutSession('t1')

    expect(customerCreate).not.toHaveBeenCalled()
    expect(sessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        customer: 'cus_1',
        line_items: [{ price: 'price_pro', quantity: 1 }],
        metadata: { kind: 'subscription', tenantId: 't1' },
      }),
    )
    expect(res).toEqual({ success: true, data: { url: 'https://checkout.stripe.com/sub' } })
  })

  it('lazily creates a Stripe customer when none exists', async () => {
    process.env.STRIPE_PRICE_PRO = 'price_pro'
    // findUnique вызывается дважды (в методе и внутри ensureStripeCustomer)
    tenantFindUnique.mockResolvedValue({ id: 't1', name: 'Acme', stripeCustomerId: null })
    customerCreate.mockResolvedValue({ id: 'cus_new' })
    tenantUpdate.mockResolvedValue({})
    sessionCreate.mockResolvedValue({ id: 'cs_sub', url: 'https://checkout.stripe.com/sub' })

    const res = await paymentService.createSubscriptionCheckoutSession('t1')

    expect(customerCreate).toHaveBeenCalledWith({ name: 'Acme', metadata: { tenantId: 't1' } })
    expect(tenantUpdate).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { stripeCustomerId: 'cus_new' },
    })
    expect(res.success).toBe(true)
  })
})

describe('createBillingPortalSession', () => {
  it('returns error when tenant has no Stripe customer', async () => {
    tenantFindUnique.mockResolvedValue({ id: 't1', stripeCustomerId: null })
    const res = await paymentService.createBillingPortalSession('t1')
    expect(res).toEqual({ success: false, error: 'No Stripe customer for this tenant' })
  })

  it('opens the billing portal and returns its url', async () => {
    tenantFindUnique.mockResolvedValue({ id: 't1', stripeCustomerId: 'cus_1' })
    portalCreate.mockResolvedValue({ url: 'https://billing.stripe.com/p/1' })
    const res = await paymentService.createBillingPortalSession('t1')
    expect(portalCreate).toHaveBeenCalledWith({
      customer: 'cus_1',
      return_url: 'http://localhost:3000/company',
    })
    expect(res).toEqual({ success: true, data: { url: 'https://billing.stripe.com/p/1' } })
  })
})

describe('handleEvent', () => {
  it('is idempotent: skips events that were already processed', async () => {
    eventFindUnique.mockResolvedValue({ id: 'evt_1', type: 'checkout.session.completed' })
    await paymentService.handleEvent({
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: { object: {} },
    } as never)
    expect(finalize).not.toHaveBeenCalled()
    expect(eventCreate).not.toHaveBeenCalled()
  })

  it('finalizes a paid order on checkout.session.completed', async () => {
    eventFindUnique.mockResolvedValue(null)
    eventCreate.mockResolvedValue({})
    finalize.mockResolvedValue({ success: true })

    await paymentService.handleEvent({
      id: 'evt_2',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          metadata: { kind: 'order', orderId: 'o1', tenantId: 't1' },
          payment_intent: 'pi_1',
          amount_total: 5000,
          currency: 'usd',
        },
      },
    } as never)

    expect(finalize).toHaveBeenCalledWith({
      orderId: 'o1',
      stripeCheckoutSessionId: 'cs_1',
      stripePaymentIntentId: 'pi_1',
      amountTotal: 5000,
      currency: 'usd',
    })
    expect(eventCreate).toHaveBeenCalledWith({
      data: { id: 'evt_2', type: 'checkout.session.completed' },
    })
  })

  it('extracts the payment intent id when it is an expanded object', async () => {
    eventFindUnique.mockResolvedValue(null)
    eventCreate.mockResolvedValue({})
    finalize.mockResolvedValue({ success: true })
    await paymentService.handleEvent({
      id: 'evt_3',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_2',
          metadata: { kind: 'order', orderId: 'o2' },
          payment_intent: { id: 'pi_2' },
          amount_total: 1000,
          currency: 'usd',
        },
      },
    } as never)
    expect(finalize).toHaveBeenCalledWith(expect.objectContaining({ stripePaymentIntentId: 'pi_2' }))
  })

  it('ignores checkout sessions that are not orders but still records the event', async () => {
    eventFindUnique.mockResolvedValue(null)
    eventCreate.mockResolvedValue({})
    await paymentService.handleEvent({
      id: 'evt_4',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_3', metadata: { kind: 'subscription' } } },
    } as never)
    expect(finalize).not.toHaveBeenCalled()
    expect(eventCreate).toHaveBeenCalled()
  })

  it('cancels the order on checkout.session.expired', async () => {
    eventFindUnique.mockResolvedValue(null)
    eventCreate.mockResolvedValue({})
    cancel.mockResolvedValue({ success: true })
    await paymentService.handleEvent({
      id: 'evt_5',
      type: 'checkout.session.expired',
      data: { object: { id: 'cs_4', metadata: { kind: 'order', orderId: 'o3' } } },
    } as never)
    expect(cancel).toHaveBeenCalledWith('o3')
  })

  it('activates the PRO plan on an active subscription event', async () => {
    eventFindUnique.mockResolvedValue(null)
    eventCreate.mockResolvedValue({})
    tenantFindFirst.mockResolvedValue({ id: 't1' })
    tenantUpdate.mockResolvedValue({})
    await paymentService.handleEvent({
      id: 'evt_6',
      type: 'customer.subscription.updated',
      data: {
        object: { id: 'sub_1', customer: 'cus_1', status: 'active', current_period_end: 1700000000 },
      },
    } as never)
    expect(tenantUpdate).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: expect.objectContaining({
        stripeSubscriptionId: 'sub_1',
        subscriptionStatus: 'active',
        plan: 'PRO',
        currentPeriodEnd: new Date(1700000000 * 1000),
      }),
    })
  })

  it('downgrades to FREE when the subscription is canceled', async () => {
    eventFindUnique.mockResolvedValue(null)
    eventCreate.mockResolvedValue({})
    tenantFindFirst.mockResolvedValue({ id: 't1' })
    tenantUpdate.mockResolvedValue({})
    await paymentService.handleEvent({
      id: 'evt_7',
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_1', customer: 'cus_1', status: 'canceled' } },
    } as never)
    expect(tenantUpdate).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: expect.objectContaining({ plan: 'FREE', subscriptionStatus: 'canceled' }),
    })
  })
})