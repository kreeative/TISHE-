import { env } from './env.js'

// Sends email through Resend. When RESEND_API_KEY is missing the message is
// logged and skipped, so a missing key never breaks checkout.

export interface Email {
  to: string | string[]
  subject: string
  html: string
  text: string
  replyTo?: string
  // Resend drops a second send with the same key within 24 hours
  idempotencyKey?: string
  tags?: Record<string, string>
}

export async function sendEmail(email: Email): Promise<boolean> {
  const key = env.resendKey()
  if (!key) {
    console.warn(`RESEND_API_KEY missing, not sending "${email.subject}"`)
    return false
  }
  const headers: Record<string, string> = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
  if (email.idempotencyKey) headers['Idempotency-Key'] = email.idempotencyKey
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      from: env.emailFrom(),
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      reply_to: email.replyTo ?? env.replyTo(),
      tags: email.tags ? Object.entries(email.tags).map(([name, value]) => ({ name, value })) : undefined,
    }),
  })
  if (!res.ok) {
    console.error(`Resend refused "${email.subject}": ${res.status} ${await res.text()}`)
    return false
  }
  return true
}

// Adds an address to the Resend contact list. Resolves true only when the
// contact is new, so the welcome email goes out once per address.
export async function addContact(email: string, source: string): Promise<boolean> {
  const key = env.resendKey()
  if (!key) return false
  const res = await fetch('https://api.resend.com/contacts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, unsubscribed: false, properties: { source } }),
  })
  if (res.ok) return true
  const body = await res.text()
  if (!/already exists/i.test(body)) console.error(`Resend contact for ${source}: ${res.status} ${body}`)
  return false
}

export interface Contact {
  email: string
  createdAt: string
  unsubscribed: boolean
}

export async function listContacts(): Promise<Contact[]> {
  const key = env.resendKey()
  if (!key) return []
  const contacts: Contact[] = []
  let after: string | undefined
  for (let page = 0; page < 10; page++) {
    const url = new URL('https://api.resend.com/contacts')
    url.searchParams.set('limit', '100')
    if (after) url.searchParams.set('after', after)
    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } })
    if (!res.ok) break
    const json = (await res.json()) as {
      data?: { id: string; email: string; created_at: string; unsubscribed: boolean }[]
      has_more?: boolean
    }
    for (const c of json.data ?? []) contacts.push({ email: c.email, createdAt: c.created_at, unsubscribed: c.unsubscribed })
    if (!json.has_more || !json.data?.length) break
    after = json.data[json.data.length - 1].id
  }
  return contacts
}
