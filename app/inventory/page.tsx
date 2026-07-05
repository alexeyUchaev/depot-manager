import { getProducts } from '@/actions/product.actions'
import { LoadError } from '@/components/load-error'
import InventoryClient from './inventory-client'

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const result = await getProducts()
  if (!result.success) {
    return <LoadError title="Failed to load inventory" message={result.error} />
  }
  return <InventoryClient products={result.data} />
}
