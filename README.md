# Depot Manager

A modern warehouse management SaaS built with Next.js 16, Prisma 7, and AI.

## Live Demo

🚀 [Open Demo](https://depot-manager-nx7e-git-main-alexs-projects-ba26bcc3.vercel.app/dashboard)

## Features

- 📦 **Inventory Management** — Track products, stock levels, and warehouse locations
- 📋 **Orders** — Manage outbound orders with real-time status updates
- 📊 **Stock Movements** — Full audit log of all inventory changes (IN/OUT/ADJUSTMENT)
- 📈 **Analytics** — Revenue, inventory valuation, and top selling products
- 🤖 **AI Assistant** — Ask questions about your warehouse in natural language
- 👥 **Team Management** — Role-based access (Owner, Manager, Staff)
- 🏢 **Multi-tenant** — Each organization has isolated data

## Tech Stack

- **Frontend** — Next.js 16, React 19, Tailwind CSS, shadcn/ui
- **Backend** — Next.js Server Actions, Prisma 7 ORM
- **Database** — PostgreSQL (Supabase)
- **AI** — Groq API (Llama 3.3 70B)
- **Deployment** — Vercel

## Architecture

```
actions/          # Server Actions (API layer)
services/         # Business logic
components/       # UI components
app/              # Next.js App Router pages
prisma/           # Database schema and seed
lib/              # Utilities (Prisma client)
types/            # TypeScript types
```

## Key Business Logic

- **Multi-tenant isolation** — all queries scoped by tenantId
- **Stock movements** — every inventory change is logged with user, reason, and timestamp
- **Low stock alerts** — automatic warnings when quantity drops below threshold
- **AI warehouse assistant** — natural language queries over real inventory data

