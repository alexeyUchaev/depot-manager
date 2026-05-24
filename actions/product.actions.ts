'use server'

import { revalidatePath } from 'next/cache'
import { productService } from '@/services/product.service'
import type { ActionResult } from '@/types/user.types'
import type { ProductDTO } from '@/services/product.service'

const DEMO_TENANT_ID = 'cmpk3vjwi00007g5dkg1dpryy'

export async function getProducts(): Promise<ActionResult<ProductDTO[]>> {
  try {
    const products = await productService.getAllByTenant(DEMO_TENANT_ID)
    return { success: true, data: products }
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error }
  }
}

export async function getLowStockProducts(): Promise<ActionResult<ProductDTO[]>> {
  try {
    const products = await productService.getLowStock(DEMO_TENANT_ID)
    return { success: true, data: products }
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error }
  }
}

export async function createProduct(data: {
  name: string
  sku: string
  category?: string
  location?: string
  price: number
  quantity?: number
  lowStockAt?: number
}): Promise<ActionResult<ProductDTO>> {
  try {
    const result = await productService.create(DEMO_TENANT_ID, data)
    if (result.success) revalidatePath('/inventory')
    return result
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error }
  }
}

export async function updateProduct(
  id: string,
  data: {
    name?: string
    category?: string
    location?: string
    price?: number
    lowStockAt?: number
  }
): Promise<ActionResult<ProductDTO>> {
  try {
    const result = await productService.update(id, DEMO_TENANT_ID, data)
    if (result.success) revalidatePath('/inventory')
    return result
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error }
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    const result = await productService.delete(id, DEMO_TENANT_ID)
    if (result.success) revalidatePath('/inventory')
    return result
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error }
  }
}