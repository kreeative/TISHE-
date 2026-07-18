import { Link } from 'react-router-dom'
import { ctaGlassOnLight, ctaTracking } from './cta'
import Reveal from './Reveal'

const STEPS = [
  { n: '01', title: 'Join free', body: 'Ten seconds, no card, no fee.' },
  { n: '02', title: 'Earn strands', body: 'Every $1 spent earns 1 strand.' },
  { n: '03', title: 'Rise in tiers', body: 'Spend unlocks richer rewards.' },
]

const TIERS = [
  {
    numeral: 'I',
    name: 'Ivory',
    threshold: 'Free to join',
    perks: [
      'Every $1 earns 1 strand. 200 strands is $20 off',
      'Early access to drops and restocks',
      'Sukundu School: care guides and install tutorials',
      'A gift on your birthday, always',
    ],
    featured: false,
  },
  {
    numeral: 'II',
    name: 'Gold',
    threshold: 'After $500',
    perks: [
      'Everything in Ivory',
      'Free express shipping, every order',
      'Member pricing on campaign launches',
      'Annual silk maintenance kit, gifted',
    ],
    featured: false,
  },
  {
    numeral: 'III',
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

  return (
    <section
      id="circle"
      className="relative overflow-hidden text-[#1B1113] py-20 sm:py-28 px-5 sm:px-10 md:px-16 border-b border-[#5A3224]/10"
      style={{ background: 'radial-gradient(120% 130% at 50% 0%, #FFFDFA 0%, #FAF7F3 55%, #F7E9DA 100%)' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Intro row: headline left, how-it-works right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-start">
          <Reveal>
            <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.35em' }}>
              The Sukundu Circle
            </p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mt-6 leading-[1.16]" style={{ textWrap: 'balance' }}>
              Loyalty, woven in
            </h2>
            <p className="mt-6 max-w-lg text-sm sm:text-base text-[#1B1113]/75 leading-[1.85]">
              Sukundu means hair in Pulaar. In our culture, hair is cared for in community. The Circle
              is ours: earn strands on every order, learn the craft, and grow into richer rewards.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="lg:pt-10 flex flex-col divide-y divide-[#5A3224]/12">
              {STEPS.map((s) => (
                <div key={s.n} className="flex items-baseline gap-4 py-5">
                  <span className="font-display text-lg text-[#c99b6f] shrink-0 w-8">{s.n}</span>
                  <p className="flex flex-wrap items-baseline gap-x-3">
                    <span className="font-display text-2xl">{s.title}</span>
                    <span className="text-sm text-[#1B1113]/60">{s.body}</span>
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14 sm:mt-20 items-stretch">
          {TIERS.map((tier, i) => (
            <Reveal key={tier.name} delay={0.1 + i * 0.12} className="h-full">
              <div
                className={`relative flex flex-col h-full p-8 overflow-hidden transition-all duration-500 hover:-translate-y-1.5 ${
                  tier.featured
                    ? 'text-[#FAF7F3] border border-[#c99b6f]/40 shadow-[0_30px_60px_-24px_rgba(27,17,19,0.55)] hover:shadow-[0_36px_70px_-24px_rgba(27,17,19,0.65)]'
                    : 'bg-[#FFFDFA] border border-[#5A3224]/20 shadow-[0_16px_40px_-24px_rgba(90,50,36,0.35)] hover:shadow-[0_24px_50px_-24px_rgba(90,50,36,0.45)] hover:border-[#5A3224]/40'
                }`}
                style={
                  tier.featured
                    ? { background: 'linear-gradient(150deg, #120C0E 0%, #1B1113 55%, #2A1D20 100%)' }
                    : undefined
                }
              >
                {/* gold sheen on the dark card */}
                {tier.featured && (
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: 'linear-gradient(115deg, transparent 30%, rgba(201,155,111,0.14) 46%, transparent 62%)' }}
                  />
                )}

                {tier.featured && (
                  <span
                    className="absolute top-0 right-0 bg-[#c99b6f] text-[#1B1113] text-[10px] font-bold uppercase px-3.5 py-1.5"
                    style={{ letterSpacing: '0.2em' }}
                  >
                    Most Rewarding
                  </span>
                )}

                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-4xl">{tier.name}</h3>
                  <span className="font-display text-lg text-[#c99b6f]">{tier.numeral}</span>
                </div>
                <p className={`font-display italic text-lg mt-1 ${tier.featured ? 'text-[#c99b6f]' : 'text-[#5A3224]'}`}>
                  {tier.threshold}
                </p>

                <ul className={`mt-7 flex flex-col gap-3.5 text-sm leading-[1.85] ${tier.featured ? 'text-[#FAF7F3]/80' : 'text-[#1B1113]/75'}`}>
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex gap-3">
                      <span className="text-[#c99b6f] shrink-0">·</span>
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        {/* CTA */}
        <Reveal delay={0.4}>
          <div className="mt-14 flex flex-col items-center gap-3 text-center">
            <Link to="/account" className={`${ctaGlassOnLight} px-12`} style={ctaTracking}>
              Join the Circle · Free
            </Link>
            <p className="text-xs text-[#1B1113]/50">Free forever. Your strands start counting with your first order.</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
