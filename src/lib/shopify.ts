const DOMAIN = import.meta.env.VITE_SHOPIFY_DOMAIN as string | undefined
const TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN as string | undefined
const API_VERSION = '2025-01'

export const shopifyConfigured = Boolean(DOMAIN && TOKEN)

export async function shopifyFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!shopifyConfigured) {
    throw new Error('Shopify is not configured — missing VITE_SHOPIFY_DOMAIN or VITE_SHOPIFY_STOREFRONT_TOKEN')
  }
  const res = await fetch(`https://${DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': TOKEN as string,
    },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join('; '))
  }
  return json.data as T
}

export interface ShopifyMoney {
  amount: string
  currencyCode: string
}

export interface ShopifyVariant {
  id: string
  title: string
  availableForSale: boolean
  price: ShopifyMoney
  selectedOptions: { name: string; value: string }[]
}

export interface ShopifyImage {
  url: string
  altText: string | null
}

export interface ShopifyOption {
  name: string
  values: string[]
}

export interface ShopifyProduct {
  id: string
  title: string
  handle: string
  descriptionHtml: string
  tags: string[]
  featuredImage: ShopifyImage | null
  images: ShopifyImage[]
  options: ShopifyOption[]
  priceRange: { minVariantPrice: ShopifyMoney; maxVariantPrice: ShopifyMoney }
  variants: ShopifyVariant[]
}

const PRODUCT_FIELDS = `
  id
  title
  handle
  descriptionHtml
  tags
  featuredImage { url altText }
  images(first: 8) { edges { node { url altText } } }
  options { name values }
  priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
  variants(first: 50) {
    edges { node { id title availableForSale price { amount currencyCode } selectedOptions { name value } } }
  }
`

function normalizeProduct(node: any): ShopifyProduct {
  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    descriptionHtml: node.descriptionHtml,
    tags: node.tags ?? [],
    featuredImage: node.featuredImage,
    images: (node.images?.edges ?? []).map((e: any) => e.node),
    options: node.options ?? [],
    priceRange: node.priceRange,
    variants: (node.variants?.edges ?? []).map((e: any) => e.node),
  }
}

export async function getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const data = await shopifyFetch<{ product: any }>(
    `query ProductByHandle($handle: String!) {
      product(handle: $handle) { ${PRODUCT_FIELDS} }
    }`,
    { handle }
  )
  return data.product ? normalizeProduct(data.product) : null
}

export async function getProducts(first = 24): Promise<ShopifyProduct[]> {
  const data = await shopifyFetch<{ products: { edges: { node: any }[] } }>(
    `query Products($first: Int!) {
      products(first: $first) {
        edges { node { ${PRODUCT_FIELDS} } }
      }
    }`,
    { first }
  )
  return data.products.edges.map((e) => normalizeProduct(e.node))
}

export interface ShopifyCartLine {
  id: string
  quantity: number
  merchandise: {
    id: string
    title: string
    price: ShopifyMoney
    product: { title: string; featuredImage: { url: string; altText: string | null } | null }
  }
}

export interface ShopifyCart {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: { subtotalAmount: ShopifyMoney; totalAmount: ShopifyMoney }
  lines: ShopifyCartLine[]
}

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  cost { subtotalAmount { amount currencyCode } totalAmount { amount currencyCode } }
  lines(first: 100) {
    edges {
      node {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            price { amount currencyCode }
            product { title featuredImage { url altText } }
          }
        }
      }
    }
  }
`

function normalizeCart(node: any): ShopifyCart {
  return {
    id: node.id,
    checkoutUrl: node.checkoutUrl,
    totalQuantity: node.totalQuantity,
    cost: node.cost,
    lines: (node.lines?.edges ?? []).map((e: any) => e.node),
  }
}

export async function createCart(merchandiseId: string, quantity = 1): Promise<ShopifyCart> {
  const data = await shopifyFetch<{ cartCreate: { cart: any; userErrors: { message: string }[] } }>(
    `mutation CartCreate($lines: [CartLineInput!]!) {
      cartCreate(input: { lines: $lines }) {
        cart { ${CART_FIELDS} }
        userErrors { message }
      }
    }`,
    { lines: [{ merchandiseId, quantity }] }
  )
  if (data.cartCreate.userErrors.length) throw new Error(data.cartCreate.userErrors[0].message)
  return normalizeCart(data.cartCreate.cart)
}

export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  const data = await shopifyFetch<{ cart: any }>(
    `query GetCart($id: ID!) {
      cart(id: $id) { ${CART_FIELDS} }
    }`,
    { id: cartId }
  )
  return data.cart ? normalizeCart(data.cart) : null
}

export async function addCartLine(cartId: string, merchandiseId: string, quantity = 1): Promise<ShopifyCart> {
  const data = await shopifyFetch<{ cartLinesAdd: { cart: any; userErrors: { message: string }[] } }>(
    `mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ${CART_FIELDS} }
        userErrors { message }
      }
    }`,
    { cartId, lines: [{ merchandiseId, quantity }] }
  )
  if (data.cartLinesAdd.userErrors.length) throw new Error(data.cartLinesAdd.userErrors[0].message)
  return normalizeCart(data.cartLinesAdd.cart)
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number): Promise<ShopifyCart> {
  const data = await shopifyFetch<{ cartLinesUpdate: { cart: any; userErrors: { message: string }[] } }>(
    `mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { ${CART_FIELDS} }
        userErrors { message }
      }
    }`,
    { cartId, lines: [{ id: lineId, quantity }] }
  )
  if (data.cartLinesUpdate.userErrors.length) throw new Error(data.cartLinesUpdate.userErrors[0].message)
  return normalizeCart(data.cartLinesUpdate.cart)
}

export async function removeCartLine(cartId: string, lineId: string): Promise<ShopifyCart> {
  const data = await shopifyFetch<{ cartLinesRemove: { cart: any; userErrors: { message: string }[] } }>(
    `mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart { ${CART_FIELDS} }
        userErrors { message }
      }
    }`,
    { cartId, lineIds: [lineId] }
  )
  if (data.cartLinesRemove.userErrors.length) throw new Error(data.cartLinesRemove.userErrors[0].message)
  return normalizeCart(data.cartLinesRemove.cart)
}

// Best-effort marketing signup: creates a customer record flagged as
// accepting marketing so the email shows up in the Shopify admin list.
// Never throws — the welcome popup must succeed for the visitor regardless.
export async function subscribeEmail(email: string): Promise<void> {
  try {
    const password = crypto.randomUUID() + crypto.randomUUID()
    await shopifyFetch(
      `mutation customerCreate($input: CustomerCreateInput!) {
        customerCreate(input: $input) {
          customer { id }
          customerUserErrors { message }
        }
      }`,
      { input: { email, password, acceptsMarketing: true } },
    )
  } catch {
    // ignore — popup UX continues either way
  }
}

// Legal policies, written in Shopify admin (Settings → Policies) and
// rendered on-site so they match the brand.
export interface ShopPolicy {
  title: string
  body: string
}

export async function getPolicies(): Promise<Record<string, ShopPolicy | null>> {
  const data = await shopifyFetch<{
    shop: {
      privacyPolicy: ShopPolicy | null
      refundPolicy: ShopPolicy | null
      shippingPolicy: ShopPolicy | null
      termsOfService: ShopPolicy | null
    }
  }>(`{
    shop {
      privacyPolicy { title body }
      refundPolicy { title body }
      shippingPolicy { title body }
      termsOfService { title body }
    }
  }`)
  return {
    'privacy-policy': data.shop.privacyPolicy,
    'refund-policy': data.shop.refundPolicy,
    'shipping-policy': data.shop.shippingPolicy,
    'terms-of-service': data.shop.termsOfService,
  }
}
