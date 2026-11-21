import type Stripe from 'stripe'
import { HttpError, bearer, handler, json, readBody, str } from './_lib/http.js'
import { env } from './_lib/env.js'
import { stripe, SOURCE } from './_lib/stripe.js'
import { needsHistory, parsePriceRequest, price } from './_lib/pricing.js'
import { historyFor } from './_lib/orders.js'
import { absolute, money } from './_lib/templates.js'
import { loadStore } from './_lib/store.js'
import { strandsFor } from './_lib/strands.js'
import { verifyToken } from './_lib/tokens.js'

// Product tax codes for Stripe Tax: general tangible goods, and shipping
const TAX_CODE_GOODS = 'txcd_99999999'
const TAX_CODE_SHIPPING = 'txcd_92010001'

// POST { action: 'quote' | 'create', items, country, code, email, strands }
//   quote  → the totals for the bag, to show before paying
//   create → a Stripe Checkout Session; the browser is sent to its url
// With a Circle member's session (Authorization: Bearer), the totals show what her
// strands can take off, and strands: true spends them (a one-time Stripe coupon).
//
// Stripe Tax adds GST/HST for Canadian addresses (shipping included) and
// zero-rates exports; Adaptive Pricing shows shoppers outside Canada and the
// US their own currency on the checkout page.
export default handler(async (request) => {
  const body = await readBody(request)
  const req = parsePriceRequest(body)
  const member = memberEmail(request)
  if (req.useStrands && !member) throw new HttpError(401, 'Please sign in again to use your strands.', 'unauthorized')
  // a member's orders carry her email: the checkout is hers
  if (member) req.email = member
  const doc = await loadStore()
  const history = needsHistory(req, doc) && req.email ? await historyFor(req.email) : null
  const priced = price(req, history, doc, member ? await strandsFor(member) : null)
  const strands = priced.strands

  if (str(body.action) === 'quote') {
    return json({
      subtotal: priced.subtotal / 100,
      discount: priced.discount / 100,
      shipping: priced.shipping / 100,
      taxAtCheckout: priced.taxAtCheckout,
      total: priced.total / 100,
      currency: priced.currency,
      code: priced.rule ? { code: priced.rule.code, label: priced.rule.label } : null,
      strands: strands
        ? { available: strands.available, usable: strands.usable, amount: strands.amount / 100, applied: strands.applied }
        : null,
    })
  }

  const currency = priced.currency.toLowerCase()
  const rule = priced.rule
  const site = env.siteUrl()

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priced.lines.map((l) => ({
    quantity: l.quantity,
    price_data: {
      currency,
      unit_amount: l.unit,
      tax_behavior: 'exclusive',
      product_data: {
        name: l.product.title,
        description:
          rule && l.unit < l.originalUnit
            ? `${l.variant.title} · ${rule.code} (was ${money(l.originalUnit, priced.currency)})`
            : l.variant.title,
        images: l.product.featuredImage ? [absolute(l.product.featuredImage.thumb)] : undefined,
        tax_code: TAX_CODE_GOODS,
        metadata: {
          variant_id: l.variant.id,
          variant_title: l.variant.title,
          handle: l.product.handle,
          supplier: l.product.supplier,
          original_unit: String(l.originalUnit),
        },
      },
    },
  }))

  // stays within Stripe's 500-character metadata limit
  const summary = priced.lines
    .map((l) => `${l.product.title} ${l.variant.title} ×${l.quantity}`)
    .join('; ')
    .slice(0, 480)

  // the strands come off the whole order, as a coupon that works once
  const coupon = strands?.applied
    ? await stripe().coupons.create({
        name: `Circle strands (${strands.usable})`,
        amount_off: strands.amount,
        currency,
        duration: 'once',
        max_redemptions: 1,
        metadata: { source: SOURCE, email: req.email ?? '', strands: String(strands.usable) },
      })
    : null

  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    discounts: coupon ? [{ coupon: coupon.id }] : undefined,
    customer_email: req.email ?? undefined,
    automatic_tax: { enabled: true },
    adaptive_pricing: { enabled: true },
    shipping_address_collection: { allowed_countries: [req.country as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: priced.shipping, currency },
          display_name: priced.freeShipping
            ? `Free tracked shipping · ${rule?.code}`
            : priced.shippingIncluded
              ? 'Free tracked shipping'
              : 'Tracked shipping',
          tax_behavior: 'exclusive',
          tax_code: TAX_CODE_SHIPPING,
          // 5–10 business days to prepare, then 5–12 in transit
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 10 },
            maximum: { unit: 'business_day', value: 22 },
          },
        },
      },
    ],
    phone_number_collection: { enabled: true },
    // the checkout page in the shop's own colours
    branding_settings: {
      display_name: 'The Ivory Sukundu',
      logo: { type: 'url', url: `${site}/images/logo-lockup-brown.png` },
      background_color: '#FAF7F3',
      button_color: '#1B1113',
      border_style: 'rectangular',
      font_family: 'montserrat',
    },
    custom_text: {
      shipping_address: { message: 'Your courier may need your phone number to deliver.' },
      submit: { message: 'Every order is prepared for you and ships within 5–10 business days.' },
    },
    locale: 'auto',
    success_url: `${site}/#/order/confirmed?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/#/collections`,
    metadata: {
      source: SOURCE,
      summary,
      code: rule?.code ?? '',
      country: req.country,
      subtotal: String(priced.subtotal),
      discount: String(priced.discount),
      shipping: String(priced.shipping),
      strands: coupon ? String(strands?.usable ?? 0) : '',
      strands_amount: coupon ? String(strands?.amount ?? 0) : '',
    },
    payment_intent_data: {
      description: `The Ivory Sukundu: ${summary}`.slice(0, 500),
      metadata: { source: SOURCE },
    },
  })

  if (!session.url) throw new Error('Stripe returned a session without a url')
  return json({ url: session.url })
})

// the signed-in Circle member, if the bag came with a valid session
function memberEmail(request: Request): string | null {
  const token = bearer(request)
  if (!token) return null
  try {
    return verifyToken(token, 'session')
  } catch {
    return null
  }
}
