import { useEffect, useRef, useState } from 'react'
import { Menu, X, ShoppingBag, User } from 'lucide-react'
import RevealLayer from './RevealLayer'
import { useStore } from './StoreContext'
import { ctaGlassOnLight, ctaTracking } from './cta'

const SPOTLIGHT_R = 260

const NAV_LINKS = [
  { label: 'Our Hair', href: '#about' },
  { label: 'Collections', href: '#collections' },
  { label: 'The Circle', href: '#circle' },
  { label: 'Contact', href: '#contact' },
]

export default function Hero() {
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 })
  const [menuOpen, setMenuOpen] = useState(false)
  const { cart, setCartOpen, setAccountOpen, memberName } = useStore()
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const sectionRef = useRef<HTMLElement>(null)
  const mouse = useRef({ x: -999, y: -999 })
  const smooth = useRef({ x: -999, y: -999 })
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const track = (clientX: number, clientY: number) => {
      const rect = sectionRef.current?.getBoundingClientRect()
      mouse.current.x = clientX - (rect?.left ?? 0)
      mouse.current.y = clientY - (rect?.top ?? 0)
    }
    const onMove = (e: MouseEvent) => track(e.clientX, e.clientY)
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) track(t.clientX, t.clientY)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchstart', onTouch, { passive: true })
    window.addEventListener('touchmove', onTouch, { passive: true })

    const loop = () => {
      const dx = mouse.current.x - smooth.current.x
      const dy = mouse.current.y - smooth.current.y
      // skip React re-renders once the spotlight has settled
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        smooth.current.x += dx * 0.1
        smooth.current.y += dy * 0.1
        setCursorPos({ x: smooth.current.x, y: smooth.current.y })
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchstart', onTouch)
      window.removeEventListener('touchmove', onTouch)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <>
      {/* Nav: solid ivory bar, text links and bare icons — no button chrome */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#FFF8F2] border-b border-[#5A3224]/15 flex items-center justify-between px-5 sm:px-8 h-16 sm:h-[72px]">
        <a href="#top" className="flex items-center shrink-0">
          <img src="/images/logo-mark-brown.webp" alt="The Ivory Sukundu" className="h-10 sm:h-12 w-auto" />
        </a>

        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-[#1a120c]/75 hover:text-[#5A3224] transition-colors whitespace-nowrap"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-5 sm:gap-6">
          <button
            className="text-[#1a120c]/75 hover:text-[#5A3224] transition-colors"
            onClick={() => setAccountOpen(true)}
            aria-label={memberName ? `Account: ${memberName}` : 'Account'}
          >
            <User size={20} strokeWidth={1.75} className={memberName ? 'text-[#5A3224]' : undefined} />
          </button>
          <button
            className="flex items-start gap-1 text-[#1a120c]/75 hover:text-[#5A3224] transition-colors"
            onClick={() => setCartOpen(true)}
            aria-label={`Bag, ${cartCount} items`}
          >
            <ShoppingBag size={20} strokeWidth={1.75} />
            {cartCount > 0 && (
              <span className="text-[11px] font-bold text-[#5A3224]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {cartCount}
              </span>
            )}
          </button>
          <button
            className="lg:hidden text-[#1a120c]/75 hover:text-[#5A3224] transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-[90] bg-[#FFF8F2] flex flex-col items-center justify-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-display text-3xl text-[#1a120c] hover:text-[#5A3224] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#collections"
            className={`${ctaGlassOnLight} mt-4`}
            style={ctaTracking}
            onClick={() => setMenuOpen(false)}
          >
            Shop Now
          </a>
        </div>
      )}

      <section
        ref={sectionRef}
        className="relative w-full overflow-hidden bg-black mt-16 sm:mt-[72px] h-[calc(100dvh-64px)] sm:h-[calc(100dvh-72px)]"
      >
        {/* Base layer: jet-black hair */}
        <div className="absolute inset-0 hero-bg hero-bg-base bg-cover bg-no-repeat hero-zoom z-10" />

        {/* Reveal layer: cursor-spotlight uncovers the 613 blonde version */}
        <RevealLayer cursorX={cursorPos.x} cursorY={cursorPos.y} radius={SPOTLIGHT_R} />

        {/* Scrim for text legibility */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

        {/* Heading: the actual logo lockup */}
        <div className="absolute top-1/2 -translate-y-1/2 left-2 sm:left-[80px] flex flex-col items-start text-left px-5 pointer-events-none z-50">
          <h1 className="m-0">
            <span className="sr-only">The Ivory Sukundu — Hair Extensions</span>
            <img
              src="/images/logo-mark.webp"
              alt=""
              className="w-[50vw] max-w-[240px] sm:w-[300px] sm:max-w-none xl:w-[360px] h-auto hero-anim hero-reveal"
              style={{ animationDelay: '0.25s' }}
            />
          </h1>
          <span
            className="text-[#FFF8F2]/90 text-xs sm:text-sm md:text-base font-medium uppercase mt-4 sm:mt-5 hero-anim hero-reveal"
            style={{ letterSpacing: '0.35em', animationDelay: '0.58s' }}
          >
            Luxury raw hair, redefined
          </span>
        </div>

        {/* Bottom-left copy */}
        <div className="hidden sm:block absolute bottom-14 max-w-[260px] hero-anim hero-fade z-50" style={{ left: '100px', animationDelay: '0.7s' }}>
          <p className="text-sm text-[#FFF8F2]/85 leading-relaxed">
            Ethically sourced, raw virgin hair — luxuriously soft, endlessly versatile, and built to move exactly like it's yours.
          </p>
        </div>

        {/* Bottom-right copy */}
        <div
          className="absolute bottom-10 sm:bottom-24 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[260px] flex flex-col items-start gap-4 sm:gap-5 hero-anim hero-fade z-50"
          style={{ animationDelay: '0.85s' }}
        >
          <p className="text-xs sm:text-sm text-[#FFF8F2]/85 leading-relaxed">
            Campaign 01 — The Half-Wig Edit. Comb-in, glueless, installed in sixty seconds. Your hairline breathes; your hair rests.
          </p>
        </div>
      </section>
    </>
  )
}
