import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import RevealLayer from './RevealLayer'
import { ctaTracking } from './cta'

const SPOTLIGHT_R = 260

export default function Hero() {
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 })
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
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-[#E5DCCE] h-[calc(100dvh-100px)] sm:h-[calc(100dvh-108px)]"
    >
      {/* Base layer: jet-black hair on champagne */}
      <div className="absolute inset-0 hero-bg hero-bg-base bg-cover bg-no-repeat hero-zoom z-10" />

      {/* Reveal layer: cursor-spotlight uncovers the 613 blonde version */}
      <RevealLayer cursorX={cursorPos.x} cursorY={cursorPos.y} radius={SPOTLIGHT_R} />

      {/* Wordmark + CTA — left on desktop, top on small portrait screens */}
      <div className="absolute z-50 flex flex-col items-center sm:items-start text-center sm:text-left pointer-events-none top-10 left-1/2 -translate-x-1/2 w-full px-6 sm:px-0 sm:w-auto sm:top-1/2 sm:left-[72px] lg:left-[96px] sm:-translate-x-0 sm:-translate-y-1/2">
        <h1 className="m-0">
          <span className="sr-only">The Ivory Sukundu, Hair Extensions</span>
          <img
            src="/images/logo-lockup-brown.png"
            alt=""
            className="w-[64vw] max-w-[280px] sm:w-[320px] sm:max-w-none lg:w-[380px] xl:w-[420px] h-auto hero-anim hero-reveal"
            style={{ animationDelay: '0.25s' }}
          />
        </h1>
        <Link
          to="/collections"
          className="pointer-events-auto inline-block text-xs font-semibold uppercase px-10 py-3.5 mt-8 sm:mt-10 text-center bg-[#FAF7F3]/90 border border-[#5A3224]/15 text-[#1B1113] shadow-[0_10px_30px_-14px_rgba(90,50,36,0.45)] backdrop-blur-sm transition-all duration-300 ease-out hover:bg-[#FAF7F3] hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-12px_rgba(90,50,36,0.5)] active:translate-y-0 hero-anim hero-fade"
          style={{ ...ctaTracking, animationDelay: '0.6s' }}
        >
          Shop Now
        </Link>
      </div>

    </section>
  )
}
