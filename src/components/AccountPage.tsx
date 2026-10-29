import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from './StoreContext'
import { circleStatus, redeemSignInLink, requestSignInLink } from '../lib/account'
import { ctaGlassOnLight, ctaTracking } from './cta'
import Reveal from './Reveal'
import { formatMoney } from '../lib/money'

const inputClass =
  'w-full bg-transparent border border-[#5A3224]/30 px-4 py-3.5 text-sm text-[#1B1113] placeholder:text-[#1B1113]/40 focus:outline-none focus:border-[#5A3224]'

function MemberCard({ name, tier }: { name: string; tier: string }) {
  return (
    <div
      className="relative w-full max-w-xl aspect-[5/3] bg-cover bg-center rounded-[4.2%/7%] overflow-hidden shadow-[0_0_44px_-10px_rgba(27,17,19,0.35)] select-none"
      style={{ backgroundImage: "url('/images/member-card.jpg')" }}
    >
      <p className="absolute right-[7%] top-[9%] text-xs sm:text-sm font-semibold uppercase text-[#3b2318]" style={{ letterSpacing: '0.08em' }}>
        {tier} Member
      </p>
      <p
        className="absolute left-[7%] bottom-[9%] text-sm sm:text-lg font-semibold uppercase text-[#3b2318]"
        style={{ letterSpacing: '0.08em' }}
      >
        {name}
      </p>
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function AccountPage() {
  const { customer, customerLoading, signIn, logout } = useStore()
  const { search } = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // the sign-in email links to /#/account?login=<token>
  const loginToken = new URLSearchParams(search).get('login')
  const redeemed = useRef(false)
  useEffect(() => {
    if (!loginToken || redeemed.current) return
    redeemed.current = true
    setBusy(true)
    redeemSignInLink(loginToken)
      .then((session) => signIn(session))
      .catch((err) => setError(err instanceof Error ? err.message : 'This link has expired. Ask for a new one below.'))
      .finally(() => {
        setBusy(false)
        navigate('/account', { replace: true })
      })
  }, [loginToken, signIn, navigate])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setError(null)
    setBusy(true)
    try {
      await requestSignInLink(email.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (customer) {
    const status = circleStatus(customer)
    const name = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email

    return (
      <section className="bg-[#FAF7F3] text-[#1B1113] py-16 sm:py-24 px-5 sm:px-10 md:px-16 min-h-[70vh]">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.06em' }}>
              The Sukundu Circle
            </p>
            <h1 className="font-display text-4xl sm:text-5xl mt-4 leading-[1.16]">
              Welcome back, {customer.firstName || 'member'}
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-10">
              <MemberCard name={name} tier={status.tier} />
            </div>
          </Reveal>

          {/* strands + tier progress */}
          <Reveal delay={0.18}>
            <div className="mt-10 max-w-xl">
              <p className="font-display text-4xl" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {status.strands.toLocaleString()}
                <span className="text-lg text-[#5A3224] ml-2">strands</span>
              </p>
              <p className="mt-1 mb-5 text-xs text-[#1B1113]/50">
                Every $1 spent earns 1 strand. 200 strands is $20 off your next order.
              </p>
              {status.next ? (
                <>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold">{status.tier}</span>
                    <span className="text-[#1B1113]/55">
                      {formatMoney(Math.max(0, status.next.min - status.spend), 'USD')} to {status.next.name}
                    </span>
                  </div>
                  <div className="mt-2 h-1 bg-[#5A3224]/15 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#5A3224] to-[#c99b6f]"
                      initial={{ width: 0 }}
                      animate={{ width: `${status.progress}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#5A3224] font-semibold">
                  Heritage member. The highest honor we have.
                </p>
              )}
            </div>
          </Reveal>

          {/* orders */}
          <Reveal delay={0.24}>
            <div className="mt-14">
              <h2 className="font-display text-2xl">Your orders</h2>
              {customer.orders.length === 0 ? (
                <p className="mt-4 text-sm text-[#1B1113]/65 leading-[1.85]">
                  No orders yet. Your strands start counting with your first one.
                </p>
              ) : (
                <div className="mt-5 divide-y divide-[#5A3224]/12 border-t border-b border-[#5A3224]/12">
                  {customer.orders.map((o) => (
                    <div key={o.number} className="py-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                      <span className="font-semibold text-sm w-20">{o.number}</span>
                      <span className="text-sm text-[#1B1113]/55">{formatDate(o.date)}</span>
                      <span className="text-sm text-[#1B1113]/55">{o.status}</span>
                      <span className="ml-auto text-sm font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatMoney(o.total, o.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mt-12 flex flex-wrap items-center gap-6">
              <a href="#/collections" className={ctaGlassOnLight} style={ctaTracking}>
                Continue Shopping
              </a>
              <button
                onClick={logout}
                className="text-xs font-medium text-[#1B1113]/45 hover:text-[#5A3224] uppercase transition-colors"
                style={{ letterSpacing: '0.08em' }}
              >
                Sign out
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-[#FAF7F3] text-[#1B1113] py-16 sm:py-24 px-5 sm:px-10 md:px-16 min-h-[70vh]">
      <div className="max-w-md mx-auto">
        <Reveal>
          <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.06em' }}>
            The Sukundu Circle
          </p>
          <h1 className="font-display text-4xl sm:text-5xl mt-4 leading-[1.16]">Your account</h1>
          <p className="mt-5 text-sm text-[#1B1113]/70 leading-[1.85]">
            No password to remember. Enter the email you order with and we'll send you a link that signs you in
            to see your member card, strands and orders.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          {sent ? (
            <div className="mt-10 border-t border-[#5A3224]/15 pt-6">
              <p className="text-sm text-[#1B1113]/75 leading-[1.85]">
                Check your inbox. If <strong>{email.trim()}</strong> is on file, a sign-in link is on its way. It expires in
                30 minutes. Not there? Look in your spam folder.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-xs font-medium text-[#1B1113]/50 hover:text-[#5A3224] underline underline-offset-4 transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form className="flex flex-col gap-4 mt-10" onSubmit={submit}>
              <label className="sr-only" htmlFor="acc-email">Email</label>
              <input
                id="acc-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className={inputClass}
                autoComplete="email"
              />
              {error && <p className="text-sm text-[#8a2d1f] leading-relaxed">{error}</p>}
              <button
                type="submit"
                disabled={busy || customerLoading}
                className={`${ctaGlassOnLight} w-full mt-2 disabled:opacity-50`}
                style={ctaTracking}
              >
                {busy ? 'One moment…' : 'Email Me a Sign-in Link'}
              </button>
            </form>
          )}

          <p className="mt-6 text-[11px] text-[#1B1113]/45 leading-relaxed">
            Your account is created with your first order. Membership is free: every $1 you spend earns a
            strand, and strands unlock the Gold and Heritage tiers.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
