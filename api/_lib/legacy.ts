import { createHash } from 'node:crypto'

// Customers who ordered on the old Shopify store (July–October 2026), keyed by
// a SHA-256 of their lowercase email so no address is stored in the code.
// They count as returning customers for codes, and their spend counts toward
// their Circle tier.
const LEGACY: Record<string, { orders: number; spend: number }> = {
  f43bfbd98dfe97b33e90f749476481bb1b3e6e517dac5a79d24858b6b0f002ca: { orders: 1, spend: 268.86 },
  '8f89e6eadf8349ad729bb33b6886946bd06fb9c7edca4a5306c27f4b3207ac7d': { orders: 1, spend: 419 },
}

export function legacyCustomer(email: string): { orders: number; spend: number } {
  const key = createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
  return LEGACY[key] ?? { orders: 0, spend: 0 }
}
