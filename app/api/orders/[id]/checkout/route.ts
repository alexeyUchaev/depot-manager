import { paymentService } from '@/services/payment.service'
import { DEMO_TENANT_ID } from '@/lib/constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/orders/:id/checkout
 * Creates a Stripe Checkout Session for the order and 303-redirects the browser
 * to the hosted payment page. Handy for testing: just open the URL.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const result = await paymentService.createOrderCheckoutSession(
    DEMO_TENANT_ID,
    id
  )

  if (!result.success) {
    return new Response(result.error ?? 'Checkout failed', { status: 400 })
  }

  return Response.redirect(result.data.url, 303)
}
