import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Reveal from './Reveal'

// y = where the length lands on the reference photo, as % of image height
const LENGTHS = [
  { inches: 10, lands: 'Nape', bundles: '2 bundles', note: 'Crisp, editorial, zero-fuss mornings.', y: 24 },
  { inches: 12, lands: 'Shoulder', bundles: '2 bundles', note: 'The perfect blunt-cut bob territory.', y: 29 },
  { inches: 14, lands: 'Collarbone', bundles: '2–3 bundles', note: 'Snappy, weightless, everyday-easy.', y: 31.5 },
  { inches: 16, lands: 'Armpit', bundles: '3 bundles', note: 'The "is that all hers?" sweet spot.', y: 35 },
  { inches: 18, lands: 'Bra strap', bundles: '3 bundles', note: 'Movement without the maintenance.', y: 41 },
  { inches: 20, lands: 'Below bra strap', bundles: '3 bundles', note: 'Our best-selling length, hands down.', y: 45 },
  { inches: 22, lands: 'Mid-back', bundles: '3–4 bundles', note: 'Full glam that still whips into a bun.', y: 49 },
  { inches: 24, lands: 'Low back', bundles: '3–4 bundles', note: 'Drama that behaves on a work day.', y: 53 },
  { inches: 26, lands: 'Waist', bundles: '4 bundles', note: 'Statement length. Bring a silk scarf.', y: 57 },
  { inches: 28, lands: 'Low waist', bundles: '4 bundles', note: 'Mermaid energy, fully committed.', y: 60.5 },
  { inches: 30, lands: 'Hip', bundles: '4+ bundles', note: 'Maximum drama. You already know.', y: 64 },
  { inches: 32, lands: 'Below hip', bundles: '4–5 bundles', note: 'Red-carpet length. Book the photographer.', y: 68 },
  { inches: 34, lands: 'Tailbone', bundles: '5 bundles', note: 'Rapunzel called. She wants tips.', y: 71 },
  { inches: 36, lands: 'Upper thigh', bundles: '5 bundles', note: 'Runway-only? Says who.', y: 74 },
  { inches: 38, lands: 'Thigh', bundles: '5+ bundles', note: 'Gravity is officially jealous.', y: 80 },
  { inches: 40, lands: 'Mid-thigh', bundles: '5+ bundles', note: 'The grand finale. Custom-order length.', y: 86 },
]

export default function LengthGuide() {
  const [selected, setSelected] = useState(LENGTHS[5])

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

          {/* photo gauge: marker line tracks the selected length on a real back view */}
          <div className="flex justify-center md:justify-end" aria-hidden="true">
            <div className="relative">
              <img
                src="/images/length-model.jpg"
                alt=""
                className="h-[540px] sm:h-[660px] w-auto select-none"
                draggable={false}
                style={{
                  maskImage:
                    'linear-gradient(180deg, transparent 0%, black 6%, black 88%, transparent 100%), linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
                  maskComposite: 'intersect',
                  WebkitMaskImage:
                    'linear-gradient(180deg, transparent 0%, black 6%, black 88%, transparent 100%), linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
                  WebkitMaskComposite: 'source-in',
                }}
              />
              <motion.div
                className="absolute left-0 right-0 pointer-events-none"
                initial={false}
                animate={{ top: `${selected.y}%` }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="h-px bg-[#FAF7F3] shadow-[0_1px_4px_rgba(27,17,19,0.55)]" />
                <span
                  className="absolute right-0 top-0 -translate-y-1/2 bg-[#5A3224] text-[#FAF7F3] text-[10px] font-semibold uppercase px-2.5 py-1 whitespace-nowrap"
                  style={{ letterSpacing: '0.12em' }}
                >
                  {selected.inches}" · {selected.lands}
                </span>
              </motion.div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.25}>
          <p className="mt-12 text-xs font-medium text-[#1B1113]/55 max-w-md leading-[1.85]">
            Texture tip: hair is measured stretched straight. Body wave wears about 2" shorter and
            deep curl about 4" shorter than the number on the bundle.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
