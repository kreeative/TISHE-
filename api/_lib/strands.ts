import type { Currency } from './catalog.js'
import { legacyCustomer } from './legacy.js'
import { ordersForEmail, type Order } from './orders.js'

// Circle strands: every US$1 spent earns 1 strand (Canadian dollars count at 1.40),
// and every 200 strands take US$20 (CA$28) off an order, in the bag. Strands spent
// are recorded on the order they were used on; a cancelled or refunded order gives
// back both the strands it earned and the strands it used.

export const STRANDS_PER_REWARD = 200
// what 200 strands take off, in cents
export const REWARD: Record<Currency, number> = { USD: 2000, CAD: 2800 }

export interface Strands {
  earned: number
  used: number
  available: number
}

export function strandsFrom(orders: Order[], legacySpendUsd: number): Strands {
  const counted = orders.filter((o) => o.status !== 'cancelled' && !o.refunded)
  const spend = legacySpendUsd + counted.reduce((n, o) => n + (o.currency === 'CAD' ? o.total / 140 : o.total / 100), 0)
  const earned = Math.floor(spend)
  const used = counted.reduce((n, o) => n + o.strandsUsed, 0)
  return { earned, used, available: Math.max(0, earned - used) }
}

export async function strandsFor(email: string): Promise<Strands> {
  return strandsFrom(await ordersForEmail(email), legacyCustomer(email).spend)
}

export interface StrandsOffer {
  available: number
  // the most this order can take: whole rewards of 200, leaving at least $1 to pay
  usable: number
  amount: number
  applied: boolean
}

// What a member's strands can take off a bag worth `merchandise` cents (after any sale or code).
export function strandsOffer(strands: Strands, merchandise: number, currency: Currency, apply: boolean): StrandsOffer {
  const byBalance = Math.floor(strands.available / STRANDS_PER_REWARD)
  const byOrder = Math.max(0, Math.floor((merchandise - 100) / REWARD[currency]))
  const rewards = Math.min(byBalance, byOrder)
  return {
    available: strands.available,
    usable: rewards * STRANDS_PER_REWARD,
    amount: rewards * REWARD[currency],
    applied: apply && rewards > 0,
  }
}
