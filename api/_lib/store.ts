import { del, list, put } from '@vercel/blob'
import { bundledProducts, bundledShipping, type CatalogProduct, type ShippingData } from './catalog.js'
import { DEFAULT_CODES, type CodeRule } from './discounts.js'

// The store document: everything the owner edits in the dashboard (products,
// prices, photos, promo codes, the announcement bar, the sale, shipping
// rates, and the page texts and pictures edited from Jeere), saved as one JSON file in Vercel Blob. Each save writes a new file
// under a random, unguessable name and removes the old ones. Until the first
// save, the copies bundled with the site are used.

export interface SaleSettings {
  name: string
  // short line in the announcement bar while the sale runs
  banner: string
  endsAt: string
  handles: string[]
  // a percentage off the normal prices, while the sale runs (the prices themselves stay as they are,
  // so they're back to normal by themselves when it ends)
  percent?: number
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
  // page texts and pictures changed from Jeere, by key (e.g. "campaign.title");
  // a key that isn't here shows the wording written in the site's code
  content?: Record<string, string>
  // products from src/data/catalog.json already copied into this document (see ADDED_FROM_CODE)
  addedFromCode?: string[]
  // one-time changes already made to this document (see CHANGES)
  changes?: string[]
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
      announcements: ['Free tracked shipping on every order', 'Install in sixty seconds', 'Luxury raw hair, redefined'],
      sale: null,
    },
    shipping: bundledShipping(),
    content: {},
  }
}

const configured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN)

let cache: { doc: StoreDoc; at: number } | null = null

// New products written into the code (src/data/catalog.json) for the owner. Each is
// copied into the live document once; after that she edits or deletes it in the
// dashboard like any other, and deleting it doesn't bring it back.
const ADDED_FROM_CODE = ['u-part-raw-vietnamese']

// One-time changes the owner asked for, made to the live document once each.
const WIGS = ['the-kinky-curly-sukundu-half-wig', 'untitled-jul21_09-54-40', 'u-part-raw-vietnamese']
const plus = (amount: string, add: number) => (Number(amount) + add).toFixed(2)
function includeShipping(p: CatalogProduct): void {
  if (p.shippingIncluded) return
  p.shippingIncluded = true
  for (const v of p.variants) {
    v.price = { USD: plus(v.price.USD, 30), CAD: plus(v.price.CAD, 42) }
    if (v.compareAtPrice) v.compareAtPrice = { USD: plus(v.compareAtPrice.USD, 30), CAD: plus(v.compareAtPrice.CAD, 42) }
  }
}
const CHANGES: { id: string; run: (doc: StoreDoc) => void }[] = [
  {
    // wigs ship free: US$30 (CA$42) of shipping goes into their price
    id: 'wigs-include-shipping',
    run: (doc) => {
      for (const p of doc.products) if (WIGS.includes(p.handle)) includeShipping(p)
    },
  },
  {
    // then every product: shipping is in every price, every order ships free, and the
    // first-order free-shipping code and its banner line have nothing left to offer
    id: 'all-include-shipping',
    run: (doc) => {
      for (const p of doc.products) includeShipping(p)
      doc.shipping = { ...doc.shipping, included: true }
      for (const c of doc.discounts) if (c.kind === 'free_shipping') c.active = false
      const lines = doc.site.announcements.map((a) => (/freeship|ships free|free shipping/i.test(a) ? 'Free tracked shipping on every order' : a))
      doc.site.announcements = [...new Set(lines)]
    },
  },
  {
    // Black Friday, asked for on November 18: 20% off everything until Cyber Monday ends (Eastern time)
    id: 'black-friday-2026',
    run: (doc) => {
      doc.site.sale = {
        name: 'Black Friday',
        banner: 'Black Friday · 20% off everything',
        endsAt: '2026-12-01T05:00:00.000Z',
        handles: doc.products.map((p) => p.handle),
        percent: 20,
      }
    },
  },
]

async function addFromCode(doc: StoreDoc, saved: boolean): Promise<StoreDoc> {
  const next = upgrade(doc)
  if (!next) return doc
  // the bundled defaults already hold all this; only a saved document needs writing
  if (saved) await write(next).catch((err) => console.error('updating the store from the code', err))
  return next
}

// The document with the code's new products and one-time changes applied, or null if it has them all.
export function upgrade(doc: StoreDoc): StoreDoc | null {
  const added = new Set(doc.addedFromCode ?? [])
  const pending = ADDED_FROM_CODE.filter((h) => !added.has(h))
  const made = new Set(doc.changes ?? [])
  const changes = CHANGES.filter((c) => !made.has(c.id))
  if (!pending.length && !changes.length) return null
  const next = structuredClone(doc)
  const bundled = bundledProducts()
  for (const handle of pending) {
    const product = bundled.find((p) => p.handle === handle)
    if (product && !next.products.some((p) => p.handle === handle)) next.products.push(product)
    next.addedFromCode = [...(next.addedFromCode ?? []), handle]
  }
  for (const change of changes) {
    change.run(next)
    next.changes = [...(next.changes ?? []), change.id]
  }
  return next
}

async function write(doc: StoreDoc): Promise<void> {
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
}

async function newest(): Promise<{ url: string; pathname: string }[]> {
  const { blobs } = await list({ prefix: PREFIX, limit: 100 })
  return blobs.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))
}

export async function loadStore(fresh = false): Promise<StoreDoc> {
  if (!fresh && cache && Date.now() - cache.at < CACHE_MS) return cache.doc
  let doc = defaults()
  let saved = false
  if (configured()) {
    const [latest] = await newest()
    if (latest) {
      const res = await fetch(`${latest.url}?t=${Date.now()}`, { cache: 'no-store' })
      if (res.ok) {
        doc = { ...doc, ...((await res.json()) as StoreDoc) }
        saved = true
      } else console.error('store document unreadable', res.status)
    }
  }
  doc = await addFromCode(doc, saved)
  cache = { doc, at: Date.now() }
  return doc
}

// Applies a change to the latest document and saves it.
export async function saveStore(change: (doc: StoreDoc) => void): Promise<StoreDoc> {
  if (!configured()) throw new Error('BLOB_READ_WRITE_TOKEN is missing')
  const doc = structuredClone(await loadStore(true))
  change(doc)
  doc.updatedAt = new Date().toISOString()
  await write(doc)
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
    content: doc.content ?? {},
    freeShipping: free ? { code: free.code, minSubtotal: free.minSubtotal ?? null, firstOrderOnly: Boolean(free.firstOrderOnly) } : null,
  }
}
