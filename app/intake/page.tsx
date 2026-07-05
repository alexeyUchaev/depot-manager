import { getIntakes } from '@/actions/intake.actions'
import { LoadError } from '@/components/load-error'
import IntakeClient from './intake-client'

export const dynamic = 'force-dynamic'

export default async function IntakePage() {
  const result = await getIntakes()
  if (!result.success) {
    return <LoadError title="Failed to load intakes" message={result.error} />
  }
  return <IntakeClient intakes={result.data} />
}
