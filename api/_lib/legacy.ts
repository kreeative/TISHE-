import { createDecipheriv, createHash, createPrivateKey, createPublicKey, diffieHellman, hkdfSync, type KeyObject } from 'node:crypto'
import { env } from './env.js'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { splitTracking, type Address, type Order, type OrderItem } from './orders.js'

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
// (src/data/legacy-orders.enc) is encrypted to the store itself: the store
// derives an X25519 key pair from SESSION_SECRET and publishes only the public
// half (action legacyKey); the file was sealed with it (ephemeral X25519 +
// HKDF + AES-256-GCM), so only the store can open it. Changing SESSION_SECRET
// means sealing the file again. Read-only: the store only shows them.
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

export type LegacyOrder = Order & { legacy: 'shopify' }

const HST_PROVINCES = ['ON', 'NB', 'NL', 'NS', 'PE']

function toOrder(r: LegacyRecord): LegacyOrder {
  return {
    id: r.id,
    paymentIntentId: null,
    number: r.number,
    createdAt: r.createdAt,
    paid: true,
    refunded: false,
    refundedAmount: 0,
    refunds: [],
    status: 'delivered',
    email: r.email,
    name: r.name,
    phone: r.phone,
    shipping: r.shipping,
    // Shopify had the billing address the same as the shipping one
    billing: r.shipping,
    payment: r.payment,
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
    trackingNumbers: splitTracking(r.tracking),
    shippedAt: r.shippedAt,
    deliveredAt: '',
    note: r.note,
    reviewRequestedAt: '',
    emailed: true,
    emails: [],
    legacy: 'shopify',
  }
}

let cached: LegacyOrder[] | null = null

const FILE = join(process.cwd(), 'src/data', 'legacy-orders.enc')
// PKCS#8 header of a raw X25519 private key
const X25519_PKCS8 = Buffer.from('302e020100300506032b656e04220420', 'hex')
const INFO = 'tis-legacy-orders'

function storeKey(): KeyObject {
  const seed = Buffer.from(hkdfSync('sha256', env.sessionSecret(), INFO, 'x25519 private key', 32))
  return createPrivateKey({ key: Buffer.concat([X25519_PKCS8, seed]), format: 'der', type: 'pkcs8' })
}

// The public half, to seal the file with (base64 SPKI). Safe to show anyone.
export function legacyPublicKey(): string {
  return createPublicKey(storeKey()).export({ format: 'der', type: 'spki' }).toString('base64')
}

function open(file: Record<string, string>): string {
  const epk = Buffer.from(file.epk, 'base64')
  const shared = diffieHellman({ privateKey: storeKey(), publicKey: createPublicKey({ key: epk, format: 'der', type: 'spki' }) })
  const key = Buffer.from(hkdfSync('sha256', shared, epk, `${INFO} aes-256-gcm`, 32))
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(file.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(file.tag, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(file.data, 'base64')), decipher.final()]).toString('utf8')
}

// Newest first. Empty if the file is missing or can't be opened.
export function legacyOrders(): LegacyOrder[] {
  if (cached) return cached
  if (!existsSync(FILE)) return []
  try {
    const file = JSON.parse(readFileSync(FILE, 'utf8')) as Record<string, string>
    if (file.v !== '2' && (file.v as unknown) !== 2) return []
    cached = (JSON.parse(open(file)) as LegacyRecord[]).map(toOrder).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  } catch (err) {
    console.error('old orders unreadable', err)
    return []
  }
  return cached
}

export function legacyOrder(id: string): LegacyOrder | null {
  return legacyOrders().find((o) => o.id === id) ?? null
}
