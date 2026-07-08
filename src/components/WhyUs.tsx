import { Leaf, Feather, ShieldCheck } from 'lucide-react'

const REASONS = [
  {
    icon: Leaf,
    title: 'Ethically sourced',
    body: 'Single-donor raw hair with full traceability — sourced with respect for both nature and community.',
  },
  {
    icon: Feather,
    title: 'Luxuriously soft',
    body: 'Cuticles aligned and fully intact. No silicone coating that washes off after two wears.',
  },
  {
    icon: ShieldCheck,
    title: 'Built to last',
    body: 'Bleach it, press it, wear it daily — two years and counting with basic care.',
  },
]

export default function WhyUs() {
  return (
    <section id="about" className="bg-[#1a0f08] text-[#FFF8F2] py-20 sm:py-28 px-5 sm:px-10 md:px-16">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-medium uppercase text-[#FFF8F2]/60" style={{ letterSpacing: '0.35em' }}>
          Sukundu — "hair" in Pulaar
        </p>
        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mt-4 max-w-2xl leading-[1.05]" style={{ textWrap: 'balance' }}>
          Hair that keeps its promises
        </h2>
        <p className="mt-5 max-w-lg text-sm sm:text-base text-[#FFF8F2]/70 leading-relaxed">
          Our name comes from the Pulaar word for hair — because for us, hair is heritage. Every
          Sukundu piece honors where it comes from and elevates where it's going.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 mt-12 sm:mt-16">
          {REASONS.map((r) => (
            <div key={r.title} className="flex flex-col items-start">
              <r.icon size={28} strokeWidth={1.25} className="text-[#c99b6f]" aria-hidden="true" />
              <h3 className="font-display text-2xl mt-5">{r.title}</h3>
              <p className="mt-3 text-sm text-[#FFF8F2]/70 leading-relaxed max-w-[320px]">{r.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-14 sm:mt-20 max-w-xl text-base sm:text-lg text-[#FFF8F2]/85 leading-relaxed font-light">
          Experience unmatched quality in every strand — indulge in texture so soft it promises to
          elevate your hair game to new heights. Choose The Ivory Sukundu for the raw hair you deserve.
        </p>
      </div>
    </section>
  )
}
