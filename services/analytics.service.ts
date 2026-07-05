import { prisma } from '@/lib/prisma'

export type AnalyticsData = {
  grossRevenue: number
  revenueGrowth: number
  inventoryValuation: number
  totalOrders: number
  monthlyRevenue: {
    month: string
    amount: number
  }[]
  topProducts: {
    name: string
    sku: string
    share: number
    trend: 'up' | 'down'
  }[]
  movementsSummary: {
    inUnits: number
    outUnits: number
  }
  lowStockProducts: {
    name: string
    sku: string
    quantity: number
  }[]
}

export const analyticsService = {

  async getAnalytics(tenantId: string): Promise<AnalyticsData> {
    
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    // One round of parallel queries per render — this page used to issue ~12
    // sequential queries (one findMany per month of the revenue chart),
    // holding a pooler connection for the whole waterfall.
    const [sellableOrders, products, totalOrders, orderItems, movements, lowStock] =
      await Promise.all([
        prisma.order.findMany({
          where: {
            orgId: tenantId,
            createdAt: { gte: sixMonthsStart },
            status: { in: ['SHIPPED', 'DELIVERED'] },
          },
          include: { items: true },
        }),
        prisma.product.findMany({
          where: { orgId: tenantId },
        }),
        prisma.order.count({
          where: { orgId: tenantId, createdAt: { gte: startOfMonth } },
        }),
        prisma.orderItem.findMany({
          where: { order: { orgId: tenantId } },
          include: { product: { select: { name: true, sku: true } } },
        }),
        prisma.stockMovement.findMany({
          where: { orgId: tenantId, createdAt: { gte: startOfMonth } },
        }),
        prisma.product.findMany({
          where: { orgId: tenantId, cachedQuantity: { lte: prisma.product.fields.lowStockAt } },
          select: { name: true, sku: true, cachedQuantity: true },
        }),
      ])

    const orderRevenue = (order: (typeof sellableOrders)[number]) =>
      order.items.reduce((s, item) => s + Number(item.price) * item.quantity, 0)

    // Bucket the six-month order history by calendar month in memory.
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`
    const revenueByMonth: Record<string, number> = {}
    sellableOrders.forEach((order) => {
      const key = monthKey(new Date(order.createdAt))
      revenueByMonth[key] = (revenueByMonth[key] ?? 0) + orderRevenue(order)
    })

    const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      return {
        month: months[date.getMonth()],
        amount: revenueByMonth[monthKey(date)] ?? 0,
      }
    })

    const grossRevenue = revenueByMonth[monthKey(startOfMonth)] ?? 0
    const lastMonthRevenue =
      revenueByMonth[monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1))] ?? 0

    const revenueGrowth = lastMonthRevenue > 0
      ? ((grossRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0

    const inventoryValuation = products.reduce(
      (sum, p) => sum + Number(p.price) * p.cachedQuantity,
      0
    )

    const productSales: Record<string, { name: string; sku: string; total: number }> = {}
    orderItems.forEach((item) => {
      const key = item.productId
      if (!productSales[key]) {
        productSales[key] = { name: item.product.name, sku: item.product.sku, total: 0 }
      }
      productSales[key].total += item.quantity
    })

    const totalSold = Object.values(productSales).reduce((s, p) => s + p.total, 0)
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.total - a.total)
      .slice(0, 4)
      .map((p) => ({
        name: p.name,
        sku: p.sku,
        share: totalSold > 0 ? Math.round((p.total / totalSold) * 100) : 0,
        trend: 'up' as const,
      }))

    const inUnits = movements.filter(m => m.type === 'IN').reduce((s, m) => s + Math.abs(m.quantity), 0)
    const outUnits = movements.filter(m => m.type === 'OUT').reduce((s, m) => s + Math.abs(m.quantity), 0)

    const lowStockProducts = lowStock.map((p) => ({
      name: p.name,
      sku: p.sku,
      quantity: p.cachedQuantity,
    }))

    return {
      grossRevenue,
      revenueGrowth,
      inventoryValuation,
      totalOrders,
      monthlyRevenue,
      topProducts,
      movementsSummary: { inUnits, outUnits },
      lowStockProducts,
    }
  },
}