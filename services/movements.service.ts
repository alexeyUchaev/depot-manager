import { prisma } from '@/lib/prisma'
import type { ActionResult } from '@/types/user.types'
import { postMovement } from './stock.service'

export type MovementDTO = {
  id: string
  type: string
  quantity: number
  reason: string | null
  createdAt: Date
  product: {
    name: string
    sku: string
  }
  user: {
    firstName: string | null
    lastName: string | null
  }
}

export const movementService = {

  async getAllByTenant(tenantId: string): Promise<MovementDTO[]> {
    const movements = await prisma.stockMovement.findMany({
      where: { orgId: tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { name: true, sku: true },
        },
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    })

    return movements.map((m) => ({
      id: m.id,
      type: m.type,
      quantity: m.quantity,
      reason: m.reason,
      createdAt: m.createdAt,
      product: m.product,
      user: m.user,
    }))
  },

  async create(
    tenantId: string,
    userId: string,
    data: {
      productId: string
      type: 'IN' | 'OUT'
      quantity: number
      reason?: string
    }
  ): Promise<ActionResult<MovementDTO>> {
    try {
      const product = await prisma.product.findFirst({
        where: { id: data.productId, orgId: tenantId },
      })
      if (!product) return { success: false, error: 'Product not found' }

      // The ledger stores a SIGNED effect on stock: IN => +q, OUT => -q.
      // Every stock change is a directional document — no special adjustments.
      const magnitude = Math.abs(data.quantity)
      const signedQuantity = data.type === 'IN' ? magnitude : -magnitude

      if (product.cachedQuantity + signedQuantity < 0) {
        return {
          success: false,
          error: `Not enough stock. Available: ${product.cachedQuantity}`,
        }
      }

      const movement = await prisma.$transaction((tx) =>
        postMovement(tx, tenantId, userId, {
          productId: data.productId,
          type: data.type,
          signedQuantity,
          reason: data.reason,
        })
      )

      return {
        success: true,
        data: {
          id: movement.id,
          type: movement.type,
          quantity: movement.quantity,
          reason: movement.reason,
          createdAt: movement.createdAt,
          product: movement.product,
          user: movement.user,
        },
      }
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : 'Failed to create movement'
      return { success: false, error }
    }
  },
}