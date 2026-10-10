// The current promotion. The sale prices themselves live in Shopify (price
// lowered, old price kept as compare-at); this file only drives the countdown
// and the struck-through prices, and both switch themselves off at endsAt so
// the site never keeps advertising a sale that has finished.

export const SALE = {
  name: 'The Fall Sale',
  headline: 'Up to $70 off half wigs',
  // Sunday October 18, 11:59 pm Toronto time (EDT, UTC-4)
  endsAt: '2026-10-19T03:59:00Z',
  handles: ['the-kinky-curly-sukundu-half-wig', 'untitled-jul21_09-54-40'],
}

const END = Date.parse(SALE.endsAt)

export function saleActive(now: number = Date.now()): boolean {
  return now < END
}

export function isSaleProduct(handle: string | undefined): boolean {
  return !!handle && SALE.handles.includes(handle)
}

export function isOnSale(handle: string | undefined, now?: number): boolean {
  return isSaleProduct(handle) && saleActive(now)
}

export interface TimeLeft {
  ms: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function saleTimeLeft(now: number = Date.now()): TimeLeft {
  const ms = Math.max(0, END - now)
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
