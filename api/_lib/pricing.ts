import { findVariant, type CatalogProduct, type CatalogVariant, type Currency } from './catalog.js'
import { checkCode, findCode, needsEmail, type CodeRule, type History } from './discounts.js'
import { HttpError, email as cleanEmail, str } from './http.js'
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
  }
}

export function needsHistory(req: PriceRequest, doc: StoreDoc): boolean {
  return Boolean(req.code && req.email && needsEmail(findCode(doc.discounts, req.code)))
}

// history is the shopper's past orders, looked up by email when a code needs it
export function price(req: PriceRequest, history: History | null, doc: StoreDoc): Priced {
  const ship = doc.shipping
  const zone = ship.zones.find((z) => z.countries.includes(req.country))
  if (!zone) throw new HttpError(400, "We don't ship to that country yet. Write to hello@theivorysukundu.com and we'll see what we can do.")

  const lines: PricedLine[] = req.items.map(({ variantId, quantity }) => {
    const match = findVariant(doc.products, variantId)
    if (!match || !match.variant.availableForSale) {
      throw new HttpError(409, 'Something in your bag is no longer available. Please remove it and try again.', 'unavailable')
    }
    const unit = cents(match.variant.price[zone.currency])
    return { ...match, quantity, originalUnit: unit, unit }
  })
  const subtotal = lines.reduce((n, l) => n + l.originalUnit * l.quantity, 0)

  const rule = req.code ? findCode(doc.discounts, req.code) : null
  if (rule) checkCode(rule, subtotal / 100, zone.currency, history)

  // an amount off is spread over the items in proportion to their price
  const share =
    rule?.kind === 'percent' && rule.percent
      ? rule.percent / 100
      : rule?.kind === 'amount' && rule.amount
        ? Math.min(1, cents(rule.amount[zone.currency]) / subtotal)
        : 0
  if (share) for (const l of lines) l.unit = Math.round(l.originalUnit * (1 - share))
  const discounted = lines.reduce((n, l) => n + l.unit * l.quantity, 0)
  const freeShipping = rule?.kind === 'free_shipping'
  const shipping = freeShipping ? 0 : cents(zone.rate)

  return {
    lines,
    currency: zone.currency,
    subtotal,
    discount: subtotal - discounted,
    shipping,
    freeShipping,
    zone: { id: zone.id, label: zone.label },
    taxAtCheckout: req.country === 'CA',
    total: discounted + shipping,
    rule,
  }
}
