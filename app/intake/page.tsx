import { getIntakes } from '@/actions/intake.actions'
import IntakeClient from './intake-client'

export const dynamic = 'force-dynamic'

export default async function IntakePage() {
  const result = await getIntakes()
  const intakes = result.success ? result.data : []
  return <IntakeClient intakes={intakes} />
}