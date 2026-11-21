import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { X, Minus, Plus, ShoppingBag } from 'lucide-react'
import { STRIPE_CHECKOUT, useStore } from './StoreContext'
import { ctaGlassOnLight, ctaTracking } from './cta'
import { formatMoney } from '../lib/money'
import { api, ApiError } from '../lib/api'
import { SHIP_COUNTRIES, shippingRate } from '../lib/shipping'
import { STRANDS_PER_REWARD, savedSession } from '../lib/account'

const PREFS_KEY = 'tis-code-prefs'

interface Quote {
  subtotal: number
  discount: number
  shipping: number
  // Canadian orders: GST/HST is added on the checkout page from the address
  taxAtCheckout: boolean
  total: number
  currency: string
  code: { code: string; label: string } | null
  // a signed-in member: her strand balance, what this order can take, and whether it does
  strands: { available: number; usable: number; amount: number; applied: boolean } | null
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
  const { cart, cartLoading, cartError, setLineQty, cartOpen, setCartOpen, checkout, customer, country, setShipTo, shipping } = useStore()
  const lines = cart.lines

  const [prefs] = useState(loadPrefs)
  const [codeInput, setCodeInput] = useState(prefs.code ?? '')
  const [email, setEmail] = useState(prefs.email ?? '')
  const [needEmail, setNeedEmail] = useState(false)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [quoting, setQuoting] = useState(false)
  const [useStrands, setUseStrands] = useState(false)

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
    code: code || undefined,
    email: (email || signedInEmail).trim() || undefined,
    strands: Boolean(customer) && useStrands,
  })
  // the member's session lets the server see her strands
  const session = customer ? savedSession() : null

  const fetchQuote = async (code: string) => {
    if (!STRIPE_CHECKOUT || !lines.length) return
    setQuoting(true)
    setCodeError(null)
    try {
      const items = lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity }))
      setQuote(await api<Quote>('checkout', { action: 'quote', items, ...details(code) }, session))
      setNeedEmail(false)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'email_required') setNeedEmail(true)
      setCodeError(err instanceof Error ? err.message : 'That code could not be applied.')
      // keep showing shipping and totals without the code
      if (code) {
        try {
          const items = lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity }))
          setQuote(await api<Quote>('checkout', { action: 'quote', items, ...details('') }, session))
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
  }, [cartOpen, linesKey, country, useStrands, signedInEmail])

  // strands the bag can't use any more (smaller bag, or none left) are unticked
  const usable = quote?.strands?.usable ?? 0
  useEffect(() => {
    if (quote && usable === 0 && useStrands) setUseStrands(false)
  }, [quote, usable, useStrands])

  // what this order earns: every $1 is a strand (Canadian dollars count at 1.40)
  const earnBase = quote ? quote.total : cart.subtotal
  const strands = Math.floor(cart.currencyCode === 'CAD' ? earnBase / 1.4 : earnBase)

  // every price includes shipping when the store says so
  const rate = shipping.included ? 0 : shippingRate(country, shipping)
  const currency = cart.currencyCode

  const startCheckout = async () => {
    try {
      await checkout({
        code: appliedCode || undefined,
        email: (email || signedInEmail).trim() || undefined,
        strands: Boolean(customer) && useStrands && Boolean(quote?.strands?.applied),
      })
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

                {/* Circle strands: every 500 take $20 (CA$28) off */}
                {customer && quote?.strands ? (
                  quote.strands.usable > 0 ? (
                    <label className="flex items-start gap-3 border border-[#5A3224]/25 px-3 py-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useStrands}
                        onChange={(e) => setUseStrands(e.target.checked)}
                        disabled={quoting}
                        className="mt-1 accent-[#5A3224]"
                      />
                      <span className="flex-1 text-sm leading-snug">
                        <span className="font-medium">Use {quote.strands.usable.toLocaleString()} strands</span>
                        <span className="block text-xs text-[#1B1113]/55 mt-0.5">
                          You have {quote.strands.available.toLocaleString()} strands.
                        </span>
                      </span>
                      <span className="text-sm font-medium whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        −{formatMoney(quote.strands.amount, currency)}
                      </span>
                    </label>
                  ) : (
                    <p className="text-xs text-[#1B1113]/55 leading-relaxed">
                      You have {quote.strands.available.toLocaleString()} strands. Every {STRANDS_PER_REWARD} take{' '}
                      {formatMoney(currency === 'CAD' ? 28 : 20, currency)} off an order.
                    </p>
                  )
                ) : !customer ? (
                  <Link to="/account" className="text-xs text-[#5A3224] underline underline-offset-4">
                    Circle member? Sign in to use your strands
                  </Link>
                ) : null}
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
              {quote?.strands?.applied && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#1B1113]/70">Circle strands ({quote.strands.usable.toLocaleString()})</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>−{formatMoney(quote.strands.amount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[#1B1113]/70">Shipping</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {quote ? (quote.shipping === 0 ? 'Free' : formatMoney(quote.shipping, currency)) : rate !== null ? (rate === 0 ? 'Free' : formatMoney(rate, currency)) : '—'}
                </span>
              </div>
              {quote?.taxAtCheckout && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#1B1113]/70">GST/HST</span>
                  <span className="text-[#1B1113]/55">Added at checkout</span>
                </div>
              )}
              {quote && (
                <div className="flex justify-between text-base font-semibold pt-1">
                  <span>{quote.taxAtCheckout ? 'Total before tax' : 'Total'}</span>
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
