import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, type Product } from './StoreContext'
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

const STEPS: Step[] = [
  {
    question: 'How much time do you give your hair in the morning?',
    options: [
      { label: 'Five minutes, tops', detail: 'Snap it in and go', scores: { 'half-wig': 3 } },
      { label: 'Fifteen to twenty', detail: 'A quick style moment', scores: { 'half-wig': 1, 'deep-curl': 1 } },
      { label: 'I enjoy the ritual', detail: 'Hair time is me time', scores: { 'deep-curl': 1, 'ivory-613': 1 } },
    ],
  },
  {
    question: "What's your season looking like?",
    options: [
      { label: 'Gym and on the go', detail: 'Sweat-proof and breathable, please', scores: { 'half-wig': 2, 'deep-curl': 1 } },
      { label: 'Office polished', detail: 'Sleek, consistent, professional', scores: { 'half-wig': 2 } },
      { label: 'Event season, always', detail: 'Photos will be taken', scores: { 'ivory-613': 2, 'deep-curl': 1 } },
    ],
  },
  {
    question: 'Your dream texture?',
    options: [
      { label: 'Sleek and straight', detail: 'Glass hair, always', scores: { 'half-wig': 3 } },
      { label: 'Springy curls', detail: 'Volume with a bounce', scores: { 'deep-curl': 4 } },
      { label: 'Bold blonde', detail: '613 or nothing', scores: { 'ivory-613': 4 } },
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

const PRODUCTS: Record<string, Product & { why: string }> = {
  'half-wig': {
    id: 'half-wig',
    name: 'The Sukundu Half Wig',
    price: 265,
    image: '/images/tex-straight.jpg',
    why: 'Comb-in, glueless, and installed in sixty seconds — sleek raw straight hair that keeps up with a fast life while your own hair rests underneath.',
  },
  'deep-curl': {
    id: 'deep-curl',
    name: 'Raw Deep Curl',
    price: 125,
    image: '/images/tex-curls.jpg',
    why: 'Springy, wash-day-proof curls with serious volume — they revert every time and love an active routine.',
  },
  'ivory-613': {
    id: 'ivory-613',
    name: 'Ivory 613',
    price: 185,
    image: '/images/tex-blonde.jpg',
    why: 'True platinum blonde that owns every room and every photo — tone it icy or wear it golden.',
  },
}

export default function Quiz() {
  const { addToCart } = useStore()
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

  let result = PRODUCTS['half-wig']
  let recLength = '20"'
  if (done) {
    const totals: Record<string, number> = { 'half-wig': 0, 'deep-curl': 0, 'ivory-613': 0 }
    for (const p of picks) {
      for (const [id, s] of Object.entries(p.scores)) totals[id] += s
      if (p.length) recLength = p.length
    }
    const winner = Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0]
    result = PRODUCTS[winner]
  }

  return (
    <section className="bg-[#FFF8F2] text-[#1a120c] py-20 sm:py-28 px-5 sm:px-10 md:px-16 min-h-[70vh]">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.35em' }}>
          Sukundu School — 60-second quiz
        </p>

        {!done ? (
          <>
            <div className="flex gap-2 mt-6" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 transition-colors ${i <= step ? 'bg-[#5A3224]' : 'bg-[#5A3224]/15'}`}
                />
              ))}
            </div>

            <h2 className="font-display text-3xl sm:text-5xl mt-8 leading-[1.1]" style={{ textWrap: 'balance' }}>
              {STEPS[step].question}
            </h2>

            <div className="flex flex-col gap-3 mt-10">
              {STEPS[step].options.map((o) => (
                <button
                  key={o.label}
                  onClick={() => pick(o)}
                  className="group text-left border border-[#5A3224]/25 hover:border-[#5A3224] bg-white/50 px-6 py-5 transition-colors"
                >
                  <span className="block font-display text-xl group-hover:text-[#5A3224] transition-colors">{o.label}</span>
                  <span className="block text-sm text-[#1a120c]/60 mt-1">{o.detail}</span>
                </button>
              ))}
            </div>

            {step > 0 && (
              <button
                onClick={() => { setPicks(picks.slice(0, -1)); setStep(step - 1) }}
                className="mt-8 text-xs font-medium uppercase text-[#1a120c]/50 hover:text-[#5A3224] transition-colors"
                style={{ letterSpacing: '0.2em' }}
              >
                ← Back
              </button>
            )}
          </>
        ) : (
          <div className="mt-8">
            <h2 className="font-display text-3xl sm:text-5xl leading-[1.1]" style={{ textWrap: 'balance' }}>
              Your unit is waiting
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10 items-start">
              <img src={result.image} alt={result.name} className="w-full aspect-[4/5] object-cover" />
              <div className="flex flex-col items-start">
                <h3 className="font-display text-3xl">{result.name}</h3>
                <p className="text-xs font-semibold uppercase text-[#5A3224] mt-2" style={{ letterSpacing: '0.25em' }}>
                  Recommended length: {recLength}
                </p>
                <p className="mt-4 text-sm text-[#1a120c]/75 leading-relaxed">{result.why}</p>
                <button
                  className={`${ctaGlassOnLight} mt-8`}
                  style={ctaTracking}
                  onClick={() => addToCart({ id: result.id, name: result.name, price: result.price, image: result.image })}
                >
                  Add to Bag — ${result.price}
                </button>
                <div className="flex gap-6 mt-6">
                  <button
                    onClick={restart}
                    className="text-xs font-medium uppercase text-[#1a120c]/50 hover:text-[#5A3224] transition-colors"
                    style={{ letterSpacing: '0.2em' }}
                  >
                    Retake quiz
                  </button>
                  <Link
                    to="/collections"
                    className="text-xs font-medium uppercase text-[#1a120c]/50 hover:text-[#5A3224] transition-colors"
                    style={{ letterSpacing: '0.2em' }}
                  >
                    See everything
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
