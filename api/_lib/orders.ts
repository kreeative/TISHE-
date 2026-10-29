import type Stripe from 'stripe'
import { stripe, SOURCE } from './stripe.js'
import { SUPPLIERS } from './catalog.js'
import { legacyCustomer } from './legacy.js'
import { env } from './env.js'
import type { History } from './discounts.js'

// Orders live in Stripe. A paid Checkout Session is the order; the fulfilment
// fields edited in the dashboard (status, supplier reference, tracking,
// notes) are kept as metadata on its PaymentIntent.

export type OrderStatus = 'new' | 'ordered' | 'shipped' | 'delivered' | 'cancelled'

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Being prepared',
  ordered: 'Being prepared',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export interface OrderItem {
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

export interface Address {
  name: string
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface Order {
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
  shipping: Address | null
  // filled in only when the full order is loaded
  items: OrderItem[]
  summary: string
  currency: string
  subtotal: number
  discount: number
  shippingAmount: number
  tax: number
  total: number
  // in CAD, as settled to the bank: the order total, Stripe's fee, and what's left
  settled: number
  fee: number
  net: number
  code: string
  country: string
  // province GST/HST was charged for, and whether the address matches it
  taxProvince: string
  provinceMismatch: boolean
  supplierRef: string
  orderedAt: string
  carrier: string
  tracking: string
  shippedAt: string
  note: string
  reviewRequestedAt: string
  emailed: boolean
}

const FIRST_ORDER_NUMBER = 1004

type SessionWithPi = Stripe.Checkout.Session & { payment_intent: Stripe.PaymentIntent | string | null }

function pi(session: SessionWithPi): Stripe.PaymentIntent | null {
  return session.payment_intent && typeof session.payment_intent === 'object' ? session.payment_intent : null
}

function address(session: Stripe.Checkout.Session): Address | null {
  const ship = session.collected_information?.shipping_details
  const a = ship?.address
  if (!ship || !a) return null
  return {
    name: ship.name ?? '',
    line1: a.line1 ?? '',
    line2: a.line2 ?? '',
    city: a.city ?? '',
    state: a.state ?? '',
    postalCode: a.postal_code ?? '',
    country: a.country ?? '',
  }
}

export function toOrder(session: SessionWithPi, lineItems: Stripe.LineItem[] = []): Order {
  const intent = pi(session)
  const m = intent?.metadata ?? {}
  const sm = session.metadata ?? {}
  const shipping = address(session)
  const charge = intent?.latest_charge && typeof intent.latest_charge === 'object' ? intent.latest_charge : null
  const balance =
    charge?.balance_transaction && typeof charge.balance_transaction === 'object' ? charge.balance_transaction : null

  const items: OrderItem[] = []
  let shippingAmount = 0
  for (const li of lineItems) {
    const product = li.price?.product && typeof li.price.product === 'object' && !('deleted' in li.price.product && li.price.product.deleted)
      ? (li.price.product as Stripe.Product)
      : null
    const pm = product?.metadata ?? {}
    if (pm.kind === 'shipping') {
      shippingAmount += li.amount_subtotal
      continue
    }
    const unitAmount = li.price?.unit_amount ?? 0
    items.push({
      title: product?.name ?? li.description ?? 'Item',
      variant: pm.variant_title ?? '',
      quantity: li.quantity ?? 1,
      unitAmount,
      originalUnit: Number(pm.original_unit) || unitAmount,
      total: li.amount_subtotal,
      image: product?.images?.[0] ?? null,
      handle: pm.handle ?? '',
      supplier: pm.supplier ?? '',
    })
  }

  const subtotal = items.length
    ? items.reduce((n, i) => n + i.originalUnit * i.quantity, 0)
    : Number(sm.subtotal) || 0
  const discount = items.length
    ? items.reduce((n, i) => n + (i.originalUnit - i.unitAmount) * i.quantity, 0)
    : Number(sm.discount) || 0

  const taxProvince = sm.province ?? ''
  return {
    id: session.id,
    paymentIntentId: intent?.id ?? (typeof session.payment_intent === 'string' ? session.payment_intent : null),
    number: m.tis_order ?? null,
    createdAt: new Date(session.created * 1000).toISOString(),
    paid: session.payment_status === 'paid',
    refunded: Boolean(charge?.refunded),
    status: (m.tis_status as OrderStatus) || 'new',
    email: session.customer_details?.email?.toLowerCase() ?? '',
    name: shipping?.name || session.customer_details?.name || '',
    phone: session.customer_details?.phone ?? '',
    shipping,
    items,
    summary: sm.summary ?? '',
    currency: (session.currency ?? 'cad').toUpperCase(),
    subtotal,
    discount,
    shippingAmount: items.length ? shippingAmount : Number(sm.shipping) || 0,
    tax: session.total_details?.amount_tax ?? 0,
    total: session.amount_total ?? 0,
    // USD orders are converted by Stripe; until then, estimate at 1.40
    settled: balance?.amount ?? Math.round((session.amount_total ?? 0) * (session.currency === 'usd' ? 1.4 : 1)),
    fee: balance?.fee ?? 0,
    net: balance?.net ?? 0,
    code: sm.code ?? '',
    country: shipping?.country || sm.country || '',
    taxProvince,
    provinceMismatch: Boolean(taxProvince && shipping?.country === 'CA' && shipping.state && shipping.state !== taxProvince),
    supplierRef: m.tis_supplier_ref ?? '',
    orderedAt: m.tis_ordered_at ?? '',
    carrier: m.tis_carrier ?? '',
    tracking: m.tis_tracking ?? '',
    shippedAt: m.tis_shipped_at ?? '',
    note: m.tis_note ?? '',
    reviewRequestedAt: m.tis_review_at ?? '',
    emailed: m.tis_emailed === '1',
  }
}

export function trackingUrl(tracking: string, carrier = ''): string {
  if (!tracking) return ''
  const c = carrier.toLowerCase()
  if (c.includes('dhl')) return `https://www.dhl.com/ca-en/home/tracking.html?tracking-id=${encodeURIComponent(tracking)}&submit=1`
  if (c.includes('canada post')) return `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${encodeURIComponent(tracking)}`
  if (c.includes('ups')) return `https://www.ups.com/track?tracknum=${encodeURIComponent(tracking)}`
  if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(tracking)}`
  return `https://t.17track.net/en#nums=${encodeURIComponent(tracking)}`
}

export async function loadOrder(sessionId: string): Promise<Order> {
  const session = (await stripe().checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent.latest_charge.balance_transaction', 'line_items.data.price.product'],
  })) as SessionWithPi
  if (session.metadata?.source !== SOURCE) throw new Error(`Session ${sessionId} is not a store order`)
  return toOrder(session, session.line_items?.data ?? [])
}

// Paid store orders, newest first.
export async function listOrders(max = 300): Promise<Order[]> {
  const orders: Order[] = []
  for await (const s of stripe().checkout.sessions.list({
    status: 'complete',
    limit: 100,
    expand: ['data.payment_intent.latest_charge.balance_transaction'],
  })) {
    const session = s as SessionWithPi
    if (session.metadata?.source === SOURCE && session.payment_status === 'paid') orders.push(toOrder(session))
    if (orders.length >= max) break
  }
  return orders
}

export async function ordersForEmail(email: string): Promise<Order[]> {
  // before Stripe is connected there are no orders to find
  if (!env.stripeConfigured()) return []
  const orders: Order[] = []
  for await (const s of stripe().checkout.sessions.list({
    customer_details: { email },
    status: 'complete',
    limit: 100,
    expand: ['data.payment_intent.latest_charge.balance_transaction'],
  })) {
    const session = s as SessionWithPi
    if (session.metadata?.source === SOURCE && session.payment_status === 'paid') orders.push(toOrder(session))
  }
  // Checkout matches the email as typed; catch the same person typed differently
  return orders.filter((o) => o.email === email.toLowerCase())
}

export async function historyFor(email: string): Promise<History> {
  const orders = (await ordersForEmail(email)).filter((o) => o.status !== 'cancelled')
  return {
    orders: orders.length + legacyCustomer(email).orders,
    codesUsed: orders.map((o) => o.code).filter(Boolean),
  }
}

export async function nextOrderNumber(): Promise<string> {
  let max = FIRST_ORDER_NUMBER - 1
  for (const o of await listOrders(100)) {
    const n = Number(o.number)
    if (n > max) max = n
  }
  return String(max + 1)
}

export async function updateOrderMeta(order: Order, fields: Record<string, string>): Promise<void> {
  if (!order.paymentIntentId) throw new Error(`Order ${order.id} has no payment`)
  await stripe().paymentIntents.update(order.paymentIntentId, { metadata: fields })
}

// The message for each supplier, ready to paste into Alibaba or WhatsApp.
export function supplierMessages(order: Order): { supplier: string; name: string; message: string }[] {
  const bySupplier = new Map<string, OrderItem[]>()
  for (const item of order.items) {
    const key = item.supplier || 'nine'
    bySupplier.set(key, [...(bySupplier.get(key) ?? []), item])
  }
  const a = order.shipping
  const addressLines = a
    ? [a.name, a.line1, a.line2, `${a.city}${a.state ? `, ${a.state}` : ''} ${a.postalCode}`.trim(), countryName(a.country)]
        .filter(Boolean)
        .join('\n')
    : '(address missing, check the order)'
  return [...bySupplier].map(([key, items]) => {
    const s = SUPPLIERS[key] ?? { name: key, greeting: 'Hello' }
    const list = items
      .map((i) => `• ${i.title}${i.variant ? `, ${i.variant}` : ''} × ${i.quantity}`)
      .join('\n')
    return {
      supplier: key,
      name: s.name,
      message: [
        `${s.greeting},`,
        '',
        `New order for The Ivory Sukundu (order #${order.number ?? '—'}):`,
        list,
        '',
        'Please ship directly to my customer:',
        addressLines,
        order.phone ? `Phone: ${order.phone}` : '',
        '',
        'Please do not put any invoice or prices in the parcel, and send me the tracking number as soon as it ships.',
        '',
        'Thank you!',
        'Kee, The Ivory Sukundu',
      ]
        .filter((line, i, all) => !(line === '' && all[i - 1] === ''))
        .join('\n'),
    }
  })
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
export function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code
  } catch {
    return code
  }
}
