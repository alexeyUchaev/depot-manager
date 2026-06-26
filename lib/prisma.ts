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
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.pool = pool
}

const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}