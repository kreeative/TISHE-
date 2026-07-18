import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from './StoreContext'
import { circleStatus, customerRecover } from '../lib/customer'
import { ctaGlassOnLight, ctaTracking } from './cta'
import PasswordInput from './PasswordInput'
import Reveal from './Reveal'

const inputClass =
  'w-full bg-transparent border border-[#5A3224]/30 px-4 py-3.5 text-sm text-[#1B1113] placeholder:text-[#1B1113]/40 focus:outline-none focus:border-[#5A3224]'

function MemberCard({ name, tier, strands }: { name: string; tier: string; strands: number }) {
  return (
    <div
      className="relative w-full max-w-xl aspect-[5/3] bg-cover bg-center rounded-[4.2%/7%] overflow-hidden shadow-[0_0_44px_-10px_rgba(27,17,19,0.35)] select-none"
      style={{ backgroundImage: "url('/images/member-card.jpg')" }}
    >
      <p className="absolute right-[7%] top-[9%] font-display italic text-lg sm:text-2xl text-[#3b2318]">
        {tier} Member
      </p>
      <div className="absolute left-[7%] bottom-[9%]">
        <p className="text-sm sm:text-lg font-semibold uppercase text-[#3b2318]" style={{ letterSpacing: '0.08em' }}>
          {name}
        </p>
      </div>
      <div className="absolute right-[7%] bottom-[9%] text-right">
        <p className="font-display text-lg sm:text-2xl text-[#3b2318]" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {strands.toLocaleString()} strands
        </p>
      </div>
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatMoney(amount: string, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(parseFloat(amount))
}

export default function AccountPage() {
  const { customer, customerLoading, login, register, logout } = useStore()
  const [tab, setTab] = useState<'signin' | 'create'>('signin')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [recoverMode, setRecoverMode] = useState(false)
  const [recoverSent, setRecoverSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (tab === 'create') await register(firstName.trim(), lastName.trim(), email.trim(), password)
      else await login(email.trim(), password)
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
              <MemberCard name={name} tier={status.tier} strands={status.strands} />
            </div>
          </Reveal>

          {/* tier progress */}
          <Reveal delay={0.18}>
            <div className="mt-10 max-w-xl">
              {status.next ? (
                <>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold">{status.tier}</span>
                    <span className="text-[#1B1113]/55">
                      {formatMoney(String(Math.max(0, status.next.min - status.spend)), 'USD')} to {status.next.name}
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
                    <div key={o.id} className="py-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                      <span className="font-semibold text-sm w-20">{o.name}</span>
                      <span className="text-sm text-[#1B1113]/55">{formatDate(o.processedAt)}</span>
                      <span className="text-sm text-[#1B1113]/55 capitalize">
                        {(o.fulfillmentStatus || 'processing').toLowerCase().replace(/_/g, ' ')}
                      </span>
                      <span className="ml-auto text-sm font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatMoney(o.total.amount, o.total.currencyCode)}
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
                onClick={() => void logout()}
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
          <h1 className="font-display text-4xl sm:text-5xl mt-4 leading-[1.16]">
            {tab === 'signin' ? 'Welcome back' : 'Join the Circle'}
          </h1>
          <p className="mt-5 text-sm text-[#1B1113]/70 leading-[1.85]">
            {tab === 'signin'
              ? 'Sign in to see your member card, strands, and orders.'
              : 'Free forever. Earn a strand for every dollar, unlock tiers, and keep your card on file.'}
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="flex gap-8 mt-10 border-b border-[#5A3224]/15">
            {(['signin', 'create'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t)
                  setError(null)
                }}
                className={`pb-3 -mb-px text-xs font-semibold uppercase whitespace-nowrap transition-colors border-b-2 ${
                  tab === t
                    ? 'border-[#5A3224] text-[#1B1113]'
                    : 'border-transparent text-[#1B1113]/50 hover:text-[#1B1113]/80'
                }`}
                style={{ letterSpacing: '0.08em' }}
              >
                {t === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form className="flex flex-col gap-4 mt-8" onSubmit={submit}>
            {tab === 'create' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="sr-only" htmlFor="acc-first">First name</label>
                  <input id="acc-first" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className={inputClass} autoComplete="given-name" />
                </div>
                <div>
                  <label className="sr-only" htmlFor="acc-last">Last name</label>
                  <input id="acc-last" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className={inputClass} autoComplete="family-name" />
                </div>
              </div>
            )}
            <label className="sr-only" htmlFor="acc-email">Email</label>
            <input id="acc-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className={inputClass} autoComplete="email" />
            <PasswordInput
              id="acc-pass"
              value={password}
              onChange={setPassword}
              placeholder="Password"
              autoComplete={tab === 'create' ? 'new-password' : 'current-password'}
            />

            {error && <p className="text-sm text-[#8a2d1f] leading-relaxed">{error}</p>}

            <button type="submit" disabled={busy || customerLoading} className={`${ctaGlassOnLight} w-full mt-2 disabled:opacity-50`} style={ctaTracking}>
              {busy ? 'One moment…' : tab === 'signin' ? 'Sign In' : 'Create My Account'}
            </button>

            {tab === 'signin' && (
              <button
                type="button"
                onClick={() => {
                  setRecoverMode(true)
                  setRecoverSent(false)
                  setError(null)
                }}
                className="self-start text-xs font-medium text-[#1B1113]/50 hover:text-[#5A3224] underline underline-offset-4 transition-colors"
              >
                Forgot your password?
              </button>
            )}
          </form>

          {recoverMode && (
            <div className="mt-8 border-t border-[#5A3224]/15 pt-6">
              {recoverSent ? (
                <p className="text-sm text-[#1B1113]/70 leading-[1.85]">
                  If an account exists for that email, a reset link is on its way. Check your inbox
                  (and spam folder), follow the link to choose a new password, then come back here to
                  sign in.
                </p>
              ) : (
                <form
                  className="flex flex-col gap-4"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!email.trim()) return
                    setBusy(true)
                    await customerRecover(email.trim())
                    setBusy(false)
                    setRecoverSent(true)
                  }}
                >
                  <p className="text-sm text-[#1B1113]/70 leading-[1.85]">
                    Enter your email and we'll send you a secure link to choose a new password.
                  </p>
                  <label className="sr-only" htmlFor="recover-email">Email</label>
                  <input
                    id="recover-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className={inputClass}
                    autoComplete="email"
                  />
                  <button type="submit" disabled={busy} className={`${ctaGlassOnLight} w-full disabled:opacity-50`} style={ctaTracking}>
                    {busy ? 'Sending…' : 'Send Reset Link'}
                  </button>
                </form>
              )}
            </div>
          )}

          <p className="mt-6 text-[11px] text-[#1B1113]/45 leading-relaxed">
            Your password is encrypted and stored by our secure commerce provider. We never see or
            keep it ourselves.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
