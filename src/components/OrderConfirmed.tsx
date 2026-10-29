import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStore } from './StoreContext'
import { api } from '../lib/api'
import { formatMoney } from '../lib/money'
import { trackPurchase } from '../lib/analytics'
import { ctaGlassOnLight, ctaTracking } from './cta'
import Reveal from './Reveal'

interface Confirmed {
  paid: boolean
  number: string | null
  email: string
  firstName: string
  currency: string
  items: { title: string; variant: string; quantity: number; total: number; image: string | null; handle: string; unit: number }[]
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
  code: string
}

const TRACKED_KEY = 'tis-tracked-orders'

// Stripe sends the shopper here after paying: /#/order/confirmed?session_id=cs_…
export default function OrderConfirmed() {
  const { search } = useLocation()
  const sessionId = new URLSearchParams(search).get('session_id') ?? ''
  const { clearCart } = useStore()
  const [order, setOrder] = useState<Confirmed | null>(null)
  const [error, setError] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (!sessionId || started.current) return
    started.current = true
    let tries = 0
    // a card that needs extra checks can take a few seconds to show as paid
    const load = () =>
      api<Confirmed>('order', { sessionId })
        .then((o) => {
          if (!o.paid && tries++ < 5) return void setTimeout(load, 2500)
          setOrder(o)
          if (o.paid) clearCart()
        })
        .catch(() => setError(true))
    load()
  }, [sessionId, clearCart])

  // report the purchase once per order, even if the page is reloaded
  useEffect(() => {
    if (!order?.paid || !order.number) return
    let tracked: string[] = []
    try {
      tracked = JSON.parse(localStorage.getItem(TRACKED_KEY) ?? '[]')
    } catch {
      tracked = []
    }
    if (tracked.includes(order.number)) return
    trackPurchase(
      order.number,
      order.total,
      order.currency,
      order.items.map((i) => ({ id: i.handle, name: `${i.title} ${i.variant}`.trim(), price: i.unit, quantity: i.quantity })),
    )
    try {
      localStorage.setItem(TRACKED_KEY, JSON.stringify([...tracked, order.number].slice(-20)))
    } catch {
      // private mode
    }
  }, [order])

  return (
    <section className="bg-[#FAF7F3] text-[#1B1113] py-16 sm:py-24 px-5 sm:px-10 md:px-16 min-h-[70vh]">
      <div className="max-w-2xl mx-auto">
        {!sessionId || error ? (
          <Reveal>
            <h1 className="font-display text-4xl sm:text-5xl leading-[1.16]">We couldn't find that order</h1>
            <p className="mt-5 text-sm text-[#1B1113]/70 leading-[1.85]">
              If you completed your payment, your confirmation email is on its way. Questions? Write to{' '}
              <a href="mailto:hello@theivorysukundu.com" className="underline underline-offset-4 text-[#5A3224]">
                hello@theivorysukundu.com
              </a>
              .
            </p>
          </Reveal>
        ) : !order ? (
          <p className="text-sm text-[#1B1113]/55">Confirming your payment…</p>
        ) : (
          <>
            <Reveal>
              <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.06em' }}>
                {order.paid && order.number ? `Order #${order.number}` : 'Payment processing'}
              </p>
              <h1 className="font-display text-4xl sm:text-5xl mt-4 leading-[1.16]" style={{ textWrap: 'balance' }}>
                {order.paid ? `Thank you${order.firstName ? `, ${order.firstName}` : ''}` : 'Almost there'}
              </h1>
              <p className="mt-5 text-sm sm:text-base text-[#1B1113]/70 leading-[1.85]">
                {order.paid ? (
                  <>
                    Your order is confirmed and a receipt is on its way to <strong>{order.email}</strong>. Every order is
                    prepared especially for you: allow 5–10 business days before it ships. We'll email you the tracking
                    number as soon as it's on its way.
                  </>
                ) : (
                  <>
                    Your bank is still confirming the payment. You'll get an email at <strong>{order.email}</strong> as
                    soon as it goes through.
                  </>
                )}
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-10 border-t border-[#5A3224]/15 divide-y divide-[#5A3224]/10">
                {order.items.map((i) => (
                  <div key={`${i.handle}-${i.variant}`} className="py-4 flex gap-4">
                    {i.image && <img src={i.image} alt="" className="w-16 h-20 object-cover" />}
                    <div className="flex-1">
                      <p className="font-display text-lg leading-tight">{i.title}</p>
                      <p className="text-xs text-[#1B1113]/50 mt-0.5">
                        {i.variant}
                        {i.quantity > 1 ? ` · Qty ${i.quantity}` : ''}
                      </p>
                    </div>
                    <p className="text-sm font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatMoney(i.total, order.currency)}
                    </p>
                  </div>
                ))}
              </div>
              <dl className="mt-4 flex flex-col gap-1.5 text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <div className="flex justify-between text-[#1B1113]/70">
                  <dt>Subtotal</dt>
                  <dd>{formatMoney(order.subtotal, order.currency)}</dd>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-[#1B1113]/70">
                    <dt>Discount{order.code ? ` (${order.code})` : ''}</dt>
                    <dd>−{formatMoney(order.discount, order.currency)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-[#1B1113]/70">
                  <dt>Shipping</dt>
                  <dd>{order.shipping ? formatMoney(order.shipping, order.currency) : 'Free'}</dd>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between text-[#1B1113]/70">
                    <dt>GST/HST</dt>
                    <dd>{formatMoney(order.tax, order.currency)}</dd>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base pt-1">
                  <dt>Total</dt>
                  <dd>{formatMoney(order.total, order.currency)}</dd>
                </div>
              </dl>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-12 flex flex-wrap items-center gap-6">
                <Link to="/collections" className={ctaGlassOnLight} style={ctaTracking}>
                  Continue Shopping
                </Link>
                <Link
                  to="/account"
                  className="text-xs font-semibold uppercase text-[#5A3224] hover:text-[#1B1113] transition-colors"
                  style={{ letterSpacing: '0.08em' }}
                >
                  See your strands →
                </Link>
              </div>
            </Reveal>
          </>
        )}
      </div>
    </section>
  )
}
