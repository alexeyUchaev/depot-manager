'use server'

import { paymentService } from '@/services/payment.service'
import type { ActionResult } from '@/types/user.types'
import { DEMO_TENANT_ID } from '@/lib/constants'

export async function startOrderCheckout(
  orderId: string
): Promise<ActionResult<{ url: string }>> {
  return paymentService.createOrderCheckoutSession(DEMO_TENANT_ID, orderId)
}

export async function startSubscriptionCheckout(): Promise<
  ActionResult<{ url: string }>
> {
  return paymentService.createSubscriptionCheckoutSession(DEMO_TENANT_ID)
}

export async function openBillingPortal(): Promise<
  ActionResult<{ url: string }>
> {
  return paymentService.createBillingPortalSession(DEMO_TENANT_ID)
}
