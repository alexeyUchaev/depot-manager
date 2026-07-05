import { getOrders } from '@/actions/order.actions'
import { LoadError } from '@/components/load-error'
import OrdersClient from './orders-client'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const result = await getOrders()
  if (!result.success) {
    return <LoadError title="Failed to load orders" message={result.error} />
  }
  return <OrdersClient orders={result.data} />
}
