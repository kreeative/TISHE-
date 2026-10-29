import { handler, json } from './_lib/http.js'
import { stripe } from './_lib/stripe.js'
import { processOrder } from './_lib/process.js'

// Stripe calls this when a checkout completes. Instead of checking a signing
// secret, the event is fetched back from Stripe by id: only an event that
// really exists in this account gets processed.
const HANDLED = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded'])

export default handler(async (request) => {
  const posted = (await request.json().catch(() => null)) as { id?: unknown } | null
  if (typeof posted?.id !== 'string' || !posted.id.startsWith('evt_')) return json({ ignored: true }, 400)
  const event = await stripe().events.retrieve(posted.id)
  if (HANDLED.has(event.type)) {
    const session = event.data.object as { id: string; metadata?: Record<string, string> | null }
    if (session.metadata?.source === 'tis-web') await processOrder(session.id)
  }
  return json({ received: true })
})
