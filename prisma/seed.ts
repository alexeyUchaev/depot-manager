import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'TechMart Wholesale Inc.',
      slug: 'techmart-wholesale',
      clerkOrgId: 'demo_org_techmart',
      plan: 'PRO',
    },
  })
  console.log('✅ Tenant created')

  // Users
  const owner = await prisma.user.create({
    data: {
      clerkId: 'demo_user_owner',
      tenantId: tenant.id,
      email: 'alexey@techmartwholesale.com',
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
      email: 'j.doe@techmartwholesale.com',
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
      email: 'm.smith@techmartwholesale.com',
      firstName: 'Mike',
      lastName: 'Smith',
      role: 'manager',
      department: 'Inventory Control',
    },
  })

  const staff1 = await prisma.user.create({
    data: {
      clerkId: 'demo_user_staff1',
      tenantId: tenant.id,
      email: 'a.kovalsky@techmartwholesale.com',
      firstName: 'Anna',
      lastName: 'Kovalsky',
      role: 'staff',
      department: 'Sales & Orders',
    },
  })

  const staff2 = await prisma.user.create({
    data: {
      clerkId: 'demo_user_staff2',
      tenantId: tenant.id,
      email: 'k.jones@techmartwholesale.com',
      firstName: 'Kevin',
      lastName: 'Jones',
      role: 'staff',
      department: 'Warehouse Operations',
      isActive: false,
    },
  })
  console.log('✅ Users created')

  // Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        orgId: tenant.id,
        name: 'Dell XPS 15 Laptop',
        sku: 'SKU-9021',
        category: 'Electronics',
        location: 'A4 / Shelf B-2',
        quantity: 24,
        price: 1299.00,
        lowStockAt: 5,
      },
    }),
    prisma.product.create({
      data: {
        orgId: tenant.id,
        name: 'Samsung 27" 4K Monitor',
        sku: 'SKU-8843',
        category: 'Electronics',
        location: 'A12 / Floor A',
        quantity: 12,
        price: 450.00,
        lowStockAt: 5,
      },
    }),
    prisma.product.create({
      data: {
        orgId: tenant.id,
        name: 'Apple iPhone 15 Pro 256GB',
        sku: 'SKU-7612',
        category: 'Mobile',
        location: 'B2 / Level 3',
        quantity: 8,
        price: 999.00,
        lowStockAt: 5,
      },
    }),
    prisma.product.create({
      data: {
        orgId: tenant.id,
        name: 'Logitech MX Keys Keyboard',
        sku: 'SKU-6549',
        category: 'Accessories',
        location: 'C14 / Bin D',
        quantity: 3,
        price: 110.00,
        lowStockAt: 5,
      },
    }),
    prisma.product.create({
      data: {
        orgId: tenant.id,
        name: 'Sony WH-1000XM5 Headphones',
        sku: 'SKU-5421',
        category: 'Audio',
        location: 'B8 / Level 1',
        quantity: 0,
        price: 350.00,
        lowStockAt: 5,
      },
    }),
  ])
  console.log('✅ Products created')

  // Stock Movements
  await Promise.all([
    prisma.stockMovement.create({
      data: {
        orgId: tenant.id,
        productId: products[0].id,
        userId: manager1.id,
        type: 'IN',
        quantity: 24,
        reason: 'Purchase Order #PO-2026-089',
      },
    }),
    prisma.stockMovement.create({
      data: {
        orgId: tenant.id,
        productId: products[2].id,
        userId: manager2.id,
        type: 'OUT',
        quantity: 10,
        reason: 'Order #ORD-1021',
      },
    }),
    prisma.stockMovement.create({
      data: {
        orgId: tenant.id,
        productId: products[1].id,
        userId: staff1.id,
        type: 'OUT',
        quantity: 8,
        reason: 'Order #ORD-1020',
      },
    }),
    prisma.stockMovement.create({
      data: {
        orgId: tenant.id,
        productId: products[3].id,
        userId: owner.id,
        type: 'ADJUSTMENT',
        quantity: 2,
        reason: 'Cycle Count Audit',
      },
    }),
    prisma.stockMovement.create({
      data: {
        orgId: tenant.id,
        productId: products[4].id,
        userId: manager1.id,
        type: 'IN',
        quantity: 15,
        reason: 'Purchase Order #PO-2026-081',
      },
    }),
  ])
  console.log('✅ Stock Movements created')

  // Orders
  const order1 = await prisma.order.create({
    data: {
      orgId: tenant.id,
      userId: staff1.id,
      orderNumber: 'ORD-1021',
      customerName: 'TechMart Wholesale',
      status: 'SHIPPED',
      items: {
        create: [
          { productId: products[0].id, quantity: 5, price: 1299.00 },
          { productId: products[2].id, quantity: 10, price: 999.00 },
        ],
      },
    },
  })

  const order2 = await prisma.order.create({
    data: {
      orgId: tenant.id,
      userId: manager1.id,
      orderNumber: 'ORD-1020',
      customerName: 'Office Depot Corp.',
      status: 'PROCESSING',
      items: {
        create: [
          { productId: products[1].id, quantity: 8, price: 450.00 },
        ],
      },
    },
  })

  const order3 = await prisma.order.create({
    data: {
      orgId: tenant.id,
      userId: staff1.id,
      orderNumber: 'ORD-1019',
      customerName: 'StartupHub NYC',
      status: 'DELIVERED',
      items: {
        create: [
          { productId: products[0].id, quantity: 3, price: 1299.00 },
          { productId: products[3].id, quantity: 3, price: 110.00 },
        ],
      },
    },
  })

  const order4 = await prisma.order.create({
    data: {
      orgId: tenant.id,
      userId: manager1.id,
      orderNumber: 'ORD-1018',
      customerName: 'Brooklyn Schools District',
      status: 'PENDING',
      items: {
        create: [
          { productId: products[1].id, quantity: 20, price: 450.00 },
        ],
      },
    },
  })

  console.log('✅ Orders created')
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