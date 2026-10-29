import type Stripe from 'stripe'
import { handler, json, readBody, str } from './_lib/http.js'
import { env } from './_lib/env.js'
import { stripe, SOURCE } from './_lib/stripe.js'
import { needsHistory, parsePriceRequest, price } from './_lib/pricing.js'
import { historyFor } from './_lib/orders.js'
import { stripeTaxRate } from './_lib/tax.js'
import { absolute, money } from './_lib/templates.js'
import { loadStore } from './_lib/store.js'

// POST { action: 'quote' | 'create', items, country, province, code, email }
//   quote  → the totals for the bag, to show before paying
//   create → a Stripe Checkout Session; the browser is sent to its url
export default handler(async (request) => {
  const body = await readBody(request)
  const req = parsePriceRequest(body)
  const doc = await loadStore()
  const history = needsHistory(req, doc) && req.email ? await historyFor(req.email) : null
  const priced = price(req, history, doc)

  if (str(body.action) === 'quote') {
    return json({
      subtotal: priced.subtotal / 100,
      discount: priced.discount / 100,
      shipping: priced.shipping / 100,
      tax: priced.taxAmount / 100,
      taxLabel: priced.tax?.label ?? '',
      total: priced.total / 100,
      currency: priced.currency,
      code: priced.rule ? { code: priced.rule.code, label: priced.rule.label } : null,
    })
  }

  const currency = priced.currency.toLowerCase()
  const taxRates = priced.tax ? [await stripeTaxRate(priced.tax)] : undefined
  const rule = priced.rule
  const site = env.siteUrl()
  const province = doc.shipping.provinces.find((p) => p.code === req.province)

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priced.lines.map((l) => ({
    quantity: l.quantity,
    tax_rates: taxRates,
    price_data: {
      currency,
      unit_amount: l.unit,
      product_data: {
        name: l.product.title,
        description:
          rule && l.unit < l.originalUnit
            ? `${l.variant.title} · ${rule.code} (was ${money(l.originalUnit, priced.currency)})`
            : l.variant.title,
        images: l.product.featuredImage ? [absolute(l.product.featuredImage.thumb)] : undefined,
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
  if (priced.shipping > 0) {
    lineItems.push({
      quantity: 1,
      tax_rates: taxRates,
      price_data: {
        currency,
        unit_amount: priced.shipping,
        product_data: {
          name: 'Shipping',
          description: `Tracked delivery · ${priced.zone.label}`,
          metadata: { kind: 'shipping', zone: priced.zone.id },
        },
      },
    })
  }

  // stays within Stripe's 500-character metadata limit
  const summary = priced.lines
    .map((l) => `${l.product.title} ${l.variant.title} ×${l.quantity}`)
    .join('; ')
    .slice(0, 480)

  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: req.email ?? undefined,
    shipping_address_collection: { allowed_countries: [req.country as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry] },
    shipping_options: priced.freeShipping
      ? [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: { amount: 0, currency },
              display_name: `Free shipping · ${rule?.code}`,
            },
          },
        ]
      : undefined,
    phone_number_collection: { enabled: true },
    custom_text: {
      shipping_address: {
        message:
          req.country === 'CA'
            ? `GST/HST is charged for ${province?.name ?? req.province}. Your address should be in this province.`
            : 'Your courier may need your phone number to deliver.',
      },
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
      province: req.province ?? '',
      subtotal: String(priced.subtotal),
      discount: String(priced.discount),
      shipping: String(priced.shipping),
    },
    payment_intent_data: {
      description: `The Ivory Sukundu: ${summary}`.slice(0, 500),
      metadata: { source: SOURCE },
    },
  })

  if (!session.url) throw new Error('Stripe returned a session without a url')
  return json({ url: session.url })
})
