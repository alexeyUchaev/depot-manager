# Architecture

Short notes on how DepotAI fits together and, more to the point, *why*
a few things are done the way they are. It's a demo, so some parts are
deliberately stubbed (see the end), but the warehouse and payment logic is
built the way I'd build it for real.

## Layout

Nothing exotic here. Requests come in through Next.js server actions
(`/actions`) or route handlers (`/app/api`), and those stay thin — they grab
the tenant/user context and hand off to a service. The actual work lives in
`/services`. Anything that talks to the outside world (Prisma, Stripe, Gemini)
sits in `/lib`.

Services don't hand Prisma models straight to the UI. They map to plain DTOs
first (`OrderDTO`, `IntakeDTO`, and so on). It's a little more typing, but the
database shape and the UI shape can then change independently, and I never
accidentally leak a column the front end has no business seeing.

## Stock is a ledger, not a number

This is the one decision I'd defend hardest.

The obvious way to track inventory is a `quantity` column on the product that
you bump up and down. I didn't do that. Every change in stock is an
append-only row in `StockMovement` (IN or OUT, with a signed quantity), and
the real on-hand figure is the sum of that ledger. `Product.cachedQuantity`
exists too, but it's only a cache — a denormalized copy of `SUM(quantity)` so
list pages don't have to aggregate on every read.

Why bother? A bare counter throws away history. With the ledger I can always
explain how we got to 14 units: which intake brought stock in, which paid
order took it out. And if the cache ever drifts — a bug, a manual DB edit, a
half-finished migration — `reconcile()` rebuilds every product's count from
the ledger and the invariant `cachedQuantity === SUM(movements)` holds again.

The rule that keeps it honest: nothing writes `cachedQuantity` directly except
`reconcile`. Everything else goes through `postMovement`, which writes the
ledger row and bumps the cache inside the *same* transaction, so the two can't
fall out of step during normal use.

## Payments: stock moves only after the money lands

Orders and Stripe are wired so an unpaid order never quietly eats inventory.

A new order starts as `AWAITING_PAYMENT` and nothing leaves stock yet. We do
check availability at that point, but treat it as a friendly early warning,
not the source of truth. The customer pays through a Stripe Checkout session,
Stripe calls our webhook, and only then does `finalizePaidOrder` post the OUT
movements and move the order to `PROCESSING`.

Two things I was careful about:

Idempotency, twice. Stripe delivers webhooks at-least-once, so the same event
can show up more than once. I guard at two levels — every processed `event.id`
is recorded in `ProcessedStripeEvent` and skipped on a repeat, and on top of
that `finalizePaidOrder` returns early if the order already has a `paidAt`.
Either guard alone would mostly do the job; together, a duplicate delivery
simply can't post the stock movements twice.

Re-check stock at payment time. Inventory can change between placing an order
and paying for it — someone else grabs the last unit. So availability is
verified again inside the finalize transaction rather than trusted from when
the order was created.

There's also `checkout.session.expired`, which cancels the order, and the
subscription events keep the tenant's plan column in sync. All of it is driven
by webhooks and never done optimistically from the browser, because the
browser is exactly the place you can't trust about whether money really moved.

## The AI agent

The chat (`/app/api/chat`) talks to Gemini with function calling. The model
can reach a small set of tools — list products, create a product, create an
order, pull analytics — and every one of those tools calls the same services
the rest of the app uses, so the AI has no private back door into the data.
Replies stream to the client over SSE.

A couple of guardrails: the tool loop is capped at five steps so a confused
model can't spin forever, and each call is wrapped so a failure comes back as
an ordinary result the model can react to instead of tearing down the stream.
It also accepts image and PDF attachments and passes them to Gemini as
multimodal input, which is how it can read a delivery note and turn it into an
order.

## What's stubbed for the demo

To be upfront about the edges:

- Auth. There's no Clerk wired in — `tenantId`/`userId` come from demo
  constants. The data model is already multi-tenant (every query is scoped by
  `orgId`), so adding real auth is mostly a question of swapping where those
  two ids come from.
- A few UI pieces (the orders search box, the row action menu) are
  presentational only.
- Order numbers are derived from a row count. Fine for a single-user demo;
  under real concurrency this would move to a database sequence.