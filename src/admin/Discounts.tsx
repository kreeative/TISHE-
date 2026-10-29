import { useEffect, useState } from 'react'
import { storeApi, type CodeRule, type StoreDoc } from './adminApi'
import { Card, CopyButton, ErrorNote, field, primary, secondary, tracking } from './ui'

const money = (n: number, currency: 'USD' | 'CAD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

function describe(c: CodeRule): string {
  const parts = [
    c.kind === 'percent' ? `${c.percent}% off` : c.kind === 'amount' && c.amount ? `${money(c.amount.USD, 'USD')} / ${money(c.amount.CAD, 'CAD')} off` : 'Free shipping',
  ]
  if (c.minSubtotal) parts.push(`orders over ${money(c.minSubtotal.USD, 'USD')} (${money(c.minSubtotal.CAD, 'CAD')})`)
  if (c.firstOrderOnly) parts.push('first order only')
  if (c.returningOnly) parts.push('returning customers only')
  if (c.oncePerCustomer) parts.push('once per customer')
  if (c.endsAt) parts.push(`until ${new Date(c.endsAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}`)
  return parts.join(' · ')
}

function status(c: CodeRule): { label: string; live: boolean } {
  const now = Date.now()
  if (!c.active) return { label: 'Off', live: false }
  if (c.startsAt && Date.parse(c.startsAt) > now) return { label: 'Scheduled', live: false }
  if (c.endsAt && Date.parse(c.endsAt) <= now) return { label: 'Ended', live: false }
  return { label: 'Active', live: true }
}

interface Draft {
  code: string
  kind: CodeRule['kind']
  percent: string
  amountUsd: string
  amountCad: string
  minUsd: string
  minCad: string
  firstOrderOnly: boolean
  returningOnly: boolean
  oncePerCustomer: boolean
  active: boolean
  startsAt: string
  endsAt: string
  label: string
}

// yyyy-mm-dd in the owner's own time zone
const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-CA') : '')

function draftOf(c?: CodeRule): Draft {
  return {
    code: c?.code ?? '',
    kind: c?.kind ?? 'percent',
    percent: c?.percent ? String(c.percent) : '10',
    amountUsd: c?.amount ? String(c.amount.USD) : '',
    amountCad: c?.amount ? String(c.amount.CAD) : '',
    minUsd: c?.minSubtotal ? String(c.minSubtotal.USD) : '',
    minCad: c?.minSubtotal ? String(c.minSubtotal.CAD) : '',
    firstOrderOnly: Boolean(c?.firstOrderOnly),
    returningOnly: Boolean(c?.returningOnly),
    oncePerCustomer: Boolean(c?.oncePerCustomer),
    active: c?.active ?? true,
    startsAt: day(c?.startsAt),
    endsAt: day(c?.endsAt),
    label: c?.label ?? '',
  }
}

export default function Discounts({ token }: { token: string }) {
  const [doc, setDoc] = useState<StoreDoc | null>(null)
  const [usage, setUsage] = useState<Record<string, number>>({})
  const [editing, setEditing] = useState<{ previous: string; draft: Draft } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    storeApi
      .load(token)
      .then((r) => {
        setDoc(r.doc)
        setUsage(r.usage)
      })
      .catch((e) => setError(e.message))
  }, [token])

  if (!doc) return error ? <ErrorNote message={error} /> : <p className="text-sm text-[#1B1113]/55">Loading your codes…</p>

  const set = (patch: Partial<Draft>) => setEditing((e) => (e ? { ...e, draft: { ...e.draft, ...patch } } : e))

  const save = async () => {
    if (!editing) return
    const d = editing.draft
    setBusy(true)
    setError(null)
    try {
      const r = await storeApi.saveCode(
        token,
        {
          code: d.code,
          kind: d.kind,
          percent: Number(d.percent),
          amount: d.kind === 'amount' ? { USD: Number(d.amountUsd), CAD: Number(d.amountCad) } : undefined,
          minSubtotal: d.minUsd || d.minCad ? { USD: Number(d.minUsd), CAD: Number(d.minCad) } : undefined,
          firstOrderOnly: d.firstOrderOnly,
          returningOnly: d.returningOnly,
          oncePerCustomer: d.oncePerCustomer,
          active: d.active,
          // in the owner's own time zone: a start date begins at midnight, an end date ends at 11:59 pm
          startsAt: d.startsAt ? new Date(`${d.startsAt}T00:00`).toISOString() : undefined,
          endsAt: d.endsAt ? new Date(`${d.endsAt}T23:59`).toISOString() : undefined,
          label: d.label,
        },
        editing.previous || undefined,
      )
      setDoc(r.doc)
      setEditing(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (code: string) => {
    if (!window.confirm(`Delete ${code}? Customers will no longer be able to use it.`)) return
    setBusy(true)
    try {
      setDoc((await storeApi.deleteCode(token, code)).doc)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete.')
    } finally {
      setBusy(false)
    }
  }

  const d = editing?.draft
  const label = 'text-xs font-semibold text-[#1B1113]/60'

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Promo codes</h1>
        {!editing && (
          <button className={primary} style={tracking} onClick={() => setEditing({ previous: '', draft: draftOf() })}>
            New code
          </button>
        )}
      </div>
      <ErrorNote message={error} />

      {d && (
        <Card title={editing.previous ? `Edit ${editing.previous}` : 'New code'}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={label}>
              Code
              <input value={d.code} onChange={(e) => set({ code: e.target.value.toUpperCase().replace(/\s/g, '') })} className={`${field} mt-1 uppercase`} placeholder="SUMMER15" />
            </label>
            <label className={label}>
              Type
              <select value={d.kind} onChange={(e) => set({ kind: e.target.value as Draft['kind'] })} className={`${field} mt-1`}>
                <option value="percent">Percentage off</option>
                <option value="amount">Amount off</option>
                <option value="free_shipping">Free shipping</option>
              </select>
            </label>
            {d.kind === 'percent' && (
              <label className={label}>
                Percentage off
                <input inputMode="numeric" value={d.percent} onChange={(e) => set({ percent: e.target.value })} className={`${field} mt-1`} />
              </label>
            )}
            {d.kind === 'amount' && (
              <div className="grid grid-cols-2 gap-2">
                <label className={label}>
                  Off in US$
                  <input
                    inputMode="decimal"
                    value={d.amountUsd}
                    onChange={(e) => set({ amountUsd: e.target.value, amountCad: e.target.value ? String(Math.round(Number(e.target.value) * 1.4)) : '' })}
                    className={`${field} mt-1`}
                  />
                </label>
                <label className={label}>
                  Off in CA$
                  <input inputMode="decimal" value={d.amountCad} onChange={(e) => set({ amountCad: e.target.value })} className={`${field} mt-1`} />
                </label>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <label className={label}>
                Minimum bag US$
                <input
                  inputMode="decimal"
                  value={d.minUsd}
                  onChange={(e) => set({ minUsd: e.target.value, minCad: e.target.value ? String(Math.round(Number(e.target.value) * 1.4)) : '' })}
                  className={`${field} mt-1`}
                  placeholder="None"
                />
              </label>
              <label className={label}>
                Minimum bag CA$
                <input inputMode="decimal" value={d.minCad} onChange={(e) => set({ minCad: e.target.value })} className={`${field} mt-1`} placeholder="None" />
              </label>
            </div>
            <label className={label}>
              Starts (optional)
              <input type="date" value={d.startsAt} onChange={(e) => set({ startsAt: e.target.value })} className={`${field} mt-1`} />
            </label>
            <label className={label}>
              Ends (optional)
              <input type="date" value={d.endsAt} onChange={(e) => set({ endsAt: e.target.value })} className={`${field} mt-1`} />
            </label>
            <label className={`${label} sm:col-span-2`}>
              What the customer sees when it's applied (optional)
              <input value={d.label} onChange={(e) => set({ label: e.target.value })} className={`${field} mt-1`} placeholder="10% off your first order" />
            </label>
          </div>
          <div className="flex flex-col gap-2 mt-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={d.firstOrderOnly} onChange={(e) => set({ firstOrderOnly: e.target.checked, returningOnly: e.target.checked ? false : d.returningOnly })} />
              First order only
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={d.returningOnly} onChange={(e) => set({ returningOnly: e.target.checked, firstOrderOnly: e.target.checked ? false : d.firstOrderOnly })} />
              Returning customers only
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={d.oncePerCustomer} onChange={(e) => set({ oncePerCustomer: e.target.checked })} />
              Once per customer
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={d.active} onChange={(e) => set({ active: e.target.checked })} />
              Active
            </label>
          </div>
          <div className="flex gap-2 mt-5">
            <button className={primary} style={tracking} disabled={busy || !d.code} onClick={() => void save()}>
              {busy ? 'Saving…' : 'Save code'}
            </button>
            <button className={secondary} style={tracking} onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </Card>
      )}

      <div className="bg-white border border-[#5A3224]/12 divide-y divide-[#5A3224]/10">
        {doc.discounts.map((c) => {
          const s = status(c)
          return (
            <div key={c.code} className="px-4 py-3.5 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-semibold tracking-wide">{c.code}</span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 ${s.live ? 'bg-[#e3ece4] text-[#2f5a3a]' : 'bg-[#1B1113]/[0.06] text-[#1B1113]/50'}`}
                style={tracking}
              >
                {s.label}
              </span>
              <span className="text-xs text-[#1B1113]/50">used {usage[c.code] ?? 0}×</span>
              <span className="basis-full text-xs text-[#1B1113]/60">{describe(c)}</span>
              <span className="basis-full flex gap-2 mt-1">
                <button className={secondary} style={tracking} onClick={() => setEditing({ previous: c.code, draft: draftOf(c) })}>
                  Edit
                </button>
                <CopyButton text={c.code} label="Copy" />
                <button className="text-xs font-semibold uppercase text-[#1B1113]/40 hover:text-[#8a2d1f] px-2" style={tracking} disabled={busy} onClick={() => void remove(c.code)}>
                  Delete
                </button>
              </span>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-[#1B1113]/50 leading-relaxed">
        Customers type codes in their bag before checkout. Percentage and amount codes come off the hair, never off shipping or tax. “First
        order”, “returning” and “once per customer” are checked against the customer's email.
      </p>
    </div>
  )
}
