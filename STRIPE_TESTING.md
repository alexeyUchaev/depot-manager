# Stripe — running test payments

The whole integration reads its keys from the environment, so **test mode** is
just a matter of using test keys (`sk_test_...` / `pk_test_...`). Nothing is
ever really charged.

## 1. Setup

Copy `.env.example` → `.env.local` and fill it in:
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... # printed by stripe listen (see below)
STRIPE_PRICE_PRO=price_... # create one in Dashboard → Products (recurring)
NEXT_PUBLIC_APP_URL=http://localhost:3000

Apply the schema changes:
npx prisma migrate dev --name stripe_payments

## 2. Local webhooks (Stripe CLI)
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe

The CLI prints a `whsec_...` secret — drop it into `STRIPE_WEBHOOK_SECRET` and
restart `next dev`.

## 3. Test cards
| Number                | What it does                  |
|-----------------------|-------------------------------|
| `4242 4242 4242 4242` | payment succeeds              |
| `4000 0000 0000 9995` | declined (insufficient funds) |
| `4000 0025 0000 3155` | triggers 3D Secure            |
Any future expiry, any CVC, any ZIP.

## 4. Paying for an order (warehouse)
1. Create an order (through the AI agent or `createOrder`). It shows up as
   `AWAITING_PAYMENT` and stock is **not** touched yet.
2. Open `http://localhost:3000/api/orders/<ORDER_ID>/checkout` in the browser
   — it redirects to Stripe Checkout. Pay with `4242...`.
3. The `checkout.session.completed` webhook fires → `finalizePaidOrder`:
   - the order moves to `PROCESSING` and gets a `paidAt`;
   - `OUT` rows are posted to `StockMovement` and `Product.cachedQuantity`
     goes down.
To check the movements, open `/movements` or look at the `StockMovement` table
directly.

## 5. Subscriptions (Tenant)
1. Go to `/company` → **Upgrade Plan** → Stripe Checkout (`subscription`).
2. Pay with `4242...`.
3. The `customer.subscription.created/updated` webhook sets `Tenant.plan = PRO`
   and fills in `stripeSubscriptionId`, `subscriptionStatus`,
   `currentPeriodEnd`.
Managing or cancelling a subscription goes through the Stripe Billing Portal
(`openBillingPortal`).

## 6. Firing events without the UI
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated

> Note: the webhook is idempotent — each `event.id` is handled exactly once
> (the `ProcessedStripeEvent` table), so Stripe re-delivering an event is safe.