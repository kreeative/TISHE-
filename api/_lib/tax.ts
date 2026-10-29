import type Stripe from 'stripe'
import { stripe, SOURCE } from './stripe.js'

// GST/HST charged on orders shipped within Canada, by province. The store is
// registered for GST/HST only (not QST or provincial sales taxes), so Quebec,
// BC, Manitoba and Saskatchewan pay the 5% GST.

export interface ProvinceTax {
  province: string
  label: 'GST' | 'HST'
  percent: number
}

const HST: Record<string, number> = { ON: 13, NB: 15, NL: 15, PE: 15, NS: 14 }

export function provinceTax(province: string): ProvinceTax {
  const hst = HST[province]
  return hst ? { province, label: 'HST', percent: hst } : { province, label: 'GST', percent: 5 }
}

let cache: Stripe.TaxRate[] | null = null

// Finds or creates the Stripe tax rate for a province.
export async function stripeTaxRate(tax: ProvinceTax): Promise<string> {
  const key = `${tax.label}-${tax.province}-${tax.percent}`
  if (!cache) {
    cache = []
    for await (const rate of stripe().taxRates.list({ active: true, limit: 100 })) cache.push(rate)
  }
  const found = cache.find((r) => r.metadata?.tis_key === key)
  if (found) return found.id
  const created = await stripe().taxRates.create({
    display_name: tax.label,
    description: `${tax.label} ${tax.percent}% for ${tax.province}`,
    percentage: tax.percent,
    inclusive: false,
    country: 'CA',
    state: tax.province,
    jurisdiction: `CA - ${tax.province}`,
    tax_type: tax.label === 'HST' ? 'hst' : 'gst',
    metadata: { tis_key: key, source: SOURCE },
  })
  cache.push(created)
  return created.id
}
