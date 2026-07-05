import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const { Pool } = pg

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: pg.Pool | undefined
}

const pool = globalForPrisma.pool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase's pooler enforces a hard client cap. Keep each instance's pool
  // small so serverless functions don't exhaust it (use the transaction
  // pooler, port 6543, for DATABASE_URL). Override via DATABASE_POOL_MAX.
  max: Number(process.env.DATABASE_POOL_MAX ?? 3),
  // Release idle connections quickly — on Supabase every idle client still
  // counts toward the pooler's cap, and warm serverless instances holding
  // idle connections are what exhausts it.
  idleTimeoutMillis: 10_000,
  allowExitOnIdle: true,
  // Fail fast with a clear error instead of queueing forever when the
  // pooler is saturated (the request would otherwise hang until the
  // platform's function timeout).
  connectionTimeoutMillis: 10_000,
})

// Cache on globalThis unconditionally: dev hot-reload re-evaluates modules,
// and separate route bundles can each get their own module copy — either way
// duplicate pools multiply connections against the pooler's client cap.
globalForPrisma.pool = pool

const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

globalForPrisma.prisma = prisma