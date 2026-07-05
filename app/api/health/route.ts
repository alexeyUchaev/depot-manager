import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Reports which database the running deployment actually targets (host/port/
// user — never the password) and whether a round-trip query succeeds. Exists
// to debug env/pooler misconfiguration: open /api/health and read the answer.
export async function GET() {
  const raw = process.env.DATABASE_URL
  let target = 'DATABASE_URL is not set'
  if (raw) {
    try {
      const u = new URL(raw)
      const port = u.port || '5432'
      const mode =
        port === '6543'
          ? 'transaction pooler'
          : u.hostname.includes('pooler.supabase.com')
            ? 'session pooler'
            : 'direct or unknown'
      target = `${u.username}@${u.hostname}:${port}${u.pathname} (${mode})`
    } catch {
      target = 'DATABASE_URL is set but is not a parseable URL (check quotes/spaces)'
    }
  }

  try {
    const started = Date.now()
    await prisma.$queryRaw`SELECT 1`
    return Response.json({ ok: true, db: target, latencyMs: Date.now() - started })
  } catch (e: unknown) {
    console.error('health check failed:', e)
    const error = e instanceof Error ? e.message : String(e)
    return Response.json({ ok: false, db: target, error }, { status: 500 })
  }
}
