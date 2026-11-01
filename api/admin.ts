import { HttpError, bearer, email, handler, json, readBody, str } from './_lib/http.js'
import { env } from './_lib/env.js'
import { stripe } from './_lib/stripe.js'
import { issueToken, verifyToken } from './_lib/tokens.js'
import { listOrders, loadOrder, supplierMessages, trackingUrl, updateOrderMeta, type Order, type OrderStatus } from './_lib/orders.js'
import { processOrder } from './_lib/process.js'
import { listContacts, sendEmail } from './_lib/email.js'
import { sendShippingEmail, sendSignInLink } from './_lib/notify.js'
import { esc, layout, p, textOf } from './_lib/templates.js'
import { loadStore, saveImage, saveStore } from './_lib/store.js'
import { cleanCode } from './_lib/discounts.js'
import { cleanProduct, cleanShipping, cleanSite } from './_lib/editing.js'

// The owner's dashboard API. Everything except link/redeem needs the admin
// session token from the dashboard sign-in email.
//
//   link     { email }                 email a sign-in link (admin emails only)
//   redeem   { token }                 swap it for a 30-day session
//   overview                           orders, stats and setup status
//   order    { id }                    one order with items and supplier messages
//   update   { id, status?, supplierRef?, carrier?, tracking?, note?, notify? }
//   customers                          everyone who has ordered, by email
//   subscribers                        the Circle mailing list
//   email    { to, subject, message }  write to a customer from the store address
//   setup                              connect the Stripe webhook
//   store                              everything editable: products, codes, site, shipping
//   saveProduct { product } · deleteProduct { id }
//   saveCode { rule, previousCode? } · deleteCode { code }
//   saveSite { announcements, sale } · saveShipping { rates }
//   upload   { handle, full, thumb }   save a product photo (base64 JPEG)

const STATUSES: OrderStatus[] = ['new', 'ordered', 'shipped', 'delivered', 'cancelled']
const WEBHOOK_EVENTS = ['checkout.session.completed', 'checkout.session.async_payment_succeeded'] as const

function publicOrder(o: Order) {
  return {
    ...o,
    trackingUrl: trackingUrl(o.tracking, o.carrier),
    stripeUrl: o.paymentIntentId ? `https://dashboard.stripe.com/payments/${o.paymentIntentId}` : '',
  }
}

// orders paid while the webhook was down still get numbered and emailed
async function sweep(orders: Order[]): Promise<Order[]> {
  const missing = orders.filter((o) => !o.number || !o.emailed)
  if (!missing.length) return orders
  const fixed = new Map<string, Order>()
  for (const o of missing.slice(0, 5)) {
    try {
      fixed.set(o.id, await processOrder(o.id))
    } catch (err) {
      console.error('sweep', o.id, err)
    }
  }
  return orders.map((o) => fixed.get(o.id) ?? o)
}

function stats(orders: Order[]) {
  const live = orders.filter((o) => o.status !== 'cancelled' && !o.refunded)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime()
  const sum = (list: Order[], f: (o: Order) => number) => list.reduce((n, o) => n + f(o), 0)
  const inRange = (from: number, to: number) => live.filter((o) => +new Date(o.createdAt) >= from && +new Date(o.createdAt) < to)
  const thisMonth = inRange(monthStart, Infinity)
  const lastMonth = inRange(lastMonthStart, monthStart)
  // in CAD and before tax: tax collected belongs to the CRA
  const sales = (list: Order[]) => sum(list, (o) => o.settled - o.tax) / 100
  return {
    currency: 'CAD',
    thisMonth: { sales: sales(thisMonth), orders: thisMonth.length },
    lastMonth: { sales: sales(lastMonth), orders: lastMonth.length },
    allTime: {
      sales: sales(live),
      orders: live.length,
      taxCollected: sum(live, (o) => o.tax) / 100,
      stripeFees: sum(live, (o) => o.fee) / 100,
      average: live.length ? sales(live) / live.length : 0,
    },
    todo: {
      toOrder: live.filter((o) => o.status === 'new').length,
      awaitingTracking: live.filter((o) => o.status === 'ordered').length,
    },
  }
}

async function webhookStatus(create: boolean): Promise<boolean> {
  const url = `${env.siteUrl()}/api/stripe-webhook`
  const endpoints = await stripe().webhookEndpoints.list({ limit: 100 })
  const existing = endpoints.data.find((e) => e.url === url && e.status === 'enabled')
  if (existing) return true
  if (!create) return false
  await stripe().webhookEndpoints.create({
    url,
    enabled_events: [...WEBHOOK_EVENTS],
    description: 'The Ivory Sukundu orders',
  })
  return true
}

export default handler(async (request) => {
  const body = await readBody(request)
  const action = str(body.action)

  if (action === 'link') {
    const address = email(body.email)
    if (address && env.adminEmails().includes(address)) {
      const { token } = issueToken(address, 'admin-login', 60 * 24)
      await sendSignInLink(address, `${env.siteUrl()}/#/admin?login=${token}`, true, '24 hours')
    }
    return json({ ok: true })
  }

  if (action === 'redeem') {
    const address = verifyToken(str(body.token, 1000), 'admin-login')
    return json({ ...issueToken(address, 'admin', 60 * 24 * 30), email: address })
  }

  const admin = verifyToken(bearer(request), 'admin')
  if (!env.adminEmails().includes(admin)) throw new HttpError(403, 'This email no longer has access.')

  if (action === 'overview') {
    const setup = {
      stripe: env.stripeConfigured(),
      resend: Boolean(env.resendKey()),
      webhook: false,
      testMode: env.stripeConfigured() && env.stripeKey().startsWith('sk_test_'),
    }
    if (!setup.stripe) return json({ orders: [], stats: stats([]), setup })
    setup.webhook = await webhookStatus(false)
    const orders = await sweep(await listOrders())
    return json({ orders: orders.map(publicOrder), stats: stats(orders), setup })
  }

  if (action === 'order') {
    const order = await loadOrder(str(body.id, 200))
    return json({ order: publicOrder(order), supplierMessages: supplierMessages(order) })
  }

  if (action === 'update') {
    let order = await loadOrder(str(body.id, 200))
    const fields: Record<string, string> = {}
    const status = str(body.status) as OrderStatus
    if (status) {
      if (!STATUSES.includes(status)) throw new HttpError(400, 'Unknown status')
      fields.tis_status = status
      if (status === 'ordered' && order.status === 'new') fields.tis_ordered_at = new Date().toISOString()
    }
    if (typeof body.supplierRef === 'string') fields.tis_supplier_ref = str(body.supplierRef, 200)
    if (typeof body.note === 'string') fields.tis_note = str(body.note, 480)
    if (typeof body.carrier === 'string') fields.tis_carrier = str(body.carrier, 60)
    if (typeof body.tracking === 'string') {
      const tracking = str(body.tracking, 100).replace(/\s+/g, '')
      fields.tis_tracking = tracking
      if (tracking && !order.shippedAt) fields.tis_shipped_at = new Date().toISOString()
      if (tracking && !status) fields.tis_status = 'shipped'
    }
    await updateOrderMeta(order, fields)
    order = await loadOrder(order.id)
    let notified = false
    if (body.notify === true && order.tracking) notified = await sendShippingEmail(order)
    return json({ order: publicOrder(order), supplierMessages: supplierMessages(order), notified })
  }

  if (action === 'customers') {
    const byEmail = new Map<string, { email: string; name: string; orders: number; spent: number; last: string; country: string }>()
    for (const o of await listOrders()) {
      if (o.status === 'cancelled' || o.refunded) continue
      const c = byEmail.get(o.email) ?? { email: o.email, name: o.name, orders: 0, spent: 0, last: o.createdAt, country: o.country }
      c.orders += 1
      c.spent += (o.settled - o.tax) / 100
      if (o.createdAt > c.last) c.last = o.createdAt
      byEmail.set(o.email, c)
    }
    return json({ customers: [...byEmail.values()].sort((a, b) => b.last.localeCompare(a.last)) })
  }

  if (action === 'subscribers') {
    const contacts = await listContacts()
    return json({ subscribers: contacts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) })
  }

  if (action === 'email') {
    const to = email(body.to)
    const subject = str(body.subject, 200)
    const message = str(body.message, 10_000)
    if (!to || !subject || !message) throw new HttpError(400, 'Add an email address, a subject and a message.')
    const paragraphs = message.split(/\n{2,}/).map((para) => p(esc(para).replace(/\n/g, '<br>')))
    const sent = await sendEmail({
      to,
      subject,
      tags: { type: 'owner_message' },
      html: layout({ preheader: message.slice(0, 120), title: subject, body: paragraphs.join('') }),
      text: textOf([message]),
    })
    if (!sent) throw new HttpError(502, 'The email could not be sent. Check the Resend setup.')
    return json({ ok: true })
  }

  if (action === 'setup') {
    return json({ webhook: await webhookStatus(true) })
  }

  if (action === 'store') {
    const doc = await loadStore(true)
    // how often each code has been used, from paid orders
    const usage: Record<string, number> = {}
    if (env.stripeConfigured()) {
      for (const o of await listOrders()) if (o.code && o.status !== 'cancelled') usage[o.code] = (usage[o.code] ?? 0) + 1
    }
    return json({ doc, usage, blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN) })
  }

  if (action === 'saveProduct') {
    const doc = await saveStore((d) => {
      const product = cleanProduct((body.product ?? {}) as Record<string, unknown>, d.products)
      const i = d.products.findIndex((p) => p.id === product.id)
      if (i >= 0) d.products[i] = product
      else d.products.push(product)
    })
    return json({ doc })
  }

  if (action === 'deleteProduct') {
    const id = str(body.id, 200)
    return json({ doc: await saveStore((d) => void (d.products = d.products.filter((p) => p.id !== id))) })
  }

  if (action === 'moveProduct') {
    const id = str(body.id, 200)
    const step = body.direction === 'up' ? -1 : 1
    const doc = await saveStore((d) => {
      const i = d.products.findIndex((p) => p.id === id)
      const j = i + step
      if (i < 0 || j < 0 || j >= d.products.length) return
      ;[d.products[i], d.products[j]] = [d.products[j], d.products[i]]
    })
    return json({ doc })
  }

  if (action === 'saveCode') {
    const rule = cleanCode((body.rule ?? {}) as Record<string, unknown>)
    const previous = str(body.previousCode, 40).toUpperCase()
    const doc = await saveStore((d) => {
      if (d.discounts.some((c) => c.code === rule.code && c.code !== previous)) {
        throw new HttpError(409, `${rule.code} already exists.`)
      }
      const i = d.discounts.findIndex((c) => c.code === (previous || rule.code))
      if (i >= 0) d.discounts[i] = rule
      else d.discounts.push(rule)
    })
    return json({ doc })
  }

  if (action === 'deleteCode') {
    const code = str(body.code, 40).toUpperCase()
    return json({ doc: await saveStore((d) => void (d.discounts = d.discounts.filter((c) => c.code !== code))) })
  }

  if (action === 'saveSite') {
    const site = cleanSite(body)
    return json({ doc: await saveStore((d) => void (d.site = site)) })
  }

  if (action === 'saveShipping') {
    return json({ doc: await saveStore((d) => void (d.shipping = cleanShipping(body, d.shipping))) })
  }

  if (action === 'upload') {
    const decode = (v: unknown) => {
      const b64 = str(v, 6_000_000).replace(/^data:image\/jpeg;base64,/, '')
      const buf = Buffer.from(b64, 'base64')
      // JPEG files start with FF D8
      if (buf.length < 100 || buf[0] !== 0xff || buf[1] !== 0xd8) throw new HttpError(400, 'Upload a JPEG photo.')
      return buf
    }
    const handle = str(body.handle, 80)
    const [url, thumb] = await Promise.all([saveImage(handle, decode(body.full)), saveImage(handle, decode(body.thumb))])
    return json({ url, thumb })
  }

  throw new HttpError(400, 'Unknown action')
})
