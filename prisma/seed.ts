import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { DEMO_TENANT_ID, DEMO_USER_ID } from '../lib/constants'

const { Pool } = pg
// Seed against the session pooler / direct connection (DIRECT_URL). Cap the
// pool so the bulk Promise.all inserts below don't open a burst of connections
// and trip Supabase's session-mode client limit (EMAXCONNSESSION).
const pool = new Pool({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  max: Number(process.env.DATABASE_POOL_MAX ?? 3),
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ---------------------------------------------------------------------------
// Niche: Industrial Fasteners / MRO (Maintenance, Repair & Operations) supply.
// The seed builds a realistic history: stock arrived through a series of
// Intakes (StockMovement IN) and part of it shipped to customers through
// Orders (StockMovement OUT). Final on-hand quantities (cachedQuantity) are
// rebuilt from the StockMovement ledger — the single source of truth.
// ---------------------------------------------------------------------------

type ProductDef = {
  name: string
  category: string
  prefix: string // SKU prefix per category
  price: number
  lowStockAt: number
}

// Aisle/bay location helper — deterministic per index so it stays stable.
function locationFor(i: number): string {
  const aisle = 1 + (i % 18)
  const bay = String.fromCharCode(65 + (i % 6)) // A..F
  const level = 1 + (i % 4)
  return `Aisle ${aisle} / Bay ${bay}-${level}`
}

// ~100 products across 10 MRO categories.
const productDefs: ProductDef[] = [
  // --- Fasteners (FST) ---
  { name: 'Hex Bolt M6x20 Zinc (100pk)', category: 'Fasteners', prefix: 'FST', price: 8.5, lowStockAt: 25 },
  { name: 'Hex Bolt M8x30 Zinc (100pk)', category: 'Fasteners', prefix: 'FST', price: 11.0, lowStockAt: 25 },
  { name: 'Hex Bolt M10x40 Zinc (50pk)', category: 'Fasteners', prefix: 'FST', price: 14.5, lowStockAt: 20 },
  { name: 'Hex Bolt M12x50 Galv (50pk)', category: 'Fasteners', prefix: 'FST', price: 19.0, lowStockAt: 20 },
  { name: 'Carriage Bolt M8x60 (50pk)', category: 'Fasteners', prefix: 'FST', price: 13.0, lowStockAt: 20 },
  { name: 'Hex Nut M6 Zinc (200pk)', category: 'Fasteners', prefix: 'FST', price: 5.5, lowStockAt: 30 },
  { name: 'Hex Nut M8 Zinc (200pk)', category: 'Fasteners', prefix: 'FST', price: 6.5, lowStockAt: 30 },
  { name: 'Hex Nut M10 Zinc (100pk)', category: 'Fasteners', prefix: 'FST', price: 7.0, lowStockAt: 25 },
  { name: 'Nyloc Nut M8 (100pk)', category: 'Fasteners', prefix: 'FST', price: 9.0, lowStockAt: 25 },
  { name: 'Flat Washer M8 Zinc (500pk)', category: 'Fasteners', prefix: 'FST', price: 6.0, lowStockAt: 30 },
  { name: 'Spring Washer M10 (500pk)', category: 'Fasteners', prefix: 'FST', price: 7.5, lowStockAt: 30 },
  { name: 'Wood Screw 4x40 Pozi (200pk)', category: 'Fasteners', prefix: 'FST', price: 7.0, lowStockAt: 30 },
  { name: 'Wood Screw 5x60 Pozi (200pk)', category: 'Fasteners', prefix: 'FST', price: 9.5, lowStockAt: 30 },
  { name: 'Self-Tapping Screw 4.2x25 (250pk)', category: 'Fasteners', prefix: 'FST', price: 8.0, lowStockAt: 30 },
  { name: 'Drywall Screw 3.5x35 (1000pk)', category: 'Fasteners', prefix: 'FST', price: 12.0, lowStockAt: 25 },
  { name: 'Sleeve Anchor M10x80 (25pk)', category: 'Fasteners', prefix: 'FST', price: 16.0, lowStockAt: 15 },
  { name: 'Wedge Anchor M12x100 (20pk)', category: 'Fasteners', prefix: 'FST', price: 22.0, lowStockAt: 15 },
  { name: 'Nylon Wall Plug 8mm (200pk)', category: 'Fasteners', prefix: 'FST', price: 5.0, lowStockAt: 30 },
  { name: 'Threaded Rod M10x1m', category: 'Fasteners', prefix: 'FST', price: 6.5, lowStockAt: 20 },
  { name: 'Threaded Rod M12x1m', category: 'Fasteners', prefix: 'FST', price: 8.5, lowStockAt: 20 },

  // --- Power Tools (PWR) ---
  { name: 'Cordless Drill 18V Brushless', category: 'Power Tools', prefix: 'PWR', price: 189.0, lowStockAt: 6 },
  { name: 'Impact Driver 18V', category: 'Power Tools', prefix: 'PWR', price: 165.0, lowStockAt: 6 },
  { name: 'Angle Grinder 125mm 900W', category: 'Power Tools', prefix: 'PWR', price: 79.0, lowStockAt: 8 },
  { name: 'Angle Grinder 230mm 2200W', category: 'Power Tools', prefix: 'PWR', price: 139.0, lowStockAt: 6 },
  { name: 'SDS-Plus Rotary Hammer 800W', category: 'Power Tools', prefix: 'PWR', price: 159.0, lowStockAt: 6 },
  { name: 'Reciprocating Saw 1100W', category: 'Power Tools', prefix: 'PWR', price: 129.0, lowStockAt: 6 },
  { name: 'Circular Saw 190mm 1600W', category: 'Power Tools', prefix: 'PWR', price: 119.0, lowStockAt: 6 },
  { name: 'Jigsaw 750W Variable Speed', category: 'Power Tools', prefix: 'PWR', price: 89.0, lowStockAt: 8 },
  { name: 'Bench Grinder 200mm 400W', category: 'Power Tools', prefix: 'PWR', price: 109.0, lowStockAt: 5 },
  { name: 'Heat Gun 2000W', category: 'Power Tools', prefix: 'PWR', price: 45.0, lowStockAt: 8 },
  { name: 'Cordless Battery 18V 5.0Ah', category: 'Power Tools', prefix: 'PWR', price: 69.0, lowStockAt: 12 },
  { name: 'Fast Charger 18V', category: 'Power Tools', prefix: 'PWR', price: 49.0, lowStockAt: 10 },

  // --- Hand Tools (HND) ---
  { name: 'Combination Spanner Set 8-22mm', category: 'Hand Tools', prefix: 'HND', price: 39.0, lowStockAt: 8 },
  { name: 'Socket Set 1/2" 24pc', category: 'Hand Tools', prefix: 'HND', price: 59.0, lowStockAt: 8 },
  { name: 'Screwdriver Set 12pc', category: 'Hand Tools', prefix: 'HND', price: 24.0, lowStockAt: 10 },
  { name: 'Claw Hammer 16oz Fiberglass', category: 'Hand Tools', prefix: 'HND', price: 18.0, lowStockAt: 12 },
  { name: 'Club Hammer 1.5kg', category: 'Hand Tools', prefix: 'HND', price: 22.0, lowStockAt: 10 },
  { name: 'Adjustable Wrench 250mm', category: 'Hand Tools', prefix: 'HND', price: 16.0, lowStockAt: 12 },
  { name: 'Locking Pliers 10"', category: 'Hand Tools', prefix: 'HND', price: 14.0, lowStockAt: 12 },
  { name: 'Side Cutter Pliers 180mm', category: 'Hand Tools', prefix: 'HND', price: 12.5, lowStockAt: 12 },
  { name: 'Tape Measure 8m', category: 'Hand Tools', prefix: 'HND', price: 9.5, lowStockAt: 15 },
  { name: 'Spirit Level 600mm', category: 'Hand Tools', prefix: 'HND', price: 21.0, lowStockAt: 10 },
  { name: 'Utility Knife + 10 Blades', category: 'Hand Tools', prefix: 'HND', price: 8.0, lowStockAt: 15 },
  { name: 'Allen Key Set Metric 9pc', category: 'Hand Tools', prefix: 'HND', price: 11.0, lowStockAt: 12 },
  { name: 'Torque Wrench 1/2" 28-210Nm', category: 'Hand Tools', prefix: 'HND', price: 64.0, lowStockAt: 6 },
  { name: 'Pry Bar 600mm', category: 'Hand Tools', prefix: 'HND', price: 17.0, lowStockAt: 10 },

  // --- Cutting Tools (CUT) ---
  { name: 'HSS Drill Bit Set 1-10mm 19pc', category: 'Cutting Tools', prefix: 'CUT', price: 22.0, lowStockAt: 12 },
  { name: 'Masonry Drill Bit Set 5-10mm', category: 'Cutting Tools', prefix: 'CUT', price: 14.0, lowStockAt: 12 },
  { name: 'SDS-Plus Drill Bit 10x160mm', category: 'Cutting Tools', prefix: 'CUT', price: 6.5, lowStockAt: 20 },
  { name: 'Cobalt Drill Bit 8mm (5pk)', category: 'Cutting Tools', prefix: 'CUT', price: 12.0, lowStockAt: 15 },
  { name: 'Screwdriver Bit PH2 (25pk)', category: 'Cutting Tools', prefix: 'CUT', price: 7.0, lowStockAt: 20 },
  { name: 'Impact Bit Set 32pc', category: 'Cutting Tools', prefix: 'CUT', price: 19.0, lowStockAt: 12 },
  { name: 'Hole Saw Set 19-64mm 11pc', category: 'Cutting Tools', prefix: 'CUT', price: 26.0, lowStockAt: 8 },
  { name: 'Tap & Die Set M3-M12', category: 'Cutting Tools', prefix: 'CUT', price: 34.0, lowStockAt: 6 },
  { name: 'Jigsaw Blade Wood (5pk)', category: 'Cutting Tools', prefix: 'CUT', price: 5.5, lowStockAt: 20 },
  { name: 'Recip Saw Blade Metal (5pk)', category: 'Cutting Tools', prefix: 'CUT', price: 8.5, lowStockAt: 20 },

  // --- Abrasives (ABR) ---
  { name: 'Cutting Disc 125x1.0mm (10pk)', category: 'Abrasives', prefix: 'ABR', price: 9.0, lowStockAt: 25 },
  { name: 'Cutting Disc 230x2.0mm (10pk)', category: 'Abrasives', prefix: 'ABR', price: 14.0, lowStockAt: 20 },
  { name: 'Grinding Disc 125x6mm (5pk)', category: 'Abrasives', prefix: 'ABR', price: 11.0, lowStockAt: 20 },
  { name: 'Flap Disc 125mm P60 (5pk)', category: 'Abrasives', prefix: 'ABR', price: 13.0, lowStockAt: 20 },
  { name: 'Sanding Sheet P120 (50pk)', category: 'Abrasives', prefix: 'ABR', price: 12.0, lowStockAt: 20 },
  { name: 'Sanding Roll P80 5m', category: 'Abrasives', prefix: 'ABR', price: 10.0, lowStockAt: 15 },
  { name: 'Wire Wheel Brush 100mm', category: 'Abrasives', prefix: 'ABR', price: 7.5, lowStockAt: 15 },
  { name: 'Diamond Blade 230mm', category: 'Abrasives', prefix: 'ABR', price: 24.0, lowStockAt: 10 },

  // --- Adhesives & Sealants (ADH) ---
  { name: 'Silicone Sealant Clear 310ml', category: 'Adhesives & Sealants', prefix: 'ADH', price: 4.5, lowStockAt: 30 },
  { name: 'Polyurethane Adhesive 310ml', category: 'Adhesives & Sealants', prefix: 'ADH', price: 7.0, lowStockAt: 25 },
  { name: 'Threadlocker Blue 50ml', category: 'Adhesives & Sealants', prefix: 'ADH', price: 9.5, lowStockAt: 20 },
  { name: 'Threadlocker Red 50ml', category: 'Adhesives & Sealants', prefix: 'ADH', price: 10.5, lowStockAt: 20 },
  { name: 'Cyanoacrylate Super Glue 20g', category: 'Adhesives & Sealants', prefix: 'ADH', price: 3.5, lowStockAt: 30 },
  { name: 'Epoxy Adhesive 2-Part 50ml', category: 'Adhesives & Sealants', prefix: 'ADH', price: 8.0, lowStockAt: 20 },
  { name: 'Expanding Foam 750ml', category: 'Adhesives & Sealants', prefix: 'ADH', price: 6.5, lowStockAt: 25 },
  { name: 'Contact Adhesive 1L', category: 'Adhesives & Sealants', prefix: 'ADH', price: 11.0, lowStockAt: 15 },

  // --- Lubricants (LUB) ---
  { name: 'Multi-Purpose Lube Spray 400ml', category: 'Lubricants', prefix: 'LUB', price: 5.0, lowStockAt: 30 },
  { name: 'White Lithium Grease 400ml', category: 'Lubricants', prefix: 'LUB', price: 6.0, lowStockAt: 25 },
  { name: 'Penetrating Oil 500ml', category: 'Lubricants', prefix: 'LUB', price: 5.5, lowStockAt: 25 },
  { name: 'Chain Lube 400ml', category: 'Lubricants', prefix: 'LUB', price: 7.0, lowStockAt: 20 },
  { name: 'Cutting Fluid 1L', category: 'Lubricants', prefix: 'LUB', price: 12.0, lowStockAt: 15 },
  { name: 'Bearing Grease Cartridge 400g', category: 'Lubricants', prefix: 'LUB', price: 4.5, lowStockAt: 25 },
  { name: 'Silicone Spray 400ml', category: 'Lubricants', prefix: 'LUB', price: 5.5, lowStockAt: 25 },
  { name: 'Brake Cleaner 500ml', category: 'Lubricants', prefix: 'LUB', price: 4.0, lowStockAt: 30 },

  // --- Safety / PPE (PPE) ---
  { name: 'Nitrile Gloves L (100pk)', category: 'Safety / PPE', prefix: 'PPE', price: 9.0, lowStockAt: 40 },
  { name: 'Cut-Resistant Gloves L', category: 'Safety / PPE', prefix: 'PPE', price: 6.5, lowStockAt: 30 },
  { name: 'Leather Rigger Gloves', category: 'Safety / PPE', prefix: 'PPE', price: 5.0, lowStockAt: 30 },
  { name: 'Safety Glasses Clear', category: 'Safety / PPE', prefix: 'PPE', price: 3.0, lowStockAt: 40 },
  { name: 'Safety Goggles Anti-Fog', category: 'Safety / PPE', prefix: 'PPE', price: 5.5, lowStockAt: 25 },
  { name: 'Hard Hat White', category: 'Safety / PPE', prefix: 'PPE', price: 8.0, lowStockAt: 20 },
  { name: 'Ear Defenders SNR 30dB', category: 'Safety / PPE', prefix: 'PPE', price: 12.0, lowStockAt: 15 },
  { name: 'FFP3 Respirator Mask (10pk)', category: 'Safety / PPE', prefix: 'PPE', price: 14.0, lowStockAt: 20 },
  { name: 'Hi-Vis Vest XL', category: 'Safety / PPE', prefix: 'PPE', price: 4.5, lowStockAt: 30 },
  { name: 'Knee Pads Gel', category: 'Safety / PPE', prefix: 'PPE', price: 11.0, lowStockAt: 15 },

  // --- Electrical (ELC) ---
  { name: 'Cable Ties 200mm Black (100pk)', category: 'Electrical', prefix: 'ELC', price: 3.5, lowStockAt: 40 },
  { name: 'Cable Ties 300mm Black (100pk)', category: 'Electrical', prefix: 'ELC', price: 5.0, lowStockAt: 30 },
  { name: 'Insulation Tape Black (10pk)', category: 'Electrical', prefix: 'ELC', price: 6.0, lowStockAt: 30 },
  { name: 'Twin & Earth Cable 2.5mm 50m', category: 'Electrical', prefix: 'ELC', price: 38.0, lowStockAt: 10 },
  { name: 'Crimp Terminal Assortment 480pc', category: 'Electrical', prefix: 'ELC', price: 15.0, lowStockAt: 12 },
  { name: 'WAGO Connector 221 3-Way (50pk)', category: 'Electrical', prefix: 'ELC', price: 22.0, lowStockAt: 12 },
  { name: 'Heat Shrink Tube Kit 328pc', category: 'Electrical', prefix: 'ELC', price: 13.0, lowStockAt: 12 },
  { name: 'Conduit Clips 20mm (100pk)', category: 'Electrical', prefix: 'ELC', price: 7.0, lowStockAt: 20 },

  // --- Plumbing & Fittings (PLB) ---
  { name: 'PTFE Thread Tape (10pk)', category: 'Plumbing & Fittings', prefix: 'PLB', price: 4.0, lowStockAt: 30 },
  { name: 'Compression Elbow 15mm (10pk)', category: 'Plumbing & Fittings', prefix: 'PLB', price: 9.0, lowStockAt: 20 },
  { name: 'Compression Tee 22mm (10pk)', category: 'Plumbing & Fittings', prefix: 'PLB', price: 14.0, lowStockAt: 15 },
  { name: 'Push-Fit Coupler 15mm (10pk)', category: 'Plumbing & Fittings', prefix: 'PLB', price: 16.0, lowStockAt: 15 },
  { name: 'Brass Ball Valve 1/2"', category: 'Plumbing & Fittings', prefix: 'PLB', price: 7.5, lowStockAt: 20 },
  { name: 'Copper Pipe 15mm 3m', category: 'Plumbing & Fittings', prefix: 'PLB', price: 11.0, lowStockAt: 15 },
  { name: 'Pipe Clip 22mm (50pk)', category: 'Plumbing & Fittings', prefix: 'PLB', price: 6.0, lowStockAt: 20 },
  { name: 'Jubilee Hose Clip Assortment 26pc', category: 'Plumbing & Fittings', prefix: 'PLB', price: 8.5, lowStockAt: 15 },
]

async function main() {
  console.log('🌱 Seeding database (Industrial Fasteners / MRO)...')

  // Make the seed idempotent: wipe existing rows first so re-running it doesn't
  // fail on unique constraints (e.g. the demo tenant/users). Delete children
  // before parents to respect foreign keys.
  await prisma.stockMovement.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.intakeItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.intake.deleteMany()
  await prisma.product.deleteMany()
  await prisma.chatAttachment.deleteMany()
  await prisma.processedStripeEvent.deleteMany()
  await prisma.user.deleteMany()
  await prisma.tenant.deleteMany()
  console.log('🧹 Existing data cleared')

  // -- Tenant --
  const tenant = await prisma.tenant.create({
    data: {
      id: DEMO_TENANT_ID,
      name: 'IronClad Industrial Supply',
      slug: 'ironclad-industrial',
      clerkOrgId: 'demo_org_ironclad',
      plan: 'PRO',
    },
  })
  console.log('✅ Tenant created')

 await prisma.user.create({
    data: {
      id: DEMO_USER_ID,
      clerkId: 'demo_user_owner',
      tenantId: tenant.id,
      email: 'alexey@ironcladsupply.com',
      firstName: 'Alexey',
      lastName: 'U.',
      role: 'owner',
      department: 'Management',
    },
  })

  const manager1 = await prisma.user.create({
    data: {
      clerkId: 'demo_user_manager1',
      tenantId: tenant.id,
      email: 'j.doe@ironcladsupply.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'manager',
      department: 'Warehouse Operations',
    },
  })

  const manager2 = await prisma.user.create({
    data: {
      clerkId: 'demo_user_manager2',
      tenantId: tenant.id,
      email: 'm.smith@ironcladsupply.com',
      firstName: 'Mike',
      lastName: 'Smith',
      role: 'manager',
      department: 'Procurement',
    },
  })

  const staff1 = await prisma.user.create({
    data: {
      clerkId: 'demo_user_staff1',
      tenantId: tenant.id,
      email: 'a.kovalsky@ironcladsupply.com',
      firstName: 'Anna',
      lastName: 'Kovalsky',
      role: 'staff',
      department: 'Goods-In',
    },
  })

  await prisma.user.create({
    data: {
      clerkId: 'demo_user_staff2',
      tenantId: tenant.id,
      email: 'k.jones@ironcladsupply.com',
      firstName: 'Kevin',
      lastName: 'Jones',
      role: 'staff',
      department: 'Dispatch',
      isActive: false,
    },
  })
  console.log('✅ Users created')

  // -- Products (master data only; cachedQuantity rebuilt from ledger) --
  // Per-category running counter so SKUs are e.g. FST-1001, FST-1002...
  const skuCounters: Record<string, number> = {}
  const products = await Promise.all(
    productDefs.map((def, i) => {
      const n = (skuCounters[def.prefix] = (skuCounters[def.prefix] ?? 1000) + 1)
      return prisma.product.create({
        data: {
          orgId: tenant.id,
          name: def.name,
          sku: `${def.prefix}-${n}`,
          category: def.category,
          location: locationFor(i),
          price: def.price,
          lowStockAt: def.lowStockAt,
        },
      })
    })
  )
  console.log(`✅ ${products.length} products created`)

  // Index helpers: by SKU and by category, for building intakes/orders.
  const bySku = new Map(products.map((p) => [p.sku, p]))
  const byCategory = (cat: string) => products.filter((p) => p.category === cat)

  const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000)

  // ---------------------------------------------------------------------
  // INTAKES — inbound stock. ACCEPTED intakes post StockMovement IN rows.
  // ---------------------------------------------------------------------
  type Line = { product: { id: string }; quantity: number; price: number }

  async function addIntake(opts: {
    number: string
    supplier: string
    userId: string
    date: Date
    status: 'REQUESTED' | 'IN_TRANSIT' | 'ARRIVED' | 'ACCEPTED' | 'REJECTED'
    lines: Line[]
  }) {
    const intake = await prisma.intake.create({
      data: {
        orgId: tenant.id,
        userId: opts.userId,
        intakeNumber: opts.number,
        customerName: opts.supplier,
        status: opts.status,
        createdAt: opts.date,
        items: {
          create: opts.lines.map((l) => ({
            productId: l.product.id,
            quantity: l.quantity,
            price: l.price,
          })),
        },
      },
    })

    // Only accepted goods actually hit the shelves → ledger IN movements.
    if (opts.status === 'ACCEPTED') {
      for (const l of opts.lines) {
        await prisma.stockMovement.create({
          data: {
            orgId: tenant.id,
            productId: l.product.id,
            userId: opts.userId,
            takeId: intake.id,
            type: 'IN',
            quantity: l.quantity, // positive: stock arriving
            reason: `Intake ${opts.number}`,
            createdAt: opts.date,
          },
        })
      }
    }
    return intake
  }

  // Build large opening intakes per category so there's plenty of stock to ship.
  const linesFor = (cat: string, qty: number): Line[] =>
    byCategory(cat).map((p) => ({ product: p, quantity: qty, price: Number(p.price) }))

  await addIntake({
    number: 'ITK-1001',
    supplier: 'Bolt & Nut Co.',
    userId: staff1.id,
    date: daysAgo(88),
    status: 'ACCEPTED',
    lines: linesFor('Fasteners', 200),
  })
  await addIntake({
    number: 'ITK-1002',
    supplier: 'PowerTool Imports Ltd.',
    userId: manager2.id,
    date: daysAgo(80),
    status: 'ACCEPTED',
    lines: linesFor('Power Tools', 40),
  })
  await addIntake({
    number: 'ITK-1003',
    supplier: 'GripTools Wholesale',
    userId: staff1.id,
    date: daysAgo(74),
    status: 'ACCEPTED',
    lines: linesFor('Hand Tools', 60),
  })
  await addIntake({
    number: 'ITK-1004',
    supplier: 'EdgeCut Supplies',
    userId: staff1.id,
    date: daysAgo(66),
    status: 'ACCEPTED',
    lines: [...linesFor('Cutting Tools', 80), ...linesFor('Abrasives', 120)],
  })
  await addIntake({
    number: 'ITK-1005',
    supplier: 'ChemBond Distribution',
    userId: manager2.id,
    date: daysAgo(58),
    status: 'ACCEPTED',
    lines: [...linesFor('Adhesives & Sealants', 100), ...linesFor('Lubricants', 120)],
  })
  await addIntake({
    number: 'ITK-1006',
    supplier: 'SafeGuard PPE Direct',
    userId: staff1.id,
    date: daysAgo(50),
    status: 'ACCEPTED',
    lines: linesFor('Safety / PPE', 150),
  })
  await addIntake({
    number: 'ITK-1007',
    supplier: 'Voltline Electrical',
    userId: manager2.id,
    date: daysAgo(43),
    status: 'ACCEPTED',
    lines: linesFor('Electrical', 90),
  })
  await addIntake({
    number: 'ITK-1008',
    supplier: 'FlowFit Plumbing Supplies',
    userId: staff1.id,
    date: daysAgo(36),
    status: 'ACCEPTED',
    lines: linesFor('Plumbing & Fittings', 80),
  })
  // Top-up of fast-moving fasteners.
  await addIntake({
    number: 'ITK-1009',
    supplier: 'Bolt & Nut Co.',
    userId: staff1.id,
    date: daysAgo(20),
    status: 'ACCEPTED',
    lines: linesFor('Fasteners', 120),
  })
  // Pending / in-transit deliveries — no ledger movement yet.
  await addIntake({
    number: 'ITK-1010',
    supplier: 'PowerTool Imports Ltd.',
    userId: manager2.id,
    date: daysAgo(5),
    status: 'IN_TRANSIT',
    lines: linesFor('Power Tools', 25),
  })
  await addIntake({
    number: 'ITK-1011',
    supplier: 'SafeGuard PPE Direct',
    userId: staff1.id,
    date: daysAgo(2),
    status: 'REQUESTED',
    lines: linesFor('Safety / PPE', 100),
  })
  console.log('✅ Intakes created (with IN movements)')

  // ---------------------------------------------------------------------
  // ORDERS — outbound. SHIPPED/DELIVERED post StockMovement OUT rows.
  // ---------------------------------------------------------------------
  let orderSeq = 0
  async function addOrder(opts: {
    number: string
    customer: string
    userId: string
    date: Date
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED'
    lines: Line[]
  }) {
    const order = await prisma.order.create({
      data: {
        orgId: tenant.id,
        userId: opts.userId,
        orderNumber: opts.number,
        customerName: opts.customer,
        status: opts.status,
        createdAt: opts.date,
        items: {
          create: opts.lines.map((l) => ({
            productId: l.product.id,
            quantity: l.quantity,
            price: l.price,
          })),
        },
      },
    })

    // Stock only leaves the building once shipped/delivered.
    if (opts.status === 'SHIPPED' || opts.status === 'DELIVERED') {
      for (const l of opts.lines) {
        await prisma.stockMovement.create({
          data: {
            orgId: tenant.id,
            productId: l.product.id,
            userId: opts.userId,
            orderId: order.id,
            type: 'OUT',
            quantity: -l.quantity, // negative: stock leaving
            reason: `Order ${opts.number}`,
            createdAt: opts.date,
          },
        })
      }
    }
    return order
  }

  const line = (sku: string, qty: number): Line => {
    const p = bySku.get(sku)!
    return { product: p, quantity: qty, price: Number(p.price) }
  }

  const customers = [
    'Meridian Construction Ltd.',
    'Apex Mechanical Services',
    'BuildRight Contractors',
    'Northgate Facilities Mgmt',
    'Precision Engineering Co.',
    'Harbor Maintenance Group',
    'Summit Electrical Installers',
    'Riverside Plumbing & Heating',
    'Ironworks Fabrication',
    'Coastal Property Services',
  ]

  // Mix of delivered/shipped (move stock) and pending/processing (reserved).
  const orderPlans: Array<{
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED'
    user: string
    days: number
    lines: Line[]
  }> = [
    { status: 'DELIVERED', user: staff1.id, days: 70, lines: [line('FST-1001', 40), line('FST-1006', 30), line('LUB-1001', 12)] },
    { status: 'DELIVERED', user: staff1.id, days: 62, lines: [line('PWR-1001', 4), line('CUT-1001', 6), line('HND-1004', 5)] },
    { status: 'DELIVERED', user: manager1.id, days: 55, lines: [line('PPE-1001', 25), line('PPE-1004', 20), line('ELC-1001', 20)] },
    { status: 'DELIVERED', user: staff1.id, days: 48, lines: [line('ABR-1001', 15), line('ABR-1002', 10), line('PWR-1003', 3)] },
    { status: 'DELIVERED', user: manager1.id, days: 41, lines: [line('PLB-1001', 18), line('PLB-1005', 12), line('ADH-1001', 20)] },
    { status: 'SHIPPED', user: staff1.id, days: 33, lines: [line('FST-1002', 35), line('FST-1009', 18), line('FST-1010', 20)] },
    { status: 'SHIPPED', user: manager1.id, days: 27, lines: [line('HND-1001', 5), line('HND-1003', 6), line('CUT-1008', 4)] },
    { status: 'SHIPPED', user: staff1.id, days: 22, lines: [line('LUB-1004', 12), line('ADH-1003', 10), line('ELC-1003', 18)] },
    { status: 'SHIPPED', user: manager1.id, days: 16, lines: [line('PPE-1008', 12), line('PWR-1011', 31), line('PWR-1012', 30)] },
    { status: 'DELIVERED', user: staff1.id, days: 14, lines: [line('PWR-1001', 33), line('PWR-1002', 35), line('HND-1013', 6)] },
    { status: 'SHIPPED', user: staff1.id, days: 12, lines: [line('FST-1015', 18), line('FST-1016', 10), line('ABR-1001', 12)] },
    { status: 'SHIPPED', user: manager1.id, days: 9, lines: [line('ELC-1006', 8), line('ELC-1005', 7), line('PLB-1003', 9)] },
    { status: 'PROCESSING', user: staff1.id, days: 4, lines: [line('PWR-1005', 3), line('CUT-1007', 5), line('HND-1013', 3)] },
    { status: 'PROCESSING', user: manager1.id, days: 3, lines: [line('FST-1004', 15), line('PLB-1006', 8)] },
    { status: 'PENDING', user: staff1.id, days: 2, lines: [line('PPE-1006', 12), line('PPE-1007', 8)] },
    { status: 'PENDING', user: manager1.id, days: 1, lines: [line('ABR-1008', 6), line('LUB-1005', 10)] },
  ]

  for (const plan of orderPlans) {
    orderSeq += 1
    await addOrder({
      number: `ORD-${1000 + orderSeq}`,
      customer: customers[orderSeq % customers.length],
      userId: plan.user,
      date: daysAgo(plan.days),
      status: plan.status,
      lines: plan.lines,
    })
  }
  console.log(`✅ ${orderPlans.length} orders created (with OUT movements)`)

  // -- Rebuild cachedQuantity projection from the ledger (source of truth) --
  const sums = await prisma.stockMovement.groupBy({
    by: ['productId'],
    where: { orgId: tenant.id },
    _sum: { quantity: true },
  })
  const sumByProduct = new Map(sums.map((s) => [s.productId, s._sum.quantity ?? 0]))
  await Promise.all(
    products.map((p) =>
      prisma.product.update({
        where: { id: p.id },
        data: { cachedQuantity: sumByProduct.get(p.id) ?? 0 },
      })
    )
  )
  console.log('✅ cachedQuantity reconciled from ledger')

  // Sanity check: no product should go negative.
  const negatives = products
    .map((p) => ({ sku: p.sku, qty: sumByProduct.get(p.id) ?? 0 }))
    .filter((p) => p.qty < 0)
  if (negatives.length) {
    console.warn('⚠️  Negative stock detected:', negatives)
  }

  console.log('🎉 Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })