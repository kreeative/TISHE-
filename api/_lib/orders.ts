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
  // fully refunded; refundedAmount says how much was given back (in the order's currency)
  refunded: boolean
  refundedAmount: number
  // each refund, when the full order is loaded
  refunds: { at: string; amount: number }[]
  status: OrderStatus
  email: string
  name: string
  phone: string
  shipping: Address | null
  // as the customer's bank has it, when Stripe collected a full one
  billing: Address | null
  // how it was paid: "Visa •••• 4242", "Klarna", "PayPal (€167.31)"…
  payment: string
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
  // "HST" or "GST" on Canadian orders, as Stripe Tax charged it
  taxLabel: string
  supplierRef: string
  orderedAt: string
  carrier: string
  // one or more numbers, comma-separated (trackingNumbers lists them)
  tracking: string
  trackingNumbers: string[]
  shippedAt: string
  deliveredAt: string
  note: string
  reviewRequestedAt: string
  emailed: boolean
  // emails the owner sent about this order from the dashboard, oldest first
  emails: { at: string; subject: string }[]
}

const FIRST_ORDER_NUMBER = 1004

// provinces where GST and the provincial tax are combined as HST
const HST_PROVINCES = ['ON', 'NB', 'NL', 'NS', 'PE']

type SessionWithPi = Stripe.Checkout.Session & { payment_intent: Stripe.PaymentIntent | string | null }

function pi(session: SessionWithPi): Stripe.PaymentIntent | null {
  return session.payment_intent && typeof session.payment_intent === 'object' ? session.payment_intent : null
}

const METHODS: Record<string, string> = { klarna: 'Klarna', affirm: 'Affirm', link: 'Link', afterpay_clearpay: 'Afterpay', paypal: 'PayPal', cashapp: 'Cash App' }

function paymentLabel(charge: Stripe.Charge | null): string {
  const d = charge?.payment_method_details
  if (!d) return ''
  if (d.type === 'card' && d.card) {
    const brand = d.card.brand ? d.card.brand.charAt(0).toUpperCase() + d.card.brand.slice(1) : 'Card'
    return `${brand} •••• ${d.card.last4 ?? ''}`.trim()
  }
  return METHODS[d.type] ?? d.type
}

function billingAddress(charge: Stripe.Charge | null): Address | null {
  const b = charge?.billing_details
  const a = b?.address
  if (!a?.line1) return null
  return {
    name: b?.name ?? '',
    line1: a.line1 ?? '',
    line2: a.line2 ?? '',
    city: a.city ?? '',
    state: a.state ?? '',
    postalCode: a.postal_code ?? '',
    country: a.country ?? '',
  }
}

export function splitTracking(tracking: string): string[] {
  return tracking.split(/[,\s]+/).filter(Boolean)
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

  return {
    id: session.id,
    paymentIntentId: intent?.id ?? (typeof session.payment_intent === 'string' ? session.payment_intent : null),
    number: m.tis_order ?? null,
    createdAt: new Date(session.created * 1000).toISOString(),
    paid: session.payment_status === 'paid',
    refunded: Boolean(charge?.refunded),
    refundedAmount: charge?.amount_refunded ?? 0,
    refunds: (charge?.refunds?.data ?? []).map((r) => ({ at: new Date(r.created * 1000).toISOString(), amount: r.amount })),
    status: (m.tis_status as OrderStatus) || 'new',
    email: session.customer_details?.email?.toLowerCase() ?? '',
    name: shipping?.name || session.customer_details?.name || '',
    phone: session.customer_details?.phone ?? '',
    shipping,
    billing: billingAddress(charge),
    payment: paymentLabel(charge),
    items,
    summary: sm.summary ?? '',
    currency: (session.currency ?? 'cad').toUpperCase(),
    subtotal,
    discount,
    // shipping is a Checkout shipping option (older orders had it as a line item)
    shippingAmount: session.shipping_cost?.amount_subtotal ?? (items.length ? shippingAmount : Number(sm.shipping) || 0),
    tax: session.total_details?.amount_tax ?? 0,
    total: session.amount_total ?? 0,
    // USD orders are converted by Stripe; until then, estimate at 1.40
    settled: balance?.amount ?? Math.round((session.amount_total ?? 0) * (session.currency === 'usd' ? 1.4 : 1)),
    fee: balance?.fee ?? 0,
    net: balance?.net ?? 0,
    code: sm.code ?? '',
    country: shipping?.country || sm.country || '',
    taxLabel: shipping?.country === 'CA' ? (HST_PROVINCES.includes(shipping.state) ? 'HST' : 'GST') : 'Tax',
    supplierRef: m.tis_supplier_ref ?? '',
    orderedAt: m.tis_ordered_at ?? '',
    carrier: m.tis_carrier ?? '',
    tracking: m.tis_tracking ?? '',
    trackingNumbers: splitTracking(m.tis_tracking ?? ''),
    shippedAt: m.tis_shipped_at ?? '',
    deliveredAt: m.tis_delivered_at ?? '',
    note: m.tis_note ?? '',
    reviewRequestedAt: m.tis_review_at ?? '',
    emailed: m.tis_emailed === '1',
    emails: parseMailLog(m.tis_mail_log),
  }
}

export function parseMailLog(raw: string | undefined): { at: string; subject: string }[] {
  try {
    const log = JSON.parse(raw ?? '[]') as unknown
    return Array.isArray(log)
      ? log.filter((e) => Array.isArray(e) && e.length === 2).map(([at, subject]) => ({ at: String(at), subject: String(subject) }))
      : []
  } catch {
    return []
  }
}

// What happened to the order, oldest first, in the owner's words (the dashboards are in French).
export function orderTimeline(o: Order & { legacy?: string }): { at: string; title: string; detail: string }[] {
  const amount = (cents: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: o.currency || 'CAD' }).format(cents / 100)
  const events: { at: string; title: string; detail: string }[] = [
    {
      at: o.createdAt,
      title: o.legacy ? 'Commande passée sur l’ancienne boutique Shopify' : 'Commande passée',
      detail: [amount(o.total), o.payment].filter(Boolean).join(' · '),
    },
  ]
  if (o.orderedAt) events.push({ at: o.orderedAt, title: 'Commandée chez le fournisseur', detail: o.supplierRef ? `Référence ${o.supplierRef}` : '' })
  if (o.shippedAt) {
    events.push({
      at: o.shippedAt,
      title: o.carrier ? `Expédiée avec ${o.carrier}` : 'Expédiée',
      detail: o.trackingNumbers.length ? `Suivi : ${o.trackingNumbers.join(', ')}` : '',
    })
  }
  if (o.deliveredAt) events.push({ at: o.deliveredAt, title: 'Livrée', detail: '' })
  for (const r of o.refunds) events.push({ at: r.at, title: 'Remboursement', detail: amount(r.amount) })
  for (const e of o.emails) events.push({ at: e.at, title: 'E-mail envoyé à la cliente', detail: e.subject })
  return events.sort((a, b) => a.at.localeCompare(b.at))
}

export function trackingUrl(tracking: string, carrier = ''): string {
  if (!tracking) return ''
  const numbers = splitTracking(tracking)
  // several parcels: one page that follows them all
  if (numbers.length > 1) return `https://t.17track.net/en#nums=${numbers.map(encodeURIComponent).join(',')}`
  tracking = numbers[0] ?? tracking
  const c = carrier.toLowerCase()
  if (c.includes('dhl')) return `https://www.dhl.com/ca-en/home/tracking.html?tracking-id=${encodeURIComponent(tracking)}&submit=1`
  if (c.includes('canada post')) return `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${encodeURIComponent(tracking)}`
  if (c.includes('ups')) return `https://www.ups.com/track?tracknum=${encodeURIComponent(tracking)}`
  if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(tracking)}`
  return `https://t.17track.net/en#nums=${encodeURIComponent(tracking)}`
}

export async function loadOrder(sessionId: string): Promise<Order> {
  const session = (await stripe().checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent.latest_charge.balance_transaction', 'payment_intent.latest_charge.refunds', 'line_items.data.price.product'],
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

// The order being numbered is left out: the webhook and the thank-you page can
// number the same order at the same moment, and must both land on the same number.
export async function nextOrderNumber(forId = ''): Promise<string> {
  let max = FIRST_ORDER_NUMBER - 1
  for (const o of await listOrders(100)) {
    if (o.id === forId) continue
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
