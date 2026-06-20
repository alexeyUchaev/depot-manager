import { getMovements } from '@/actions/movements.actions'
import MovementsClient from './movements-clients'

export const dynamic = 'force-dynamic'

export default async function MovementsPage() {
  const result = await getMovements()
  const movements = result.success ? result.data : []
  return <MovementsClient movements={movements} />
}