import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  as?: 'div' | 'section'
  // in the Jeere editor, a click here opens that editor in Jeere (e.g. "product:<handle>")
  open?: string
}

export default function Reveal({ children, className, delay = 0, y = 28, as = 'div', open }: RevealProps) {
  const reduced = useReducedMotion()
  const Component = motion[as]

  if (reduced) {
    const Static = as
    return <Static className={className} data-tis-open={open}>{children}</Static>
  }

  return (
    <Component
      className={className}
      data-tis-open={open}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Component>
  )
}
