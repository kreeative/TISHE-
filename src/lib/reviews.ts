import { shopifyFetch } from './shopify'

// Judge.me writes every published review into a shop metafield
// (judgeme.reviews_grid). A metafield definition with storefront access makes
// it readable here, so new reviews show up without any change to the site.

export interface Review {
  id: string
  rating: number
  body: string
  name: string
  verified: boolean
  createdAt: string
  photos: { thumb: string; full: string }[]
  // the product the reviewer bought, for a "shop the look" link
  look: ReviewLook | null
}

export interface ReviewLook {
  handle: string
  variant?: string
  label: string
}

export interface ReviewSummary {
  average: number
  count: number
  reviews: Review[]
}

interface JudgemePicture {
  compact?: string
  small?: string
  huge?: string
  original?: string
}

interface JudgemeReview {
  uuid: string
  rating: number
  body?: string
  reviewer_name?: string
  is_anonymous_reviewer?: boolean
  verified_buyer?: boolean
  created_at: string
  pictures_urls?: JudgemePicture[]
  product_url?: string
  product_title?: string
}

// Store reviews are not tied to a product in Judge.me, so the product a
// reviewer bought is added here by review id. Product reviews link on their own.
const REVIEW_LOOKS: Record<string, ReviewLook> = {
  // Sophie N., October 2026: order #1003
  '84559ce9-ab50-4fc9-a1f6-e21345ed81f8': {
    handle: 'burmese-curly-bundles',
    variant: '3 Bundles / 22"',
    label: '3 bundles of 22" Burmese curly',
  },
}

function lookFor(r: JudgemeReview): ReviewLook | null {
  if (REVIEW_LOOKS[r.uuid]) return REVIEW_LOOKS[r.uuid]
  const handle = r.product_url?.match(/\/products\/([^/?#]+)/)?.[1]
  return handle ? { handle, label: r.product_title ?? 'this product' } : null
}

// "Sophie Noutevi" becomes "Sophie N.", the usual way reviews show a name
function displayName(r: JudgemeReview): string {
  if (r.is_anonymous_reviewer || !r.reviewer_name?.trim()) return 'Anonymous'
  const [first, ...rest] = r.reviewer_name.trim().split(/\s+/)
  const last = rest.pop()
  return last ? `${first} ${last[0].toUpperCase()}.` : first
}

let cached: Promise<ReviewSummary> | null = null

export function getReviews(): Promise<ReviewSummary> {
  if (!cached) {
    cached = shopifyFetch<{ shop: { metafield: { value: string } | null } }>(
      `{ shop { metafield(namespace: "judgeme", key: "reviews_grid") { value } } }`,
      undefined,
      { localized: false },
    ).then((data) => {
      const raw = data.shop.metafield?.value
      if (!raw) return { average: 0, count: 0, reviews: [] }
      const grid = JSON.parse(raw)
      const list: JudgemeReview[] = grid?.all_reviews?.reviews ?? []
      return {
        average: Number(grid.average_rating) || 0,
        count: Number(grid.number_of_reviews) || list.length,
        reviews: list.map((r) => ({
          id: r.uuid,
          rating: r.rating,
          body: r.body ?? '',
          name: displayName(r),
          verified: !!r.verified_buyer,
          createdAt: r.created_at,
          photos: (r.pictures_urls ?? [])
            .map((p) => ({
              thumb: p.compact ?? p.small ?? p.original ?? '',
              full: p.huge ?? p.original ?? p.compact ?? '',
            }))
            .filter((p) => p.thumb),
          look: lookFor(r),
        })),
      }
    })
    // a failed fetch should not stick for the rest of the visit
    cached.catch(() => {
      cached = null
    })
  }
  return cached
}
