import { del, list, put } from '@vercel/blob'
import { bundledProducts, bundledShipping, type CatalogProduct, type ShippingData } from './catalog.js'
import { DEFAULT_CODES, type CodeRule } from './discounts.js'

// The store document: everything the owner edits in the dashboard (products,
// prices, photos, promo codes, the announcement bar, the sale and shipping
// rates), saved as one JSON file in Vercel Blob. Each save writes a new file
// under a random, unguessable name and removes the old ones. Until the first
// save, the copies bundled with the site are used.

export interface SaleSettings {
  name: string
  // short line in the announcement bar while the sale runs
  banner: string
  endsAt: string
  handles: string[]
}

export interface SiteSettings {
  announcements: string[]
  sale: SaleSettings | null
}

export interface StoreDoc {
  version: 1
  updatedAt: string
  products: CatalogProduct[]
  discounts: CodeRule[]
  site: SiteSettings
  shipping: ShippingData
}

const PREFIX = 'store/document-'
const CACHE_MS = 10_000

function defaults(): StoreDoc {
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    products: bundledProducts(),
    discounts: DEFAULT_CODES,
    site: {
      announcements: ['1st order over $200 ships free · FREESHIP200', 'Install in sixty seconds', 'Luxury raw hair, redefined'],
      sale: null,
    },
    shipping: bundledShipping(),
  }
}

const configured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN)

let cache: { doc: StoreDoc; at: number } | null = null

async function newest(): Promise<{ url: string; pathname: string }[]> {
  const { blobs } = await list({ prefix: PREFIX, limit: 100 })
  return blobs.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))
}

export async function loadStore(fresh = false): Promise<StoreDoc> {
  if (!fresh && cache && Date.now() - cache.at < CACHE_MS) return cache.doc
  let doc = defaults()
  if (configured()) {
    const [latest] = await newest()
    if (latest) {
      const res = await fetch(`${latest.url}?t=${Date.now()}`, { cache: 'no-store' })
      if (res.ok) doc = { ...doc, ...((await res.json()) as StoreDoc) }
      else console.error('store document unreadable', res.status)
    }
  }
  cache = { doc, at: Date.now() }
  return doc
}

// Applies a change to the latest document and saves it.
export async function saveStore(change: (doc: StoreDoc) => void): Promise<StoreDoc> {
  if (!configured()) throw new Error('BLOB_READ_WRITE_TOKEN is missing')
  const doc = structuredClone(await loadStore(true))
  change(doc)
  doc.updatedAt = new Date().toISOString()
  const old = await newest()
  await put(`${PREFIX}${Date.now()}.json`, JSON.stringify(doc), {
    access: 'public',
    addRandomSuffix: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  })
  // keep the previous version as a backup, delete anything older
  const stale = old.slice(1).map((b) => b.url)
  if (stale.length) await del(stale)
  cache = { doc, at: Date.now() }
  return doc
}

// Saves a product photo uploaded from the dashboard and returns its address.
export async function saveImage(handle: string, data: Buffer): Promise<string> {
  const safe = handle.replace(/[^a-z0-9-]/g, '') || 'product'
  const blob = await put(`media/${safe}/${Date.now()}.jpg`, data, {
    access: 'public',
    addRandomSuffix: true,
    contentType: 'image/jpeg',
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  })
  return blob.url
}

// What the shop itself needs: no codes (except the free-shipping offer it
// advertises), no hidden products.
export function publicView(doc: StoreDoc) {
  const now = Date.now()
  const free = doc.discounts.find(
    (c) => c.kind === 'free_shipping' && c.active && !c.returningOnly && (!c.endsAt || Date.parse(c.endsAt) > now),
  )
  return {
    updatedAt: doc.updatedAt,
    products: doc.products.filter((p) => !p.hidden),
    site: doc.site,
    shipping: doc.shipping,
    freeShipping: free ? { code: free.code, minSubtotal: free.minSubtotal ?? null, firstOrderOnly: Boolean(free.firstOrderOnly) } : null,
  }
}
