import Stripe from 'stripe'
import { env } from './env.js'

let client: Stripe | null = null

export function stripe(): Stripe {
  if (!client) client = new Stripe(env.stripeKey(), { maxNetworkRetries: 2, appInfo: { name: 'The Ivory Sukundu' } })
  return client
}

// marks every Stripe object this site creates, so other uses of the same
// Stripe account never show up in the dashboard
export const SOURCE = 'tis-web'
