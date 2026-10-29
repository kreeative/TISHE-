import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { formatTimeLeft } from '../lib/sale'
import { useSaleClock } from './SaleCountdown'
import { useStore } from './StoreContext'

// Thin rotating strip pinned above the nav. The messages and the sale are
// set in the dashboard (Site).

const barClass = 'fixed top-0 inset-x-0 z-[120] h-9 flex items-center justify-center overflow-hidden text-[#FAF7F3] px-4'
const barStyle = { background: 'linear-gradient(90deg, #1B1113 0%, #2A1D20 50%, #1B1113 100%)' }

export default function AnnouncementBar() {
  const [i, setI] = useState(0)
  const { announcements } = useStore()
  const left = useSaleClock()
  const sale = left.sale
  const onSale = left.ms > 0
  const count = announcements.length

  useEffect(() => {
    if (onSale || count < 2) return
    const t = setInterval(() => setI((n) => (n + 1) % count), 4500)
    return () => clearInterval(t)
  }, [onSale, count])

  // While a sale runs the strip stops rotating and counts down instead.
  if (onSale) {
    return (
      <Link to="/collections" className={barClass} style={barStyle} aria-label={sale?.banner || sale?.name}>
        <p
          className="text-[10px] sm:text-[11px] font-semibold uppercase text-center whitespace-nowrap flex items-center gap-2"
          style={{ letterSpacing: '0.14em' }}
        >
          <span>{sale?.banner || sale?.name}</span>
          <span className="text-[#c99b6f]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatTimeLeft(left)}
          </span>
        </p>
      </Link>
    )
  }

  if (!count) return <div className={barClass} style={barStyle} />

  return (
    <div className={barClass} style={barStyle}>
      <AnimatePresence mode="wait">
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-[10px] sm:text-[11px] font-semibold uppercase text-center whitespace-nowrap"
          style={{ letterSpacing: '0.14em' }}
        >
          {announcements[i % count]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
