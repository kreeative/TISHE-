import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import RevealLayer from './RevealLayer'
import { ctaLight, ctaTracking } from './cta'

const SPOTLIGHT_R = 260
const BASE_IMAGE = '/images/hero-base.jpg'
const REVEAL_IMAGE = '/images/hero-reveal.jpg'

const NAV_LINKS = [
  { label: 'Our Hair', href: '#about' },
  { label: 'Collections', href: '#collections' },
  { label: 'Contact', href: '#contact' },
]

export default function Hero() {
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 })
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
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
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchstart', onTouch, { passive: true })
    window.addEventListener('touchmove', onTouch, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })

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
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden h-screen bg-black"
      style={{ height: '100dvh' }}
    >
      {/* Base layer: jet-black hair */}
      <div
        className="absolute inset-0 hero-bg bg-cover bg-no-repeat hero-zoom z-10"
        style={{ backgroundImage: `url(${BASE_IMAGE})` }}
      />

      {/* Reveal layer: cursor-spotlight uncovers the 613 blonde version */}
      <RevealLayer image={REVEAL_IMAGE} cursorX={cursorPos.x} cursorY={cursorPos.y} radius={SPOTLIGHT_R} />

      {/* Scrim for text legibility */}
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none" />

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
          className="text-[#FFF8F2]/85 text-xs sm:text-sm md:text-base font-light uppercase mt-4 sm:mt-5 hero-anim hero-reveal"
          style={{ letterSpacing: '0.35em', animationDelay: '0.58s' }}
        >
          Luxury raw hair, redefined
        </span>
      </div>

      {/* Bottom-left copy */}
      <div className="hidden sm:block absolute bottom-14 max-w-[260px] hero-anim hero-fade z-50" style={{ left: '100px', animationDelay: '0.7s' }}>
        <p className="text-sm text-[#FFF8F2]/80 leading-relaxed">
          Ethically sourced, raw virgin hair — luxuriously soft, endlessly versatile, and built to move exactly like it's yours.
        </p>
      </div>

      {/* Bottom-right copy */}
      <div
        className="absolute bottom-10 sm:bottom-24 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[260px] flex flex-col items-start gap-4 sm:gap-5 hero-anim hero-fade z-50"
        style={{ animationDelay: '0.85s' }}
      >
        <p className="text-xs sm:text-sm text-[#FFF8F2]/80 leading-relaxed">
          Hand-selected raw bundles and wigs crafted for texture, shine, and hold. Wash day to slay day — hair built to last.
        </p>
      </div>

      {/* Nav */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 sm:p-5 transition-colors duration-300 ${
          scrolled ? 'bg-black/70 backdrop-blur-md' : ''
        }`}
      >
        <a href="#top" className="flex items-center">
          <img src="/images/logo-mark.webp" alt="The Ivory Sukundu" className="h-10 sm:h-14 w-auto" />
        </a>

        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-2 py-2 items-center gap-1">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-4 py-1.5 rounded-full text-sm font-medium text-white/80 hover:bg-white/20 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <a href="#collections" className={`hidden md:block ${ctaLight}`} style={ctaTracking}>
          Shop Now
        </a>

        <button
          className="md:hidden text-white p-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[90] bg-black flex flex-col items-center justify-center gap-8">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-[#FFF8F2] text-2xl font-display" onClick={() => setMenuOpen(false)}>
              {l.label}
            </a>
          ))}
          <a
            href="#collections"
            className={`${ctaLight} mt-4`}
            style={ctaTracking}
            onClick={() => setMenuOpen(false)}
          >
            Shop Now
          </a>
        </div>
      )}
    </section>
  )
}
