import { getIntakes } from '@/actions/intake.actions'
import IntakeClient from './intake-client'

export default async function IntakePage() {
  const result = await getIntakes()
  const intakes = result.success ? result.data : []
  return <IntakeClient intakes={intakes} />
}