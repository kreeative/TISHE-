import { Link } from 'react-router-dom'
import { ctaGlassOnLight, ctaTracking } from './cta'
import Reveal from './Reveal'

const FACTS = [
  ['60 sec', 'comb-in install, zero glue'],
  ['90%', 'less daily manipulation than a sew-in'],
  ['1 yr+', 'of wear from a single unit'],
]

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
      <div className="relative max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        <Reveal>
          <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.35em' }}>
            Campaign 01 — The Half-Wig Edit
          </p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mt-4 leading-[1.05]" style={{ textWrap: 'balance' }}>
            Half the install. All the hair.
          </h2>
          <p className="mt-5 max-w-md text-sm sm:text-base text-[#1a120c]/75 leading-relaxed">
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
        <dl className="grid grid-cols-3 gap-6 md:gap-8">
          {FACTS.map(([stat, label], i) => (
            <Reveal key={stat} delay={0.1 + i * 0.1} className="flex flex-col gap-2">
              <div
                className="h-px w-full"
                style={{ background: 'linear-gradient(90deg, rgba(90,50,36,0.55), rgba(90,50,36,0.05))' }}
              />
              <div className="pt-4 flex flex-col gap-2 backdrop-blur-[2px]">
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-3xl sm:text-4xl" style={{ fontVariantNumeric: 'tabular-nums' }}>{stat}</dd>
                <dd className="text-xs text-[#1a120c]/65 leading-relaxed">{label}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  )
}
