// The current promotion, set in the dashboard (Site → Sale). Sale prices
// themselves are the product prices, with the old price kept as "was"; this
// only drives the countdown, the badge and the struck-through prices, and all
// three switch themselves off at endsAt so the site never keeps advertising a
// sale that has finished.

export interface Sale {
  name: string
  // short line in the announcement bar while the sale runs
  banner: string
  endsAt: string
  handles: string[]
}

export function isSaleProduct(sale: Sale | null, handle: string | undefined): boolean {
  return !!sale && !!handle && sale.handles.includes(handle)
}

export function isOnSale(sale: Sale | null, handle: string | undefined, now: number = Date.now()): boolean {
  return isSaleProduct(sale, handle) && saleTimeLeft(sale, now).ms > 0
}

export interface TimeLeft {
  ms: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function saleTimeLeft(sale: Sale | null, now: number = Date.now()): TimeLeft {
  const end = sale ? Date.parse(sale.endsAt) : 0
  const ms = Math.max(0, (Number.isNaN(end) ? 0 : end) - now)
  const s = Math.floor(ms / 1000)
  return {
    ms,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

// 8d 04h 12m 33s, dropping the day part on the last day
export function formatTimeLeft(t: TimeLeft): string {
  const clock = `${pad(t.hours)}h ${pad(t.minutes)}m ${pad(t.seconds)}s`
  return t.days > 0 ? `${t.days}d ${clock}` : clock
}
