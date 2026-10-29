import type { ProductVariant } from './catalog'

// A product photo becomes "shop the model" when its alt text in Shopify ends
// with `Shop the model: <variant title>`, e.g.
//   Sophie wears 3 bundles of 22". Shop the model: 3 Bundles / 22"
// The text before the marker is shown as the photo caption.

export interface ShopTheModel {
  caption: string
  variantTitle: string
}

export function parseShopTheModel(alt: string | null | undefined): ShopTheModel | null {
  const m = alt?.match(/^(.*?)\s*Shop the model:\s*(.+)$/i)
  if (!m) return null
  return { caption: m[1].trim(), variantTitle: m[2].trim() }
}

// Shopify and phones mix straight and curly inch marks, so compare loosely
function normalizeTitle(s: string): string {
  return s.replace(/[“”″]/g, '"').replace(/\s+/g, ' ').trim().toLowerCase()
}

export function findVariantByTitle(variants: ProductVariant[], title: string | null | undefined): ProductVariant | undefined {
  if (!title) return undefined
  const wanted = normalizeTitle(title)
  return variants.find((v) => normalizeTitle(v.title) === wanted)
}

export function selectionOf(variant: ProductVariant): Record<string, string> {
  const s: Record<string, string> = {}
  variant.selectedOptions.forEach((o) => {
    s[o.name] = o.value
  })
  return s
}
