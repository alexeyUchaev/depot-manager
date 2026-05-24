'use server'

import { dashboardService } from '@/services/dashboard.service'
import type { DashboardStats } from '@/services/dashboard.service'
import type { ActionResult } from '@/types/user.types'

const DEMO_TENANT_ID = 'cmpk3vjwi00007g5dkg1dpryy'

export async function getDashboardStats(): Promise<ActionResult<DashboardStats>> {
  try {
    const stats = await dashboardService.getStats(DEMO_TENANT_ID)
    return { success: true, data: stats }
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error }
  }
}