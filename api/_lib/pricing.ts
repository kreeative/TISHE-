import { findVariant, type CatalogProduct, type CatalogVariant, type Currency } from './catalog.js'
import { checkCode, findCode, needsEmail, type CodeRule, type History } from './discounts.js'
import { HttpError, email as cleanEmail, str } from './http.js'
import { strandsOffer, type Strands, type StrandsOffer } from './strands.js'
import type { StoreDoc } from './store.js'

// Prices a bag on the server from the catalog. The browser only sends variant
// ids and quantities, so a tampered request can't change what is charged.
// Amounts are in cents and before tax: Stripe Tax adds GST/HST at checkout,
// once the customer's address is known.

export interface PriceRequest {
  items: { variantId: string; quantity: number }[]
  country: string
  code: string | null
  email: string | null
  // a signed-in Circle member asks to spend her strands
  useStrands: boolean
}

export interface PricedLine {
  product: CatalogProduct
  variant: CatalogVariant
  quantity: number
  originalUnit: number
  unit: number
}

export interface Priced {
  lines: PricedLine[]
  currency: Currency
  subtotal: number
  discount: number
  shipping: number
  freeShipping: boolean
  zone: { id: string; label: string }
  // Canadian orders get GST/HST added by Stripe Tax on the checkout page
  taxAtCheckout: boolean
  total: number
  rule: CodeRule | null
  // every item's price already includes shipping
  shippingIncluded: boolean
  // a signed-in member's strands: what they can take off, and whether they do
  strands: StrandsOffer | null
}

const cents = (amount: string | number) => Math.round(Number(amount) * 100)

export function parsePriceRequest(body: Record<string, unknown>): PriceRequest {
  const raw = Array.isArray(body.items) ? body.items : []
  if (!raw.length || raw.length > 30) throw new HttpError(400, 'Your bag is empty.')
  const merged = new Map<string, number>()
  for (const item of raw) {
    const variantId = str((item as Record<string, unknown>)?.variantId, 200)
    const quantity = Number((item as Record<string, unknown>)?.quantity)
    if (!variantId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw new HttpError(400, 'Something in your bag is not right. Please refresh the page and try again.')
    }
    merged.set(variantId, (merged.get(variantId) ?? 0) + quantity)
  }
  return {
    items: [...merged].map(([variantId, quantity]) => ({ variantId, quantity })),
    country: str(body.country, 2).toUpperCase(),
    code: str(body.code, 40).toUpperCase() || null,
    email: cleanEmail(body.email) || null,
    useStrands: body.strands === true,
  }
}

export function needsHistory(req: PriceRequest, doc: StoreDoc): boolean {
  return Boolean(req.code && req.email && needsEmail(findCode(doc.discounts, req.code)))
}

// history is the shopper's past orders, looked up by email when a code needs it;
// member is a signed-in Circle member's strands (they add up with a sale and with codes)
export function price(req: PriceRequest, history: History | null, doc: StoreDoc, member: Strands | null = null): Priced {
  const ship = doc.shipping
  const zone = ship.zones.find((z) => z.countries.includes(req.country))
  if (!zone) throw new HttpError(400, "We don't ship to that country yet. Write to hello@theivorysukundu.com and we'll see what we can do.")

  const sale = doc.site.sale
  const saleRunning = Boolean(sale && Date.parse(sale.endsAt) > Date.now())
  const saleOn = (handle: string) => saleRunning && Boolean(sale?.handles.includes(handle))

  const lines: PricedLine[] = req.items.map(({ variantId, quantity }) => {
    const match = findVariant(doc.products, variantId)
    if (!match || !match.variant.availableForSale) {
      throw new HttpError(409, 'Something in your bag is no longer available. Please remove it and try again.', 'unavailable')
    }
    let unit = cents(match.variant.price[zone.currency])
    // a percentage sale is worked out here, the same way the shop shows it
    if (sale?.percent && saleOn(match.product.handle)) unit = Math.round(unit * (1 - sale.percent / 100))
    return { ...match, quantity, originalUnit: unit, unit }
  })
  const subtotal = lines.reduce((n, l) => n + l.originalUnit * l.quantity, 0)

  const rule = req.code ? findCode(doc.discounts, req.code) : null
  if (rule) checkCode(rule, subtotal / 100, zone.currency, history)

  // codes don't add up with a sale: they only take money off what isn't on sale
  const eligible = lines.filter((l) => !saleOn(l.product.handle))
  const eligibleSubtotal = eligible.reduce((n, l) => n + l.originalUnit * l.quantity, 0)
  if (rule && (rule.kind === 'percent' || rule.kind === 'amount') && !eligible.length) {
    throw new HttpError(400, "Codes can't be combined with sale prices. Your sale price is already applied.", 'not_with_sale')
  }

  // an amount off is spread over the items in proportion to their price
  const share =
    rule?.kind === 'percent' && rule.percent
      ? rule.percent / 100
      : rule?.kind === 'amount' && rule.amount && eligibleSubtotal
        ? Math.min(1, cents(rule.amount[zone.currency]) / eligibleSubtotal)
        : 0
  if (share) for (const l of eligible) l.unit = Math.round(l.originalUnit * (1 - share))
  const discounted = lines.reduce((n, l) => n + l.unit * l.quantity, 0)
  const freeShipping = rule?.kind === 'free_shipping'
  const shippingIncluded = Boolean(ship.included) || lines.every((l) => l.product.shippingIncluded)
  const shipping = freeShipping || shippingIncluded ? 0 : cents(zone.rate)
  const strands = member ? strandsOffer(member, discounted, zone.currency, req.useStrands) : null
  const strandsOff = strands?.applied ? strands.amount : 0

  return {
    lines,
    currency: zone.currency,
    subtotal,
    discount: subtotal - discounted,
    shipping,
    freeShipping,
    zone: { id: zone.id, label: zone.label },
    taxAtCheckout: req.country === 'CA',
    total: discounted + shipping - strandsOff,
    rule,
    shippingIncluded,
    strands,
  }
}
