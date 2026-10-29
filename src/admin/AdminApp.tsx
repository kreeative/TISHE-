import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  adminApi,
  cents,
  loadAdminSession,
  saveAdminSession,
  shortDate,
  type AdminOrder,
  type AdminSession,
  type OrderStatus,
  type Setup,
  type Stats,
} from './adminApi'
import OrderDetail from './OrderDetail'
import { ProductEditor, ProductList } from './Products'
import Discounts from './Discounts'
import SiteSettings from './SiteSettings'
import { Card, CopyButton, ErrorNote, Stat, StatusChip, field, primary, secondary, tracking } from './ui'

// The owner's dashboard at /#/admin, outside the shop's header and footer.
export default function AdminApp() {
  const [session, setSession] = useState<AdminSession | null>(loadAdminSession)
  const signOut = () => {
    saveAdminSession(null)
    setSession(null)
  }

  if (!session) {
    return (
      <Login
        onSignedIn={(s) => {
          saveAdminSession(s)
          setSession(s)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F3] text-[#1B1113]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <header className="bg-[#1B1113] text-[#FAF7F3]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/admin" className="font-display text-lg sm:text-xl">
            Sukundu · Dashboard
          </Link>
          <div className="flex items-center gap-4 text-xs">
            <a href="#/" className="text-[#FAF7F3]/60 hover:text-[#FAF7F3]">
              View shop
            </a>
            <button onClick={signOut} className="text-[#FAF7F3]/60 hover:text-[#FAF7F3]">
              Sign out
            </button>
          </div>
        </div>
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-6 overflow-x-auto text-xs font-semibold uppercase" style={tracking}>
          {[
            ['/admin', 'Orders'],
            ['/admin/products', 'Products'],
            ['/admin/discounts', 'Promo codes'],
            ['/admin/site', 'Site'],
            ['/admin/customers', 'Customers'],
            ['/admin/subscribers', 'Subscribers'],
            ['/admin/settings', 'Settings'],
          ].map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) =>
                `pb-3 border-b-2 whitespace-nowrap ${isActive ? 'border-[#c99b6f] text-[#FAF7F3]' : 'border-transparent text-[#FAF7F3]/55 hover:text-[#FAF7F3]'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Routes>
          <Route path="orders/:id" element={<OrderDetail token={session.token} />} />
          <Route path="products" element={<ProductList token={session.token} />} />
          <Route path="products/:id" element={<ProductEditor token={session.token} />} />
          <Route path="discounts" element={<Discounts token={session.token} />} />
          <Route path="site" element={<SiteSettings token={session.token} />} />
          <Route path="customers" element={<Customers token={session.token} />} />
          <Route path="subscribers" element={<Subscribers token={session.token} />} />
          <Route path="settings" element={<Settings token={session.token} email={session.email} />} />
          <Route path="*" element={<Orders token={session.token} onExpired={signOut} />} />
        </Routes>
      </main>
    </div>
  )
}

function Login({ onSignedIn }: { onSignedIn: (s: AdminSession) => void }) {
  const { search } = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const loginToken = new URLSearchParams(search).get('login')
  const redeemed = useRef(false)

  useEffect(() => {
    if (!loginToken || redeemed.current) return
    redeemed.current = true
    setBusy(true)
    adminApi
      .redeem(loginToken)
      .then((s) => {
        navigate('/admin', { replace: true })
        onSignedIn(s)
      })
      .catch((e) => {
        setError(e.message)
        navigate('/admin', { replace: true })
      })
      .finally(() => setBusy(false))
  }, [loginToken, navigate, onSignedIn])

  return (
    <div className="min-h-screen bg-[#FAF7F3] text-[#1B1113] flex items-center justify-center px-5" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <div className="w-full max-w-sm">
        <p className="text-xs font-semibold uppercase text-[#5A3224]" style={tracking}>
          The Ivory Sukundu
        </p>
        <h1 className="font-display text-4xl mt-3">Dashboard</h1>
        {sent ? (
          <p className="mt-6 text-sm text-[#1B1113]/75 leading-[1.85]">
            If {email.trim()} has access, a sign-in link is in that inbox now. It expires in 30 minutes.
          </p>
        ) : (
          <form
            className="mt-6 flex flex-col gap-3"
            onSubmit={async (e) => {
              e.preventDefault()
              setBusy(true)
              setError(null)
              try {
                await adminApi.link(email.trim())
                setSent(true)
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not send the link.')
              } finally {
                setBusy(false)
              }
            }}
          >
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className={field} autoComplete="email" />
            <ErrorNote message={error} />
            <button className={primary} style={tracking} disabled={busy}>
              {busy ? 'One moment…' : 'Email me a sign-in link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

type Filter = 'todo' | OrderStatus | 'all'

const FILTERS: [Filter, string][] = [
  ['todo', 'To do'],
  ['shipped', 'Shipped'],
  ['delivered', 'Delivered'],
  ['all', 'All'],
]

function Orders({ token, onExpired }: { token: string; onExpired: () => void }) {
  const [data, setData] = useState<{ orders: AdminOrder[]; stats: Stats; setup: Setup } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('todo')

  const load = useCallback(() => {
    adminApi
      .overview(token)
      .then(setData)
      .catch((e) => {
        if (e.code === 'unauthorized') onExpired()
        else setError(e.message)
      })
  }, [token, onExpired])

  useEffect(load, [load])

  if (error) return <ErrorNote message={error} />
  if (!data) return <p className="text-sm text-[#1B1113]/55">Loading your orders…</p>

  const { orders, stats, setup } = data
  const shown = orders.filter((o) =>
    filter === 'all' ? true : filter === 'todo' ? (o.status === 'new' || o.status === 'ordered') && !o.refunded : o.status === filter,
  )
  const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: stats.currency }).format(n)

  return (
    <div className="flex flex-col gap-6">
      {!setup.stripe && (
        <Card title="Almost ready">
          <p className="text-sm leading-relaxed">
            Stripe isn't connected yet, so there are no orders to show. Add your Stripe secret key in Vercel (see Settings), then come back here.
          </p>
        </Card>
      )}
      {setup.testMode && <ErrorNote message="Stripe is in test mode: these are test orders, not real payments." />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Sales this month" value={money(stats.thisMonth.sales)} hint={`${stats.thisMonth.orders} orders · last month ${money(stats.lastMonth.sales)}`} />
        <Stat label="To order" value={String(stats.todo.toOrder)} hint="Send to your supplier" />
        <Stat label="Awaiting tracking" value={String(stats.todo.awaitingTracking)} hint="Ordered, not shipped yet" />
        <Stat label="Average order" value={money(stats.allTime.average)} hint={`${stats.allTime.orders} orders all time`} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map(([f, label]) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase border whitespace-nowrap ${filter === f ? 'bg-[#1B1113] text-[#FAF7F3] border-[#1B1113]' : 'border-[#1B1113]/20 text-[#1B1113]/65'}`}
              style={tracking}
            >
              {label}
            </button>
          ))}
        </div>
        <button onClick={load} className={secondary} style={tracking}>
          Refresh
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-[#1B1113]/55">{filter === 'todo' ? 'Nothing to do right now.' : 'No orders here yet.'}</p>
      ) : (
        <div className="bg-white border border-[#5A3224]/12 divide-y divide-[#5A3224]/10">
          {shown.map((o) => (
            <Link key={o.id} to={`/admin/orders/${o.id}`} className="flex items-center gap-3 sm:gap-4 px-4 py-3.5 hover:bg-[#FAF7F3]">
              <span className="font-semibold text-sm w-14 shrink-0">#{o.number ?? '…'}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm truncate">{o.name || o.email}</span>
                <span className="block text-xs text-[#1B1113]/50 truncate">
                  {shortDate(o.createdAt)} · {o.summary}
                </span>
              </span>
              <span className="hidden sm:block text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {cents(o.total, o.currency)}
              </span>
              <StatusChip status={o.status} refunded={o.refunded} />
            </Link>
          ))}
        </div>
      )}

      <p className="text-xs text-[#1B1113]/45 leading-relaxed">
        All time: {money(stats.allTime.sales)} in sales before tax · {money(stats.allTime.taxCollected)} GST/HST collected (owed to the CRA) ·{' '}
        {money(stats.allTime.stripeFees)} in Stripe fees.
      </p>
    </div>
  )
}

function Customers({ token }: { token: string }) {
  const [rows, setRows] = useState<{ email: string; name: string; orders: number; spent: number; last: string; country: string }[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    adminApi
      .customers(token)
      .then((r) => setRows(r.customers))
      .catch((e) => setError(e.message))
  }, [token])
  if (error) return <ErrorNote message={error} />
  if (!rows) return <p className="text-sm text-[#1B1113]/55">Loading…</p>
  const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CAD' }).format(n)
  return (
    <Card title={`${rows.length} customers`} action={rows.length ? <CopyButton text={rows.map((r) => r.email).join(', ')} label="Copy emails" /> : undefined}>
      {rows.length === 0 ? (
        <p className="text-sm text-[#1B1113]/55">Your customers will appear here after their first order.</p>
      ) : (
        <div className="divide-y divide-[#5A3224]/10 -mx-1">
          {rows.map((c) => (
            <div key={c.email} className="px-1 py-3 flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
              <span className="text-sm font-semibold">{c.name || c.email}</span>
              <a href={`mailto:${c.email}`} className="text-xs text-[#5A3224]">
                {c.email}
              </a>
              <span className="ml-auto text-xs text-[#1B1113]/55" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {c.orders} {c.orders === 1 ? 'order' : 'orders'} · {money(c.spent)} · last {shortDate(c.last)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function Subscribers({ token }: { token: string }) {
  const [rows, setRows] = useState<{ email: string; createdAt: string; unsubscribed: boolean }[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    adminApi
      .subscribers(token)
      .then((r) => setRows(r.subscribers))
      .catch((e) => setError(e.message))
  }, [token])
  if (error) return <ErrorNote message={error} />
  if (!rows) return <p className="text-sm text-[#1B1113]/55">Loading…</p>
  const active = rows.filter((r) => !r.unsubscribed)
  return (
    <Card title={`${active.length} Circle subscribers`} action={active.length ? <CopyButton text={active.map((r) => r.email).join(', ')} label="Copy emails" /> : undefined}>
      <p className="text-xs text-[#1B1113]/55 mb-4">
        People who joined from the welcome popup or the footer. They received WELCOME10 automatically. To email all of them, create a broadcast in Resend.
      </p>
      <div className="divide-y divide-[#5A3224]/10">
        {rows.map((r) => (
          <div key={r.email} className="py-2.5 flex justify-between gap-3 text-sm">
            <span className={r.unsubscribed ? 'line-through text-[#1B1113]/40' : ''}>{r.email}</span>
            <span className="text-xs text-[#1B1113]/50">{shortDate(r.createdAt)}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Settings({ token, email }: { token: string; email: string }) {
  const [setup, setSetup] = useState<Setup | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    adminApi
      .overview(token)
      .then((r) => setSetup(r.setup))
      .catch((e) => setError(e.message))
  }, [token])

  const item = (ok: boolean, label: string, help: string) => (
    <div className="flex gap-3 py-3">
      <span className={`mt-0.5 w-5 h-5 shrink-0 grid place-items-center text-[11px] font-bold ${ok ? 'bg-[#e3ece4] text-[#2f5a3a]' : 'bg-[#c99b6f] text-[#1B1113]'}`}>
        {ok ? '✓' : '!'}
      </span>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-[#1B1113]/60 leading-relaxed mt-0.5">{help}</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      <ErrorNote message={error} />
      {setup && (
        <Card title="Store setup">
          <div className="divide-y divide-[#5A3224]/10">
            {item(setup.stripe, setup.testMode ? 'Stripe connected (test mode)' : 'Stripe connected', 'Payments go to your Stripe account. The secret key lives in Vercel → Settings → Environment Variables → STRIPE_SECRET_KEY.')}
            {item(setup.webhook, 'Stripe notifications', 'Lets Stripe tell the site the moment an order is paid, so emails go out right away.')}
            {item(setup.resend, 'Emails (Resend)', 'Order confirmations, shipping emails, the welcome code and your new-order alerts.')}
          </div>
          {setup.stripe && !setup.webhook && (
            <button
              className={`${primary} mt-3`}
              style={tracking}
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  const r = await adminApi.setup(token)
                  setSetup({ ...setup, webhook: r.webhook })
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Could not connect.')
                } finally {
                  setBusy(false)
                }
              }}
            >
              Connect Stripe notifications
            </button>
          )}
        </Card>
      )}
      <Card title="Your store assistant">
        <ul className="text-sm leading-relaxed flex flex-col gap-2 list-disc pl-5">
          <li>Every new order: the customer gets a confirmation, and you get an alert with the supplier message ready to paste.</li>
          <li>When you add a tracking number here, the customer gets a shipping email with the tracking link.</li>
          <li>Every morning: if orders are waiting to be sent to a supplier, or have no tracking after five days, you get a to-do email.</li>
          <li>Two weeks after an order ships, the customer is asked for a review and photo, with THANKYOU15 for the next order.</li>
          <li>New Circle subscribers get WELCOME10 by email.</li>
        </ul>
      </Card>
      <p className="text-xs text-[#1B1113]/45">Signed in as {email}.</p>
    </div>
  )
}
