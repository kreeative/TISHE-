import { HttpError, bearer, handler, json } from './_lib/http.js'
import { env } from './_lib/env.js'
import { listOrders, loadOrder, supplierMessages, updateOrderMeta, type Order } from './_lib/orders.js'
import { processOrder } from './_lib/process.js'
import { sendEmail } from './_lib/email.js'
import { sendReviewRequest } from './_lib/notify.js'
import { button, esc, heading, layout, money, p, pre, small, textOf } from './_lib/templates.js'

// The daily store assistant, run by Vercel Cron (see vercel.json):
//   1. numbers and emails any paid order the webhook missed
//   2. asks for a review two weeks after an order ships
//   3. emails the owner a to-do list when orders need attention
const DAY = 86_400_000
const REVIEW_AFTER_DAYS = 14
const CHASE_TRACKING_AFTER_DAYS = 5

function daysSince(iso: string): number {
  return iso ? (Date.now() - +new Date(iso)) / DAY : 0
}

async function digest(toOrder: Order[], chase: Order[]): Promise<boolean> {
  if (!toOrder.length && !chase.length) return false
  const dashboard = `${env.siteUrl()}/#/admin`
  const detailed = await Promise.all(toOrder.map((o) => loadOrder(o.id)))
  const blocks: string[] = []
  const text: string[] = []
  if (detailed.length) {
    blocks.push(heading(`To send to your suppliers (${detailed.length})`))
    text.push(`TO SEND TO YOUR SUPPLIERS (${detailed.length})`)
    for (const o of detailed) {
      blocks.push(p(`<strong>#${o.number}</strong> · ${esc(o.name)} · ${money(o.total, o.currency)} · ${Math.floor(daysSince(o.createdAt))} days ago`))
      for (const s of supplierMessages(o)) {
        blocks.push(small(`For ${esc(s.name)}:`), pre(s.message))
        text.push('', `#${o.number} for ${s.name}:`, s.message)
      }
    }
  }
  if (chase.length) {
    blocks.push(heading(`Waiting for tracking (${chase.length})`))
    blocks.push(p('Ordered from the supplier more than five days ago with no tracking number yet. Worth a nudge:'))
    text.push('', `WAITING FOR TRACKING (${chase.length})`)
    for (const o of chase) {
      const line = `#${o.number} · ${o.name}${o.supplierRef ? ` · supplier ref ${o.supplierRef}` : ''}`
      blocks.push(p(esc(line)))
      text.push(line)
    }
  }
  blocks.push(button('Open the dashboard', dashboard))
  const count = detailed.length + chase.length
  return sendEmail({
    to: env.ownerEmails(),
    subject: `Today: ${count} ${count === 1 ? 'order needs' : 'orders need'} you`,
    tags: { type: 'daily_digest' },
    html: layout({ preheader: 'Your store to-do list for today', title: 'Your to-do list', body: blocks.join('') }),
    text: textOf([...text, '', `Dashboard: ${dashboard}`]),
  })
}

export default handler(async (request) => {
  const secret = env.cronSecret()
  if (!secret || bearer(request) !== secret) throw new HttpError(401, 'Unauthorized')
  if (!env.stripeConfigured()) return json({ skipped: 'stripe not configured' })

  const report = { processed: 0, reviewsRequested: 0, digestSent: false, errors: 0 }
  let orders = await listOrders()

  for (const o of orders.filter((x) => !x.number || !x.emailed)) {
    try {
      await processOrder(o.id)
      report.processed++
    } catch (err) {
      report.errors++
      console.error('cron process', o.id, err)
    }
  }
  if (report.processed) orders = await listOrders()

  const live = orders.filter((o) => o.status !== 'cancelled' && !o.refunded)
  for (const o of live) {
    const shipped = o.status === 'shipped' || o.status === 'delivered'
    if (!shipped || o.reviewRequestedAt || daysSince(o.shippedAt) < REVIEW_AFTER_DAYS) continue
    try {
      const full = await loadOrder(o.id)
      if (await sendReviewRequest(full)) report.reviewsRequested++
      await updateOrderMeta(o, { tis_review_at: new Date().toISOString() })
    } catch (err) {
      report.errors++
      console.error('cron review', o.id, err)
    }
  }

  const toOrder = live.filter((o) => o.status === 'new')
  const chase = live.filter((o) => o.status === 'ordered' && !o.tracking && daysSince(o.orderedAt || o.createdAt) > CHASE_TRACKING_AFTER_DAYS)
  report.digestSent = await digest(toOrder, chase)

  console.log('cron', report)
  return json(report)
})
