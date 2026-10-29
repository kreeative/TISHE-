import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Product, shipping and supplier types, and the copies of the catalog and
// shipping rates bundled with the site (src/data). The live versions, which
// the owner edits in the dashboard, live in the store document (store.ts);
// the bundled files are its starting point and fallback.

export type Currency = 'USD' | 'CAD'

export interface CatalogVariant {
  id: string
  title: string
  availableForSale: boolean
  price: Record<Currency, string>
  compareAtPrice: Record<Currency, string> | null
  selectedOptions: { name: string; value: string }[]
}

export interface CatalogImage {
  url: string
  thumb: string
  altText: string | null
}

export interface CatalogMedia {
  type: 'image' | 'video' | 'external_video'
  url: string
  previewUrl: string | null
  poster?: string | null
  altText: string | null
}

export interface CatalogProduct {
  id: string
  title: string
  handle: string
  supplier: string
  // hidden products stay in the dashboard but disappear from the shop
  hidden?: boolean
  descriptionHtml: string
  tags: string[]
  featuredImage: CatalogImage | null
  images: CatalogImage[]
  media: CatalogMedia[]
  options: { name: string; values: string[] }[]
  variants: CatalogVariant[]
}

export interface ShippingZone {
  id: string
  label: string
  currency: Currency
  rate: number
  countries: string[]
}

export interface ShippingData {
  freeShippingCode: string
  freeShippingMinimum: Record<Currency, number>
  zones: ShippingZone[]
  provinces: { code: string; name: string }[]
}

const read = <T>(file: string): T => JSON.parse(readFileSync(join(process.cwd(), 'src/data', file), 'utf8')) as T

export function bundledProducts(): CatalogProduct[] {
  return read<{ products: CatalogProduct[] }>('catalog.json').products
}

export function bundledShipping(): ShippingData {
  return read<ShippingData>('shipping.json')
}

export function findVariant(products: CatalogProduct[], id: string): { product: CatalogProduct; variant: CatalogVariant } | null {
  for (const product of products) {
    if (product.hidden) continue
    const variant = product.variants.find((v) => v.id === id)
    if (variant) return { product, variant }
  }
  return null
}

export const SUPPLIERS: Record<string, { name: string; greeting: string; country: string }> = {
  nine: { name: 'Nine ISEE', greeting: 'Hello Nine', country: 'India' },
  evelyn: { name: 'Evelyn Thanh An Hair', greeting: 'Hello Evelyn', country: 'Vietnam' },
}
