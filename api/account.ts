import { HttpError, bearer, email, handler, json, readBody, str } from './_lib/http.js'
import { env } from './_lib/env.js'
import { issueToken, verifyToken } from './_lib/tokens.js'
import { STATUS_LABELS, ordersForEmail } from './_lib/orders.js'
import { legacyCustomer } from './_lib/legacy.js'
import { sendSignInLink } from './_lib/notify.js'

// Sukundu Circle accounts, without passwords.
//   link   { email }  → emails a sign-in link if this email has ordered
//   redeem { token }  → swaps the link's token for a 30-day session
//   me     (Bearer session) → name, orders and legacy spend
export default handler(async (request) => {
  const body = await readBody(request)
  const action = str(body.action)

  if (action === 'link') {
    const address = email(body.email)
    if (!address) throw new HttpError(400, 'Please enter a valid email address.')
    const known = legacyCustomer(address).orders > 0 || (await ordersForEmail(address)).length > 0
    if (known) {
      const { token } = issueToken(address, 'login', 120)
      await sendSignInLink(address, `${env.siteUrl()}/#/account?login=${token}`, false, '2 hours')
    }
    // same answer either way, so the form can't be used to test who has ordered
    return json({ ok: true })
  }

  if (action === 'redeem') {
    const address = verifyToken(str(body.token, 1000), 'login')
    return json(issueToken(address, 'session', 60 * 24 * 30))
  }

  if (action === 'me') {
    const address = verifyToken(bearer(request), 'session')
    const orders = await ordersForEmail(address)
    const latest = orders[0]
    const [firstName, ...rest] = (latest?.name ?? '').split(/\s+/).filter(Boolean)
    return json({
      email: address,
      firstName: firstName ?? null,
      lastName: rest.join(' ') || null,
      legacySpend: legacyCustomer(address).spend,
      orders: orders
        .filter((o) => o.status !== 'cancelled' && !o.refunded)
        .map((o) => ({
          number: o.number ? `#${o.number}` : 'Processing',
          date: o.createdAt,
          total: o.total / 100,
          currency: o.currency,
          status: STATUS_LABELS[o.status],
        })),
    })
  }

  throw new HttpError(400, 'Unknown action')
})
