import { useEffect, useState } from 'react'
import { saleTimeLeft, type TimeLeft } from '../lib/sale'

// Ticks once a second until the sale ends, then stops.
export function useSaleClock(): TimeLeft {
  const [left, setLeft] = useState(() => saleTimeLeft())
  const done = left.ms === 0

  useEffect(() => {
    if (done) return
    const t = setInterval(() => setLeft(saleTimeLeft()), 1000)
    return () => clearInterval(t)
  }, [done])

  return left
}
