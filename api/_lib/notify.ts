import { env } from './env.js'
import { sendEmail } from './email.js'
import { countryName, supplierMessages, trackingUrl, type Order } from './orders.js'
import { button, codeBox, esc, heading, itemRows, layout, money, p, pre, small, textOf, totals } from './templates.js'

// Every email the store sends, in one place.

function addressBlock(order: Order): string[] {
  const a = order.shipping
  if (!a) return []
  return [a.name, a.line1, a.line2, `${a.city}${a.state ? `, ${a.state}` : ''} ${a.postalCode}`.trim(), countryName(a.country)].filter(Boolean)
}

function orderTotals(order: Order): [string, string, boolean?][] {
  const rows: [string, string, boolean?][] = [['Subtotal', money(order.subtotal, order.currency)]]
  if (order.discount) rows.push([`Discount${order.code ? ` (${order.code})` : ''}`, `−${money(order.discount, order.currency)}`])
  rows.push(['Shipping', order.shippingAmount ? money(order.shippingAmount, order.currency) : 'Free'])
  if (order.tax) rows.push([order.taxProvince && ['ON', 'NB', 'NL', 'NS', 'PE'].includes(order.taxProvince) ? 'HST' : 'GST', money(order.tax, order.currency)])
  rows.push(['Total', money(order.total, order.currency), true])
  return rows
}

function itemsHtml(order: Order): string {
  return itemRows(
    order.items.map((i) => ({
      image: i.image,
      title: i.title,
      detail: [i.variant, i.quantity > 1 ? `Qty ${i.quantity}` : ''].filter(Boolean).join(' · '),
      amount: money(i.total, order.currency),
    })),
  )
}

function itemsText(order: Order): string[] {
  return order.items.map((i) => `- ${i.title}${i.variant ? `, ${i.variant}` : ''} × ${i.quantity}: ${money(i.total, order.currency)}`)
}

export async function sendOrderEmails(order: Order): Promise<void> {
  const number = `#${order.number}`
  const first = order.name.split(/\s+/)[0] || 'there'
  const gst = env.gstNumber()

  // to the customer
  if (order.email) {
    await sendEmail({
      to: order.email,
      subject: `Your order ${number} is confirmed`,
      idempotencyKey: `order-confirmation/${order.id}`,
      tags: { type: 'order_confirmation' },
      html: layout({
        preheader: `Thank you, ${first}. We're preparing your hair now.`,
        title: `Thank you, ${esc(first)}`,
        body: [
          p(`Your order <strong>${number}</strong> is confirmed and we're getting started on it. Every order is prepared especially for you: please allow 5–10 business days before it ships, then 5–12 business days for delivery.`),
          p(`We'll email you the tracking number as soon as it's on its way.`),
          heading('Your order'),
          itemsHtml(order),
          totals(orderTotals(order)),
          heading('Shipping to'),
          p(addressBlock(order).map(esc).join('<br>')),
          order.country && order.country !== 'CA'
            ? small('Your country may charge import duties or VAT. If so, the courier collects them on delivery.')
            : '',
          gst ? small(`GST/HST registration no. ${esc(gst)}`) : '',
        ].join(''),
      }),
      text: textOf([
        `Thank you, ${first}.`,
        '',
        `Your order ${number} is confirmed. Please allow 5–10 business days for it to be prepared, then 5–12 business days for delivery. We'll email you the tracking number when it ships.`,
        '',
        ...itemsText(order),
        `Total: ${money(order.total, order.currency)}`,
        '',
        'Shipping to:',
        ...addressBlock(order),
        gst ? `\nGST/HST registration no. ${gst}` : false,
      ]),
    })
  }

  // to the owner, with the supplier messages ready to paste
  const suppliers = supplierMessages(order)
  const dashboard = `${env.siteUrl()}/#/admin/orders/${order.id}`
  await sendEmail({
    to: env.ownerEmail(),
    replyTo: order.email || undefined,
    subject: `New order ${number} · ${money(order.total, order.currency)} · ${order.name || order.email}`,
    idempotencyKey: `order-alert/${order.id}`,
    tags: { type: 'owner_alert' },
    html: layout({
      preheader: `${order.items.map((i) => i.title).join(', ')}, shipping to ${countryName(order.country)}`,
      title: `New order ${number}`,
      body: [
        p(`<strong>${esc(order.name)}</strong> · ${esc(order.email)}${order.phone ? ` · ${esc(order.phone)}` : ''}`),
        order.provinceMismatch
          ? p(`<strong style="color:#8a2d1f">Check the tax:</strong> GST/HST was charged for ${esc(order.taxProvince)}, but the address is in ${esc(order.shipping?.state ?? '')}.`)
          : '',
        itemsHtml(order),
        totals(orderTotals(order)),
        heading('Ship to'),
        p(addressBlock(order).map(esc).join('<br>')),
        ...suppliers.flatMap((s) => [heading(`Message for ${esc(s.name)}`), pre(s.message)]),
        button('Open in dashboard', dashboard),
        small('When the supplier gives you the tracking number, add it in the dashboard and the customer gets the shipping email automatically.'),
      ].join(''),
    }),
    text: textOf([
      `New order ${number}: ${money(order.total, order.currency)}`,
      `${order.name} · ${order.email}${order.phone ? ` · ${order.phone}` : ''}`,
      '',
      ...itemsText(order),
      '',
      'Ship to:',
      ...addressBlock(order),
      ...suppliers.flatMap((s) => ['', `--- Message for ${s.name} ---`, s.message]),
      '',
      `Dashboard: ${dashboard}`,
    ]),
  })
}

export async function sendShippingEmail(order: Order): Promise<boolean> {
  if (!order.email) return false
  const first = order.name.split(/\s+/)[0] || 'there'
  const url = trackingUrl(order.tracking, order.carrier)
  return sendEmail({
    to: order.email,
    subject: `Your order #${order.number} is on its way`,
    idempotencyKey: `shipping/${order.id}/${order.tracking}`,
    tags: { type: 'shipping' },
    html: layout({
      preheader: `Tracking number ${order.tracking}`,
      title: 'Your hair is on its way',
      body: [
        p(`Good news, ${esc(first)}: order <strong>#${order.number}</strong> has shipped${order.carrier ? ` with ${esc(order.carrier)}` : ''}.`),
        p(`Tracking number: <strong>${esc(order.tracking)}</strong>`),
        button('Track my order', url),
        small('Tracking can take a day or two to show the first scan. Delivery usually takes 5–12 business days.'),
        order.country && order.country !== 'CA'
          ? small('If your country charges import duties or VAT, the courier will collect them on delivery.')
          : '',
        heading('In your parcel'),
        itemsHtml(order),
      ].join(''),
    }),
    text: textOf([
      `Good news, ${first}: order #${order.number} has shipped${order.carrier ? ` with ${order.carrier}` : ''}.`,
      `Tracking number: ${order.tracking}`,
      `Track it here: ${url}`,
    ]),
  })
}

export async function sendReviewRequest(order: Order): Promise<boolean> {
  if (!order.email) return false
  const first = order.name.split(/\s+/)[0] || 'there'
  const item = order.items[0]
  return sendEmail({
    to: order.email,
    subject: `${first}, how is your hair?`,
    idempotencyKey: `review/${order.id}`,
    tags: { type: 'review_request' },
    html: layout({
      preheader: 'A photo and a few words would mean the world to us.',
      title: `How is your hair, ${esc(first)}?`,
      body: [
        p(`Your ${item ? esc(item.title.toLowerCase()) : 'order'} should be with you by now. We'd love to know how it's going.`),
        p(`Just <strong>reply to this email</strong> with a few words and, if you're happy to, a photo of your install. With your permission, we'll share it on the site with your first name and initial only.`),
        p('As a thank-you, your next order is 15% off with code:'),
        codeBox('THANKYOU15'),
        small('Something not right? Reply and tell us. We read every message.'),
      ].join(''),
    }),
    text: textOf([
      `How is your hair, ${first}?`,
      '',
      'Reply to this email with a few words and, if you like, a photo of your install. With your permission we will share it on the site with your first name and initial only.',
      '',
      'As a thank-you, your next order is 15% off with code THANKYOU15.',
    ]),
  })
}

export async function sendWelcome(email: string): Promise<boolean> {
  const shop = `${env.siteUrl()}/#/collections`
  return sendEmail({
    to: email,
    subject: 'Welcome to the Circle. Here is your 10% off.',
    idempotencyKey: `welcome/${email}`,
    tags: { type: 'welcome' },
    html: layout({
      preheader: 'Your code for 10% off your first order is inside.',
      title: 'Welcome to the Circle',
      body: [
        p("Thank you for joining. Here's 10% off your first order, as promised:"),
        codeBox('WELCOME10'),
        p("Enter it in your bag before checkout. You'll also be first to hear about new drops and restocks."),
        button('Shop the collection', shop),
        small('Raw Vietnamese hair from a single donor, cuticle-aligned Indian hair, and glueless half wigs. Every texture is labelled exactly as it is.'),
      ].join(''),
    }),
    text: textOf([
      'Welcome to the Circle.',
      '',
      'Your code for 10% off your first order: WELCOME10',
      'Enter it in your bag before checkout.',
      '',
      `Shop: ${shop}`,
    ]),
  })
}

export async function sendSignInLink(email: string, url: string, forAdmin: boolean): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: forAdmin ? 'Your dashboard sign-in link' : 'Your sign-in link',
    tags: { type: forAdmin ? 'admin_sign_in' : 'sign_in' },
    html: layout({
      preheader: 'This link expires in 30 minutes.',
      title: forAdmin ? 'Sign in to your dashboard' : 'Sign in to the Circle',
      body: [
        p(forAdmin ? 'Tap the button to open your store dashboard.' : 'Tap the button to see your member card, strands and orders.'),
        button('Sign in', url),
        small("This link expires in 30 minutes. If you didn't ask for it, you can ignore this email."),
      ].join(''),
    }),
    text: textOf([forAdmin ? 'Sign in to your dashboard:' : 'Sign in to the Circle:', url, '', 'This link expires in 30 minutes.']),
  })
}

