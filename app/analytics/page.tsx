import { getAnalytics } from '@/actions/analytics.actions'
import AnalyticsClient from './analytics-client'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const result = await getAnalytics()
  const data = result.success ? result.data : null
  return <AnalyticsClient data={data} />
}