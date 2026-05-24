import { prisma } from '@/lib/prisma'

export type DashboardStats = {
  todaySales: number
  totalProducts: number
  pendingOrders: number
  todayMovements: number
  recentActivities: {
    id: string
    type: 'order' | 'movement' | 'alert'
    text: string
    time: Date
    amount: number | null
  }[]
  weeklyActivity: {
    day: string
    count: number
  }[]
}

export const dashboardService = {

  async getStats(tenantId: string): Promise<DashboardStats> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Продажи за сегодня
    const todayOrders = await prisma.order.findMany({
      where: {
        orgId: tenantId,
        createdAt: { gte: today },
        status: { in: ['SHIPPED', 'DELIVERED'] },
      },
      include: { items: true },
    })

    const todaySales = todayOrders.reduce(
      (sum, order) =>
        sum + order.items.reduce((s, item) => s + Number(item.price) * item.quantity, 0),
      0
    )

    // Всего товаров
    const totalProducts = await prisma.product.count({
      where: { orgId: tenantId },
    })

    // Ожидающие заказы
    const pendingOrders = await prisma.order.count({
      where: { orgId: tenantId, status: 'PENDING' },
    })

    // Движения за сегодня
    const todayMovements = await prisma.stockMovement.count({
      where: { orgId: tenantId, createdAt: { gte: today } },
    })

    // Последние активности
    const recentOrders = await prisma.order.findMany({
      where: { orgId: tenantId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { items: true },
    })

    const recentMovements = await prisma.stockMovement.findMany({
      where: { orgId: tenantId },
      orderBy: { createdAt: 'desc' },
      take: 2,
      include: { product: { select: { name: true, sku: true } } },
    })

    const lowStockProducts = await prisma.product.findMany({
      where: {
        orgId: tenantId,
        quantity: { lte: 5 },
      },
      take: 2,
    })

    const recentActivities = [
      ...recentOrders.map((order) => ({
        id: order.id,
        type: 'order' as const,
        text: `Order ${order.orderNumber} — ${order.customerName}`,
        time: order.createdAt,
        amount: order.items.reduce(
          (s, item) => s + Number(item.price) * item.quantity,
          0
        ),
      })),
      ...recentMovements.map((mov) => ({
        id: mov.id,
        type: 'movement' as const,
        text: `${mov.product.name} ${mov.type === 'IN' ? 'received' : 'dispatched'} — ${mov.type === 'IN' ? '+' : '-'}${mov.quantity} units`,
        time: mov.createdAt,
        amount: null,
      })),
      ...lowStockProducts.map((product) => ({
        id: product.id,
        type: 'alert' as const,
        text: `Low Stock Alert: ${product.name} — only ${product.quantity} units remaining`,
        time: product.createdAt,
        amount: null,
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5)

    // Активность за неделю
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const weeklyActivity = await Promise.all(
      days.map(async (day, index) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - index))
        date.setHours(0, 0, 0, 0)
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        const count = await prisma.stockMovement.count({
          where: {
            orgId: tenantId,
            createdAt: { gte: date, lt: nextDate },
          },
        })
        return { day, count }
      })
    )

    return {
      todaySales,
      totalProducts,
      pendingOrders,
      todayMovements,
      recentActivities,
      weeklyActivity,
    }
  },
}