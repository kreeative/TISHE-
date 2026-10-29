import { HttpError } from './http.js'

// Configuration comes from Vercel → Settings → Environment Variables.

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(`Missing environment variable ${name}`)
    throw new HttpError(503, 'This part of the site is being set up. Please try again shortly.', 'not_configured')
  }
  return value
}

const list = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

export const env = {
  stripeKey: () => required('STRIPE_SECRET_KEY'),
  stripeConfigured: () => Boolean(process.env.STRIPE_SECRET_KEY),
  resendKey: () => process.env.RESEND_API_KEY ?? '',
  // the store's own list in Resend (the account also holds other brands' contacts)
  resendSegment: () => process.env.RESEND_SEGMENT_ID || 'eb1f41b8-5998-406d-8ad9-fa843e4b48e4',
  sessionSecret: () => required('SESSION_SECRET'),
  // who may sign in to the dashboard
  adminEmails: () => list(process.env.ADMIN_EMAILS || 'hello@theivorysukundu.com'),
  // where new-order alerts and the daily digest go
  ownerEmail: () => process.env.OWNER_EMAIL || 'hello@theivorysukundu.com',
  siteUrl: () => (process.env.SITE_URL || 'https://www.theivorysukundu.com').replace(/\/$/, ''),
  emailFrom: () => process.env.EMAIL_FROM || 'The Ivory Sukundu <orders@theivorysukundu.com>',
  replyTo: () => process.env.EMAIL_REPLY_TO || 'hello@theivorysukundu.com',
  cronSecret: () => process.env.CRON_SECRET ?? '',
  gstNumber: () => process.env.GST_NUMBER ?? '',
}
