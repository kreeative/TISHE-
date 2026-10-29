import { findVariantById, type Currency, type Product, type ProductVariant } from './catalog'

// The bag lives in the shopper's browser. Only variant ids and quantities are
// stored; titles and prices always come from the current catalog, and the
// checkout API prices everything again on the server.

const KEY = 'tis-cart'

export interface StoredLine {
  variantId: string
  quantity: number
}

export interface CartLine extends StoredLine {
  product: Product
  variant: ProductVariant
  lineTotal: number
}

export interface Cart {
  lines: CartLine[]
  totalQuantity: number
  subtotal: number
  currencyCode: string
}

export function loadLines(): StoredLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(raw)
      ? raw.filter((l) => typeof l?.variantId === 'string' && Number.isInteger(l?.quantity) && l.quantity > 0)
      : []
  } catch {
    return []
  }
}

export function saveLines(lines: StoredLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines))
  } catch {
    // private mode: the bag still works for this visit
  }
}

export function buildCart(stored: StoredLine[], products: Product[], currency: Currency): Cart {
  const lines: CartLine[] = []
  for (const l of stored) {
    const match = findVariantById(products, l.variantId)
    if (!match || !match.variant.availableForSale) continue
    lines.push({ ...l, ...match, lineTotal: Number(match.variant.price.amount) * l.quantity })
  }
  return {
    lines,
    totalQuantity: lines.reduce((n, l) => n + l.quantity, 0),
    subtotal: lines.reduce((n, l) => n + l.lineTotal, 0),
    currencyCode: currency,
  }
}
