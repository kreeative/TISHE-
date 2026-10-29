import { useEffect, useState } from 'react'
import { storeApi, type StoreDoc } from './adminApi'
import { Card, ErrorNote, field, primary, secondary, tracking } from './ui'

// datetime-local wants "yyyy-mm-ddThh:mm" in local time
function localInput(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(+d)) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function SiteSettings({ token }: { token: string }) {
  const [doc, setDoc] = useState<StoreDoc | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [messages, setMessages] = useState<string[]>([])
  const [saleOn, setSaleOn] = useState(false)
  const [saleName, setSaleName] = useState('')
  const [saleBanner, setSaleBanner] = useState('')
  const [saleEnds, setSaleEnds] = useState('')
  const [saleHandles, setSaleHandles] = useState<string[]>([])
  const [rates, setRates] = useState<Record<string, string>>({})

  useEffect(() => {
    storeApi
      .load(token)
      .then(({ doc: d }) => {
        setDoc(d)
        setMessages(d.site.announcements)
        const sale = d.site.sale
        setSaleOn(Boolean(sale && Date.parse(sale.endsAt) > Date.now()))
        setSaleName(sale?.name ?? 'The Winter Sale')
        setSaleBanner(sale?.banner ?? '')
        setSaleEnds(sale ? localInput(sale.endsAt) : '')
        setSaleHandles(sale?.handles ?? [])
        setRates(Object.fromEntries(d.shipping.zones.map((z) => [z.id, String(z.rate)])))
      })
      .catch((e) => setError(e.message))
  }, [token])

  if (!doc) return error ? <ErrorNote message={error} /> : <p className="text-sm text-[#1B1113]/55">Loading…</p>

  const run = async (fn: () => Promise<{ doc: StoreDoc }>, done: string) => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      setDoc((await fn()).doc)
      setNotice(done)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  const saveSite = () =>
    run(
      () =>
        storeApi.saveSite(token, {
          announcements: messages,
          sale:
            saleOn && saleEnds
              ? { name: saleName, banner: saleBanner, endsAt: new Date(saleEnds).toISOString(), handles: saleHandles }
              : null,
        }),
      'Saved. The site shows it within a minute.',
    )

  const label = 'text-xs font-semibold text-[#1B1113]/60'

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-3xl">Site</h1>
      <ErrorNote message={error} />
      {notice && <p className="text-sm text-[#2f5a3a] bg-[#e3ece4] px-3 py-2">{notice}</p>}

      <Card title="Announcement bar">
        <p className="text-xs text-[#1B1113]/55 mb-3">The thin strip at the very top of every page. The messages take turns.</p>
        <div className="flex flex-col gap-2">
          {messages.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={m}
                maxLength={70}
                onChange={(e) => setMessages((all) => all.map((x, j) => (j === i ? e.target.value : x)))}
                className={field}
              />
              <button className={secondary} style={tracking} onClick={() => setMessages((all) => all.filter((_, j) => j !== i))}>
                Remove
              </button>
            </div>
          ))}
          {messages.length < 6 && (
            <button className={`${secondary} self-start`} style={tracking} onClick={() => setMessages((all) => [...all, ''])}>
              + Message
            </button>
          )}
        </div>
      </Card>

      <Card title="Sale">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={saleOn} onChange={(e) => setSaleOn(e.target.checked)} />
          Run a sale with a countdown
        </label>
        {saleOn && (
          <div className="flex flex-col gap-3 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={label}>
                Sale name
                <input value={saleName} onChange={(e) => setSaleName(e.target.value)} className={`${field} mt-1`} placeholder="The Winter Sale" />
              </label>
              <label className={label}>
                Ends
                <input type="datetime-local" value={saleEnds} onChange={(e) => setSaleEnds(e.target.value)} className={`${field} mt-1`} />
              </label>
              <label className={`${label} sm:col-span-2`}>
                Banner text (shown with the countdown)
                <input value={saleBanner} maxLength={60} onChange={(e) => setSaleBanner(e.target.value)} className={`${field} mt-1`} placeholder="Winter Sale · up to $70 off" />
              </label>
            </div>
            <p className={label}>Products on sale</p>
            <div className="flex flex-col gap-1.5">
              {doc.products.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={saleHandles.includes(p.handle)}
                    onChange={(e) => setSaleHandles((hs) => (e.target.checked ? [...hs, p.handle] : hs.filter((h) => h !== p.handle)))}
                  />
                  {p.title}
                </label>
              ))}
            </div>
            <p className="text-xs text-[#1B1113]/55 leading-relaxed">
              Lower the prices and add the old price as the “was” price in Products. The sale adds the countdown, the badge and the crossed-out
              prices, and switches itself off at the end date. Put the prices back after the sale.
            </p>
          </div>
        )}
      </Card>

      <button className={`${primary} self-start`} style={tracking} disabled={busy} onClick={() => void saveSite()}>
        {busy ? 'Saving…' : 'Save announcement and sale'}
      </button>

      <Card title="Shipping rates">
        <div className="flex flex-col gap-3">
          {doc.shipping.zones.map((z) => (
            <label key={z.id} className="flex items-center gap-3 text-sm">
              <span className="flex-1">
                {z.label}
                <span className="block text-xs text-[#1B1113]/50">{z.countries.length} {z.countries.length === 1 ? 'country' : 'countries'}</span>
              </span>
              <span className="text-xs text-[#1B1113]/55">{z.currency === 'CAD' ? 'CA$' : 'US$'}</span>
              <input
                inputMode="decimal"
                value={rates[z.id] ?? ''}
                onChange={(e) => setRates((r) => ({ ...r, [z.id]: e.target.value }))}
                className={`${field} w-24`}
              />
            </label>
          ))}
        </div>
        <button
          className={`${primary} mt-4`}
          style={tracking}
          disabled={busy}
          onClick={() =>
            void run(
              () => storeApi.saveShipping(token, Object.fromEntries(Object.entries(rates).map(([k, v]) => [k, Number(v)]))),
              'Shipping rates saved.',
            )
          }
        >
          Save shipping rates
        </button>
      </Card>
    </div>
  )
}
