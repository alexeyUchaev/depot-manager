
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { ActionResult } from '@/types/user.types'

export type ProductDTO = {
  id: string
  name: string
  sku: string
  category: string | null
  location: string | null
  quantity: number
  price: number
  lowStockAt: number
  status: 'In Stock' | 'Low Stock' | 'Out of Stock'
  createdAt: Date
}

const toDTO = (product: {
  id: string
  name: string
  sku: string
  category: string | null
  location: string | null
  quantity: number
  price: Prisma.Decimal
  lowStockAt: number
  createdAt: Date
}): ProductDTO => ({
  ...product,
  price: Number(product.price),
  status:
    product.quantity === 0
      ? 'Out of Stock'
      : product.quantity <= product.lowStockAt
      ? 'Low Stock'
      : 'In Stock',
})


export const getAllProductsByTenant = async (tenantId: string): Promise<ProductDTO[]> => {
    const products = await prisma.product.findMany({
      where: { orgId: tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        location: true,
        quantity: true,
        price: true,
        lowStockAt: true,
        createdAt: true,
      },
    })
    return products.map(toDTO)
  }

 
export const  getBySku = async (sku: string, tenantId: string): Promise<ProductDTO | null> => {
    const product = await prisma.product.findFirst({
      where: { sku, orgId: tenantId },
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        location: true,
        quantity: true,
        price: true,
        lowStockAt: true,
        createdAt: true,
      },
    })
    return product ? toDTO(product) : null
  }

 
export const  getLowStock = async (tenantId: string): Promise<ProductDTO[]> => {
    const products = await prisma.product.findMany({
      where: {
        orgId: tenantId,
        quantity: { lte: prisma.product.fields.lowStockAt },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        location: true,
        quantity: true,
        price: true,
        lowStockAt: true,
        createdAt: true,
      },
    })
    return products.map(toDTO)
  }

  
export const  createProduct = async(
    tenantId: string,
    data: {
      name: string
      sku: string
      category?: string
      location?: string
      price: number
      quantity?: number
      lowStockAt?: number
    }
  ): Promise<ActionResult<ProductDTO>> => {
    try {
      const existing = await prisma.product.findUnique({
        where: { orgId_sku: { orgId: tenantId, sku: data.sku } },
      })
      if (existing) {
        return { success: false, error: 'SKU already exists' }
      }

      const product = await prisma.product.create({
        data: {
          orgId: tenantId,
          name: data.name,
          sku: data.sku,
          category: data.category,
          location: data.location,
          price: data.price,
          quantity: data.quantity ?? 0,
          lowStockAt: data.lowStockAt ?? 10,
        },
        select: {
          id: true,
          name: true,
          sku: true,
          category: true,
          location: true,
          quantity: true,
          price: true,
          lowStockAt: true,
          createdAt: true,
        },
      })
      return { success: true, data: toDTO(product) }
    } catch {
      return { success: false, error: 'Failed to create product' }
    }
  }

  // Обновить товар
 
export const  updateProduct = async (
    id: string,
    tenantId: string,
    data: {
      name?: string
      category?: string
      location?: string
      price?: number
      lowStockAt?: number
    }
  ): Promise<ActionResult<ProductDTO>> => {
    try {
      const existing = await prisma.product.findFirst({
        where: { id, orgId: tenantId },
      })
      if (!existing) return { success: false, error: 'Product not found' }

      const product = await prisma.product.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          sku: true,
          category: true,
          location: true,
          quantity: true,
          price: true,
          lowStockAt: true,
          createdAt: true,
        },
      })
      return { success: true, data: toDTO(product) }
    } catch {
      return { success: false, error: 'Failed to update product' }
    }
  }


export const  deleteProduct = async (
    id: string,
    tenantId: string
  ): Promise<ActionResult> => {
    try {
      const existing = await prisma.product.findFirst({
        where: { id, orgId: tenantId },
      })
      if (!existing) return { success: false, error: 'Product not found' }

      await prisma.product.delete({ where: { id } })
      return { success: true, data: undefined }
    } catch {
      return { success: false, error: 'Failed to delete product' }
    }
  }
