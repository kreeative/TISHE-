import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { SALE, formatTimeLeft } from '../lib/sale'
import { useSaleClock } from './SaleCountdown'

// Thin rotating strip pinned above the nav.
const MESSAGES = [
  '1st order over $200 ships free · FREESHIP200',
  'Install in sixty seconds',
  'Luxury raw hair, redefined',
]

const barClass = 'fixed top-0 inset-x-0 z-[120] h-9 flex items-center justify-center overflow-hidden text-[#FAF7F3] px-4'
const barStyle = { background: 'linear-gradient(90deg, #1B1113 0%, #2A1D20 50%, #1B1113 100%)' }

export default function AnnouncementBar() {
  const [i, setI] = useState(0)
  const left = useSaleClock()
  const onSale = left.ms > 0

  useEffect(() => {
    if (onSale || MESSAGES.length < 2) return
    const t = setInterval(() => setI((n) => (n + 1) % MESSAGES.length), 4500)
    return () => clearInterval(t)
  }, [onSale])

  // While a sale runs the strip stops rotating and counts down instead.
  if (onSale) {
    return (
      <Link to="/collections" className={barClass} style={barStyle} aria-label={`${SALE.name}: ${SALE.headline}`}>
        <p
          className="text-[10px] sm:text-[11px] font-semibold uppercase text-center whitespace-nowrap flex items-center gap-2"
          style={{ letterSpacing: '0.14em' }}
        >
          <span>Fall Sale · up to $70 off</span>
          <span className="text-[#c99b6f]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatTimeLeft(left)}
          </span>
        </p>
      </Link>
    )
  }

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
          {MESSAGES[i]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
