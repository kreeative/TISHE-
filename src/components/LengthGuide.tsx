import { useState } from 'react'

const LENGTHS = [
  { inches: 14, lands: 'Shoulder', bundles: '2–3 bundles', note: 'Snappy, weightless, everyday-easy.' },
  { inches: 16, lands: 'Collarbone', bundles: '3 bundles', note: 'The "is that all hers?" sweet spot.' },
  { inches: 18, lands: 'Armpit', bundles: '3 bundles', note: 'Movement without the maintenance.' },
  { inches: 20, lands: 'Bra strap', bundles: '3 bundles', note: 'Our best-selling length, hands down.' },
  { inches: 22, lands: 'Mid-back', bundles: '3–4 bundles', note: 'Full glam that still whips into a bun.' },
  { inches: 26, lands: 'Waist', bundles: '4 bundles', note: 'Statement length — bring a silk scarf.' },
  { inches: 30, lands: 'Hip', bundles: '4+ bundles', note: 'Maximum drama. You already know.' },
]

export default function LengthGuide() {
  const [selected, setSelected] = useState(LENGTHS[3])
  const maxIn = LENGTHS[LENGTHS.length - 1].inches

  return (
    <section id="lengths" className="bg-black text-[#FFF8F2] py-20 sm:py-28 px-5 sm:px-10 md:px-16">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-medium uppercase text-[#FFF8F2]/60" style={{ letterSpacing: '0.35em' }}>
          Sukundu School
        </p>
        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mt-4 max-w-2xl leading-[1.05]" style={{ textWrap: 'balance' }}>
          Find your length
        </h2>
        <p className="mt-5 max-w-md text-sm sm:text-base text-[#FFF8F2]/70 leading-relaxed">
          Tap a length to see where it lands and how many bundles build the look.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 mt-12 items-start">
          <div>
            <div className="flex flex-wrap gap-2">
              {LENGTHS.map((l) => (
                <button
                  key={l.inches}
                  onClick={() => setSelected(l)}
                  aria-pressed={selected.inches === l.inches}
                  className={`px-5 py-2.5 text-xs font-semibold backdrop-blur-md border transition-colors ${
                    selected.inches === l.inches
                      ? 'bg-white/25 border-white/50 text-white'
                      : 'bg-white/5 border-white/20 text-[#FFF8F2]/60 hover:bg-white/15 hover:text-[#FFF8F2]'
                  }`}
                  style={{ letterSpacing: '0.15em', fontVariantNumeric: 'tabular-nums' }}
                >
                  {l.inches}"
                </button>
              ))}
            </div>

            <div className="mt-10 border-t border-[#FFF8F2]/10 pt-8">
              <div className="flex items-baseline gap-4">
                <span className="font-display text-6xl sm:text-7xl" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {selected.inches}"
                </span>
                <span className="text-xs uppercase text-[#c99b6f]" style={{ letterSpacing: '0.3em' }}>
                  lands at {selected.lands}
                </span>
              </div>
              <p className="mt-4 text-sm text-[#FFF8F2]/70 leading-relaxed max-w-sm">{selected.note}</p>
              <p className="mt-3 text-xs uppercase text-[#FFF8F2]/50" style={{ letterSpacing: '0.2em' }}>
                Full look: {selected.bundles}
              </p>
            </div>
          </div>

          {/* length gauge — swaps for the campaign visual when it's ready */}
          <div className="flex flex-col gap-3" aria-hidden="true">
            {LENGTHS.map((l) => (
              <button key={l.inches} onClick={() => setSelected(l)} className="group flex items-center gap-4 text-left">
                <span
                  className={`text-xs w-8 shrink-0 transition-colors ${
                    selected.inches === l.inches ? 'text-[#c99b6f]' : 'text-[#FFF8F2]/40 group-hover:text-[#FFF8F2]/70'
                  }`}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {l.inches}"
                </span>
                <span
                  className={`h-px transition-all duration-500 ${
                    selected.inches === l.inches ? 'bg-[#c99b6f]' : 'bg-[#FFF8F2]/20 group-hover:bg-[#FFF8F2]/40'
                  }`}
                  style={{ width: `${(l.inches / maxIn) * 100}%` }}
                />
                <span
                  className={`text-xs whitespace-nowrap transition-colors ${
                    selected.inches === l.inches ? 'text-[#FFF8F2]' : 'text-[#FFF8F2]/40 group-hover:text-[#FFF8F2]/70'
                  }`}
                >
                  {l.lands}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
