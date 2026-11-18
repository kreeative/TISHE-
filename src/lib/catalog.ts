import data from '../data/catalog.json'
import type { Sale } from './sale'

// Product types and the catalog. The live catalog is edited in the dashboard
// and served by /api/store (see StoreContext); src/data/catalog.json is the
// copy bundled with the site, used for the first paint and as a fallback.
// The checkout API prices from the same live catalog, so the price a shopper
// sees is the price charged.
//
// Every variant has two prices: USD, the store's base currency, and CAD,
// charged to shoppers in Canada.

export type Currency = 'USD' | 'CAD'

export interface Money {
  amount: string
  currencyCode: string
}

export interface ProductVariant {
  id: string
  title: string
  availableForSale: boolean
  price: Money
  compareAtPrice: Money | null
  selectedOptions: { name: string; value: string }[]
}

export interface ProductImage {
  url: string
  // smaller copy for cards, thumbnails and the bag
  thumb: string
  altText: string | null
}

export interface ProductMedia {
  type: 'image' | 'video' | 'external_video'
  url: string
  previewUrl: string | null
  poster?: string | null
  altText: string | null
}

export interface ProductOption {
  name: string
  values: string[]
}

export interface Product {
  id: string
  title: string
  handle: string
  // who makes it: 'nine' (Nine ISEE, India) or 'evelyn' (Evelyn Thanh An, Vietnam)
  supplier: string
  // the price already includes tracked shipping
  shippingIncluded?: boolean
  descriptionHtml: string
  tags: string[]
  featuredImage: ProductImage | null
  images: ProductImage[]
  media: ProductMedia[]
  options: ProductOption[]
  priceRange: { minVariantPrice: Money; maxVariantPrice: Money }
  variants: ProductVariant[]
}

const money = (amount: string, currencyCode: Currency): Money => ({ amount, currencyCode })

// the catalog as stored: two prices per variant
export type RawProduct = Omit<Product, 'variants' | 'priceRange' | 'media'> & {
  hidden?: boolean
  media: ProductMedia[]
  variants: (Omit<ProductVariant, 'price' | 'compareAtPrice'> & {
    price: Record<Currency, string>
    compareAtPrice: Record<Currency, string> | null
  })[]
}

// the copy bundled with the site, shown until the live catalog arrives
export const BUNDLED_PRODUCTS = data.products as RawProduct[]

export function buildProducts(raw: RawProduct[], currency: Currency): Product[] {
  return raw
    .filter((p) => !p.hidden)
    .map((p) => {
      const variants: ProductVariant[] = p.variants.map((v) => ({
        id: v.id,
        title: v.title,
        availableForSale: v.availableForSale,
        price: money(v.price[currency], currency),
        compareAtPrice: v.compareAtPrice ? money(v.compareAtPrice[currency], currency) : null,
        selectedOptions: v.selectedOptions,
      }))
      const prices = variants.map((v) => Number(v.price.amount))
      return {
        ...p,
        variants,
        priceRange: {
          minVariantPrice: money(String(Math.min(...prices)), currency),
          maxVariantPrice: money(String(Math.max(...prices)), currency),
        },
      }
    })
}

export interface VariantMatch {
  product: Product
  variant: ProductVariant
}

export function findVariantById(products: Product[], id: string): VariantMatch | null {
  for (const product of products) {
    const variant = product.variants.find((v) => v.id === id)
    if (variant) return { product, variant }
  }
  return null
}

// A percentage sale, while it runs: each product on sale shows its normal price as the
// "was" price and the reduced one as its price (worked out like the checkout does).
export function withSale(raw: RawProduct[], sale: Sale | null, now = Date.now()): RawProduct[] {
  if (!sale?.percent || !(Date.parse(sale.endsAt) > now)) return raw
  const factor = 1 - sale.percent / 100
  const off = (amount: string) => (Math.round(Math.round(Number(amount) * 100) * factor) / 100).toFixed(2)
  return raw.map((p) =>
    sale.handles.includes(p.handle)
      ? {
          ...p,
          variants: p.variants.map((v) => ({
            ...v,
            compareAtPrice: { USD: v.price.USD, CAD: v.price.CAD },
            price: { USD: off(v.price.USD), CAD: off(v.price.CAD) },
          })),
        }
      : p,
  )
}
