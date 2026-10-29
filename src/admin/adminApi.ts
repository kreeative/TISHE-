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

// ---------------------------------------------------------------------------
// Editing the store: products, promo codes, site settings, shipping
// ---------------------------------------------------------------------------

export type Currency = 'USD' | 'CAD'

export interface CodeRule {
  code: string
  kind: 'percent' | 'amount' | 'free_shipping'
  percent?: number
  amount?: Record<Currency, number>
  minSubtotal?: Record<Currency, number>
  firstOrderOnly?: boolean
  returningOnly?: boolean
  oncePerCustomer?: boolean
  active: boolean
  startsAt?: string
  endsAt?: string
  label: string
}

export interface EditVariant {
  id: string
  title: string
  availableForSale: boolean
  price: Record<Currency, string>
  compareAtPrice: Record<Currency, string> | null
  selectedOptions: { name: string; value: string }[]
}

export interface EditMedia {
  type: 'image' | 'video' | 'external_video'
  url: string
  previewUrl: string | null
  poster?: string | null
  altText: string | null
}

export interface EditProduct {
  id: string
  title: string
  handle: string
  supplier: string
  hidden?: boolean
  descriptionHtml: string
  tags: string[]
  media: EditMedia[]
  options: { name: string; values: string[] }[]
  variants: EditVariant[]
}

export interface StoreDoc {
  updatedAt: string
  products: EditProduct[]
  discounts: CodeRule[]
  site: {
    announcements: string[]
    sale: { name: string; banner: string; endsAt: string; handles: string[] } | null
  }
  shipping: {
    zones: { id: string; label: string; currency: Currency; rate: number; countries: string[] }[]
  }
}

type DocResponse = { doc: StoreDoc }

export const storeApi = {
  load: (t: string) => api<{ doc: StoreDoc; usage: Record<string, number>; blob: boolean }>('admin', { action: 'store' }, t),
  saveProduct: (t: string, product: Partial<EditProduct>) => api<DocResponse>('admin', { action: 'saveProduct', product }, t),
  deleteProduct: (t: string, id: string) => api<DocResponse>('admin', { action: 'deleteProduct', id }, t),
  moveProduct: (t: string, id: string, direction: 'up' | 'down') => api<DocResponse>('admin', { action: 'moveProduct', id, direction }, t),
  saveCode: (t: string, rule: Partial<CodeRule>, previousCode?: string) =>
    api<DocResponse>('admin', { action: 'saveCode', rule, previousCode }, t),
  deleteCode: (t: string, code: string) => api<DocResponse>('admin', { action: 'deleteCode', code }, t),
  saveSite: (t: string, site: StoreDoc['site']) => api<DocResponse>('admin', { action: 'saveSite', ...site }, t),
  saveShipping: (t: string, rates: Record<string, number>) => api<DocResponse>('admin', { action: 'saveShipping', rates }, t),
  upload: (t: string, handle: string, full: string, thumb: string) =>
    api<{ url: string; thumb: string }>('admin', { action: 'upload', handle, full, thumb }, t),
}
