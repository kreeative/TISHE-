import { useStore } from './StoreContext'
import { ctaGlassOnLight, ctaTracking } from './cta'

const TIERS = [
  {
    name: 'Ivory',
    threshold: 'Free to join',
    perks: [
      'Every $1 earns 1 strand — 200 strands is $20 off',
      'Early access to drops and restocks',
      'Sukundu School: care guides and install tutorials',
      'A gift on your birthday, always',
    ],
  },
  {
    name: 'Gold',
    threshold: 'After $500',
    perks: [
      'Everything in Ivory',
      'Free express shipping, every order',
      'Member pricing on campaign launches',
      'Annual silk maintenance kit, gifted',
    ],
  },
  {
    name: 'Heritage',
    threshold: 'After $1,200',
    perks: [
      'Everything in Gold',
      'One-on-one texture consultation',
      'Yearly unit revamp service, on us',
      'Anniversary bundle gifted every year',
    ],
  },
]

export default function Circle() {
  const { setAccountOpen } = useStore()

  return (
    <section id="circle" className="bg-[#FFF8F2] text-[#1a120c] py-20 sm:py-28 px-5 sm:px-10 md:px-16 border-b border-[#5A3224]/10">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.35em' }}>
          The Sukundu Circle
        </p>
        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mt-4 max-w-2xl leading-[1.05]" style={{ textWrap: 'balance' }}>
          Loyalty, woven in
        </h2>
        <p className="mt-5 max-w-lg text-sm sm:text-base text-[#1a120c]/75 leading-relaxed">
          Sukundu means hair in Pulaar — and in our culture, hair is cared for in community. The Circle
          is ours: earn strands on every order, learn the craft, and grow into richer rewards.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 sm:mt-16">
          {TIERS.map((tier, i) => (
            <div
              key={tier.name}
              className={`flex flex-col p-7 border bg-white/50 ${
                i === 2 ? 'border-[#5A3224]' : 'border-[#5A3224]/25'
              }`}
            >
              <h3 className="font-display text-3xl">{tier.name}</h3>
              <p className="text-xs font-semibold uppercase text-[#5A3224] mt-1" style={{ letterSpacing: '0.25em' }}>
                {tier.threshold}
              </p>
              <ul className="mt-6 flex flex-col gap-3 text-sm text-[#1a120c]/75 leading-relaxed">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex gap-3">
                    <span className="text-[#5A3224] shrink-0">—</span>
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <button className={`${ctaGlassOnLight} mt-10`} style={ctaTracking} onClick={() => setAccountOpen(true)}>
          Join the Circle — Free
        </button>
      </div>
    </section>
  )
}
