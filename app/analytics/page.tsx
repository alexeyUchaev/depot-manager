import { getAnalytics } from '@/actions/analytics.actions'
import { LoadError } from '@/components/load-error'
import AnalyticsClient from './analytics-client'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const result = await getAnalytics()
  if (!result.success) {
    return <LoadError title="Failed to load analytics" message={result.error} />
  }
  return <AnalyticsClient data={result.data} />
}
