import { prisma } from '@/lib/prisma'
import type { ActionResult } from '@/types/user.types'
import { postMovement } from './stock.service'

export type OrderDTO = {
  id: string
  orderNumber: string
  customerName: string
  status: string
  createdAt: Date
  items: {
    id: string
    quantity: number
    price: number
    product: {
      name: string
      sku: string
    }
  }[]
  total: number
  assignedTo: string
}

export const orderService = {

  async getAllByTenant(tenantId: string): Promise<OrderDTO[]> {
    const orders = await prisma.order.findMany({
      where: { orgId: tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, sku: true },
            },
          },
        },
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    })

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: order.status,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        product: item.product,
      })),
      total: order.items.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
      ),
      assignedTo: [order.user.firstName, order.user.lastName]
        .filter(Boolean)
        .join(' '),
    }))
  },

  async create(
    tenantId: string,
    userId: string,
    data: {
      customerName: string
      items: { id: string, sku: string; quantity: number; price: number }[]
    }
  ): Promise<ActionResult<OrderDTO>> {
    try {
      const count = await prisma.order.count({ where: { orgId: tenantId } })
      const orderNumber = `ORD-${1000 + count + 1}`

      const order = await prisma.$transaction(async (tx) => {
        for (const item of data.items) {
          const product = await tx.product.findFirst({
            where: { sku: item.sku, orgId: tenantId },
          })
          if (!product) throw new Error(`Product not found`)
          if (product.cachedQuantity < item.quantity) {
            throw new Error(`Not enough stock for ${product.name}`)
          }
        }

        const newOrder = await tx.order.create({
          data: {
            orgId: tenantId,
            userId,
            orderNumber,
            customerName: data.customerName,
            status: 'AWAITING_PAYMENT',
            items: {
              create: data.items.map((item) => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
          include: {
            items: {
              include: {
                product: { select: { name: true, sku: true } },
              },
            },
            user: { select: { firstName: true, lastName: true } },
          },
        })

        return newOrder
      })

      return {
        success: true,
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          status: order.status,
          createdAt: order.createdAt,
          items: order.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            price: Number(item.price),
            product: item.product,
          })),
          total: order.items.reduce(
            (sum, item) => sum + Number(item.price) * item.quantity,
            0
          ),
          assignedTo: [order.user.firstName, order.user.lastName]
            .filter(Boolean)
            .join(' '),
        },
      }
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : 'Failed to create order'
      return { success: false, error }
    }
  },

  async updateStatus(
    id: string,
    tenantId: string,
    status:
      | 'AWAITING_PAYMENT'
      | 'PENDING'
      | 'PROCESSING'
      | 'SHIPPED'
      | 'DELIVERED'
      | 'CANCELLED'
  ): Promise<ActionResult> {
    try {
      const existing = await prisma.order.findFirst({
        where: { id, orgId: tenantId },
      })
      if (!existing) return { success: false, error: 'Order not found' }

      await prisma.order.update({
        where: { id },
        data: { status },
      })

      return { success: true, data: undefined }
    } catch {
      return { success: false, error: 'Failed to update order' }
    }
  },

  /**
   * Mark an order as paid and dispatch its stock.
   *
   * Called from the Stripe webhook after checkout.session.completed. Idempotent:
   * if the order is already paid it is a no-op, so duplicate webhook deliveries
   * don't post the OUT movements twice. Stock availability is re-checked here
   * because it may have changed between order creation and payment.
   */
  async finalizePaidOrder(input: {
    orderId: string
    stripeCheckoutSessionId?: string
    stripePaymentIntentId?: string
    amountTotal?: number | null
    currency?: string | null
  }): Promise<ActionResult> {
    try {
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: input.orderId },
          include: { items: true },
        })
        if (!order) throw new Error('Order not found')

        if (order.paidAt) return

        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          })
          if (!product) throw new Error('Product not found')
          if (product.cachedQuantity < item.quantity) {
            throw new Error(`Not enough stock for ${product.name}`)
          }
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'PROCESSING',
            paidAt: new Date(),
            stripeCheckoutSessionId: input.stripeCheckoutSessionId,
            stripePaymentIntentId: input.stripePaymentIntentId,
            amountTotal: input.amountTotal ?? undefined,
            currency: input.currency ?? undefined,
          },
        })

        for (const item of order.items) {
          await postMovement(tx, order.orgId, order.userId, {
            productId: item.productId,
            type: 'OUT',
            signedQuantity: -item.quantity,
            reason: `Order ${order.orderNumber} (paid)`,
            orderId: order.id,
          })
        }
      })

      return { success: true, data: undefined }
    } catch (e: unknown) {
      const error =
        e instanceof Error ? e.message : 'Failed to finalize paid order'
      return { success: false, error }
    }
  },

  /** Cancel an unpaid order (e.g. the checkout session expired). */
  async cancelUnpaidOrder(orderId: string): Promise<ActionResult> {
    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } })
      if (!order) return { success: false, error: 'Order not found' }
      if (order.paidAt) return { success: true, data: undefined } // already paid, ignore

      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      })
      return { success: true, data: undefined }
    } catch {
      return { success: false, error: 'Failed to cancel order' }
    }
  },
}