import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './StoreContext'
import { useProducts } from '../lib/useProducts'
import type { ShopifyProduct } from '../lib/shopify'
import { ctaGlassOnLight, ctaTracking } from './cta'

interface Option {
  label: string
  detail: string
  scores: Record<string, number>
  length?: string
}

interface Step {
  question: string
  options: Option[]
}

const ARCHETYPES = {
  straight: { keywords: ['straight', 'half wig', 'half-wig', 'sleek'], why: 'Comb-in, glueless, and installed in sixty seconds. Sleek raw hair that keeps up with a fast life while your own hair rests underneath.' },
  curl: { keywords: ['curl', 'curly', 'wave'], why: 'Springy, wash-day-proof texture with serious volume. It reverts every time and loves an active routine.' },
  blonde: { keywords: ['613', 'blonde', 'ivory'], why: 'True platinum blonde that owns every room and every photo. Tone it icy or wear it golden.' },
} as const

type Archetype = keyof typeof ARCHETYPES

const STEPS: Step[] = [
  {
    question: 'How much time do you give your hair in the morning?',
    options: [
      { label: 'Five minutes, tops', detail: 'Snap it in and go', scores: { straight: 3 } },
      { label: 'Fifteen to twenty', detail: 'A quick style moment', scores: { straight: 1, curl: 1 } },
      { label: 'I enjoy the ritual', detail: 'Hair time is me time', scores: { curl: 1, blonde: 1 } },
    ],
  },
  {
    question: "What's your season looking like?",
    options: [
      { label: 'Gym and on the go', detail: 'Sweat-proof and breathable, please', scores: { straight: 2, curl: 1 } },
      { label: 'Office polished', detail: 'Sleek, consistent, professional', scores: { straight: 2 } },
      { label: 'Event season, always', detail: 'Photos will be taken', scores: { blonde: 2, curl: 1 } },
    ],
  },
  {
    question: 'Your dream texture?',
    options: [
      { label: 'Sleek and straight', detail: 'Glass hair, always', scores: { straight: 3 } },
      { label: 'Springy curls', detail: 'Volume with a bounce', scores: { curl: 4 } },
      { label: 'Bold blonde', detail: '613 or nothing', scores: { blonde: 4 } },
    ],
  },
  {
    question: 'How long are we going?',
    options: [
      { label: 'Short and snappy', detail: '10" – 16"', scores: {}, length: '14"' },
      { label: 'The classic zone', detail: '18" – 24"', scores: {}, length: '22"' },
      { label: 'Maximum drama', detail: '26" – 40"', scores: {}, length: '28"' },
    ],
  },
]

function matchProduct(products: ShopifyProduct[], archetype: Archetype): ShopifyProduct | undefined {
  const { keywords } = ARCHETYPES[archetype]
  return products.find((p) => {
    const haystack = `${p.title} ${p.tags.join(' ')}`.toLowerCase()
    return keywords.some((k) => haystack.includes(k))
  })
}

function formatMoney(amount: string, currencyCode: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(Number(amount))
}

export default function Quiz() {
  const { addToCart, cartLoading } = useStore()
  const { products, loading: productsLoading } = useProducts()
  const [step, setStep] = useState(0)
  const [picks, setPicks] = useState<Option[]>([])

  const pick = (o: Option) => {
    const next = [...picks, o]
    setPicks(next)
    setStep(step + 1)
  }

  const restart = () => {
    setPicks([])
    setStep(0)
  }

  const done = step >= STEPS.length

  let recLength = '20"'
  let result: ShopifyProduct | undefined
  let why = ''
  if (done) {
    const totals: Record<Archetype, number> = { straight: 0, curl: 0, blonde: 0 }
    for (const p of picks) {
      for (const [id, s] of Object.entries(p.scores)) totals[id as Archetype] += s
      if (p.length) recLength = p.length
    }
    const winner = (Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0] ?? 'straight') as Archetype
    result = matchProduct(products, winner) ?? products[0]
    why = ARCHETYPES[winner].why
  }

  const lengthMatch = result?.variants.find(
    (v) => v.availableForSale && v.selectedOptions.some((o) => o.name.toLowerCase() === 'length' && o.value === recLength)
  )
  const resultVariant = lengthMatch ?? result?.variants.find((v) => v.availableForSale) ?? result?.variants[0]

  return (
    <section
      className="relative overflow-hidden text-[#1B1113] py-20 sm:py-28 px-5 sm:px-10 md:px-16 min-h-[70vh]"
      style={{ background: 'radial-gradient(120% 130% at 50% 0%, #FFFDFA 0%, #FAF7F3 55%, #F7E9DA 100%)' }}
    >
      <div className="max-w-2xl mx-auto">
        <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.06em' }}>
          Sukundu School · 60-second quiz
        </p>

        <div className="flex gap-2 mt-6" aria-label={`Step ${Math.min(step + 1, STEPS.length)} of ${STEPS.length}`}>
          {STEPS.map((_, i) => (
            <span key={i} className="h-1 flex-1 bg-[#5A3224]/15 overflow-hidden">
              <motion.span
                className="block h-full bg-[#5A3224]"
                initial={false}
                animate={{ width: i <= step ? '100%' : '0%' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </span>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="font-display text-3xl sm:text-5xl mt-8 leading-[1.18]" style={{ textWrap: 'balance' }}>
                {STEPS[step].question}
              </h2>

              <div className="flex flex-col gap-3 mt-10">
                {STEPS[step].options.map((o, i) => (
                  <motion.button
                    key={o.label}
                    onClick={() => pick(o)}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -2 }}
                    className="group text-left border border-[#5A3224]/25 hover:border-[#5A3224] bg-white/45 backdrop-blur-sm hover:bg-white/75 hover:shadow-[0_16px_36px_-18px_rgba(90,50,36,0.4)] px-6 py-5 transition-colors duration-300"
                  >
                    <span className="block font-display text-xl group-hover:text-[#5A3224] transition-colors">{o.label}</span>
                    <span className="block text-sm text-[#1B1113]/60 mt-1">{o.detail}</span>
                  </motion.button>
                ))}
              </div>

              {step > 0 && (
                <button
                  onClick={() => { setPicks(picks.slice(0, -1)); setStep(step - 1) }}
                  className="mt-8 text-xs font-medium uppercase text-[#1B1113]/50 hover:text-[#5A3224] transition-colors"
                  style={{ letterSpacing: '0.08em' }}
                >
                  ← Back
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8"
            >
              <h2 className="font-display text-3xl sm:text-5xl leading-[1.18]" style={{ textWrap: 'balance' }}>
                Your unit is waiting
              </h2>

              {productsLoading ? (
                <p className="mt-10 text-sm text-[#1B1113]/50">Finding your match…</p>
              ) : !result ? (
                <p className="mt-10 text-sm text-[#1B1113]/50 max-w-md">
                  The shop isn't connected yet. Once products are live, your match will appear here.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10 items-start">
                  <div className="overflow-hidden shadow-[0_20px_50px_-24px_rgba(90,50,36,0.5)]">
                    {result.featuredImage && (
                      <img src={result.featuredImage.url} alt={result.title} className="w-full aspect-[4/5] object-cover" />
                    )}
                  </div>
                  <div className="flex flex-col items-start">
                    <h3 className="font-display text-3xl">{result.title}</h3>
                    <p className="text-xs font-semibold uppercase text-[#5A3224] mt-2" style={{ letterSpacing: '0.1em' }}>
                      Recommended length: {recLength}
                    </p>
                    <p className="mt-4 text-sm text-[#1B1113]/75 leading-[1.85]">{why}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-8">
                      <button
                        className={ctaGlassOnLight}
                        style={ctaTracking}
                        disabled={!resultVariant || cartLoading}
                        onClick={() => resultVariant && addToCart(resultVariant.id)}
                      >
                        Add to Bag{resultVariant ? ` · ${formatMoney(resultVariant.price.amount, resultVariant.price.currencyCode)}` : ''}
                      </button>
                      <Link
                        to={`/products/${result.handle}`}
                        className="text-xs font-semibold uppercase text-[#5A3224] hover:text-[#1B1113] transition-colors"
                        style={{ letterSpacing: '0.08em' }}
                      >
                        Customize length →
                      </Link>
                    </div>
                    <div className="flex gap-6 mt-6">
                      <button
                        onClick={restart}
                        className="text-xs font-medium uppercase text-[#1B1113]/50 hover:text-[#5A3224] transition-colors"
                        style={{ letterSpacing: '0.08em' }}
                      >
                        Retake quiz
                      </button>
                      <Link
                        to="/collections"
                        className="text-xs font-medium uppercase text-[#1B1113]/50 hover:text-[#5A3224] transition-colors"
                        style={{ letterSpacing: '0.08em' }}
                      >
                        See everything
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
