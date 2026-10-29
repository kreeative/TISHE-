import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { adminApi, cents, shortDate, type AdminOrder, type SupplierMessage } from './adminApi'
import { Card, CopyButton, ErrorNote, StatusChip, field, primary, secondary, tracking } from './ui'

const CARRIERS = ['DHL', 'FedEx', 'UPS', 'Canada Post', 'Other']
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

function addressText(o: AdminOrder): string {
  const a = o.shipping
  if (!a) return ''
  return [a.name, a.line1, a.line2, `${a.city}${a.state ? `, ${a.state}` : ''} ${a.postalCode}`.trim(), regionNames.of(a.country) ?? a.country]
    .filter(Boolean)
    .join('\n')
}

export default function OrderDetail({ token }: { token: string }) {
  const { id = '' } = useParams()
  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [messages, setMessages] = useState<SupplierMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const [supplierRef, setSupplierRef] = useState('')
  const [carrier, setCarrier] = useState('DHL')
  const [trackingNo, setTrackingNo] = useState('')
  const [notify, setNotify] = useState(true)
  const [note, setNote] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const apply = (o: AdminOrder, m: SupplierMessage[]) => {
    setOrder(o)
    setMessages(m)
    setSupplierRef(o.supplierRef)
    setCarrier(o.carrier || 'DHL')
    setTrackingNo(o.tracking)
    setNote(o.note)
    setSubject((s) => s || `Your order #${o.number}`)
  }

  useEffect(() => {
    adminApi
      .order(token, id)
      .then((r) => apply(r.order, r.supplierMessages))
      .catch((e) => setError(e.message))
  }, [token, id])

  const save = async (fields: Record<string, unknown>, done: string) => {
    if (!order) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const r = await adminApi.update(token, order.id, fields)
      apply(r.order, r.supplierMessages)
      setNotice(r.notified ? `${done} The customer has been emailed.` : done)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  if (error && !order) return <ErrorNote message={error} />
  if (!order) return <p className="text-sm text-[#1B1113]/55">Loading the order…</p>

  const money = (n: number) => cents(n, order.currency)

  return (
    <div className="flex flex-col gap-5">
      <Link to="/admin" className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-[#1B1113]/50 hover:text-[#5A3224]" style={tracking}>
        <ChevronLeft size={14} /> All orders
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Order #{order.number ?? '…'}</h1>
          <p className="text-sm text-[#1B1113]/55 mt-1">
            {shortDate(order.createdAt)} · {money(order.total)}
          </p>
        </div>
        <StatusChip status={order.status} refunded={order.refunded} />
      </div>

      {notice && <p className="text-sm text-[#2f5a3a] bg-[#e3ece4] px-3 py-2">{notice}</p>}
      <ErrorNote message={error} />
      {order.provinceMismatch && (
        <ErrorNote
          message={`GST/HST was charged for ${order.taxProvince}, but the address is in ${order.shipping?.state}. Check with the customer before shipping.`}
        />
      )}

      {/* step 1: send it to the supplier */}
      {(order.status === 'new' || order.status === 'ordered') && (
        <Card title={order.status === 'new' ? 'Step 1 · Send to your supplier' : 'Sent to your supplier'}>
          <div className="flex flex-col gap-5">
            {messages.map((m) => (
              <div key={m.supplier}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold">{m.name}</p>
                  <CopyButton text={m.message} label="Copy message" />
                </div>
                <pre className="whitespace-pre-wrap text-[13px] leading-relaxed bg-[#FAF7F3] border border-[#5A3224]/12 p-3 font-sans">{m.message}</pre>
              </div>
            ))}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={supplierRef}
                onChange={(e) => setSupplierRef(e.target.value)}
                placeholder="Supplier order number (optional)"
                className={field}
              />
              <button
                className={primary}
                style={tracking}
                disabled={busy}
                onClick={() => save({ status: 'ordered', supplierRef }, 'Marked as ordered from the supplier.')}
              >
                {order.status === 'new' ? 'Mark as ordered' : 'Save'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* step 2: tracking */}
      {order.status !== 'cancelled' && (
        <Card title={order.tracking ? 'Tracking' : 'Step 2 · Add the tracking number'}>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-2">
              <select value={carrier} onChange={(e) => setCarrier(e.target.value)} className={field}>
                {CARRIERS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} placeholder="Tracking number" className={field} />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#1B1113]/75">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
              Email the customer the tracking link
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                className={primary}
                style={tracking}
                disabled={busy || !trackingNo.trim()}
                onClick={() => save({ carrier, tracking: trackingNo, notify }, 'Tracking saved.')}
              >
                Save tracking
              </button>
              {order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noreferrer" className={secondary} style={tracking}>
                  Track <ExternalLink size={12} />
                </a>
              )}
              {order.status === 'shipped' && (
                <button className={secondary} style={tracking} disabled={busy} onClick={() => save({ status: 'delivered' }, 'Marked as delivered.')}>
                  Mark delivered
                </button>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Customer">
          <p className="font-semibold">{order.name}</p>
          <p className="text-sm mt-1">
            <a href={`mailto:${order.email}`} className="text-[#5A3224] underline underline-offset-4">
              {order.email}
            </a>
          </p>
          {order.phone && (
            <p className="text-sm mt-1">
              <a href={`tel:${order.phone}`} className="text-[#5A3224]">
                {order.phone}
              </a>
            </p>
          )}
          {order.shipping && (
            <>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed mt-4 font-sans">{addressText(order)}</pre>
              <div className="mt-3">
                <CopyButton text={[addressText(order), order.phone && `Phone: ${order.phone}`].filter(Boolean).join('\n')} label="Copy address" />
              </div>
            </>
          )}
        </Card>

        <Card title="Payment">
          <dl className="text-sm flex flex-col gap-1.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
            <Row label="Subtotal" value={money(order.subtotal)} />
            {order.discount > 0 && <Row label={`Discount${order.code ? ` (${order.code})` : ''}`} value={`−${money(order.discount)}`} />}
            <Row label="Shipping" value={order.shippingAmount ? money(order.shippingAmount) : 'Free'} />
            {order.tax > 0 && <Row label={`GST/HST (${order.taxProvince})`} value={money(order.tax)} />}
            <Row label="Total paid" value={money(order.total)} bold />
            {order.fee > 0 && <Row label="Stripe fee" value={`−${money(order.fee)}`} />}
            {order.net > 0 && <Row label="To your bank" value={money(order.net)} bold />}
          </dl>
          {order.stripeUrl && (
            <a href={order.stripeUrl} target="_blank" rel="noreferrer" className={`${secondary} mt-4`} style={tracking}>
              Open in Stripe (refunds) <ExternalLink size={12} />
            </a>
          )}
        </Card>
      </div>

      <Card title="Items">
        <div className="divide-y divide-[#5A3224]/10">
          {order.items.map((i) => (
            <div key={`${i.handle}-${i.variant}`} className="py-3 flex gap-3 items-center">
              {i.image && <img src={i.image} alt="" className="w-12 h-14 object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{i.title}</p>
                <p className="text-xs text-[#1B1113]/55">
                  {i.variant} · Qty {i.quantity} · {i.supplier === 'evelyn' ? 'Evelyn (Vietnam)' : 'Nine ISEE (India)'}
                </p>
              </div>
              <p className="text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {money(i.total)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Private note">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={field} placeholder="Only you see this" />
        <button className={`${secondary} mt-3`} style={tracking} disabled={busy} onClick={() => save({ note }, 'Note saved.')}>
          Save note
        </button>
      </Card>

      <Card title="Write to the customer">
        <div className="flex flex-col gap-2">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className={field} />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className={field}
            placeholder={`Hi ${order.name.split(' ')[0] || 'there'},\n\n…`}
          />
          <p className="text-xs text-[#1B1113]/50">Sent from orders@theivorysukundu.com. Replies come to hello@theivorysukundu.com.</p>
          <button
            className={`${primary} self-start`}
            style={tracking}
            disabled={busy || !message.trim()}
            onClick={async () => {
              setBusy(true)
              setError(null)
              try {
                await adminApi.email(token, order.email, subject, message)
                setMessage('')
                setNotice('Email sent.')
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not send.')
              } finally {
                setBusy(false)
              }
            }}
          >
            Send email
          </button>
        </div>
      </Card>

      {order.status !== 'cancelled' && (
        <button
          className="self-start text-xs font-semibold uppercase text-[#1B1113]/45 hover:text-[#8a2d1f]"
          style={tracking}
          disabled={busy}
          onClick={() => {
            if (window.confirm('Mark this order as cancelled? Refund the payment in Stripe separately.')) {
              void save({ status: 'cancelled' }, 'Order cancelled. Remember to refund it in Stripe.')
            }
          }}
        >
          Cancel this order
        </button>
      )}
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${bold ? 'font-semibold' : 'text-[#1B1113]/70'}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
