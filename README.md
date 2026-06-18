# DepotAI — AI-native Warehouse Management

Manage an entire warehouse by **talking to an AI agent**. DepotAI is a multi-tenant inventory &
order-management system where the AI assistant is a first-class interface: ask it in plain language
to check stock, add products or place orders, and it executes the operation against live data using
function calling — never hallucinating numbers.

> Built with Next.js 16, React 19, Prisma 7 and Google Gemini.

## Live Demo

 **[Live demo](https://depot-ai-manager.vercel.app/)**

In the demo, sign-in is disabled and the manual "create" buttons are intentionally turned off —
everything is created through the AI assistant. Try:

> *"Create an order of 20 Hex Bolt M8 for Meridian Construction."*

…and watch the agent find the SKU, verify there is enough stock, and place the order.

## Why it stands out

- 🤖 **AI as the interface** — a tool-calling agent (Gemini) that reads real inventory and performs
  actions (`getAllProductsByTenant`, `createProduct`, `createOrder`, `getAnalytics`) over a streaming
  (SSE) loop. Voice input is supported.
- 🧾 **Ledger-based stock accounting** — `StockMovement` is the single source of truth. Every IN/OUT
  is an immutable, signed ledger entry written **atomically** alongside a denormalized
  `cachedQuantity` projection, with a `reconcile()` routine to rebuild quantities from the ledger.
  This is the pattern real accounting/ERP systems use — not a mutable `quantity` column.
- 🏢 **Multi-tenant by design** — every query is scoped by tenant.

## Features

- 📦 **Inventory** — products, stock levels, categories, warehouse locations, low-stock thresholds
- 📥 **Intake** — inbound deliveries from suppliers (goods-in)
- 📋 **Orders** — outbound orders with a status workflow
- 🔁 **Stock Movements** — full audit log of every inventory change (IN/OUT) with user & reason
- 📈 **Analytics** — revenue, inventory valuation, top products, monthly trend, low-stock list
- 👥 **Users & Company** — role-based access (Owner, Manager, Staff)
- 💳 **Payments** — Stripe Checkout for order payments, Stripe Billing for tenant subscriptions
- 🔐 **Webhook-driven idempotent payments** — `checkout.session.completed` triggers stock ledger
  debits atomically; `customer.subscription.updated` manages tenant plan upgrades

## Tech Stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui |
| Backend | Next.js Server Actions, Prisma 7 ORM |
| Database | PostgreSQL |
| AI | Google Gemini (`@google/genai`) — function calling + SSE streaming |
| Payments | Stripe Checkout, Stripe Billing, Stripe webhooks |
| Deployment | Vercel |

## Payments (Stripe)

DepotAI uses **Stripe** in test mode for two payment flows:

| Flow | Description |
| --- | --- |
| **Order payment** | An order created in `AWAITING_PAYMENT` status. Visiting `/api/orders/<ID>/checkout` redirects to Stripe Checkout. On success, a `checkout.session.completed` webhook finalises the order: status → `PROCESSING`, `paidAt` is set, and `OUT` movements are posted to the stock ledger. |
| **Tenant subscription** | The `/company` page offers an **Upgrade Plan** button that opens Stripe Checkout for a recurring subscription. The `customer.subscription.created/updated` webhook sets `Tenant.plan = PRO` and stores Stripe subscription metadata. |

Both flows are **idempotent** — every Stripe event is deduplicated via the `ProcessedStripeEvent` table.

For local testing, test card numbers, and Stripe CLI setup, see **[STRIPE_TESTING.md](./STRIPE_TESTING.md)**.

## Screenshots

<!-- Drop images into docs/screenshots/ and reference them here, e.g.: -->
<!-- ![Dashboard](docs/screenshots/dashboard.png) -->
<!-- ![AI assistant placing an order](docs/screenshots/ai-agent.png) -->

_Add a dashboard screenshot and a short GIF of the AI assistant placing an order here._

## Getting Started

```bash
# 1. Install dependencies
npm install 

# 2. Configure environment
cp .env.example .env   # then fill in DATABASE_URL and GEMINI_API_KEY

# 3. Create the schema and seed realistic demo data
#    (~100 industrial/MRO SKUs, suppliers, customers, orders and movements)
npx prisma db push
npx prisma db seed

# 4. Run the dev server
npm run dev
```

Open <http://localhost:3000> — the root redirects to the dashboard.

## Project Structure

```
app/            # App Router pages (dashboard, inventory, intake, orders, movements, analytics, users, company)
app/api/chat/   # Streaming AI agent endpoint (function-calling loop)
actions/        # Server Actions — thin API layer over services
services/       # Business logic — incl. stock.service.ts (the stock ledger)
lib/            # ai-tools, ai-executor, prisma client, constants
prisma/         # schema.prisma + seed.ts
components/     # UI (shadcn/ui) + AI agent widgets
schemas/        # Zod schemas
types/          # TypeScript types
```

## Notes

This repository is a portfolio demo. Authentication is stubbed via a fixed demo tenant so the app
runs without sign-in, and manual create actions are routed through the AI assistant. The stock
ledger, multi-tenant data model and AI agent are production-style and meant to be reused as a
starting point for real builds.