import { getProducts } from '@/actions/product.actions'
import InventoryClient from './inventory-client'

export default async function InventoryPage() {
  const result = await getProducts()
  const products = result.success ? result.data : []
  return <InventoryClient products={products} />
}