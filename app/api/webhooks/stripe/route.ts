import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { paymentService } from '@/services/payment.service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return new Response('STRIPE_WEBHOOK_SECRET is not set', { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  const payload = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return new Response(`Webhook signature verification failed: ${message}`, {
      status: 400,
    })
  }

  try {
    await paymentService.handleEvent(event)
  } catch (err) {
    console.error('Stripe webhook handler error:', err)
    return new Response('Webhook handler failed', { status: 500 })
  }

  return Response.json({ received: true })
}
