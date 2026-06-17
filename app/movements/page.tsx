import { getMovements } from '@/actions/movements.actions'
import MovementsClient from './movements-clients'

export default async function MovementsPage() {
  const result = await getMovements()
  const movements = result.success ? result.data : []
  console.log(movements)
  return <MovementsClient movements={movements} />
}