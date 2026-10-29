import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronLeft, ExternalLink, ImagePlus, Trash2, X } from 'lucide-react'
import { storeApi, type EditMedia, type EditProduct, type StoreDoc } from './adminApi'
import { htmlToText, textToHtml } from './richText'
import { preparePhoto } from './image'
import { parseShopTheModel } from '../lib/shopTheModel'
import { Card, ErrorNote, field, primary, secondary, tracking } from './ui'

const SUPPLIERS = [
  { id: 'nine', label: 'Nine ISEE (India)' },
  { id: 'evelyn', label: 'Evelyn Thanh An (Vietnam)' },
]

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const toCad = (usdAmount: string) => (usdAmount && Number(usdAmount) > 0 ? String(Math.round(Number(usdAmount) * 1.4)) : '')

function useStoreDoc(token: string) {
  const [doc, setDoc] = useState<StoreDoc | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    storeApi
      .load(token)
      .then((r) => setDoc(r.doc))
      .catch((e) => setError(e.message))
  }, [token])
  return { doc, setDoc, error }
}

export function ProductList({ token }: { token: string }) {
  const { doc, setDoc, error } = useStoreDoc(token)
  const [busy, setBusy] = useState(false)
  if (error) return <ErrorNote message={error} />
  if (!doc) return <p className="text-sm text-[#1B1113]/55">Loading your products…</p>

  const move = async (id: string, direction: 'up' | 'down') => {
    setBusy(true)
    try {
      setDoc((await storeApi.moveProduct(token, id, direction)).doc)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Products</h1>
        <Link to="/admin/products/new" className={primary} style={tracking}>
          New product
        </Link>
      </div>
      <p className="text-xs text-[#1B1113]/55">The order here is the order in the shop. Changes show on the site within a minute.</p>
      <div className="bg-white border border-[#5A3224]/12 divide-y divide-[#5A3224]/10">
        {doc.products.map((p, i) => {
          const prices = p.variants.map((v) => Number(v.price.USD))
          const image = p.media.find((m) => m.type === 'image')
          const soldOut = p.variants.every((v) => !v.availableForSale)
          return (
            <div key={p.id} className="flex items-center gap-3 px-3 sm:px-4 py-3">
              <Link to={`/admin/products/${encodeURIComponent(p.id)}`} className="flex items-center gap-3 flex-1 min-w-0">
                {image ? (
                  <img src={image.previewUrl ?? image.url} alt="" className="w-12 h-14 object-cover shrink-0" />
                ) : (
                  <span className="w-12 h-14 bg-[#FAF7F3] shrink-0" />
                )}
                <span className="min-w-0">
                  <span className="block text-sm font-semibold truncate">{p.title}</span>
                  <span className="block text-xs text-[#1B1113]/55">
                    {usd(Math.min(...prices))}
                    {Math.max(...prices) !== Math.min(...prices) ? ` – ${usd(Math.max(...prices))}` : ''} · {p.variants.length} options
                  </span>
                </span>
              </Link>
              {p.hidden ? (
                <span className="text-[10px] font-bold uppercase px-2 py-1 bg-[#1B1113]/[0.06] text-[#1B1113]/55" style={tracking}>
                  Hidden
                </span>
              ) : soldOut ? (
                <span className="text-[10px] font-bold uppercase px-2 py-1 bg-[#c99b6f]/30 text-[#5A3224]" style={tracking}>
                  Sold out
                </span>
              ) : null}
              <div className="flex flex-col">
                <button aria-label="Move up" disabled={busy || i === 0} onClick={() => move(p.id, 'up')} className="p-1 text-[#1B1113]/50 disabled:opacity-20">
                  <ArrowUp size={14} />
                </button>
                <button
                  aria-label="Move down"
                  disabled={busy || i === doc.products.length - 1}
                  onClick={() => move(p.id, 'down')}
                  className="p-1 text-[#1B1113]/50 disabled:opacity-20"
                >
                  <ArrowDown size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface Row {
  id: string
  values: string[]
  usd: string
  cad: string
  wasUsd: string
  wasCad: string
  inStock: boolean
}

function rowsOf(p: EditProduct, names: string[]): Row[] {
  return p.variants.map((v) => ({
    id: v.id,
    values: names.map((n) => v.selectedOptions.find((o) => o.name === n)?.value ?? ''),
    usd: String(Number(v.price.USD)),
    cad: String(Number(v.price.CAD)),
    wasUsd: v.compareAtPrice ? String(Number(v.compareAtPrice.USD)) : '',
    wasCad: v.compareAtPrice ? String(Number(v.compareAtPrice.CAD)) : '',
    inStock: v.availableForSale,
  }))
}

const BLANK: EditProduct = {
  id: '',
  title: '',
  handle: '',
  supplier: 'nine',
  descriptionHtml: '',
  tags: [],
  media: [],
  options: [{ name: 'Length', values: ['18"'] }],
  variants: [
    {
      id: '',
      title: '18"',
      availableForSale: true,
      price: { USD: '', CAD: '' },
      compareAtPrice: null,
      selectedOptions: [{ name: 'Length', value: '18"' }],
    },
  ],
}

export function ProductEditor({ token }: { token: string }) {
  const { id = 'new' } = useParams()
  const navigate = useNavigate()
  const { doc, setDoc, error: loadError } = useStoreDoc(token)
  const original = useMemo(() => (id === 'new' ? BLANK : doc?.products.find((p) => p.id === id) ?? null), [doc, id])

  const [title, setTitle] = useState('')
  const [supplier, setSupplier] = useState('nine')
  const [visible, setVisible] = useState(true)
  const [description, setDescription] = useState('')
  const [media, setMedia] = useState<EditMedia[]>([])
  const [names, setNames] = useState<string[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(0)
  const fileInput = useRef<HTMLInputElement>(null)
  const seeded = useRef<string | null>(null)

  useEffect(() => {
    if (!original || seeded.current === (original.id || 'new')) return
    seeded.current = original.id || 'new'
    const optionNames = original.options.map((o) => o.name).filter((n) => n !== 'Title')
    setTitle(original.title)
    setSupplier(original.supplier)
    setVisible(!original.hidden)
    setDescription(htmlToText(original.descriptionHtml))
    setMedia(original.media)
    setNames(optionNames.length ? optionNames : ['Option'])
    setRows(rowsOf(original, optionNames.length ? optionNames : ['Option']))
  }, [original])

  if (loadError) return <ErrorNote message={loadError} />
  if (!doc) return <p className="text-sm text-[#1B1113]/55">Loading…</p>
  if (!original) return <ErrorNote message="That product no longer exists." />

  const variantTitles = rows.map((r) => r.values.filter(Boolean).join(' / '))

  const updateRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) =>
      rs.map((r, j) => {
        if (j !== i) return r
        const next = { ...r, ...patch }
        // keep CAD in step with USD unless it was set by hand
        if (patch.usd !== undefined && (r.cad === '' || r.cad === toCad(r.usd))) next.cad = toCad(patch.usd)
        if (patch.wasUsd !== undefined && (r.wasCad === '' || r.wasCad === toCad(r.wasUsd))) next.wasCad = toCad(patch.wasUsd)
        return next
      }),
    )

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setError(null)
    for (const file of [...files]) {
      setUploading((n) => n + 1)
      try {
        const { full, thumb } = await preparePhoto(file)
        const saved = await storeApi.upload(token, original.handle || title, full, thumb)
        setMedia((m) => [...m, { type: 'image', url: saved.url, previewUrl: saved.thumb, altText: title || null }])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not upload that photo.')
      } finally {
        setUploading((n) => n - 1)
      }
    }
  }

  const moveMedia = (i: number, step: number) =>
    setMedia((m) => {
      const j = i + step
      if (j < 0 || j >= m.length) return m
      const next = [...m]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  const setAlt = (i: number, caption: string, model: string) =>
    setMedia((m) => m.map((x, j) => (j === i ? { ...x, altText: `${caption.trim()}${model ? ` Shop the model: ${model}` : ''}`.trim() || null } : x)))

  const save = async () => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const product: Partial<EditProduct> = {
        id: original.id || undefined,
        title,
        supplier,
        hidden: !visible,
        descriptionHtml: textToHtml(description),
        media,
        variants: rows.map((r) => ({
          id: r.id,
          title: '',
          availableForSale: r.inStock,
          price: { USD: r.usd, CAD: r.cad },
          compareAtPrice: r.wasUsd || r.wasCad ? { USD: r.wasUsd || String(Math.round(Number(r.wasCad) / 1.4)), CAD: r.wasCad || toCad(r.wasUsd) } : null,
          selectedOptions: names.map((name, k) => ({ name: name.trim(), value: r.values[k]?.trim() ?? '' })),
        })),
      }
      const { doc: saved } = await storeApi.saveProduct(token, product)
      setDoc(saved)
      setNotice('Saved. The shop shows the change within a minute.')
      if (!original.id) {
        const created = saved.products[saved.products.length - 1]
        seeded.current = null
        navigate(`/admin/products/${encodeURIComponent(created.id)}`, { replace: true })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!original.id || !window.confirm(`Delete ${original.title}? To keep it but take it off the shop, untick "Show in the shop" instead.`)) return
    setBusy(true)
    try {
      await storeApi.deleteProduct(token, original.id)
      navigate('/admin/products')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete.')
      setBusy(false)
    }
  }

  const cell = 'bg-white border border-[#5A3224]/20 px-2 py-1.5 text-sm w-full min-w-0 focus:outline-none focus:border-[#5A3224]'

  return (
    <div className="flex flex-col gap-5 pb-24">
      <Link to="/admin/products" className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-[#1B1113]/50 hover:text-[#5A3224]" style={tracking}>
        <ChevronLeft size={14} /> Products
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl">{original.id ? title || 'Product' : 'New product'}</h1>
        {original.handle && !original.hidden && (
          <a href={`#/products/${original.handle}`} target="_blank" rel="noreferrer" className={secondary} style={tracking}>
            View in shop <ExternalLink size={12} />
          </a>
        )}
      </div>

      <ErrorNote message={error} />
      {notice && <p className="text-sm text-[#2f5a3a] bg-[#e3ece4] px-3 py-2">{notice}</p>}

      <Card title="Product">
        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-[#1B1113]/60">
            Name
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${field} mt-1`} placeholder="Raw Vietnamese Straight Bundles" />
          </label>
          <label className="text-xs font-semibold text-[#1B1113]/60">
            Supplier
            <select value={supplier} onChange={(e) => setSupplier(e.target.value)} className={`${field} mt-1`}>
              {SUPPLIERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            Show in the shop
          </label>
        </div>
      </Card>

      <Card
        title="Photos"
        action={
          <button className={secondary} style={tracking} onClick={() => fileInput.current?.click()} disabled={uploading > 0}>
            <ImagePlus size={14} /> {uploading ? 'Uploading…' : 'Add photos'}
          </button>
        }
      >
        <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void upload(e.target.files)} />
        {media.length === 0 && <p className="text-sm text-[#1B1113]/55">No photos yet. The first photo is the one shown in the collection.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {media.map((m, i) => {
            const look = parseShopTheModel(m.altText)
            const caption = look ? look.caption : m.altText ?? ''
            return (
              <div key={m.url} className="border border-[#5A3224]/12 p-3 flex gap-3">
                <div className="relative w-20 shrink-0">
                  <img src={m.type === 'video' ? m.previewUrl ?? '' : m.previewUrl ?? m.url} alt="" className="w-20 h-24 object-cover bg-[#1B1113]" />
                  {m.type === 'video' && (
                    <span className="absolute bottom-1 left-1 text-[9px] font-bold uppercase bg-[#FAF7F3] px-1">Video</span>
                  )}
                  {i === 0 && <span className="absolute top-1 left-1 text-[9px] font-bold uppercase bg-[#c99b6f] px-1">Main</span>}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <input
                    value={caption}
                    onChange={(e) => setAlt(i, e.target.value, look?.variantTitle ?? '')}
                    placeholder="What the photo shows"
                    className={cell}
                  />
                  <select value={look?.variantTitle ?? ''} onChange={(e) => setAlt(i, caption, e.target.value)} className={cell}>
                    <option value="">No “shop the model” button</option>
                    {variantTitles.map((t) => (
                      <option key={t} value={t}>
                        Shop the model: {t}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-1 mt-auto">
                    <button aria-label="Move left" onClick={() => moveMedia(i, -1)} disabled={i === 0} className="p-1.5 border border-[#5A3224]/20 disabled:opacity-25">
                      <ArrowLeft size={13} />
                    </button>
                    <button
                      aria-label="Move right"
                      onClick={() => moveMedia(i, 1)}
                      disabled={i === media.length - 1}
                      className="p-1.5 border border-[#5A3224]/20 disabled:opacity-25"
                    >
                      <ArrowRight size={13} />
                    </button>
                    <button
                      aria-label="Remove photo"
                      onClick={() => setMedia((all) => all.filter((_, j) => j !== i))}
                      className="ml-auto p-1.5 border border-[#5A3224]/20 text-[#8a2d1f]"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card title="Description">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={14} className={`${field} font-sans leading-relaxed`} />
        <p className="text-xs text-[#1B1113]/50 mt-2 leading-relaxed">
          Leave an empty line between paragraphs. Start a line with <strong>## </strong> for a small heading, with <strong>- </strong> for a bullet.
          Put **two stars** around words for bold and _underscores_ for italics.
        </p>
      </Card>

      <Card title="Options and prices">
        <div className="flex flex-wrap gap-2 mb-4">
          {names.map((n, k) => (
            <input
              key={k}
              value={n}
              onChange={(e) => setNames((all) => all.map((x, j) => (j === k ? e.target.value : x)))}
              className={`${cell} w-36`}
              aria-label={`Option ${k + 1} name`}
            />
          ))}
          {names.length < 3 && (
            <button
              className={secondary}
              style={tracking}
              onClick={() => {
                setNames((all) => [...all, 'Density'])
                setRows((rs) => rs.map((r) => ({ ...r, values: [...r.values, ''] })))
              }}
            >
              + Option
            </button>
          )}
        </div>
        <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
          <table className="text-sm min-w-[640px] w-full border-separate" style={{ borderSpacing: '0 6px' }}>
            <thead>
              <tr className="text-[10px] uppercase text-[#1B1113]/50 text-left" style={tracking}>
                {names.map((n, k) => (
                  <th key={k} className="font-semibold pr-2">
                    {n || `Option ${k + 1}`}
                  </th>
                ))}
                <th className="font-semibold pr-2">Price US$</th>
                <th className="font-semibold pr-2">Price CA$</th>
                <th className="font-semibold pr-2">Was US$</th>
                <th className="font-semibold pr-2">Was CA$</th>
                <th className="font-semibold pr-2">In stock</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id || `new-${i}`}>
                  {names.map((_, k) => (
                    <td key={k} className="pr-2 min-w-[112px]">
                      <input
                        value={r.values[k] ?? ''}
                        onChange={(e) => updateRow(i, { values: r.values.map((v, j) => (j === k ? e.target.value : v)) })}
                        className={cell}
                      />
                    </td>
                  ))}
                  <td className="pr-2 w-24">
                    <input inputMode="decimal" value={r.usd} onChange={(e) => updateRow(i, { usd: e.target.value })} className={cell} />
                  </td>
                  <td className="pr-2 w-24">
                    <input inputMode="decimal" value={r.cad} onChange={(e) => updateRow(i, { cad: e.target.value })} className={cell} />
                  </td>
                  <td className="pr-2 w-24">
                    <input inputMode="decimal" value={r.wasUsd} onChange={(e) => updateRow(i, { wasUsd: e.target.value })} className={cell} placeholder="—" />
                  </td>
                  <td className="pr-2 w-24">
                    <input inputMode="decimal" value={r.wasCad} onChange={(e) => updateRow(i, { wasCad: e.target.value })} className={cell} placeholder="—" />
                  </td>
                  <td className="pr-2 text-center">
                    <input type="checkbox" checked={r.inStock} onChange={(e) => updateRow(i, { inStock: e.target.checked })} aria-label="In stock" />
                  </td>
                  <td>
                    <button
                      aria-label="Remove this option"
                      disabled={rows.length === 1}
                      onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                      className="p-1.5 text-[#8a2d1f] disabled:opacity-20"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            className={secondary}
            style={tracking}
            onClick={() => setRows((rs) => [...rs, { ...(rs[rs.length - 1] ?? rowsOf(BLANK, names)[0]), id: '' }])}
          >
            + Add a row
          </button>
          <button className={secondary} style={tracking} onClick={() => setRows((rs) => rs.map((r) => ({ ...r, cad: toCad(r.usd), wasCad: toCad(r.wasUsd) })))}>
            CA$ = US$ × 1.40
          </button>
          <button className={secondary} style={tracking} onClick={() => setRows((rs) => rs.map((r) => ({ ...r, wasUsd: '', wasCad: '' })))}>
            Remove “was” prices
          </button>
        </div>
        <p className="text-xs text-[#1B1113]/50 mt-3 leading-relaxed">
          Canada pays the CA$ price; every other country pays the US$ price. A “was” price shows crossed out next to the price, for sets and sales.
          Untick “In stock” to show an option as sold out.
        </p>
      </Card>

      <div className="fixed bottom-0 inset-x-0 bg-[#FAF7F3]/95 backdrop-blur border-t border-[#5A3224]/15">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button className={primary} style={tracking} disabled={busy || uploading > 0} onClick={() => void save()}>
            {busy ? 'Saving…' : 'Save product'}
          </button>
          {original.id && (
            <button className="ml-auto text-xs font-semibold uppercase text-[#1B1113]/45 hover:text-[#8a2d1f]" style={tracking} disabled={busy} onClick={() => void remove()}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
