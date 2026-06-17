import { getOrders } from '@/actions/order.actions'
import IntakeClient from './intake-client'

export default async function OrdersPage() {
  const result = await getOrders()
  const intakes = result.success ? result.data : []
  return <IntakeClient intakes={intakes} />
}