import { HttpError, email, handler, json, readBody, str } from './_lib/http.js'
import { addContact } from './_lib/email.js'
import { sendWelcome } from './_lib/notify.js'

// POST { email, source } from the welcome popup and the footer. Adds the
// address to the Circle list and, the first time only, emails WELCOME10.
export default handler(async (request) => {
  const body = await readBody(request)
  const address = email(body.email)
  if (!address) throw new HttpError(400, 'Please enter a valid email address.')
  const isNew = await addContact(address, str(body.source, 40) || 'site')
  if (isNew) await sendWelcome(address)
  return json({ ok: true })
})
