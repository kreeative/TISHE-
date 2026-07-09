import { useEffect, useState } from 'react'
import { getProductByHandle, shopifyConfigured, type ShopifyProduct } from './shopify'

interface UseProductResult {
  product: ShopifyProduct | null
  loading: boolean
  error: string | null
}

export function useProduct(handle: string | undefined): UseProductResult {
  const [product, setProduct] = useState<ShopifyProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!handle) return
    if (!shopifyConfigured) {
      setError('Shopify is not connected yet.')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    getProductByHandle(handle)
      .then((p) => {
        if (cancelled) return
        if (p) setProduct(p)
        else setError('That product could not be found.')
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load this product.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [handle])

  return { product, loading, error }
}
