import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useStore, type StoreDocument } from './StoreContext'
import { JEERE_FRAME, toJeere } from '../lib/jeere'

// Page texts and pictures that can be changed from Jeere. Each one has a key
// ("campaign.title") and its original wording in the code; a value saved from
// Jeere (store document → content) replaces it. Inside the Jeere frame, in edit
// mode, a click on a text edits it in place and a click on a picture asks Jeere
// for a new one. See docs/jeere-editor.md.

type Kind = 'text' | 'image'

interface SiteContentState {
  framed: boolean
  editing: boolean
  selected: string | null
  value: (key: string, original: string) => string
  register: (key: string, kind: Kind, original: string) => () => void
  select: (key: string, kind: Kind, original: string) => void
  change: (key: string, value: string) => void
}

// the pages Jeere can show in its page list (product pages are added from the catalog)
const PAGES = [
  { route: '/', name: 'Home' },
  { route: '/our-hair', name: 'Our Hair' },
  { route: '/collections', name: 'Collections' },
  { route: '/circle', name: 'The Circle' },
  { route: '/contact', name: 'Contact' },
  { route: '/quiz', name: 'Hair Quiz' },
]

const EDIT_CSS = `
html.tis-editing [data-tis-edit]{pointer-events:auto;cursor:text;outline-offset:4px;transition:outline-color .15s}
html.tis-editing img[data-tis-edit]{cursor:pointer}
html.tis-editing [data-tis-edit]:hover,html.tis-editing [data-tis-open]:hover{outline:2px solid #0d99ff}
html.tis-editing [data-tis-open]{cursor:pointer;outline-offset:2px}
html.tis-editing [data-tis-edit][contenteditable]{outline:2px solid #0d99ff;background:rgba(13,153,255,.06)}
html.tis-editing [data-tis-selected]{outline:2px solid #0d99ff}
`

const SiteContentContext = createContext<SiteContentState | null>(null)

const noop = () => {}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const { content, products, showStore } = useStore()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(Boolean(JEERE_FRAME?.editing))
  // changes not saved yet: '' means back to the original wording
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const fields = useRef(new Map<string, { kind: Kind; original: string; count: number }>())
  const [fieldsRev, setFieldsRev] = useState(0)

  const value = useCallback(
    (key: string, original: string) => (key in drafts ? drafts[key] : content[key]) || original,
    [drafts, content],
  )

  const register = useCallback((key: string, kind: Kind, original: string) => {
    if (!JEERE_FRAME) return noop
    const f = fields.current.get(key)
    fields.current.set(key, { kind, original, count: (f?.count ?? 0) + 1 })
    setFieldsRev((n) => n + 1)
    return () => {
      const now = fields.current.get(key)
      if (!now) return
      if (now.count > 1) now.count -= 1
      else fields.current.delete(key)
      setFieldsRev((n) => n + 1)
    }
  }, [])

  const draftsRef = useRef(drafts)
  draftsRef.current = drafts

  const select = useCallback(
    (key: string, kind: Kind, original: string) => {
      setSelected(key)
      toJeere({ type: 'select', key, kind, value: value(key, original), original })
    },
    [value],
  )

  const change = useCallback((key: string, next: string) => {
    const all = { ...draftsRef.current, [key]: next }
    setDrafts(all)
    toJeere({ type: 'change', key, value: next, changes: all })
  }, [])

  // edit-mode outlines
  useEffect(() => {
    if (!JEERE_FRAME) return
    if (!document.getElementById('tis-edit-css')) {
      const style = document.createElement('style')
      style.id = 'tis-edit-css'
      style.textContent = EDIT_CSS
      document.head.appendChild(style)
    }
    document.documentElement.classList.toggle('tis-editing', editing)
  }, [editing])

  // what's on screen, for Jeere's layers panel
  useEffect(() => {
    if (!JEERE_FRAME) return
    const t = setTimeout(() => {
      toJeere({
        type: 'page',
        route: pathname,
        editing,
        fields: [...fields.current].map(([key, f]) => ({
          key,
          kind: f.kind,
          value: value(key, f.original),
          original: f.original,
          changed: key in drafts,
        })),
        changes: drafts,
      })
    }, 150)
    return () => clearTimeout(t)
  }, [pathname, fieldsRev, drafts, value, editing])

  // the pages Jeere can open
  const pages = useMemo(
    () => [...PAGES, ...products.map((p) => ({ route: `/products/${p.handle}`, name: p.title }))],
    [products],
  )
  useEffect(() => {
    toJeere({ type: 'ready', editing: Boolean(JEERE_FRAME?.editing), pages })
  }, [pages])

  // products, the announcement bar and the sale have their own editors in Jeere
  useEffect(() => {
    if (!JEERE_FRAME || !editing) return
    const onClick = (e: globalThis.MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null
      const el = target?.closest('[data-tis-open]')
      if (!el || target?.closest('[data-tis-edit]')) return
      e.preventDefault()
      e.stopPropagation()
      const [what, id = ''] = (el.getAttribute('data-tis-open') ?? '').split(':')
      toJeere({ type: 'open', what, id })
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [editing])

  // messages from Jeere
  useEffect(() => {
    if (!JEERE_FRAME) return
    const frame = JEERE_FRAME
    const onMessage = (e: MessageEvent) => {
      if (e.source !== window.parent || e.origin !== frame.origin) return
      const m = e.data as Record<string, unknown> | null
      if (!m || typeof m !== 'object' || m.source !== 'jeere') return
      if (m.type === 'edit') {
        setEditing(Boolean(m.on))
        if (!m.on) setSelected(null)
      } else if (m.type === 'set' && typeof m.key === 'string') {
        const key = m.key
        const next = typeof m.value === 'string' ? m.value.slice(0, 3000) : ''
        setDrafts((d) => ({ ...d, [key]: next }))
      } else if (m.type === 'discard') {
        setDrafts({})
      } else if (m.type === 'store' && m.doc && typeof m.doc === 'object') {
        const doc = m.doc as StoreDocument
        showStore(doc)
        // what was just saved is no longer a draft
        const saved = doc.content ?? {}
        setDrafts((d) => Object.fromEntries(Object.entries(d).filter(([k, v]) => v !== (saved[k] ?? ''))))
      } else if (m.type === 'navigate' && typeof m.route === 'string' && m.route.startsWith('/') && !m.route.startsWith('/admin')) {
        navigate(m.route)
      } else if (m.type === 'select' && typeof m.key === 'string') {
        setSelected(m.key)
        document.querySelector(`[data-tis-edit="${CSS.escape(m.key)}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [navigate, showStore])

  const state = useMemo<SiteContentState>(
    () => ({ framed: Boolean(JEERE_FRAME), editing: Boolean(JEERE_FRAME) && editing, selected, value, register, select, change }),
    [editing, selected, value, register, select, change],
  )
  return <SiteContentContext.Provider value={state}>{children}</SiteContentContext.Provider>
}

function useSiteContent(): SiteContentState {
  const ctx = useContext(SiteContentContext)
  if (!ctx) throw new Error('useSiteContent must be used inside SiteContentProvider')
  return ctx
}

type TextTag = 'p' | 'h1' | 'h2' | 'h3' | 'span' | 'div'

interface TextProps {
  // the key it's saved under, e.g. "campaign.title"
  k: string
  as?: TextTag
  // the original wording
  children: string
  className?: string
  style?: CSSProperties
}

// A text the owner can change from Jeere.
export function Text({ k, as = 'span', children, className, style }: TextProps) {
  const site = useSiteContent()
  const { register } = site
  useEffect(() => register(k, 'text', children), [register, k, children])
  const shown = site.value(k, children)
  if (!site.framed) return createElement(as, { className, style }, shown)
  return <EditableText k={k} as={as} original={children} shown={shown} className={className} style={style} />
}

function EditableText({ k, as, original, shown, className, style }: { k: string; as: TextTag; original: string; shown: string; className?: string; style?: CSSProperties }) {
  const site = useSiteContent()
  const ref = useRef<HTMLElement>(null)
  const cancelled = useRef(false)
  const [active, setActive] = useState(false)
  // bumped after each edit so React draws the element afresh
  const [rev, setRev] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!active || !el) return
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }, [active])

  const finish = () => {
    const typed = (ref.current?.innerText ?? shown).replace(/\s+/g, ' ').trim()
    setActive(false)
    setRev((n) => n + 1)
    if (cancelled.current) {
      cancelled.current = false
      return
    }
    if (typed !== shown) site.change(k, typed === original ? '' : typed)
  }

  const props: Record<string, unknown> = {
      key: rev,
      ref,
      className,
      style,
      'data-tis-edit': k,
      'data-tis-selected': site.selected === k && !active ? '' : undefined,
      contentEditable: active ? 'plaintext-only' : undefined,
      suppressContentEditableWarning: true,
      spellCheck: active ? true : undefined,
      onClick: (e: MouseEvent) => {
        if (!site.editing) return
        // a text inside a link is edited, not followed
        e.preventDefault()
        e.stopPropagation()
        if (!active) {
          setActive(true)
          site.select(k, 'text', original)
        }
      },
      onBlur: () => {
        if (active) finish()
      },
      onKeyDown: (e: KeyboardEvent) => {
        if (!active) return
        if (e.key === 'Enter') {
          e.preventDefault()
          ref.current?.blur()
        } else if (e.key === 'Escape') {
          cancelled.current = true
          ref.current?.blur()
        }
      },
  }
  return createElement(as, props as HTMLAttributes<HTMLElement>, shown)
}

type ImgProps = { k: string; src: string } & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'>

// A picture the owner can change from Jeere (Jeere uploads it and sends its address).
export function Img({ k, src, ...rest }: ImgProps) {
  const site = useSiteContent()
  const { register } = site
  useEffect(() => register(k, 'image', src), [register, k, src])
  const value = site.value(k, src)
  // only pictures on the web or on this site
  const shown = /^(https:\/\/|\/(?!\/))/.test(value) ? value : src
  if (!site.framed) return <img {...rest} src={shown} />
  return (
    <img
      {...rest}
      src={shown}
      data-tis-edit={k}
      data-tis-selected={site.selected === k ? '' : undefined}
      onClick={(e) => {
        if (!site.editing) return
        e.preventDefault()
        e.stopPropagation()
        site.select(k, 'image', src)
      }}
    />
  )
}
