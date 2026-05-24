import { createGroq } from '@ai-sdk/groq'
import { streamText } from 'ai'
import { prisma } from '@/lib/prisma'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const DEMO_TENANT_ID = 'cmpk3vjwi00007g5dkg1dpryy'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const products = await prisma.product.findMany({
    where: { orgId: DEMO_TENANT_ID },
    select: {
      name: true,
      sku: true,
      category: true,
      quantity: true,
      price: true,
      lowStockAt: true,
      location: true,
    },
  })

  const orders = await prisma.order.findMany({
    where: { orgId: DEMO_TENANT_ID },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      orderNumber: true,
      customerName: true,
      status: true,
      createdAt: true,
    },
  })

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: `You are a warehouse management assistant for Depot Manager.
    
Current inventory:
${JSON.stringify(products, null, 2)}

Recent orders:
${JSON.stringify(orders, null, 2)}

Answer questions about stock levels, orders, and warehouse operations.
Be concise and helpful. If a product is below lowStockAt, warn about it.`,
    messages,
  })

return result.toUIMessageStreamResponse()
}