// actions/order.actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { orderService } from '@/services/order.service'
import type { ActionResult } from '@/types/user.types'
import type { OrderDTO } from '@/services/order.service'

const DEMO_TENANT_ID = 'cmpk3vjwi00007g5dkg1dpryy'
const DEMO_USER_ID = 'cmpk3vk9p00017g5d5sucwz3r'

export async function getOrders(): Promise<ActionResult<OrderDTO[]>> {
  try {
    const orders = await orderService.getAllByTenant(DEMO_TENANT_ID)
    return { success: true, data: orders }
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error }
  }
}

export async function createOrder(data: {
  customerName: string
  items: { sku: string; quantity: number; price: number }[]
}): Promise<ActionResult<OrderDTO>> {
  try {
    const result = await orderService.create(DEMO_TENANT_ID, DEMO_USER_ID, data)
    if (result.success) revalidatePath('/orders')
    return result
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error }
  }
}

export async function updateOrderStatus(
  id: string,
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED'
): Promise<ActionResult> {
  try {
    const result = await orderService.updateStatus(id, DEMO_TENANT_ID, status)
    if (result.success) revalidatePath('/orders')
    return result
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error }
  }
}