import { useStore } from './StoreContext'
import { ctaGlass, ctaTracking } from './cta'

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
    <section id="circle" className="bg-[#1a0f08] text-[#FFF8F2] py-20 sm:py-28 px-5 sm:px-10 md:px-16 border-t border-[#FFF8F2]/10">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-medium uppercase text-[#c99b6f]" style={{ letterSpacing: '0.35em' }}>
          The Sukundu Circle
        </p>
        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mt-4 max-w-2xl leading-[1.05]" style={{ textWrap: 'balance' }}>
          Loyalty, woven in
        </h2>
        <p className="mt-5 max-w-lg text-sm sm:text-base text-[#FFF8F2]/70 leading-relaxed">
          Sukundu means hair in Pulaar — and in our culture, hair is cared for in community. The Circle
          is ours: earn strands on every order, learn the craft, and grow into richer rewards.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 sm:mt-16">
          {TIERS.map((tier, i) => (
            <div
              key={tier.name}
              className={`flex flex-col p-7 border backdrop-blur-md ${
                i === 2 ? 'border-[#c99b6f]/50 bg-white/[0.07]' : 'border-[#FFF8F2]/15 bg-white/[0.03]'
              }`}
            >
              <h3 className="font-display text-3xl">{tier.name}</h3>
              <p className="text-xs uppercase text-[#c99b6f] mt-1" style={{ letterSpacing: '0.25em' }}>
                {tier.threshold}
              </p>
              <ul className="mt-6 flex flex-col gap-3 text-sm text-[#FFF8F2]/70 leading-relaxed">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex gap-3">
                    <span className="text-[#c99b6f] shrink-0">—</span>
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <button className={`${ctaGlass} mt-10`} style={ctaTracking} onClick={() => setAccountOpen(true)}>
          Join the Circle — Free
        </button>
      </div>
    </section>
  )
}
