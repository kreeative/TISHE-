import { useEffect, useRef, useState } from 'react'
import RevealLayer from './RevealLayer'

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
      className="relative w-full overflow-hidden bg-black h-[calc(100dvh-64px)] sm:h-[calc(100dvh-72px)]"
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
  )
}
