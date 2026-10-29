import { useEffect, useState } from 'react'
import { saleTimeLeft, type Sale, type TimeLeft } from '../lib/sale'
import { useStore } from './StoreContext'

// The current sale and the time left on it, ticking once a second until it ends.
export function useSaleClock(): TimeLeft & { sale: Sale | null } {
  const { sale } = useStore()
  const [left, setLeft] = useState(() => saleTimeLeft(sale))
  const done = left.ms === 0

  // a sale set in the dashboard arrives after the first paint
  useEffect(() => {
    setLeft(saleTimeLeft(sale))
  }, [sale])

  useEffect(() => {
    if (done) return
    const t = setInterval(() => setLeft(saleTimeLeft(sale)), 1000)
    return () => clearInterval(t)
  }, [done, sale])

  return { ...left, sale }
}
