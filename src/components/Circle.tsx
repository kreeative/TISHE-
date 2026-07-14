import { useStore } from './StoreContext'
import { ctaGlassOnLight, ctaTracking } from './cta'
import Reveal from './Reveal'

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
    featured: true,
  },
]

export default function Circle() {
  const { setAccountOpen } = useStore()

  return (
    <section
      id="circle"
      className="relative overflow-hidden text-[#1a120c] py-20 sm:py-28 px-5 sm:px-10 md:px-16 border-b border-[#5A3224]/10"
      style={{ background: 'radial-gradient(120% 130% at 50% 0%, #FFFDFA 0%, #FFF8F2 55%, #F7E9DA 100%)' }}
    >
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.35em' }}>
            The Sukundu Circle
          </p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mt-6 max-w-2xl leading-[1.16]" style={{ textWrap: 'balance' }}>
            Loyalty, woven in
          </h2>
          <p className="mt-6 max-w-lg text-sm sm:text-base text-[#1a120c]/75 leading-[1.85]">
            Sukundu means hair in Pulaar — and in our culture, hair is cared for in community. The Circle
            is ours: earn strands on every order, learn the craft, and grow into richer rewards.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 sm:mt-16 md:items-end">
          {TIERS.map((tier, i) => (
            <Reveal key={tier.name} delay={0.1 + i * 0.12}>
              <div
                className={`group relative flex flex-col p-7 border backdrop-blur-md transition-all duration-500 hover:-translate-y-1 ${
                  tier.featured
                    ? 'border-[#5A3224] bg-gradient-to-b from-white/80 to-[#FBEEE1]/70 shadow-[0_20px_50px_-20px_rgba(90,50,36,0.45)] md:py-9'
                    : 'border-[#5A3224]/25 bg-white/45 hover:bg-white/65 hover:shadow-[0_16px_40px_-20px_rgba(90,50,36,0.3)]'
                }`}
              >
                {tier.featured && (
                  <span
                    className="absolute -top-3 left-7 bg-[#5A3224] text-[#FFF8F2] text-[10px] font-semibold uppercase px-3 py-1 shadow-[0_6px_16px_-4px_rgba(90,50,36,0.5)]"
                    style={{ letterSpacing: '0.2em' }}
                  >
                    Most Rewarding
                  </span>
                )}
                <h3 className="font-display text-3xl">{tier.name}</h3>
                <p className="text-xs font-semibold uppercase text-[#5A3224] mt-1" style={{ letterSpacing: '0.25em' }}>
                  {tier.threshold}
                </p>
                <ul className="mt-6 flex flex-col gap-3 text-sm text-[#1a120c]/75 leading-[1.85]">
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex gap-3">
                      <span className="text-[#5A3224] shrink-0">—</span>
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.4}>
          <button className={`${ctaGlassOnLight} mt-10`} style={ctaTracking} onClick={() => setAccountOpen(true)}>
            Join the Circle — Free
          </button>
        </Reveal>
      </div>
    </section>
  )
}
