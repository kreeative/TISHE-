import { api } from './api'

// Sukundu Circle accounts. There are no passwords: a shopper asks for a
// sign-in link, the link carries a signed session token, and the orders are
// read from the payment records on the server.

const SESSION_KEY = 'tis-session'

export interface CustomerOrder {
  number: string
  date: string
  total: number
  currency: string
  status: string
}

export interface Customer {
  email: string
  firstName: string | null
  lastName: string | null
  orders: CustomerOrder[]
  // spend from orders placed on the previous shop, before October 2026
  legacySpend: number
}

export function savedSession(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as { token: string; expiresAt: number }
    if (s.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return s.token
  } catch {
    return null
  }
}

export function saveSession(token: string, expiresAt: number) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token, expiresAt }))
  } catch {
    // private mode: signed in for this visit only
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // nothing stored
  }
}

export function requestSignInLink(email: string): Promise<{ ok: true }> {
  return api('account', { action: 'link', email })
}

// trades the one-time token from the email link for a longer session
export function redeemSignInLink(token: string): Promise<{ token: string; expiresAt: number }> {
  return api('account', { action: 'redeem', token })
}

export function fetchCustomer(token: string): Promise<Customer> {
  return api('account', { action: 'me' }, token)
}

// Circle rules: every $1 spent earns 1 strand
export const TIER_THRESHOLDS = [
  { name: 'Ivory', min: 0 },
  { name: 'Gold', min: 500 },
  { name: 'Heritage', min: 1200 },
] as const

// in USD, the store's base currency; Canadian orders are converted back at 1.40
export function lifetimeSpend(customer: Customer): number {
  return customer.legacySpend + customer.orders.reduce((sum, o) => sum + (o.currency === 'CAD' ? o.total / 1.4 : o.total), 0)
}

export function circleStatus(customer: Customer) {
  const spend = lifetimeSpend(customer)
  const strands = Math.floor(spend)
  let tier: (typeof TIER_THRESHOLDS)[number] = TIER_THRESHOLDS[0]
  for (const t of TIER_THRESHOLDS) if (spend >= t.min) tier = t
  const next = TIER_THRESHOLDS.find((t) => t.min > spend) ?? null
  const progress = next ? Math.min(100, Math.round((spend / next.min) * 100)) : 100
  return { spend, strands, tier: tier.name, next: next ? { name: next.name, min: next.min } : null, progress }
}
