import { getOrders } from '@/actions/order.actions'
import OrdersClient from './orders-client'

export default async function OrdersPage() {
  const result = await getOrders()
  const orders = result.success ? result.data : []
  return <OrdersClient orders={orders} />
}