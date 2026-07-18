import { shopifyFetch } from './shopify'

// On-site membership backed by Shopify's customer database.
// Passwords are hashed and stored by Shopify (never by this site);
// the browser only keeps a revocable access token.

export interface CustomerOrder {
  id: string
  name: string
  processedAt: string
  financialStatus: string | null
  fulfillmentStatus: string | null
  total: { amount: string; currencyCode: string }
}

export interface SukunduCustomer {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  createdAt: string
  orders: CustomerOrder[]
}

export interface CustomerToken {
  accessToken: string
  expiresAt: string
}

interface UserError {
  message: string
}

function friendly(errors: UserError[], fallback: string): string {
  const msg = errors.map((e) => e.message).join(' ')
  if (/unidentified customer/i.test(msg)) return 'Email or password is incorrect.'
  if (/taken/i.test(msg)) return 'An account already exists for this email. Try signing in instead.'
  if (/too short/i.test(msg)) return 'Password is too short. Use at least 5 characters.'
  return msg || fallback
}

export async function customerRegister(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
): Promise<CustomerToken> {
  const data = await shopifyFetch<{
    customerCreate: { customer: { id: string } | null; customerUserErrors: UserError[] }
  }>(
    `mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer { id }
        customerUserErrors { message }
      }
    }`,
    { input: { firstName, lastName, email, password, acceptsMarketing: true } },
  )
  if (!data.customerCreate.customer) {
    throw new Error(friendly(data.customerCreate.customerUserErrors, 'Could not create your account.'))
  }
  return customerLogin(email, password)
}

export async function customerLogin(email: string, password: string): Promise<CustomerToken> {
  const data = await shopifyFetch<{
    customerAccessTokenCreate: {
      customerAccessToken: CustomerToken | null
      customerUserErrors: UserError[]
    }
  }>(
    `mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { message }
      }
    }`,
    { input: { email, password } },
  )
  const token = data.customerAccessTokenCreate.customerAccessToken
  if (!token) {
    throw new Error(friendly(data.customerAccessTokenCreate.customerUserErrors, 'Could not sign you in.'))
  }
  return token
}

export async function customerLogout(accessToken: string): Promise<void> {
  try {
    await shopifyFetch(
      `mutation customerAccessTokenDelete($customerAccessToken: String!) {
        customerAccessTokenDelete(customerAccessToken: $customerAccessToken) { deletedAccessToken }
      }`,
      { customerAccessToken: accessToken },
    )
  } catch {
    // token is discarded locally regardless
  }
}

export async function fetchCustomer(accessToken: string): Promise<SukunduCustomer | null> {
  const data = await shopifyFetch<{
    customer: {
      id: string
      firstName: string | null
      lastName: string | null
      email: string
      createdAt: string
      orders: {
        edges: {
          node: {
            id: string
            name: string
            processedAt: string
            financialStatus: string | null
            fulfillmentStatus: string | null
            currentTotalPrice: { amount: string; currencyCode: string }
          }
        }[]
      }
    } | null
  }>(
    `query customer($token: String!) {
      customer(customerAccessToken: $token) {
        id
        firstName
        lastName
        email
        createdAt
        orders(first: 50, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id
              name
              processedAt
              financialStatus
              fulfillmentStatus
              currentTotalPrice { amount currencyCode }
            }
          }
        }
      }
    }`,
    { token: accessToken },
  )
  if (!data.customer) return null
  return {
    id: data.customer.id,
    firstName: data.customer.firstName,
    lastName: data.customer.lastName,
    email: data.customer.email,
    createdAt: data.customer.createdAt,
    orders: data.customer.orders.edges.map(({ node }) => ({
      id: node.id,
      name: node.name,
      processedAt: node.processedAt,
      financialStatus: node.financialStatus,
      fulfillmentStatus: node.fulfillmentStatus,
      total: node.currentTotalPrice,
    })),
  }
}

// Circle rules: every $1 spent earns 1 strand
export const TIER_THRESHOLDS = [
  { name: 'Ivory', min: 0 },
  { name: 'Gold', min: 500 },
  { name: 'Heritage', min: 1200 },
] as const

export function lifetimeSpend(customer: SukunduCustomer): number {
  return customer.orders.reduce((sum, o) => sum + parseFloat(o.total.amount || '0'), 0)
}

export function circleStatus(customer: SukunduCustomer) {
  const spend = lifetimeSpend(customer)
  const strands = Math.floor(spend)
  let tier: (typeof TIER_THRESHOLDS)[number] = TIER_THRESHOLDS[0]
  for (const t of TIER_THRESHOLDS) if (spend >= t.min) tier = t
  const next = TIER_THRESHOLDS.find((t) => t.min > spend) ?? null
  const progress = next ? Math.min(100, Math.round((spend / next.min) * 100)) : 100
  return { spend, strands, tier: tier.name, next: next ? { name: next.name, min: next.min } : null, progress }
}
