import { useEffect, useState } from 'react'
import { getProducts, shopifyConfigured, type ShopifyProduct } from './shopify'

interface UseProductsResult {
  products: ShopifyProduct[]
  loading: boolean
  error: string | null
}

export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<ShopifyProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shopifyConfigured) {
      setError('Shopify is not connected yet.')
      setLoading(false)
      return
    }
    let cancelled = false
    getProducts()
      .then((p) => {
        if (!cancelled) setProducts(p)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load products.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { products, loading, error }
}
