import { ctaGlassOnLight, ctaTracking } from './cta'

const FACTS = [
  ['60 sec', 'comb-in install, zero glue'],
  ['90%', 'less daily manipulation than a sew-in'],
  ['1 yr+', 'of wear from a single unit'],
]

export default function Campaign() {
  return (
    <section className="bg-[#FFF8F2] text-[#1a120c] py-20 sm:py-24 px-5 sm:px-10 md:px-16 border-b border-[#5A3224]/10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div>
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
          <a href="#collections" className={`${ctaGlassOnLight} mt-8`} style={ctaTracking}>
            Shop the Half-Wig
          </a>
        </div>
        <dl className="grid grid-cols-3 gap-6 md:gap-8">
          {FACTS.map(([stat, label]) => (
            <div key={stat} className="flex flex-col gap-2 border-t border-[#5A3224]/40 pt-4">
              <dt className="sr-only">{label}</dt>
              <dd className="font-display text-3xl sm:text-4xl" style={{ fontVariantNumeric: 'tabular-nums' }}>{stat}</dd>
              <dd className="text-xs text-[#1a120c]/65 leading-relaxed">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
