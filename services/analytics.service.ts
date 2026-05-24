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
    
    // Текущий месяц
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Заказы текущего месяца
    const currentMonthOrders = await prisma.order.findMany({
      where: {
        orgId: tenantId,
        createdAt: { gte: startOfMonth },
        status: { in: ['SHIPPED', 'DELIVERED'] },
      },
      include: { items: true },
    })

    const grossRevenue = currentMonthOrders.reduce(
      (sum, order) =>
        sum + order.items.reduce((s, item) => s + Number(item.price) * item.quantity, 0),
      0
    )

    // Заказы прошлого месяца
    const lastMonthOrders = await prisma.order.findMany({
      where: {
        orgId: tenantId,
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        status: { in: ['SHIPPED', 'DELIVERED'] },
      },
      include: { items: true },
    })

    const lastMonthRevenue = lastMonthOrders.reduce(
      (sum, order) =>
        sum + order.items.reduce((s, item) => s + Number(item.price) * item.quantity, 0),
      0
    )

    const revenueGrowth = lastMonthRevenue > 0
      ? ((grossRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0

    // Стоимость инвентаря
    const products = await prisma.product.findMany({
      where: { orgId: tenantId },
    })

    const inventoryValuation = products.reduce(
      (sum, p) => sum + Number(p.price) * p.quantity,
      0
    )

    // Всего заказов за месяц
    const totalOrders = await prisma.order.count({
      where: { orgId: tenantId, createdAt: { gte: startOfMonth } },
    })

    // Выручка за 6 месяцев
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyRevenue = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
        const endDate = new Date(now.getFullYear(), now.getMonth() - 4 + i, 0)
        return { date, endDate, label: months[date.getMonth()] }
      }).map(async ({ date, endDate, label }) => {
        const orders = await prisma.order.findMany({
          where: {
            orgId: tenantId,
            createdAt: { gte: date, lte: endDate },
            status: { in: ['SHIPPED', 'DELIVERED'] },
          },
          include: { items: true },
        })
        const amount = orders.reduce(
          (sum, order) =>
            sum + order.items.reduce((s, item) => s + Number(item.price) * item.quantity, 0),
          0
        )
        return { month: label, amount }
      })
    )

    // Топ продукты
    const orderItems = await prisma.orderItem.findMany({
      where: { order: { orgId: tenantId } },
      include: { product: { select: { name: true, sku: true } } },
    })

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

    // Движения IN/OUT
    const movements = await prisma.stockMovement.findMany({
      where: { orgId: tenantId, createdAt: { gte: startOfMonth } },
    })

    const inUnits = movements.filter(m => m.type === 'IN').reduce((s, m) => s + m.quantity, 0)
    const outUnits = movements.filter(m => m.type === 'OUT').reduce((s, m) => s + m.quantity, 0)

    // Low stock
    const lowStockProducts = await prisma.product.findMany({
      where: { orgId: tenantId, quantity: { lte: 5 } },
      select: { name: true, sku: true, quantity: true },
    })

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