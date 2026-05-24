// actions/movement.actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { movementService } from '@/services/movements.service'
import type { ActionResult } from '@/types/user.types'
import type { MovementDTO } from '@/services/movements.service'

const DEMO_TENANT_ID = 'cmpk3vjwi00007g5dkg1dpryy'
const DEMO_USER_ID = 'cmpk3vk9p00017g5d5sucwz3r'

export async function getMovements(): Promise<ActionResult<MovementDTO[]>> {
  try {
    const movements = await movementService.getAllByTenant(DEMO_TENANT_ID)
    return { success: true, data: movements }
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error }
  }
}

export async function createMovement(data: {
  productId: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: number
  reason?: string
}): Promise<ActionResult<MovementDTO>> {
  try {
    const result = await movementService.create(DEMO_TENANT_ID, DEMO_USER_ID, data)
    if (result.success) {
      revalidatePath('/movements')
      revalidatePath('/inventory')
    }
    return result
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error }
  }
}