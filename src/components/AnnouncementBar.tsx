import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// Thin rotating strip pinned above the nav.
const MESSAGES = [
  'Complimentary shipping on every order',
  '15% off your first order — code WELCOME15',
]

export default function AnnouncementBar() {
  const [i, setI] = useState(0)

  useEffect(() => {
    if (MESSAGES.length < 2) return
    const t = setInterval(() => setI((n) => (n + 1) % MESSAGES.length), 4500)
    return () => clearInterval(t)
  }, [])

  return (
    <div
      className="fixed top-0 inset-x-0 z-[120] h-9 flex items-center justify-center overflow-hidden text-[#FAF7F3] px-4"
      style={{ background: 'linear-gradient(90deg, #1B1113 0%, #2A1D20 50%, #1B1113 100%)' }}
    >
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
