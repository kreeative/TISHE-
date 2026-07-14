import { Link } from 'react-router-dom'
import { ctaGlassOnLight, ctaTracking } from './cta'
import Reveal from './Reveal'

export default function Campaign() {
  return (
    <section
      className="relative overflow-hidden text-[#1a120c] py-20 sm:py-24 px-5 sm:px-10 md:px-16 border-b border-[#5A3224]/10"
      style={{ background: 'radial-gradient(120% 140% at 15% 0%, #FFFDFA 0%, #FFF8F2 45%, #FBEEE1 100%)' }}
    >
      <div
        className="pointer-events-none absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(90,50,36,0.16) 0%, rgba(90,50,36,0) 70%)' }}
      />
      <div className="relative max-w-3xl mx-auto">
        <Reveal>
          <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.35em' }}>
            Campaign 01 — The Half-Wig Edit
          </p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mt-5 leading-[1.16]" style={{ textWrap: 'balance' }}>
            Half the install. All the hair.
          </h2>
          <p className="mt-6 max-w-md text-sm sm:text-base text-[#1a120c]/75 leading-[1.85]">
            Our signature half wig snaps in with combs — no glue, no lace, no salon chair. Your leave-out
            blends at the crown, your hairline breathes, and your natural hair rests protected underneath.
          </p>
          <div className="flex flex-wrap items-center gap-6 mt-8">
            <Link to="/collections" className={ctaGlassOnLight} style={ctaTracking}>
              Shop the Half-Wig
            </Link>
            <Link
              to="/quiz"
              className="text-xs font-semibold uppercase text-[#5A3224] hover:text-[#1a120c] transition-colors"
              style={ctaTracking}
            >
              Not sure? Take the quiz →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
