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
  // page texts and pictures changed from Jeere, by key (e.g. "collection.title");
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
  {
    // the order of the collection, top to bottom: Kinky Curly, the U-part, Yaki, then the bundles as they were
    id: 'collection-order-2026-11-18',
    run: (doc) => {
      const first = ['the-kinky-curly-sukundu-half-wig', 'u-part-raw-vietnamese', 'untitled-jul21_09-54-40']
      const rank = (handle: string) => (first.includes(handle) ? first.indexOf(handle) : first.length)
      doc.products = doc.products
        .map((p, i) => ({ p, i }))
        .sort((a, b) => rank(a.p.handle) - rank(b.p.handle) || a.i - b.i)
        .map(({ p }) => p)
    },
  },
  {
    // the owner removed the curly photo with the inset from the Kinky Curly Half Wig
    id: 'kinky-remove-photo-2',
    run: (doc) => {
      const gone = (url: string) => url.endsWith('/the-kinky-curly-sukundu-half-wig/2.jpg')
      for (const p of doc.products) {
        if (p.handle !== 'the-kinky-curly-sukundu-half-wig') continue
        p.media = p.media.filter((m) => !gone(m.url))
        p.images = p.images.filter((i) => !gone(i.url))
        p.featuredImage = p.images[0] ?? null
      }
    },
  },
  {
    // in its place, the owner's Canva video, second in the gallery; a still of it is the collection cover
    id: 'kinky-add-canva-video',
    run: (doc) => {
      const base = '/media/products/the-kinky-curly-sukundu-half-wig'
      for (const p of doc.products) {
        if (p.handle !== 'the-kinky-curly-sukundu-half-wig' || p.media.some((m) => m.url === `${base}/5.mp4`)) continue
        p.media.splice(Math.min(1, p.media.length), 0, {
          type: 'video',
          url: `${base}/5.mp4`,
          previewUrl: `${base}/5-poster-sm.jpg`,
          poster: `${base}/5-poster.jpg`,
          altText: 'The Kinky Curly Half Wig, worn',
        })
        p.featuredImage = { url: `${base}/5-poster.jpg`, thumb: `${base}/5-poster.jpg`, altText: 'The Kinky Curly Half Wig, worn' }
      }
    },
  },
  {
    // the same Canva video, sent again in HD: it replaces the first export
    id: 'kinky-canva-video-hd',
    run: (doc) => {
      const swap = (url: string) => url.replace(/\/the-kinky-curly-sukundu-half-wig\/5(-poster(-sm)?\.jpg|\.mp4)$/, '/the-kinky-curly-sukundu-half-wig/6$1')
      for (const p of doc.products) {
        if (p.handle !== 'the-kinky-curly-sukundu-half-wig') continue
        p.media = p.media.map((m) => ({ ...m, url: swap(m.url), previewUrl: m.previewUrl && swap(m.previewUrl), poster: m.poster && swap(m.poster) }))
        if (p.featuredImage) p.featuredImage = { ...p.featuredImage, url: swap(p.featuredImage.url), thumb: swap(p.featuredImage.thumb) }
      }
    },
  },
  {
    // and then the owner's cropped version of it, which is the one to keep
    id: 'kinky-canva-video-cropped',
    run: (doc) => {
      const swap = (url: string) => url.replace(/\/the-kinky-curly-sukundu-half-wig\/[56](-poster(-sm)?\.jpg|\.mp4)$/, '/the-kinky-curly-sukundu-half-wig/7$1')
      for (const p of doc.products) {
        if (p.handle !== 'the-kinky-curly-sukundu-half-wig') continue
        p.media = p.media.map((m) => ({ ...m, url: swap(m.url), previewUrl: m.previewUrl && swap(m.previewUrl), poster: m.poster && swap(m.poster) }))
        if (p.featuredImage) p.featuredImage = { ...p.featuredImage, url: swap(p.featuredImage.url), thumb: swap(p.featuredImage.thumb) }
      }
    },
  },
  {
    // the owner's own cover for the Kinky Curly Half Wig in the collection (the gallery stays as it is)
    id: 'kinky-cover-photo',
    run: (doc) => {
      const base = '/media/products/the-kinky-curly-sukundu-half-wig'
      for (const p of doc.products) {
        if (p.handle === 'the-kinky-curly-sukundu-half-wig') {
          p.featuredImage = { url: `${base}/cover.jpg`, thumb: `${base}/cover-sm.jpg`, altText: 'The Kinky Curly Half Wig, worn' }
        }
      }
    },
  },
  {
    // the Indian bundles before the Vietnamese ones, after the three wigs
    id: 'collection-order-indian-first',
    run: (doc) => {
      const order = [
        'the-kinky-curly-sukundu-half-wig',
        'u-part-raw-vietnamese',
        'untitled-jul21_09-54-40',
        'straight-bundles',
        'burmese-curly-bundles',
        'raw-wavy-bundles',
        'raw-curly-bundles',
      ]
      const rank = (handle: string) => (order.includes(handle) ? order.indexOf(handle) : order.length)
      doc.products = doc.products
        .map((p, i) => ({ p, i }))
        .sort((a, b) => rank(a.p.handle) - rank(b.p.handle) || a.i - b.i)
        .map(({ p }) => p)
    },
  },
  {
    // then the owner put the Indian Burmese Curly Bundles at the very top; the rest keeps its order
    id: 'collection-burmese-curly-top',
    run: (doc) => {
      const top = doc.products.filter((p) => p.handle === 'burmese-curly-bundles')
      doc.products = [...top, ...doc.products.filter((p) => p.handle !== 'burmese-curly-bundles')]
    },
  },
  {
    // the owner removed the photo with someone in the background from the U-part
    id: 'u-part-remove-photo-3',
    run: (doc) => {
      const gone = (url: string) => url.endsWith('/u-part-raw-vietnamese/3.jpg')
      for (const p of doc.products) {
        if (p.handle !== 'u-part-raw-vietnamese') continue
        p.media = p.media.filter((m) => !gone(m.url))
        p.images = p.images.filter((i) => !gone(i.url))
        if (p.featuredImage && gone(p.featuredImage.url)) p.featuredImage = p.images[0] ?? null
      }
    },
  },
  {
    // two more photos and a video of the U-part from the owner (pink top), at the end of its gallery
    id: 'u-part-add-pink-set',
    run: (doc) => {
      const base = '/media/products/u-part-raw-vietnamese'
      const photos = [
        { url: `${base}/5.jpg`, thumb: `${base}/5-sm.jpg`, altText: 'Raw Vietnamese U-part wig, bone straight, side view' },
        { url: `${base}/6.jpg`, thumb: `${base}/6-sm.jpg`, altText: 'Raw Vietnamese U-part wig, bone straight, blended with the leave-out' },
      ]
      for (const p of doc.products) {
        if (p.handle !== 'u-part-raw-vietnamese' || p.media.some((m) => m.url === `${base}/video2.mp4`)) continue
        for (const ph of photos) {
          p.images.push(ph)
          p.media.push({ type: 'image', url: ph.url, previewUrl: ph.thumb, altText: ph.altText })
        }
        p.media.push({
          type: 'video',
          url: `${base}/video2.mp4`,
          previewUrl: `${base}/video2-poster.jpg`,
          poster: `${base}/video2-poster.jpg`,
          altText: 'The raw Vietnamese U-part wig, moving',
        })
      }
    },
  },
  {
    // the new photos replace the old ones: the pink-top photos first (the first is the cover), the new
    // video, then the first video
    id: 'u-part-new-photos-only',
    run: (doc) => {
      const base = '/media/products/u-part-raw-vietnamese'
      const keep = [`${base}/5.jpg`, `${base}/6.jpg`, `${base}/video2.mp4`, `${base}/video.mp4`]
      for (const p of doc.products) {
        if (p.handle !== 'u-part-raw-vietnamese') continue
        p.media = keep.map((url) => p.media.find((m) => m.url === url)).filter((m): m is NonNullable<typeof m> => Boolean(m))
        p.images = p.images.filter((im) => keep.includes(im.url))
        p.featuredImage = p.images[0] ?? null
      }
    },
  },
  {
    // the owner found the Yaki Body Wave Half-Wig too expensive: 15% off its normal prices, for good
    // (rounded to the dollar; shipping stays included, and the Black Friday sale still applies on top)
    id: 'yaki-15-percent-lower',
    run: (doc) => {
      const lower = (amount: string) => Math.round(Number(amount) * 0.85).toFixed(2)
      for (const p of doc.products) {
        if (p.handle !== 'untitled-jul21_09-54-40') continue
        for (const v of p.variants) v.price = { USD: lower(v.price.USD), CAD: lower(v.price.CAD) }
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
