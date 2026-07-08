import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import RevealLayer from './RevealLayer'

const SPOTLIGHT_R = 260
const HERO_IMAGE = '/images/hero-curls.jpg'

export default function Hero() {
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 })
  const [menuOpen, setMenuOpen] = useState(false)
  const mouse = useRef({ x: -999, y: -999 })
  const smooth = useRef({ x: -999, y: -999 })
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
    }
    window.addEventListener('mousemove', onMove)

    const loop = () => {
      smooth.current.x += (mouse.current.x - smooth.current.x) * 0.1
      smooth.current.y += (mouse.current.y - smooth.current.y) * 0.1
      setCursorPos({ x: smooth.current.x, y: smooth.current.y })
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white tracking-[-0.02em]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <section className="relative w-full overflow-hidden h-screen bg-black" style={{ height: '100dvh' }}>
        {/* Base layer: desaturated editorial still */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat hero-zoom z-10"
          style={{ backgroundImage: `url(${HERO_IMAGE})`, filter: 'grayscale(1) contrast(1.1) brightness(0.85)' }}
        />

        {/* Reveal layer: cursor-spotlight uncovers full color */}
        <RevealLayer image={HERO_IMAGE} cursorX={cursorPos.x} cursorY={cursorPos.y} radius={SPOTLIGHT_R} />

        {/* Scrim for text legibility */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/70 via-black/10 to-black/40 pointer-events-none" />

        {/* Heading */}
        <div
          className="absolute top-1/2 -translate-y-1/2 flex flex-col items-start text-left px-5 pointer-events-none z-50"
          style={{ left: '80px' }}
        >
          <h1 className="text-[#FFF8F2] leading-[0.95]">
            <span
              className="block font-display italic font-normal text-5xl sm:text-7xl md:text-8xl hero-anim hero-reveal"
              style={{ letterSpacing: '-0.05em', animationDelay: '0.25s' }}
            >
              The Ivory
            </span>
            <span
              className="block font-display font-normal text-5xl sm:text-7xl md:text-8xl -mt-1 hero-anim hero-reveal"
              style={{ letterSpacing: '-0.08em', animationDelay: '0.42s' }}
            >
              SUKUNDU
            </span>
          </h1>
          <span
            className="font-display italic text-[#FFF8F2]/90 text-base sm:text-lg md:text-xl mt-3 sm:mt-4 hero-anim hero-reveal"
            style={{ letterSpacing: '-0.02em', animationDelay: '0.58s' }}
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
        <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 sm:p-5">
          <a href="#" className="flex items-center">
            <img src="/images/logo-mark.webp" alt="The Ivory Sukundu" className="h-9 sm:h-11 w-auto" />
          </a>

          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-2 py-2 items-center gap-1">
            <button className="px-4 py-1.5 rounded-full text-sm font-medium text-white">About</button>
            <button className="px-4 py-1.5 rounded-full text-sm font-medium text-white/80 hover:bg-white/20 hover:text-white transition-colors">
              Collections
            </button>
            <button className="px-4 py-1.5 rounded-full text-sm font-medium text-white/80 hover:bg-white/20 hover:text-white transition-colors">
              Contact
            </button>
          </div>

          <button className="hidden md:block bg-[#FFF8F2] text-black text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-white transition-colors">
            Shop Now
          </button>

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
            <button className="text-[#FFF8F2] text-2xl font-display" onClick={() => setMenuOpen(false)}>About</button>
            <button className="text-[#FFF8F2] text-2xl font-display" onClick={() => setMenuOpen(false)}>Collections</button>
            <button className="text-[#FFF8F2] text-2xl font-display" onClick={() => setMenuOpen(false)}>Contact</button>
            <button className="bg-[#FFF8F2] text-black text-sm font-semibold px-6 py-2.5 rounded-full mt-4">Shop Now</button>
          </div>
        )}
      </section>
    </div>
  )
}
