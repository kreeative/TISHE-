import { ctaDark, ctaTracking } from './cta'

const PRODUCTS = [
  {
    image: '/images/tex-straight.jpg',
    name: 'Sukundu Straight',
    blurb: 'Glass-sleek raw straight that holds a press for weeks.',
    lengths: '14" – 30"',
  },
  {
    image: '/images/tex-curls.jpg',
    name: 'Raw Deep Curl',
    blurb: 'Springy, wash-day-proof curls that revert every time.',
    lengths: '12" – 26"',
  },
  {
    image: '/images/tex-blonde.jpg',
    name: 'Ivory 613',
    blurb: 'True platinum blonde, ready to tone or wear icy.',
    lengths: '14" – 26"',
  },
]

export default function Collection() {
  return (
    <section id="collections" className="bg-[#FFF8F2] text-[#1a120c] py-20 sm:py-28 px-5 sm:px-10 md:px-16">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-medium uppercase text-[#5A3224]" style={{ letterSpacing: '0.35em' }}>
          The Collection
        </p>
        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mt-4 max-w-2xl leading-[1.05]" style={{ textWrap: 'balance' }}>
          Textures worth <span className="italic">the obsession</span>
        </h2>
        <p className="mt-5 max-w-md text-sm sm:text-base text-[#1a120c]/70 leading-relaxed">
          Raw, single-donor hair in three signature finishes — every bundle hand-inspected before it ships.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16">
          {PRODUCTS.map((p) => (
            <article key={p.name} className="group flex flex-col">
              <div className="overflow-hidden">
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  className="w-full aspect-[4/5] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              </div>
              <div className="flex items-baseline justify-between mt-5 gap-3">
                <h3 className="font-display text-2xl sm:text-3xl">{p.name}</h3>
                <span className="text-xs text-[#5A3224] font-medium whitespace-nowrap" style={{ letterSpacing: '0.15em' }}>
                  {p.lengths}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#1a120c]/70 leading-relaxed">{p.blurb}</p>
              <a href="#contact" className={`mt-4 self-start ${ctaDark}`} style={ctaTracking}>
                Shop Now
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
