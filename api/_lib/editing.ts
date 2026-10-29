import { randomUUID } from 'node:crypto'
import { HttpError } from './http.js'
import type { CatalogMedia, CatalogProduct, CatalogVariant, Currency, ShippingData } from './catalog.js'
import type { SiteSettings } from './store.js'

// Checks what the dashboard sends before it is saved to the store document.

const ALLOWED_TAGS = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'h3', 'h4'])

// keeps simple formatting and drops everything else (scripts, links, styles)
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<(\/?)([a-z0-9]+)[^>]*>/gi, (_m, slash: string, tag: string) =>
      ALLOWED_TAGS.has(tag.toLowerCase()) ? `<${slash}${tag.toLowerCase()}>` : '',
    )
    .slice(0, 20_000)
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)

const OUR_MEDIA = /^(\/media\/|https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/)/

function price(v: unknown, label: string): string {
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) throw new HttpError(400, `Check the price for ${label}.`)
  return n.toFixed(2)
}

function priceMap(v: unknown, label: string): Record<Currency, string> {
  const m = (v ?? {}) as Record<string, unknown>
  return { USD: price(m.USD, label), CAD: price(m.CAD, label) }
}

export function cleanProduct(raw: Record<string, unknown>, existing: CatalogProduct[]): CatalogProduct {
  const title = String(raw.title ?? '').trim().slice(0, 120)
  if (!title) throw new HttpError(400, 'The product needs a name.')
  const id = String(raw.id ?? '') || `tis-product-${randomUUID()}`
  const previous = existing.find((p) => p.id === id)
  let handle = previous?.handle ?? slug(String(raw.handle ?? '') || title)
  if (!previous) {
    const base = handle || 'product'
    let n = 2
    while (existing.some((p) => p.handle === handle)) handle = `${base}-${n++}`
  }

  const rawVariants = Array.isArray(raw.variants) ? (raw.variants as Record<string, unknown>[]) : []
  if (!rawVariants.length) throw new HttpError(400, 'The product needs at least one option to buy.')
  const variants: CatalogVariant[] = rawVariants.map((v) => {
    const selectedOptions = (Array.isArray(v.selectedOptions) ? (v.selectedOptions as Record<string, unknown>[]) : [])
      .map((o) => ({ name: String(o.name ?? '').trim(), value: String(o.value ?? '').trim() }))
      .filter((o) => o.name && o.value)
    const variantTitle = selectedOptions.map((o) => o.value).join(' / ') || 'Default Title'
    const compare = v.compareAtPrice as Record<string, unknown> | null
    return {
      id: String(v.id ?? '') || `tis-variant-${randomUUID()}`,
      title: variantTitle,
      availableForSale: v.availableForSale !== false,
      price: priceMap(v.price, variantTitle),
      compareAtPrice: compare && (Number(compare.USD) > 0 || Number(compare.CAD) > 0) ? priceMap(compare, `${variantTitle} (was)`) : null,
      selectedOptions: selectedOptions.length ? selectedOptions : [{ name: 'Title', value: 'Default Title' }],
    }
  })
  const titles = new Set<string>()
  for (const v of variants) {
    if (titles.has(v.title)) throw new HttpError(400, `"${v.title}" is listed twice.`)
    titles.add(v.title)
  }

  // option lists follow the variants, in the order values first appear
  const options: { name: string; values: string[] }[] = []
  for (const v of variants) {
    for (const o of v.selectedOptions) {
      let opt = options.find((x) => x.name === o.name)
      if (!opt) options.push((opt = { name: o.name, values: [] }))
      if (!opt.values.includes(o.value)) opt.values.push(o.value)
    }
  }

  const media: CatalogMedia[] = (Array.isArray(raw.media) ? (raw.media as Record<string, unknown>[]) : [])
    .filter((m) => typeof m.url === 'string' && OUR_MEDIA.test(m.url))
    .map((m) => ({
      type: m.type === 'video' ? 'video' : 'image',
      url: String(m.url),
      previewUrl: typeof m.previewUrl === 'string' && OUR_MEDIA.test(m.previewUrl) ? m.previewUrl : String(m.url),
      poster: typeof m.poster === 'string' && OUR_MEDIA.test(m.poster) ? m.poster : null,
      altText: String(m.altText ?? '').trim().slice(0, 300) || null,
    }))
  const images = media.filter((m) => m.type === 'image').map((m) => ({ url: m.url, thumb: m.previewUrl ?? m.url, altText: m.altText }))

  return {
    id,
    title,
    handle,
    supplier: String(raw.supplier ?? previous?.supplier ?? 'nine').slice(0, 40),
    hidden: raw.hidden === true || undefined,
    descriptionHtml: sanitizeHtml(String(raw.descriptionHtml ?? '')),
    tags: previous?.tags ?? [],
    featuredImage: images[0] ?? null,
    images,
    media,
    options,
    variants,
  }
}

export function cleanSite(raw: Record<string, unknown>): SiteSettings {
  const announcements = (Array.isArray(raw.announcements) ? raw.announcements : [])
    .map((a) => String(a).trim().slice(0, 70))
    .filter(Boolean)
    .slice(0, 6)
  const s = raw.sale as Record<string, unknown> | null
  let sale: SiteSettings['sale'] = null
  if (s && String(s.endsAt ?? '')) {
    const endsAt = Date.parse(String(s.endsAt))
    if (Number.isNaN(endsAt)) throw new HttpError(400, 'Check the sale end date.')
    sale = {
      name: String(s.name ?? 'Sale').trim().slice(0, 40) || 'Sale',
      banner: String(s.banner ?? '').trim().slice(0, 60),
      endsAt: new Date(endsAt).toISOString(),
      handles: (Array.isArray(s.handles) ? s.handles : []).map(String).slice(0, 50),
    }
  }
  return { announcements, sale }
}

export function cleanShipping(raw: Record<string, unknown>, current: ShippingData): ShippingData {
  const rates = (raw.rates ?? {}) as Record<string, unknown>
  const amount = (v: unknown, fallback: number) => {
    const n = Number(v)
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : fallback
  }
  return {
    ...current,
    zones: current.zones.map((z) => ({ ...z, rate: amount(rates[z.id], z.rate) })),
  }
}
