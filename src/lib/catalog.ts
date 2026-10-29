import data from '../data/catalog.json'

// The product catalog, bundled with the site. Products, prices and photos
// live in src/data/catalog.json and public/media; the checkout API reads the
// same file, so the price a shopper sees is the price charged.
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

function build(currency: Currency): Product[] {
  return data.products.map((p) => {
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
      media: p.media as ProductMedia[],
      variants,
      priceRange: {
        minVariantPrice: money(String(Math.min(...prices)), currency),
        maxVariantPrice: money(String(Math.max(...prices)), currency),
      },
    }
  })
}

const BY_CURRENCY: Record<Currency, Product[]> = { USD: build('USD'), CAD: build('CAD') }

export function productsIn(currency: Currency): Product[] {
  return BY_CURRENCY[currency]
}

export function productByHandle(handle: string | undefined, currency: Currency): Product | null {
  return BY_CURRENCY[currency].find((p) => p.handle === handle) ?? null
}

export interface VariantMatch {
  product: Product
  variant: ProductVariant
}

export function findVariantById(id: string, currency: Currency): VariantMatch | null {
  for (const product of BY_CURRENCY[currency]) {
    const variant = product.variants.find((v) => v.id === id)
    if (variant) return { product, variant }
  }
  return null
}
