import { useEffect, useState } from 'react'
import { shopifyConfigured } from './shopify'
import { getReviews, type ReviewSummary } from './reviews'

// null until loaded; stays null if the shop is not connected or the fetch fails
export function useReviews(): ReviewSummary | null {
  const [data, setData] = useState<ReviewSummary | null>(null)

  useEffect(() => {
    if (!shopifyConfigured) return
    let cancelled = false
    getReviews()
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return data
}
