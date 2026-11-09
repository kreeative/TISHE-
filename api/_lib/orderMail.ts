import { trackingUrl, updateOrderMeta, type Order } from './orders.js'
import { button, esc, heading, itemRows, layout, money, p, textOf } from './templates.js'

// Emails the owner writes to a customer about one order, from the dashboard:
// ready-made templates she rewrites as she likes, {placeholders} filled from
// the order, the order itself shown under the message if she wants, and a
// short log of what was sent, kept on the order.

export interface MailTemplate {
  id: string
  // what the owner sees in the dashboard (French)
  label: string
  // what the customer receives (English, like the shop)
  subject: string
  message: string
  includeOrder: boolean
}

const SIGN = 'With love,\nKee, The Ivory Sukundu'

export const MAIL_TEMPLATES: MailTemplate[] = [
  {
    id: 'preparing',
    label: 'Commande en préparation',
    subject: 'Your order #{order} is being prepared',
    message: `Hi {first_name},\n\nA quick note to let you know your order #{order} is being prepared especially for you. We'll email you the tracking number as soon as it ships.\n\n${SIGN}`,
    includeOrder: true,
  },
  {
    id: 'shipped',
    label: 'Commande expédiée',
    subject: 'Your order #{order} is on its way',
    message: `Hi {first_name},\n\nGood news: your order #{order} has shipped with {carrier}.\n\nTracking number: {tracking}\nTrack it here: {tracking_link}\n\nTracking can take a day or two to show the first scan.\n\n${SIGN}`,
    includeOrder: true,
  },
  {
    id: 'delay',
    label: 'Petit retard',
    subject: 'A quick update on your order #{order}',
    message: `Hi {first_name},\n\nI wanted to let you know that your order #{order} is taking a little longer than planned. It should ship within the next few days, and I'll send you the tracking number as soon as it does.\n\nThank you so much for your patience.\n\n${SIGN}`,
    includeOrder: false,
  },
  {
    id: 'delivered',
    label: 'Commande livrée',
    subject: 'Your order #{order} has arrived',
    message: `Hi {first_name},\n\nYour order #{order} has been delivered. I hope you love your hair!\n\nIf you have a minute, reply with a few words or a photo of your install: it means the world to us.\n\n${SIGN}`,
    includeOrder: false,
  },
  {
    id: 'refunded',
    label: 'Remboursement',
    subject: 'Your refund for order #{order}',
    message: `Hi {first_name},\n\nI've refunded {refund} for your order #{order}, to the card or account you paid with. It usually appears within 5–10 business days, depending on your bank.\n\n${SIGN}`,
    includeOrder: false,
  },
  {
    id: 'question',
    label: 'Question sur la commande',
    subject: 'About your order #{order}',
    message: `Hi {first_name},\n\n\n\n${SIGN}`,
    includeOrder: false,
  },
]

const first = (o: Order) => o.name.split(/\s+/)[0] || 'there'
const items = (o: Order) => o.items.map((i) => `${i.title}${i.variant ? ` (${i.variant})` : ''}${i.quantity > 1 ? ` × ${i.quantity}` : ''}`).join(', ')
const link = (o: Order) => trackingUrl(o.tracking, o.carrier)
const refund = (o: Order) => money(o.refundedAmount, o.currency)

// {first_name} or {prénom}, {order} or {commande}, … (case and accents ignored)
const FIELDS: Record<string, (o: Order) => string> = {
  first_name: first,
  prenom: first,
  order: (o) => o.number ?? '',
  commande: (o) => o.number ?? '',
  tracking: (o) => o.trackingNumbers.join(', '),
  suivi: (o) => o.trackingNumbers.join(', '),
  carrier: (o) => o.carrier,
  transporteur: (o) => o.carrier,
  tracking_link: link,
  lien_suivi: link,
  items,
  articles: items,
  refund,
  remboursement: refund,
}

export const PLACEHOLDERS = ['{first_name}', '{order}', '{tracking}', '{carrier}', '{tracking_link}', '{items}', '{refund}']

export function fillIn(text: string, order: Order): string {
  return text.replace(/\{\s*([^{}\s]{1,30})\s*\}/g, (all, name: string) => {
    const key = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const field = FIELDS[key]
    return field ? field(order) : all
  })
}

// The email as the customer will receive it.
export function orderMail(order: Order | null, subject: string, message: string, includeOrder: boolean) {
  const subj = order ? fillIn(subject, order) : subject
  const msg = order ? fillIn(message, order) : message
  const body = msg.split(/\n{2,}/).map((para) => p(esc(para).replace(/\n/g, '<br>')))
  const text: string[] = [msg]
  if (order && includeOrder) {
    body.push(heading(`Your order #${esc(order.number ?? '')}`))
    body.push(
      itemRows(
        order.items.map((i) => ({
          image: i.image,
          title: i.title,
          detail: [i.variant, i.quantity > 1 ? `Qty ${i.quantity}` : ''].filter(Boolean).join(' · '),
          amount: money(i.total, order.currency),
        })),
      ),
    )
    text.push('', `Your order #${order.number ?? ''}:`, ...order.items.map((i) => `- ${i.title}${i.variant ? `, ${i.variant}` : ''} × ${i.quantity}`))
    if (order.tracking) {
      body.push(button('Track my order', link(order)))
      text.push(`Track it: ${link(order)}`)
    }
  }
  return {
    subject: subj,
    html: layout({ preheader: msg.slice(0, 120), title: subj, body: body.join('') }),
    text: textOf(text),
  }
}

// Remembers what was sent, on the order (newest last, as many as fit in Stripe's 500 characters).
export async function logMail(order: Order, subject: string): Promise<void> {
  if (!order.paymentIntentId) return
  const log = [...order.emails.map((e) => [e.at, e.subject]), [new Date().toISOString().slice(0, 16), subject.slice(0, 80)]]
  while (log.length > 1 && JSON.stringify(log).length > 500) log.shift()
  await updateOrderMeta(order, { tis_mail_log: JSON.stringify(log) })
}
