import { api } from '../lib/api'

// The dashboard's calls to /api/admin, and the signed-in admin session.

const KEY = 'tis-admin'

export type OrderStatus = 'new' | 'ordered' | 'shipped' | 'delivered' | 'cancelled'

export interface AdminOrderItem {
  title: string
  variant: string
  quantity: number
  unitAmount: number
  originalUnit: number
  total: number
  image: string | null
  handle: string
  supplier: string
}

export interface AdminOrder {
  id: string
  paymentIntentId: string | null
  number: string | null
  createdAt: string
  paid: boolean
  refunded: boolean
  status: OrderStatus
  email: string
  name: string
  phone: string
  shipping: { name: string; line1: string; line2: string; city: string; state: string; postalCode: string; country: string } | null
  items: AdminOrderItem[]
  summary: string
  currency: string
  // amounts in cents
  subtotal: number
  discount: number
  shippingAmount: number
  tax: number
  total: number
  settled: number
  fee: number
  net: number
  code: string
  country: string
  taxProvince: string
  provinceMismatch: boolean
  supplierRef: string
  carrier: string
  tracking: string
  trackingUrl: string
  shippedAt: string
  note: string
  reviewRequestedAt: string
  stripeUrl: string
}

export interface Stats {
  currency: string
  thisMonth: { sales: number; orders: number }
  lastMonth: { sales: number; orders: number }
  allTime: { sales: number; orders: number; taxCollected: number; stripeFees: number; average: number }
  todo: { toOrder: number; awaitingTracking: number }
}

export interface Setup {
  stripe: boolean
  resend: boolean
  webhook: boolean
  testMode: boolean
}

export interface SupplierMessage {
  supplier: string
  name: string
  message: string
}

export interface AdminSession {
  token: string
  expiresAt: number
  email: string
}

export function loadAdminSession(): AdminSession | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as AdminSession | null
    return s && s.expiresAt > Date.now() ? s : null
  } catch {
    return null
  }
}

export function saveAdminSession(s: AdminSession | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s))
    else localStorage.removeItem(KEY)
  } catch {
    // private mode: signed in for this visit only
  }
}

export const adminApi = {
  link: (email: string) => api<{ ok: true }>('admin', { action: 'link', email }),
  redeem: (token: string) => api<AdminSession>('admin', { action: 'redeem', token }),
  overview: (t: string) => api<{ orders: AdminOrder[]; stats: Stats; setup: Setup }>('admin', { action: 'overview' }, t),
  order: (t: string, id: string) => api<{ order: AdminOrder; supplierMessages: SupplierMessage[] }>('admin', { action: 'order', id }, t),
  update: (t: string, id: string, fields: Record<string, unknown>) =>
    api<{ order: AdminOrder; supplierMessages: SupplierMessage[]; notified: boolean }>('admin', { action: 'update', id, ...fields }, t),
  customers: (t: string) =>
    api<{ customers: { email: string; name: string; orders: number; spent: number; last: string; country: string }[] }>(
      'admin',
      { action: 'customers' },
      t,
    ),
  subscribers: (t: string) =>
    api<{ subscribers: { email: string; createdAt: string; unsubscribed: boolean }[] }>('admin', { action: 'subscribers' }, t),
  email: (t: string, to: string, subject: string, message: string) =>
    api<{ ok: true }>('admin', { action: 'email', to, subject, message }, t),
  setup: (t: string) => api<{ webhook: boolean }>('admin', { action: 'setup' }, t),
}

export const STATUS_TEXT: Record<OrderStatus, string> = {
  new: 'To order',
  ordered: 'Awaiting tracking',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export function cents(amount: number, currency = 'CAD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}
