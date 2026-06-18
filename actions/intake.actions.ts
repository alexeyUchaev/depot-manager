// actions/intake.actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { intakeService } from '@/services/intake.service'
import type { ActionResult } from '@/types/user.types'
import type { IntakeDTO } from '@/services/intake.service'
import { DEMO_TENANT_ID, DEMO_USER_ID } from '@/lib/constants'



export async function getIntakes(): Promise<ActionResult<IntakeDTO[]>> {
  try {
    const intakes = await intakeService.getAllIntakesByTenant(DEMO_TENANT_ID)
    return { success: true, data: intakes }
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error }
  }
}

export async function createIntake(data: {
  customerName: string
  items: { id:string, sku: string; quantity: number; price: number }[]
}): Promise<ActionResult<IntakeDTO>> {
  try {
    const result = await intakeService.create(DEMO_TENANT_ID, DEMO_USER_ID, data)
    if (result.success) {
      revalidatePath('/intake')
      revalidatePath('/inventory')
    }
    return result
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error }
  }
}

export async function updateIntakeStatus(
  id: string,
  status: 'REQUESTED' | 'ACCEPTED' | 'ARRIVED' | 'IN_TRANSIT' | 'REJECTED'
): Promise<ActionResult> {
  try {
    const result = await intakeService.updateStatus(id, DEMO_TENANT_ID, status)
    if (result.success) revalidatePath('/intake')
    return result
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error }
  }
}