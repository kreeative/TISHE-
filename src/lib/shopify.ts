// Temporary bridge while payments move to Stripe: until VITE_CHECKOUT is set
// to "stripe", the bag is sent to Shopify's checkout as before. Delete this
// file once Shopify is closed.

const DOMAIN = import.meta.env.VITE_SHOPIFY_DOMAIN as string | undefined
const TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN as string | undefined

export const shopifyConfigured = Boolean(DOMAIN && TOKEN)

export async function shopifyCheckoutUrl(lines: { variantId: string; quantity: number }[]): Promise<string> {
  if (!shopifyConfigured) throw new Error('Checkout is not available right now. Please try again shortly.')
  const res = await fetch(`https://${DOMAIN}/api/2025-01/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': TOKEN as string },
    body: JSON.stringify({
      query: `mutation CartCreate($lines: [CartLineInput!]!) {
        cartCreate(input: { lines: $lines }) { cart { checkoutUrl } userErrors { message } }
      }`,
      variables: { lines: lines.map((l) => ({ merchandiseId: l.variantId, quantity: l.quantity })) },
    }),
  })
  const json = await res.json()
  const result = json.data?.cartCreate
  if (!result?.cart) throw new Error(result?.userErrors?.[0]?.message ?? 'Could not start checkout.')
  return result.cart.checkoutUrl
}
