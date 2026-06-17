import { prisma } from '@/lib/prisma'
import type { ActionResult } from '@/types/user.types'
import { postMovement } from './stock.service'

export type IntakeDTO = {
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

  async getAllIntakesByTenant(tenantId: string): Promise<IntakeDTO[]> {
    const intakes = await prisma.intake.findMany({
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

    return intakes.map((intake) => ({
      id: intake.id,
      orderNumber: intake.orderNumber,
      customerName: intake.customerName,
      status: intake.status,
      createdAt: intake.createdAt,
      items: intake.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        product: item.product,
      })),
      total: intake.items.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
      ),
      assignedTo: [intake.user.firstName, intake.user.lastName]
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
  ): Promise<ActionResult<IntakeDTO>> {
    try {
      const count = await prisma.intake.count({ where: { orgId: tenantId } })
      const intakeNumber = `ORD-${String(count + 1).padStart(4, '0')}`

      const intake = await prisma.$transaction(async (tx) => {
        for (const item of data.items) {
          const product = await tx.product.findFirst({
            where: { sku: item.sku, orgId: tenantId },
          })
          if (!product) throw new Error(`Product not found`)
          if (product.cachedQuantity < item.quantity) {
            throw new Error(`Not enough stock for ${product.name}`)
          }
        }

        const newIntake = await tx.intake.create({
          data: {
            orgId: tenantId,
            userId,
            intakeNumber,
            customerName: data.customerName,
            status: 'REQUESTED',
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

        // Each order line dispatches stock => an OUT movement in the ledger
        // (the single source of truth), which also updates the cached stock.
        for (const item of data.items) {
          await postMovement(tx, tenantId, userId, {
            productId: item.id,
            type: 'IN',
            signedQuantity: -item.quantity,
            reason: `Intake ${newIntake.intakeNumber}`,
            orderId: newIntake.id,
          })
        }

        return newIntake
      })

      return {
        success: true,
        data: {
          id: intake.id,
          orderNumber: intake.intakeNumber,
          customerName: intake.customerName,
          status: intake.status,
          createdAt: intake.createdAt,
          items: intake.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            price: Number(item.price),
            product: item.product,
          })),
          total: intake.items.reduce(
            (sum, item) => sum + Number(item.price) * item.quantity,
            0
          ),
          assignedTo: [intake.user.firstName, intake.user.lastName]
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
    status: 'REQUESTED' | 'ACCEPTED' | 'ARRIVED' | 'IN_TRANSIT' | 'REJECTED'
  ): Promise<ActionResult> {
    try {
      const existing = await prisma.intake.findFirst({
        where: { id, orgId: tenantId },
      })
      if (!existing) return { success: false, error: 'Intake not found' }

      await prisma.intake.update({
        where: { id },
        data: { status },
      })

      return { success: true, data: undefined }
    } catch {
      return { success: false, error: 'Failed to update intake' }
    }
  },
}