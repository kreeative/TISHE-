import { HttpError } from './http.js'
import type { Currency } from './catalog.js'

// Promo codes. They are edited in the dashboard and kept in the store
// document; DEFAULT_CODES are the ones carried over from Shopify. Percent and
// amount codes come off the hair only, never off shipping or tax.

export interface CodeRule {
  code: string
  kind: 'percent' | 'amount' | 'free_shipping'
  percent?: number
  // for 'amount' codes: how much comes off, per currency
  amount?: Record<Currency, number>
  // minimum bag, per currency
  minSubtotal?: Record<Currency, number>
  // only for someone who has never ordered before
  firstOrderOnly?: boolean
  // only for someone who has ordered before
  returningOnly?: boolean
  // each email can use it once
  oncePerCustomer?: boolean
  active: boolean
  startsAt?: string
  endsAt?: string
  // shown in the bag when the code is applied
  label: string
}

export const DEFAULT_CODES: CodeRule[] = [
  { code: 'WELCOME10', kind: 'percent', percent: 10, firstOrderOnly: true, oncePerCustomer: true, active: true, label: '10% off your first order' },
  { code: 'KEE10', kind: 'percent', percent: 10, active: true, label: '10% off' },
  { code: 'SOBEAUTY10', kind: 'percent', percent: 10, active: true, label: '10% off' },
  { code: 'THANKYOU15', kind: 'percent', percent: 15, returningOnly: true, oncePerCustomer: true, active: true, label: '15% off, thank you for coming back' },
  {
    code: 'FREESHIP200',
    kind: 'free_shipping',
    minSubtotal: { USD: 200, CAD: 280 },
    firstOrderOnly: true,
    oncePerCustomer: true,
    active: true,
    label: 'free shipping on your first order',
  },
]

export interface History {
  orders: number
  codesUsed: string[]
}

export function findCode(codes: CodeRule[], code: string, now = Date.now()): CodeRule {
  const rule = codes.find((c) => c.code === code.trim().toUpperCase())
  const live =
    rule && rule.active && (!rule.startsAt || Date.parse(rule.startsAt) <= now) && (!rule.endsAt || Date.parse(rule.endsAt) > now)
  if (!rule || !live) throw new HttpError(400, "That code isn't valid. Check the spelling and try again.", 'invalid_code')
  return rule
}

export function needsEmail(rule: CodeRule): boolean {
  return Boolean(rule.firstOrderOnly || rule.returningOnly || rule.oncePerCustomer)
}

const fmt = (n: number, currency: Currency) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

// Throws a shopper-friendly error when the code can't be used on this order.
export function checkCode(rule: CodeRule, subtotal: number, currency: Currency, history: History | null) {
  const min = rule.minSubtotal?.[currency]
  if (min && subtotal < min) {
    throw new HttpError(400, `${rule.code} needs a bag of ${fmt(min, currency)} or more.`, 'below_minimum')
  }
  if (!needsEmail(rule)) return
  if (!history) {
    throw new HttpError(400, `Enter the email you'll use at checkout so we can check ${rule.code} for you.`, 'email_required')
  }
  if (rule.oncePerCustomer && history.codesUsed.includes(rule.code)) {
    throw new HttpError(400, `${rule.code} has already been used with this email.`, 'already_used')
  }
  if (rule.firstOrderOnly && history.orders > 0) {
    throw new HttpError(400, `${rule.code} is for first orders only. Welcome back, though!`, 'not_first_order')
  }
  if (rule.returningOnly && history.orders === 0) {
    throw new HttpError(400, `${rule.code} is a thank-you for returning customers. Try WELCOME10 on your first order.`, 'not_returning')
  }
}

// Checks a code sent from the dashboard before it is saved.
export function cleanCode(raw: Record<string, unknown>): CodeRule {
  const code = String(raw.code ?? '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
  if (!code || code.length > 30) throw new HttpError(400, 'A code needs 1 to 30 letters or numbers, with no spaces.')
  const kind = raw.kind === 'amount' || raw.kind === 'free_shipping' ? raw.kind : 'percent'
  const num = (v: unknown) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.round(Number(v) * 100) / 100 : 0)
  const money = (v: unknown): Record<Currency, number> | undefined => {
    const m = (v ?? {}) as Record<string, unknown>
    const usd = num(m.USD)
    const cad = num(m.CAD)
    return usd || cad ? { USD: usd || Math.round(cad / 1.4), CAD: cad || Math.round(usd * 1.4) } : undefined
  }
  const rule: CodeRule = {
    code,
    kind,
    active: raw.active !== false,
    label: String(raw.label ?? '').trim().slice(0, 80),
    firstOrderOnly: raw.firstOrderOnly === true || undefined,
    returningOnly: raw.returningOnly === true || undefined,
    oncePerCustomer: raw.oncePerCustomer === true || undefined,
    minSubtotal: money(raw.minSubtotal),
  }
  if (kind === 'percent') {
    rule.percent = num(raw.percent)
    if (!rule.percent || rule.percent >= 100) throw new HttpError(400, 'Enter a percentage between 1 and 99.')
    rule.label ||= `${rule.percent}% off`
  }
  if (kind === 'amount') {
    rule.amount = money(raw.amount)
    if (!rule.amount) throw new HttpError(400, 'Enter how much comes off.')
    rule.label ||= `$${rule.amount.USD} off`
  }
  if (kind === 'free_shipping') rule.label ||= 'free shipping'
  if (rule.firstOrderOnly && rule.returningOnly) throw new HttpError(400, "A code can't be both for first orders and for returning customers.")
  for (const key of ['startsAt', 'endsAt'] as const) {
    const v = String(raw[key] ?? '').trim()
    if (v) {
      if (Number.isNaN(Date.parse(v))) throw new HttpError(400, 'One of the dates is not valid.')
      rule[key] = new Date(v).toISOString()
    }
  }
  return JSON.parse(JSON.stringify(rule)) as CodeRule
}
