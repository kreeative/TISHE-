import { createDecipheriv, createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Address, Order, OrderItem } from './orders.js'

// Customers who ordered on the old Shopify store (July–October 2026), keyed by
// a SHA-256 of their lowercase email so no address is stored in the code.
// They count as returning customers for codes, and their spend counts toward
// their Circle tier.
const LEGACY: Record<string, { orders: number; spend: number }> = {
  f43bfbd98dfe97b33e90f749476481bb1b3e6e517dac5a79d24858b6b0f002ca: { orders: 1, spend: 268.86 },
  '8f89e6eadf8349ad729bb33b6886946bd06fb9c7edca4a5306c27f4b3207ac7d': { orders: 1, spend: 419 },
}

export function legacyCustomer(email: string): { orders: number; spend: number } {
  const key = createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
  return LEGACY[key] ?? { orders: 0, spend: 0 }
}

// The old orders themselves, in full, so the dashboards can open them after
// Shopify is closed. They hold names and addresses, so the file
// (src/data/legacy-orders.enc) is encrypted (AES-256-GCM) with LEGACY_ORDERS_KEY,
// set in Vercel. Read-only: the store only shows them.
interface LegacyRecord {
  id: string
  number: string
  createdAt: string
  email: string
  name: string
  phone: string
  shipping: Address
  items: OrderItem[]
  subtotal: number
  discount: number
  shippingAmount: number
  tax: number
  total: number
  code: string
  carrier: string
  tracking: string
  shippedAt: string
  // how it was paid, as Shopify recorded it
  payment: string
  note: string
}

export type LegacyOrder = Order & { legacy: 'shopify'; payment: string }

const HST_PROVINCES = ['ON', 'NB', 'NL', 'NS', 'PE']

function toOrder(r: LegacyRecord): LegacyOrder {
  return {
    id: r.id,
    paymentIntentId: null,
    number: r.number,
    createdAt: r.createdAt,
    paid: true,
    refunded: false,
    status: 'delivered',
    email: r.email,
    name: r.name,
    phone: r.phone,
    shipping: r.shipping,
    items: r.items,
    summary: r.items.map((i) => `${i.title}${i.quantity > 1 ? ` × ${i.quantity}` : ''}`).join(', '),
    currency: 'CAD',
    subtotal: r.subtotal,
    discount: r.discount,
    shippingAmount: r.shippingAmount,
    tax: r.tax,
    total: r.total,
    settled: r.total,
    fee: 0,
    net: 0,
    code: r.code,
    country: r.shipping.country,
    taxLabel: r.shipping.country === 'CA' ? (HST_PROVINCES.includes(r.shipping.state) ? 'HST' : 'GST') : 'Tax',
    supplierRef: '',
    orderedAt: '',
    carrier: r.carrier,
    tracking: r.tracking,
    shippedAt: r.shippedAt,
    note: r.note,
    reviewRequestedAt: '',
    emailed: true,
    emails: [],
    legacy: 'shopify',
    payment: r.payment,
  }
}

let cached: LegacyOrder[] | null = null

const FILE = join(process.cwd(), 'src/data', 'legacy-orders.enc')

// Newest first. Empty until both the file and LEGACY_ORDERS_KEY are there.
export function legacyOrders(): LegacyOrder[] {
  if (cached) return cached
  const key = process.env.LEGACY_ORDERS_KEY
  if (!key || !existsSync(FILE)) return []
  const file = JSON.parse(readFileSync(FILE, 'utf8')) as Record<string, string>
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(key, 'base64'), Buffer.from(file.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(file.tag, 'base64'))
  const text = Buffer.concat([decipher.update(Buffer.from(file.data, 'base64')), decipher.final()]).toString('utf8')
  cached = (JSON.parse(text) as LegacyRecord[]).map(toOrder).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return cached
}

export function legacyOrder(id: string): LegacyOrder | null {
  return legacyOrders().find((o) => o.id === id) ?? null
}
