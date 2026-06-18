import Stripe from 'stripe'

/**
 * Server-side Stripe client (singleton).
 *
 * Reads STRIPE_SECRET_KEY from the environment, so switching between Stripe
 * test mode and live mode is just a matter of swapping keys (sk_test_... vs
 * sk_live_...) — no code changes required. See STRIPE_TESTING.md.
 */
const globalForStripe = globalThis as unknown as { stripe: Stripe | undefined }

const secretKey = process.env.STRIPE_SECRET_KEY

export const stripe =
  globalForStripe.stripe ??
  // Fall back to a non-empty placeholder when STRIPE_SECRET_KEY is unset so the
  // constructor doesn't throw at import time (e.g. during `next build`, which
  // evaluates route modules without runtime env). Any real API call is guarded
  // by assertStripeConfigured() and will fail loudly if the key is missing.
  new Stripe(secretKey ?? 'sk_test_unconfigured_placeholder', {
    // Pin nothing here on purpose: the account's default API version is used,
    // which keeps webhook payload shapes consistent with the dashboard.
    appInfo: { name: 'depot-manager' },
  })

if (process.env.NODE_ENV !== 'production') {
  globalForStripe.stripe = stripe
}

/** Throws a clear error if Stripe is not configured, instead of a cryptic 401. */
export function assertStripeConfigured() {
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set in the environment')
  }
}

/** Base URL used to build Stripe success/cancel redirect targets. */
export function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
    'http://localhost:3000'
  )
}
