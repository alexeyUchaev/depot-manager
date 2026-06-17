import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * The StockMovement ledger is the single SOURCE OF TRUTH for stock.
 * Product.cachedQuantity is only a denormalized projection of SUM(quantity).
 *
 * Every stock change MUST go through postMovement so the ledger row and the
 * cache are written atomically in the same transaction. Nothing else should
 * touch cachedQuantity directly (except reconcile, which rebuilds it).
 */

type PostMovementInput = {
  productId: string
  type: 'IN' | 'OUT'
  /** Signed effect on stock: IN => +q, OUT => -q. */
  signedQuantity: number
  reason?: string
  orderId?: string
  takeId?: string
}

/** Create a ledger movement AND increment the cached stock, atomically. */
export async function postMovement(
  tx: Prisma.TransactionClient,
  tenantId: string,
  userId: string,
  input: PostMovementInput
) {
  const movement = await tx.stockMovement.create({
    data: {
      orgId: tenantId,
      productId: input.productId,
      userId,
      orderId: input.orderId,
      takeId: input.takeId,
      type: input.type,
      quantity: input.signedQuantity,
      reason: input.reason,
    },
    include: {
      product: { select: { name: true, sku: true } },
      user: { select: { firstName: true, lastName: true } },
    },
  })

  await tx.product.update({
    where: { id: input.productId },
    data: { cachedQuantity: { increment: input.signedQuantity } },
  })

  return movement
}

/**
 * Rebuild cachedQuantity for every product of a tenant from the ledger.
 * Use for cycle counts / repairing any drift. After this runs the invariant
 * cachedQuantity === SUM(StockMovement.quantity) holds for all products.
 */
export async function reconcile(tenantId: string): Promise<void> {
  const products = await prisma.product.findMany({
    where: { orgId: tenantId },
    select: { id: true },
  })

  const sums = await prisma.stockMovement.groupBy({
    by: ['productId'],
    where: { orgId: tenantId },
    _sum: { quantity: true },
  })
  const sumByProduct = new Map(sums.map((s) => [s.productId, s._sum.quantity ?? 0]))

  await prisma.$transaction(
    products.map((p) =>
      prisma.product.update({
        where: { id: p.id },
        data: { cachedQuantity: sumByProduct.get(p.id) ?? 0 },
      })
    )
  )
}
