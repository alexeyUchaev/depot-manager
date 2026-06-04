'use server'

import { revalidatePath } from 'next/cache'
import * as services from "@/services";
import type { ActionResult } from '@/types/user.types'
import type { ProductDTO } from '@/services/product.service'
import { DEMO_TENANT_ID } from '@/lib/constants';

export async function getProducts(): Promise<ActionResult<ProductDTO[]>> {
  try {
    const products = await services.getAllProductsByTenant(DEMO_TENANT_ID)
    return { success: true, data: products }
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error }
  }
}

export async function getLowStockProducts(): Promise<ActionResult<ProductDTO[]>> {
  try {
    const products = await services.getLowStock(DEMO_TENANT_ID)
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
    const result = await services.createProduct(DEMO_TENANT_ID, data)
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
    const result = await services.updateProduct(id, DEMO_TENANT_ID, data)
    if (result.success) revalidatePath('/inventory')
    return result
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error }
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    const result = await services.deleteProduct(id, DEMO_TENANT_ID)
    if (result.success) revalidatePath('/inventory')
    return result
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error }
  }
}