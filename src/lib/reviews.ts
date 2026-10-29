import data from '../data/reviews.json'

// Published customer reviews, kept in src/data/reviews.json. Photos live in
// public/media/reviews. "look" links a review to the product and variant the
// customer bought, for the "shop the look" link under it.

export interface Review {
  id: string
  rating: number
  body: string
  // shown as first name and initial, e.g. "Sophie N."
  name: string
  verified: boolean
  createdAt: string
  photos: { thumb: string; full: string }[]
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

const reviews: Review[] = [...data.reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

export const REVIEWS: ReviewSummary = {
  average: reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
  count: reviews.length,
  reviews,
}
