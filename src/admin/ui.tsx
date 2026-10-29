import { useState, type ReactNode } from 'react'
import type { OrderStatus } from './adminApi'
import { STATUS_TEXT } from './adminApi'

// Small building blocks shared by the dashboard screens.

export const field =
  'w-full bg-white border border-[#5A3224]/25 px-3 py-2.5 text-sm text-[#1B1113] placeholder:text-[#1B1113]/35 focus:outline-none focus:border-[#5A3224]'

export const primary =
  'inline-flex items-center justify-center gap-2 bg-[#1B1113] text-[#FAF7F3] text-xs font-semibold uppercase px-5 py-3 hover:bg-[#2A1D20] transition-colors disabled:opacity-40'

export const secondary =
  'inline-flex items-center justify-center gap-2 border border-[#1B1113]/30 text-[#1B1113] text-xs font-semibold uppercase px-4 py-2.5 hover:border-[#5A3224] hover:text-[#5A3224] transition-colors disabled:opacity-40'

export const tracking = { letterSpacing: '0.08em' } as const

const STATUS_STYLE: Record<OrderStatus, string> = {
  new: 'bg-[#c99b6f] text-[#1B1113]',
  ordered: 'bg-[#f1e4d6] text-[#5A3224]',
  shipped: 'bg-[#e3ece4] text-[#2f5a3a]',
  delivered: 'bg-[#1B1113]/[0.06] text-[#1B1113]/60',
  cancelled: 'bg-[#1B1113]/[0.06] text-[#1B1113]/45 line-through',
}

export function StatusChip({ status, refunded }: { status: OrderStatus; refunded?: boolean }) {
  if (refunded) {
    return (
      <span className="inline-block text-[10px] font-bold uppercase px-2 py-1 bg-[#1B1113]/[0.06] text-[#8a2d1f]" style={{ letterSpacing: '0.08em' }}>
        Refunded
      </span>
    )
  }
  return (
    <span className={`inline-block text-[10px] font-bold uppercase px-2 py-1 whitespace-nowrap ${STATUS_STYLE[status]}`} style={{ letterSpacing: '0.08em' }}>
      {STATUS_TEXT[status]}
    </span>
  )
}

export function Card({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="bg-white border border-[#5A3224]/12 p-5 sm:p-6">
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && (
            <h2 className="text-[11px] font-semibold uppercase text-[#5A3224]" style={tracking}>
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white border border-[#5A3224]/12 p-4 sm:p-5">
      <p className="text-[10px] font-semibold uppercase text-[#1B1113]/50" style={tracking}>
        {label}
      </p>
      <p className="font-display text-2xl sm:text-3xl mt-2" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
      {hint && <p className="text-xs text-[#1B1113]/50 mt-1">{hint}</p>}
    </div>
  )
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className={secondary}
      style={tracking}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          setTimeout(() => setDone(false), 1800)
        } catch {
          window.prompt('Copy this:', text)
        }
      }}
    >
      {done ? 'Copied ✓' : label}
    </button>
  )
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null
  return <p className="text-sm text-[#8a2d1f] bg-[#8a2d1f]/[0.06] border border-[#8a2d1f]/20 px-3 py-2">{message}</p>
}
