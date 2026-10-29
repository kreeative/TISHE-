import { HttpError } from './http.js'
import { shippingData, type Currency } from './catalog.js'

// Promo codes, carried over from the Shopify store. Percent codes take the
// percentage off the hair (never off shipping or tax).

export interface CodeRule {
  code: string
  kind: 'percent' | 'free_shipping'
  percent?: number
  // minimum bag, per currency
  minSubtotal?: Record<Currency, number>
  // only for someone who has never ordered before
  firstOrderOnly?: boolean
  // only for someone who has ordered before
  returningOnly?: boolean
  // each email can use it once
  oncePerCustomer?: boolean
  label: string
}

export const CODES: CodeRule[] = [
  { code: 'WELCOME10', kind: 'percent', percent: 10, firstOrderOnly: true, oncePerCustomer: true, label: '10% off your first order' },
  { code: 'KEE10', kind: 'percent', percent: 10, label: '10% off' },
  { code: 'SOBEAUTY10', kind: 'percent', percent: 10, label: '10% off' },
  { code: 'THANKYOU15', kind: 'percent', percent: 15, returningOnly: true, oncePerCustomer: true, label: '15% off, thank you for coming back' },
  {
    code: 'FREESHIP200',
    kind: 'free_shipping',
    minSubtotal: shippingData().freeShippingMinimum,
    firstOrderOnly: true,
    oncePerCustomer: true,
    label: 'free shipping on your first order',
  },
]

export interface History {
  orders: number
  codesUsed: string[]
}

export function findCode(code: string): CodeRule {
  const rule = CODES.find((c) => c.code === code.trim().toUpperCase())
  if (!rule) throw new HttpError(400, "That code isn't valid. Check the spelling and try again.", 'invalid_code')
  return rule
}

export function needsEmail(rule: CodeRule): boolean {
  return Boolean(rule.firstOrderOnly || rule.returningOnly || rule.oncePerCustomer)
}

// Throws a shopper-friendly error when the code can't be used on this order.
export function checkCode(rule: CodeRule, subtotal: number, currency: Currency, history: History | null) {
  const min = rule.minSubtotal?.[currency]
  if (min && subtotal < min) {
    const label = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(min)
    throw new HttpError(400, `${rule.code} needs a bag of ${label} or more.`, 'below_minimum')
  }
  if (!needsEmail(rule)) return
  if (!history) {
    throw new HttpError(400, `Enter the email you'll use at checkout so we can check ${rule.code} for you.`, 'email_required')
  }
  if (rule.oncePerCustomer && history.codesUsed.includes(rule.code)) {
    throw new HttpError(400, `${rule.code} has already been used with this email.`, 'already_used')
  }
  if (rule.firstOrderOnly && history.orders > 0) {
    throw new HttpError(400, `${rule.code} is for first orders only. Welcome back, though!`, 'not_first_order')
  }
  if (rule.returningOnly && history.orders === 0) {
    throw new HttpError(400, `${rule.code} is a thank-you for returning customers. Try WELCOME10 on your first order.`, 'not_returning')
  }
}
