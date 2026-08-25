// One money formatter for the whole storefront.
//
// en-US is deliberate rather than the visitor's locale: it disambiguates
// non-USD currencies for us (CA$259, £259) instead of printing a bare
// dollar sign that a shopper could read as their own currency.

export function formatMoney(amount: string | number, currencyCode: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(Number(amount))
}

// Rounded form for cards and buttons, where cents are noise.
export function formatMoneyShort(amount: string | number, currencyCode: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(amount))
}
