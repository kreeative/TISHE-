import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

export default function PageTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()

  if (reduced) return <>{children}</>

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
