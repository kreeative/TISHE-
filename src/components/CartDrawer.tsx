import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { X, Minus, Plus, ShoppingBag } from 'lucide-react'
import { STRIPE_CHECKOUT, useStore } from './StoreContext'
import { ctaGlassOnLight, ctaTracking } from './cta'
import { formatMoney } from '../lib/money'
import { api, ApiError } from '../lib/api'
import { PROVINCES, SHIP_COUNTRIES, shippingRate } from '../lib/shipping'

const PREFS_KEY = 'tis-code-prefs'

interface Quote {
  subtotal: number
  discount: number
  shipping: number
  tax: number
  taxLabel: string
  total: number
  currency: string
  code: { code: string; label: string } | null
}

function loadPrefs(): { code?: string; email?: string } {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

const fieldClass =
  'w-full bg-transparent border border-[#5A3224]/30 px-3 py-2.5 text-sm text-[#1B1113] placeholder:text-[#1B1113]/40 focus:outline-none focus:border-[#5A3224]'
const labelClass = 'block text-[10px] font-semibold uppercase text-[#1B1113]/55 mb-1.5'

export default function CartDrawer() {
  const { cart, cartLoading, cartError, setLineQty, cartOpen, setCartOpen, checkout, customer, country, province, setShipTo, shipping } =
    useStore()
  const lines = cart.lines
  const strands = Math.round(cart.subtotal)

  const [prefs] = useState(loadPrefs)
  const [codeInput, setCodeInput] = useState(prefs.code ?? '')
  const [email, setEmail] = useState(prefs.email ?? '')
  const [needEmail, setNeedEmail] = useState(false)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [quoting, setQuoting] = useState(false)

  // close the bag when the shopper follows a link to another page
  const { pathname } = useLocation()
  useEffect(() => {
    setCartOpen(false)
  }, [pathname, setCartOpen])

  const appliedCode = quote?.code?.code ?? ''
  const signedInEmail = customer?.email ?? ''

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ code: appliedCode, email }))
    } catch {
      // private mode
    }
  }, [appliedCode, email])

  const details = (code: string) => ({
    country,
    province: country === 'CA' ? province : undefined,
    code: code || undefined,
    email: (email || signedInEmail).trim() || undefined,
  })

  const fetchQuote = async (code: string) => {
    if (!STRIPE_CHECKOUT || !lines.length) return
    setQuoting(true)
    setCodeError(null)
    try {
      const items = lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity }))
      setQuote(await api<Quote>('checkout', { action: 'quote', items, ...details(code) }))
      setNeedEmail(false)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'email_required') setNeedEmail(true)
      setCodeError(err instanceof Error ? err.message : 'That code could not be applied.')
      // keep showing shipping and totals without the code
      if (code) {
        try {
          const items = lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity }))
          setQuote(await api<Quote>('checkout', { action: 'quote', items, ...details('') }))
        } catch {
          setQuote(null)
        }
      }
    } finally {
      setQuoting(false)
    }
  }

  // re-price when the bag, destination or code changes while the bag is open
  const linesKey = lines.map((l) => `${l.variantId}x${l.quantity}`).join(',')
  useEffect(() => {
    if (cartOpen && lines.length) void fetchQuote(appliedCode || codeInput.trim())
  }, [cartOpen, linesKey, country, province])

  const rate = shippingRate(country, shipping)
  const currency = cart.currencyCode

  const startCheckout = async () => {
    try {
      await checkout({ code: appliedCode || undefined, email: (email || signedInEmail).trim() || undefined })
    } catch (err) {
      if (err instanceof ApiError && err.code === 'email_required') setNeedEmail(true)
    }
  }

  return (
    <>
      {cartOpen && (
        <button
          aria-label="Close bag"
          className="fixed inset-0 z-[110] bg-[#1B1113]/40 backdrop-blur-sm cursor-default"
          onClick={() => setCartOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-[120] w-full sm:w-[420px] bg-[#FAF7F3] text-[#1B1113] border-l border-[#5A3224]/15 flex flex-col transition-transform duration-500 ease-out ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!cartOpen}
      >
        <div className="flex items-center justify-between p-6 border-b border-[#5A3224]/15">
          <h2 className="font-display text-2xl">Your Bag</h2>
          <button
            onClick={() => setCartOpen(false)}
            aria-label="Close"
            className="text-[#1B1113]/60 hover:text-[#5A3224] transition-colors"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        {cartError && (
          <p className="mx-6 mt-4 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2">{cartError}</p>
        )}

        {lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-[#1B1113]/55 px-8 text-center">
            <ShoppingBag size={32} strokeWidth={1.5} />
            <p className="text-sm leading-[1.85]">Your bag is empty. The half-wig edit is waiting.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {lines.map((line) => (
              <div key={line.variantId} className="flex gap-4">
                {line.product.featuredImage && (
                  <img
                    src={line.product.featuredImage.thumb}
                    alt={line.product.featuredImage.altText ?? line.product.title}
                    className="w-20 h-24 object-cover"
                  />
                )}
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg leading-tight">{line.product.title}</h3>
                      {line.variant.title !== 'Default Title' && (
                        <p className="text-xs text-[#1B1113]/50 mt-0.5">{line.variant.title}</p>
                      )}
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatMoney(line.lineTotal, line.variant.price.currencyCode)}
                    </span>
                  </div>
                  <div className="mt-auto flex items-center gap-3">
                    <button
                      onClick={() => setLineQty(line.variantId, line.quantity - 1)}
                      disabled={cartLoading}
                      aria-label={`Decrease ${line.product.title} quantity`}
                      className="p-1.5 border border-[#5A3224]/30 text-[#1B1113]/70 hover:border-[#5A3224] hover:text-[#5A3224] transition-colors disabled:opacity-40"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm w-4 text-center font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>{line.quantity}</span>
                    <button
                      onClick={() => setLineQty(line.variantId, line.quantity + 1)}
                      disabled={cartLoading}
                      aria-label={`Increase ${line.product.title} quantity`}
                      className="p-1.5 border border-[#5A3224]/30 text-[#1B1113]/70 hover:border-[#5A3224] hover:text-[#5A3224] transition-colors disabled:opacity-40"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => setLineQty(line.variantId, 0)}
                      disabled={cartLoading}
                      className="ml-auto text-xs font-medium text-[#1B1113]/50 hover:text-[#5A3224] uppercase transition-colors disabled:opacity-40"
                      style={{ letterSpacing: '0.08em' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {STRIPE_CHECKOUT && (
              <div className="border-t border-[#5A3224]/15 pt-6 flex flex-col gap-4">
                <div className={country === 'CA' ? 'grid grid-cols-2 gap-3' : ''}>
                  <div>
                    <label htmlFor="ship-country" className={labelClass} style={{ letterSpacing: '0.08em' }}>
                      Ship to
                    </label>
                    <select id="ship-country" value={country} onChange={(e) => setShipTo(e.target.value)} className={fieldClass}>
                      {SHIP_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {country === 'CA' && (
                    <div>
                      <label htmlFor="ship-province" className={labelClass} style={{ letterSpacing: '0.08em' }}>
                        Province
                      </label>
                      <select id="ship-province" value={province} onChange={(e) => setShipTo(country, e.target.value)} className={fieldClass}>
                        {PROVINCES.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void fetchQuote(codeInput.trim())
                  }}
                  className="flex flex-col gap-2"
                >
                  <label htmlFor="promo-code" className={labelClass} style={{ letterSpacing: '0.08em' }}>
                    Promo code
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="promo-code"
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      autoComplete="off"
                      className={`${fieldClass} uppercase`}
                    />
                    <button
                      type="submit"
                      disabled={quoting || !codeInput.trim()}
                      className="shrink-0 border border-[#1B1113] px-4 text-xs font-semibold uppercase hover:bg-[#1B1113] hover:text-[#FAF7F3] transition-colors disabled:opacity-40"
                      style={{ letterSpacing: '0.08em' }}
                    >
                      Apply
                    </button>
                  </div>
                  {needEmail && !signedInEmail && (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email you'll use at checkout"
                      autoComplete="email"
                      className={fieldClass}
                    />
                  )}
                  {codeError && <p className="text-xs text-[#8a2d1f] leading-relaxed">{codeError}</p>}
                  {quote?.code && !codeError && (
                    <p className="text-xs text-[#5A3224] font-medium">
                      {quote.code.code} applied · {quote.code.label}
                    </p>
                  )}
                </form>
              </div>
            )}
          </div>
        )}

        <div className="p-6 border-t border-[#5A3224]/15 flex flex-col gap-3">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-[#1B1113]/70">Subtotal</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(cart.subtotal, currency)}</span>
          </div>
          {STRIPE_CHECKOUT && lines.length > 0 && (
            <>
              {quote && quote.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#1B1113]/70">Discount</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>−{formatMoney(quote.discount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[#1B1113]/70">Shipping</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {quote ? (quote.shipping === 0 ? 'Free' : formatMoney(quote.shipping, currency)) : rate !== null ? formatMoney(rate, currency) : '—'}
                </span>
              </div>
              {quote && quote.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#1B1113]/70">{quote.taxLabel}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.tax, currency)}</span>
                </div>
              )}
              {quote && (
                <div className="flex justify-between text-base font-semibold pt-1">
                  <span>Total</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.total, currency)}</span>
                </div>
              )}
              {country !== 'CA' && (
                <p className="text-[11px] text-[#1B1113]/50 leading-relaxed">
                  Import duties or VAT, if your country charges them, are collected by the courier on delivery.
                </p>
              )}
            </>
          )}
          {strands > 0 && (
            <p className="text-xs font-semibold text-[#5A3224]" style={{ letterSpacing: '0.08em' }}>
              CIRCLE MEMBERS EARN {strands} STRANDS ON THIS ORDER
            </p>
          )}
          <button
            className={`${ctaGlassOnLight} w-full mt-1 disabled:opacity-50`}
            style={ctaTracking}
            disabled={!lines.length || cartLoading}
            onClick={() => void startCheckout()}
          >
            {cartLoading ? 'One moment…' : 'Checkout'}
          </button>
        </div>
      </aside>
    </>
  )
}
