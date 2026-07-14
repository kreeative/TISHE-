import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Reveal from './Reveal'

const LENGTHS = [
  { inches: 10, lands: 'Nape', bundles: '2 bundles', note: 'Crisp, editorial, zero-fuss mornings.' },
  { inches: 12, lands: 'Shoulder', bundles: '2 bundles', note: 'The perfect blunt-cut bob territory.' },
  { inches: 14, lands: 'Collarbone', bundles: '2–3 bundles', note: 'Snappy, weightless, everyday-easy.' },
  { inches: 16, lands: 'Armpit', bundles: '3 bundles', note: 'The "is that all hers?" sweet spot.' },
  { inches: 18, lands: 'Bra strap', bundles: '3 bundles', note: 'Movement without the maintenance.' },
  { inches: 20, lands: 'Below bra strap', bundles: '3 bundles', note: 'Our best-selling length, hands down.' },
  { inches: 22, lands: 'Mid-back', bundles: '3–4 bundles', note: 'Full glam that still whips into a bun.' },
  { inches: 24, lands: 'Low back', bundles: '3–4 bundles', note: 'Drama that behaves on a work day.' },
  { inches: 26, lands: 'Waist', bundles: '4 bundles', note: 'Statement length — bring a silk scarf.' },
  { inches: 28, lands: 'Low waist', bundles: '4 bundles', note: 'Mermaid energy, fully committed.' },
  { inches: 30, lands: 'Hip', bundles: '4+ bundles', note: 'Maximum drama. You already know.' },
  { inches: 32, lands: 'Below hip', bundles: '4–5 bundles', note: 'Red-carpet length. Book the photographer.' },
  { inches: 34, lands: 'Tailbone', bundles: '5 bundles', note: 'Rapunzel called — she wants tips.' },
  { inches: 36, lands: 'Upper thigh', bundles: '5 bundles', note: 'Runway-only? Says who.' },
  { inches: 38, lands: 'Thigh', bundles: '5+ bundles', note: 'Gravity is officially jealous.' },
  { inches: 40, lands: 'Mid-thigh', bundles: '5+ bundles', note: 'The grand finale. Custom-order length.' },
]

export default function LengthGuide() {
  const [selected, setSelected] = useState(LENGTHS[5])
  const maxIn = LENGTHS[LENGTHS.length - 1].inches

  return (
    <section id="lengths" className="bg-[#FAF7F3] text-[#1B1113] py-20 sm:py-28 px-5 sm:px-10 md:px-16 border-b border-[#5A3224]/10">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.35em' }}>
            Sukundu School
          </p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mt-6 max-w-2xl leading-[1.16]" style={{ textWrap: 'balance' }}>
            Find your length
          </h2>
          <p className="mt-6 max-w-md text-sm sm:text-base text-[#1B1113]/75 leading-[1.85]">
            Tap a length to see where it lands and how many bundles build the look.
          </p>
        </Reveal>

        <Reveal delay={0.15} className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 mt-12 items-start">
          <div>
            <div className="flex flex-wrap gap-2">
              {LENGTHS.map((l) => {
                const active = selected.inches === l.inches
                return (
                  <button
                    key={l.inches}
                    onClick={() => setSelected(l)}
                    aria-pressed={active}
                    className={`px-5 py-2.5 text-xs font-semibold border transition-all duration-300 ${
                      active
                        ? 'bg-[#5A3224] border-[#5A3224] text-[#FAF7F3] shadow-[0_8px_22px_-8px_rgba(90,50,36,0.6)] -translate-y-0.5'
                        : 'bg-white/40 backdrop-blur-sm border-[#5A3224]/25 text-[#1B1113]/65 hover:border-[#5A3224] hover:text-[#1B1113] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-8px_rgba(90,50,36,0.35)]'
                    }`}
                    style={{ letterSpacing: '0.15em', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {l.inches}"
                  </button>
                )
              })}
            </div>

            <div className="mt-10 border-t border-[#5A3224]/15 pt-8 min-h-[150px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected.inches}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-baseline gap-4">
                    <span className="font-display text-6xl sm:text-7xl" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {selected.inches}"
                    </span>
                    <span className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.3em' }}>
                      lands at {selected.lands}
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-[#1B1113]/75 leading-[1.85] max-w-sm">{selected.note}</p>
                  <p className="mt-3 text-xs font-semibold uppercase text-[#1B1113]/55" style={{ letterSpacing: '0.2em' }}>
                    Full look: {selected.bundles}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* length gauge — swaps for the campaign visual when it's ready */}
          <div className="flex flex-col gap-3" aria-hidden="true">
            {LENGTHS.map((l) => {
              const active = selected.inches === l.inches
              return (
                <button key={l.inches} onClick={() => setSelected(l)} className="group flex items-center gap-4 text-left">
                  <span
                    className={`text-xs w-8 shrink-0 transition-colors ${
                      active ? 'text-[#5A3224] font-semibold' : 'text-[#1B1113]/45 group-hover:text-[#1B1113]/75'
                    }`}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {l.inches}"
                  </span>
                  <span className="relative h-px flex-1 bg-[#5A3224]/15 overflow-hidden">
                    <motion.span
                      className="absolute inset-y-0 left-0 bg-[#5A3224]"
                      initial={false}
                      animate={{ width: `${(l.inches / maxIn) * 100}%`, opacity: active ? 1 : 0.45 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </span>
                  <span
                    className={`text-xs whitespace-nowrap transition-colors ${
                      active ? 'text-[#1B1113] font-medium' : 'text-[#1B1113]/45 group-hover:text-[#1B1113]/75'
                    }`}
                  >
                    {l.lands}
                  </span>
                </button>
              )
            })}
          </div>
        </Reveal>

        <Reveal delay={0.25}>
          <p className="mt-12 text-xs font-medium text-[#1B1113]/55 max-w-md leading-[1.85]">
            Texture tip: hair is measured stretched straight — body wave wears about 2" shorter and
            deep curl about 4" shorter than the number on the bundle.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
