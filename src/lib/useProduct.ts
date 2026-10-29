import type { Product } from './catalog'
import { useStore } from '../components/StoreContext'

interface UseProductResult {
  product: Product | null
  loading: boolean
  error: string | null
}

export function useProduct(handle: string | undefined): UseProductResult {
  const { products } = useStore()
  const product = products.find((p) => p.handle === handle) ?? null
  return { product, loading: false, error: product ? null : 'That product could not be found.' }
}
