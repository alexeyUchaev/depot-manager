import { prisma } from '@/lib/prisma'
import type { ActionResult } from '@/types/user.types'

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
      items: { sku: string; quantity: number; price: number }[]
    }
  ): Promise<ActionResult<OrderDTO>> {
    try {
      const count = await prisma.order.count({ where: { orgId: tenantId } })
      const orderNumber = `ORD-${String(count + 1).padStart(4, '0')}`

      const order = await prisma.$transaction(async (tx) => {
        for (const item of data.items) {
          const product = await tx.product.findFirst({
            where: { sku: item.productId, orgId: tenantId },
          })
          if (!product) throw new Error(`Product not found`)
          if (product.quantity < item.quantity) {
            throw new Error(`Not enough stock for ${product.name}`)
          }
        }

        // Создаём заказ
        const newOrder = await tx.order.create({
          data: {
            orgId: tenantId,
            userId,
            orderNumber,
            customerName: data.customerName,
            status: 'PENDING',
            items: {
              create: data.items.map((item) => ({
                productId: item.productId,
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
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED'
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
}