import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// The same catalog and shipping files the storefront is built from, read from
// disk (vercel.json includes src/data with every function).

export type Currency = 'USD' | 'CAD'

export interface CatalogVariant {
  id: string
  title: string
  availableForSale: boolean
  price: Record<Currency, string>
  compareAtPrice: Record<Currency, string> | null
  selectedOptions: { name: string; value: string }[]
}

export interface CatalogProduct {
  id: string
  title: string
  handle: string
  supplier: string
  featuredImage: { url: string; thumb: string } | null
  variants: CatalogVariant[]
}

interface ShippingData {
  freeShippingCode: string
  freeShippingMinimum: Record<Currency, number>
  zones: { id: string; label: string; currency: Currency; rate: number; countries: string[] }[]
  provinces: { code: string; name: string }[]
}

const read = <T>(file: string): T => JSON.parse(readFileSync(join(process.cwd(), 'src/data', file), 'utf8')) as T

let catalog: { products: CatalogProduct[] } | null = null
let shipping: ShippingData | null = null

export function products(): CatalogProduct[] {
  if (!catalog) catalog = read<{ products: CatalogProduct[] }>('catalog.json')
  return catalog.products
}

export function shippingData(): ShippingData {
  if (!shipping) shipping = read<ShippingData>('shipping.json')
  return shipping
}

export function findVariant(id: string): { product: CatalogProduct; variant: CatalogVariant } | null {
  for (const product of products()) {
    const variant = product.variants.find((v) => v.id === id)
    if (variant) return { product, variant }
  }
  return null
}

export const SUPPLIERS: Record<string, { name: string; greeting: string; country: string }> = {
  nine: { name: 'Nine ISEE', greeting: 'Hello Nine', country: 'India' },
  evelyn: { name: 'Evelyn Thanh An Hair', greeting: 'Hello Evelyn', country: 'Vietnam' },
}
