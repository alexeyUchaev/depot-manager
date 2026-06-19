import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'

vi.mock('@/lib/prisma', () => {
  const prisma: Record<string, unknown> = {
    order: { findUnique: vi.fn(), update: vi.fn() },
    product: { findUnique: vi.fn() },
  }
  prisma.$transaction = vi.fn(async (cb: (tx: unknown) => unknown) => cb(prisma))
  return { prisma }
})

vi.mock('@/services/stock.service', () => ({
  postMovement: vi.fn(),
  reconcile: vi.fn(),
}))

import { orderService } from '@/services/order.service'
import { prisma } from '@/lib/prisma'
import { postMovement } from '@/services/stock.service'

const orderFindUnique = prisma.order.findUnique as Mock
const orderUpdate = prisma.order.update as Mock
const productFindUnique = prisma.product.findUnique as Mock
const post = postMovement as Mock

beforeEach(() => {
  vi.clearAllMocks()
})

describe('finalizePaidOrder', () => {
  it('returns error when the order does not exist', async () => {
    orderFindUnique.mockResolvedValue(null)
    const res = await orderService.finalizePaidOrder({ orderId: 'o1' })
    expect(res).toEqual({ success: false, error: 'Order not found' })
    expect(post).not.toHaveBeenCalled()
  })

  it('is idempotent: does nothing if the order is already paid', async () => {
    orderFindUnique.mockResolvedValue({
      id: 'o1', paidAt: new Date(), orgId: 't1', userId: 'u1', orderNumber: 'ORD-1', items: [],
    })
    const res = await orderService.finalizePaidOrder({ orderId: 'o1' })
    expect(res).toEqual({ success: true, data: undefined })
    expect(orderUpdate).not.toHaveBeenCalled()
    expect(post).not.toHaveBeenCalled()
  })

  it('fails when stock is insufficient at payment time', async () => {
    orderFindUnique.mockResolvedValue({
      id: 'o1', paidAt: null, orgId: 't1', userId: 'u1', orderNumber: 'ORD-1',
      items: [{ productId: 'p1', quantity: 5 }],
    })
    productFindUnique.mockResolvedValue({ id: 'p1', name: 'Widget', cachedQuantity: 2 })
    const res = await orderService.finalizePaidOrder({ orderId: 'o1' })
    expect(res).toEqual({ success: false, error: 'Not enough stock for Widget' })
    expect(orderUpdate).not.toHaveBeenCalled()
    expect(post).not.toHaveBeenCalled()
  })

  it('marks the order paid and posts an OUT movement per item', async () => {
    orderFindUnique.mockResolvedValue({
      id: 'o1', paidAt: null, orgId: 't1', userId: 'u1', orderNumber: 'ORD-1',
      items: [
        { productId: 'p1', quantity: 2 },
        { productId: 'p2', quantity: 1 },
      ],
    })
    productFindUnique.mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve({ id: where.id, name: where.id, cachedQuantity: 100 }),
    )
    orderUpdate.mockResolvedValue({})

    const res = await orderService.finalizePaidOrder({
      orderId: 'o1',
      stripeCheckoutSessionId: 'cs_1',
      stripePaymentIntentId: 'pi_1',
      amountTotal: 5000,
      currency: 'usd',
    })

    expect(orderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'o1' },
        data: expect.objectContaining({
          status: 'PROCESSING',
          paidAt: expect.any(Date),
          stripeCheckoutSessionId: 'cs_1',
          stripePaymentIntentId: 'pi_1',
          amountTotal: 5000,
          currency: 'usd',
        }),
      }),
    )
    expect(post).toHaveBeenCalledTimes(2)
    expect(post).toHaveBeenNthCalledWith(
      1, prisma, 't1', 'u1',
      expect.objectContaining({ productId: 'p1', type: 'OUT', signedQuantity: -2, orderId: 'o1' }),
    )
    expect(post).toHaveBeenNthCalledWith(
      2, prisma, 't1', 'u1',
      expect.objectContaining({ productId: 'p2', type: 'OUT', signedQuantity: -1, orderId: 'o1' }),
    )
    expect(res).toEqual({ success: true, data: undefined })
  })
})

describe('cancelUnpaidOrder', () => {
  it('returns error when the order does not exist', async () => {
    orderFindUnique.mockResolvedValue(null)
    const res = await orderService.cancelUnpaidOrder('o1')
    expect(res).toEqual({ success: false, error: 'Order not found' })
  })

  it('ignores an order that is already paid', async () => {
    orderFindUnique.mockResolvedValue({ id: 'o1', paidAt: new Date() })
    const res = await orderService.cancelUnpaidOrder('o1')
    expect(res).toEqual({ success: true, data: undefined })
    expect(orderUpdate).not.toHaveBeenCalled()
  })

  it('cancels an unpaid order', async () => {
    orderFindUnique.mockResolvedValue({ id: 'o1', paidAt: null })
    orderUpdate.mockResolvedValue({})
    const res = await orderService.cancelUnpaidOrder('o1')
    expect(orderUpdate).toHaveBeenCalledWith({ where: { id: 'o1' }, data: { status: 'CANCELLED' } })
    expect(res).toEqual({ success: true, data: undefined })
  })
})
