import type { Product } from './catalog'
import { useStore } from '../components/StoreContext'

interface UseProductsResult {
  products: Product[]
  loading: boolean
  error: string | null
}

// The live catalog, in the shopper's currency.
export function useProducts(): UseProductsResult {
  const { products } = useStore()
  return { products, loading: false, error: null }
}
