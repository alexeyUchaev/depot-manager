'use server'

import { analyticsService } from '@/services/analytics.service'
import type { AnalyticsData } from '@/services/analytics.service'
import type { ActionResult } from '@/types/user.types'

const DEMO_TENANT_ID = 'cmpk3vjwi00007g5dkg1dpryy'

export async function getAnalytics(): Promise<ActionResult<AnalyticsData>> {
  try {
    const data = await analyticsService.getAnalytics(DEMO_TENANT_ID)
    return { success: true, data }
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error }
  }
}