import { getMovements } from '@/actions/movements.actions'
import { LoadError } from '@/components/load-error'
import MovementsClient from './movements-clients'

export const dynamic = 'force-dynamic'

export default async function MovementsPage() {
  const result = await getMovements()
  if (!result.success) {
    return <LoadError title="Failed to load movements" message={result.error} />
  }
  return <MovementsClient movements={result.data} />
}
