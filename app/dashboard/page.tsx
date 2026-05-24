import { getDashboardStats } from '@/actions/dashboard.actions'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const result = await getDashboardStats()
  const stats = result.success ? result.data : null
  return <DashboardClient stats={stats} />
}