import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'

vi.mock('@/services', () => ({
  getAllProductsByTenant: vi.fn(),
  createProduct: vi.fn(),
  getBySku: vi.fn(),
  orderService: { getAllByTenant: vi.fn(), create: vi.fn() },
}))

vi.mock('@/services/analytics.service', () => ({
  analyticsService: { getAnalytics: vi.fn() },
}))

vi.mock('@/services/intake.service', () => ({
  intakeService: { getAllIntakesByTenant: vi.fn() },
}))

vi.mock('@/services/payment.service', () => ({
  paymentService: { createOrderCheckoutSession: vi.fn() },
}))

import { executeTool, type ToolArgs } from '@/lib/ai-executor'
import * as services from '@/services'
import { analyticsService } from '@/services/analytics.service'
import { intakeService } from '@/services/intake.service'
import { paymentService } from '@/services/payment.service'
import { DEMO_TENANT_ID, DEMO_USER_ID } from '@/lib/constants'

const getAllProducts = services.getAllProductsByTenant as Mock
const createProduct = services.createProduct as Mock
const getBySku = services.getBySku as Mock
const orderGetAll = services.orderService.getAllByTenant as Mock
const orderCreate = services.orderService.create as Mock
const getAnalytics = analyticsService.getAnalytics as Mock
const getIntakes = intakeService.getAllIntakesByTenant as Mock
const createCheckout = paymentService.createOrderCheckoutSession as Mock

const args = (over: Partial<ToolArgs> = {}): ToolArgs => ({
  name: '', sku: '', price: 0, customerName: '', orderId: '', ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('executeTool — dispatch', () => {
  it('getAllProductsByTenant -> product service with demo tenant', async () => {
    getAllProducts.mockResolvedValue([{ sku: 'A' }])
    const res = await executeTool('getAllProductsByTenant', args())
    expect(getAllProducts).toHaveBeenCalledWith(DEMO_TENANT_ID)
    expect(res).toEqual([{ sku: 'A' }])
  })

  it('getAllByTenant -> orderService.getAllByTenant', async () => {
    orderGetAll.mockResolvedValue([])
    await executeTool('getAllByTenant', args())
    expect(orderGetAll).toHaveBeenCalledWith(DEMO_TENANT_ID)
  })

  it('getAllIntakesByTenant -> intakeService', async () => {
    getIntakes.mockResolvedValue([])
    await executeTool('getAllIntakesByTenant', args())
    expect(getIntakes).toHaveBeenCalledWith(DEMO_TENANT_ID)
  })

  it('getAnalytics -> analyticsService', async () => {
    getAnalytics.mockResolvedValue({ revenue: 0 })
    await executeTool('getAnalytics', args())
    expect(getAnalytics).toHaveBeenCalledWith(DEMO_TENANT_ID)
  })

  it('throws for an unknown tool', async () => {
    await expect(executeTool('nope', args())).rejects.toThrow(/not implemented/)
  })
})

describe('executeTool — createProduct', () => {
  it('defaults lowStockAt to 10 when omitted', async () => {
    createProduct.mockResolvedValue({ success: true })
    await executeTool('createProduct', args({ name: 'Bolt', sku: 'B-1', price: 5 }))
    expect(createProduct).toHaveBeenCalledWith(
      DEMO_TENANT_ID,
      expect.objectContaining({ name: 'Bolt', sku: 'B-1', price: 5, lowStockAt: 10 }),
    )
  })

  it('passes an explicit lowStockAt through', async () => {
    createProduct.mockResolvedValue({ success: true })
    await executeTool('createProduct', args({ name: 'Bolt', sku: 'B-1', price: 5, lowStockAt: 3 }))
    expect(createProduct).toHaveBeenCalledWith(
      DEMO_TENANT_ID,
      expect.objectContaining({ lowStockAt: 3 }),
    )
  })
})

describe('executeTool — createOrder', () => {
  it('returns an error when a SKU is not found (and never creates the order)', async () => {
    getBySku.mockResolvedValue(null)
    const res = await executeTool('createOrder', args({
      customerName: 'Jane', products: [{ sku: 'X', quantity: 1 }],
    }))
    expect(res).toEqual({ error: 'Product not found: X' })
    expect(orderCreate).not.toHaveBeenCalled()
  })

  it('creates the order and attaches a Stripe checkout url on success', async () => {
    getBySku.mockResolvedValue({ id: 'p1', sku: 'X', price: 9.99 })
    orderCreate.mockResolvedValue({ success: true, data: { id: 'o1', orderNumber: 'ORD-1' } })
    createCheckout.mockResolvedValue({ success: true, data: { url: 'https://pay/o1' } })

    const res = await executeTool('createOrder', args({
      customerName: 'Jane', products: [{ sku: 'X', quantity: 2 }],
    }))

    expect(orderCreate).toHaveBeenCalledWith(DEMO_TENANT_ID, DEMO_USER_ID, {
      customerName: 'Jane',
      items: [{ id: 'p1', sku: 'X', quantity: 2, price: 9.99 }],
    })
    expect(createCheckout).toHaveBeenCalledWith(DEMO_TENANT_ID, 'o1')
    expect(res).toMatchObject({
      success: true,
      data: { id: 'o1', checkoutUrl: 'https://pay/o1' },
    })
  })

  it('reports a checkout error when the payment link cannot be generated', async () => {
    getBySku.mockResolvedValue({ id: 'p1', sku: 'X', price: 9.99 })
    orderCreate.mockResolvedValue({ success: true, data: { id: 'o1' } })
    createCheckout.mockResolvedValue({ success: false, error: 'Stripe down' })

    const res = await executeTool('createOrder', args({
      customerName: 'Jane', products: [{ sku: 'X', quantity: 1 }],
    }))

    expect(res).toMatchObject({ data: { checkoutUrl: null, checkoutError: 'Stripe down' } })
  })

  it('returns a failed create result without attempting checkout', async () => {
    getBySku.mockResolvedValue({ id: 'p1', sku: 'X', price: 9.99 })
    orderCreate.mockResolvedValue({ success: false, error: 'Not enough stock for X' })

    const res = await executeTool('createOrder', args({
      customerName: 'Jane', products: [{ sku: 'X', quantity: 99 }],
    }))

    expect(res).toEqual({ success: false, error: 'Not enough stock for X' })
    expect(createCheckout).not.toHaveBeenCalled()
  })
})

describe('executeTool — createOrderCheckout', () => {
  it('delegates to paymentService.createOrderCheckoutSession', async () => {
    createCheckout.mockResolvedValue({ success: true, data: { url: 'u' } })
    const res = await executeTool('createOrderCheckout', args({ orderId: 'o1' }))
    expect(createCheckout).toHaveBeenCalledWith(DEMO_TENANT_ID, 'o1')
    expect(res).toEqual({ success: true, data: { url: 'u' } })
  })
})