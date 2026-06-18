// actions/billing.actions.ts
'use server'

import { paymentService } from '@/services/payment.service'
import type { ActionResult } from '@/types/user.types'
import { DEMO_TENANT_ID } from '@/lib/constants'

/** Start Stripe Checkout for an existing order; returns the hosted URL. */
export async function startOrderCheckout(
  orderId: string
): Promise<ActionResult<{ url: string }>> {
  return paymentService.createOrderCheckoutSession(DEMO_TENANT_ID, orderId)
}

/** Start Stripe Checkout to upgrade the org to PRO; returns the hosted URL. */
export async function startSubscriptionCheckout(): Promise<
  ActionResult<{ url: string }>
> {
  return paymentService.createSubscriptionCheckoutSession(DEMO_TENANT_ID)
}

/** Open the Stripe billing portal; returns the hosted URL. */
export async function openBillingPortal(): Promise<
  ActionResult<{ url: string }>
> {
  return paymentService.createBillingPortalSession(DEMO_TENANT_ID)
}
