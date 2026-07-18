import { Leaf, Feather, ShieldCheck } from 'lucide-react'
import Reveal from './Reveal'

const REASONS = [
  {
    icon: Leaf,
    title: 'Ethically sourced',
    body: 'Single-donor raw hair with full traceability, sourced with respect for both nature and community.',
  },
  {
    icon: Feather,
    title: 'Luxuriously soft',
    body: 'Cuticles aligned and fully intact. No silicone coating that washes off after two wears.',
  },
  {
    icon: ShieldCheck,
    title: 'Built to last',
    body: 'Bleach it, press it, wear it daily. Two years and counting with basic care.',
  },
]

export default function WhyUs() {
  return (
    <section
      id="about"
      className="relative overflow-hidden text-[#1B1113] py-20 sm:py-28 px-5 sm:px-10 md:px-16 border-b border-[#5A3224]/10"
      style={{ background: 'radial-gradient(110% 130% at 85% 10%, #FFFDFA 0%, #FAF7F3 50%, #F7E9DA 100%)' }}
    >
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.06em' }}>
            Sukundu, "hair" in Pulaar
          </p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mt-6 max-w-2xl leading-[1.16]" style={{ textWrap: 'balance' }}>
            Hair that keeps its promises
          </h2>
          <p className="mt-6 max-w-lg text-sm sm:text-base text-[#1B1113]/75 leading-[1.85]">
            Our name comes from the Pulaar word for hair, because for us, hair is heritage. Every
            Sukundu piece honors where it comes from and elevates where it's going.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 mt-12 sm:mt-16">
          {REASONS.map((r, i) => (
            <Reveal key={r.title} delay={0.1 + i * 0.12} className="group flex flex-col items-start">
              <div
                className="p-3 -m-3 backdrop-blur-sm border border-[#5A3224]/0 group-hover:border-[#5A3224]/15 group-hover:bg-white/40 transition-all duration-500"
                style={{ borderRadius: 0 }}
              >
                <r.icon size={28} strokeWidth={1.5} className="text-[#5A3224] transition-transform duration-500 group-hover:-translate-y-0.5" aria-hidden="true" />
                <h3 className="font-display text-2xl mt-5">{r.title}</h3>
                <p className="mt-3 text-sm text-[#1B1113]/75 leading-[1.85] max-w-[320px]">{r.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <p className="mt-14 sm:mt-20 max-w-xl text-base sm:text-lg text-[#1B1113]/85 leading-[1.85]">
            Experience unmatched quality in every strand. Indulge in texture so soft it promises to
            elevate your hair game to new heights. Choose The Ivory Sukundu for the raw hair you deserve.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
