import { getDashboardStats } from '@/actions/dashboard.actions'
import { LoadError } from '@/components/load-error'
import DashboardClient from './dashboard-client'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const result = await getDashboardStats()
  if (!result.success) {
    return <LoadError title="Failed to load dashboard" message={result.error} />
  }
  return <DashboardClient stats={result.data} />
}
