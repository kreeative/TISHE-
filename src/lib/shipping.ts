import data from '../data/shipping.json'
import type { Currency } from './catalog'

// Flat shipping rates by zone, shared with the checkout API (which charges
// from the same file). Each zone also sets the currency: CAD for Canada,
// USD everywhere else.

export const SHIPPING = data

export type ShippingData = typeof data

export interface ShipCountry {
  code: string
  name: string
}

const names = new Intl.DisplayNames(['en'], { type: 'region' })

export const SHIP_COUNTRIES: ShipCountry[] = data.zones
  .flatMap((z) => z.countries.map((code) => ({ code, name: names.of(code) ?? code })))
  .sort((a, b) => (a.code === 'CA' ? -1 : b.code === 'CA' ? 1 : a.name.localeCompare(b.name)))

export const PROVINCES = data.provinces

function zoneOf(country: string) {
  return data.zones.find((z) => z.countries.includes(country))
}

export function shipsTo(country: string): boolean {
  return Boolean(zoneOf(country))
}

export function currencyFor(country: string): Currency {
  return zoneOf(country)?.currency === 'CAD' ? 'CAD' : 'USD'
}

// rates come from the live settings when given (they're edited in the dashboard)
export function shippingRate(country: string, live: ShippingData = data): number | null {
  return live.zones.find((z) => z.countries.includes(country))?.rate ?? null
}

const CANADIAN_ZONES = /^America\/(Toronto|Montreal|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Moncton|Glace_Bay|Goose_Bay|Whitehorse|Dawson|Dawson_Creek|Creston|Fort_Nelson|Yellowknife|Iqaluit|Rankin_Inlet|Resolute|Cambridge_Bay|Inuvik|Swift_Current|Atikokan|Blanc-Sablon|Nipigon|Thunder_Bay|Rainy_River)$/

// A first guess at the shopper's country, before the server's answer arrives.
// The time zone beats the browser language: many Canadians browse in en-US.
export function guessCountry(): string {
  try {
    if (CANADIAN_ZONES.test(Intl.DateTimeFormat().resolvedOptions().timeZone)) return 'CA'
    const region = new Intl.Locale(navigator.language).maximize().region
    if (region && shipsTo(region)) return region
  } catch {
    // older browsers: fall through
  }
  return 'US'
}
