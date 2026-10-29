import { productsIn, type Product } from './catalog'
import { useStore } from '../components/StoreContext'

interface UseProductsResult {
  products: Product[]
  loading: boolean
  error: string | null
}

// The catalog ships with the site, so there is nothing to wait for. Prices
// come in the shopper's currency.
export function useProducts(): UseProductsResult {
  const { currency } = useStore()
  return { products: productsIn(currency), loading: false, error: null }
}
