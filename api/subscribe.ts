import { HttpError, email, handler, json, readBody, str } from './_lib/http.js'
import { addContact } from './_lib/email.js'
import { sendWelcome, type WelcomeSale } from './_lib/notify.js'
import { loadStore } from './_lib/store.js'

// POST { email, source } from the welcome popup and the footer. Adds the
// address to the Circle list and, the first time only, sends the welcome email:
// WELCOME10, or the sale while one with a percentage runs.
export default handler(async (request) => {
  const body = await readBody(request)
  const address = email(body.email)
  if (!address) throw new HttpError(400, 'Please enter a valid email address.')
  const isNew = await addContact(address, str(body.source, 40) || 'site')
  if (isNew) await sendWelcome(address, await runningSale())
  return json({ ok: true })
})

async function runningSale(): Promise<WelcomeSale | null> {
  try {
    const sale = (await loadStore()).site.sale
    if (!sale?.percent || !(Date.parse(sale.endsAt) > Date.now())) return null
    const lastDay = new Date(Date.parse(sale.endsAt) - 1).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Toronto',
    })
    return { name: sale.name, percent: sale.percent, lastDay }
  } catch {
    // the store can't be read: the usual welcome email
    return null
  }
}
