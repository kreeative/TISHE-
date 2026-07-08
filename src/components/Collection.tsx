import { useStore, type Product } from './StoreContext'
import { ctaGlassOnLight, ctaTracking } from './cta'

interface CollectionProduct extends Product {
  blurb: string
  lengths: string
  tag?: string
}

const PRODUCTS: CollectionProduct[] = [
  {
    id: 'half-wig',
    name: 'The Sukundu Half Wig',
    price: 265,
    image: '/images/tex-straight.jpg',
    blurb: 'Comb-in, glueless, sixty-second install. The campaign piece.',
    lengths: '16" – 26"',
    tag: 'Campaign 01',
  },
  {
    id: 'deep-curl',
    name: 'Raw Deep Curl',
    price: 125,
    image: '/images/tex-curls.jpg',
    blurb: 'Springy, wash-day-proof curls that revert every time.',
    lengths: '12" – 26"',
  },
  {
    id: 'ivory-613',
    name: 'Ivory 613',
    price: 185,
    image: '/images/tex-blonde.jpg',
    blurb: 'True platinum blonde, ready to tone or wear icy.',
    lengths: '14" – 26"',
  },
]

export default function Collection() {
  const { addToCart } = useStore()

  return (
    <section id="collections" className="bg-[#FFF8F2] text-[#1a120c] py-20 sm:py-28 px-5 sm:px-10 md:px-16">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-medium uppercase text-[#5A3224]" style={{ letterSpacing: '0.35em' }}>
          The Collection
        </p>
        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mt-4 max-w-2xl leading-[1.05]" style={{ textWrap: 'balance' }}>
          Textures worth the obsession
        </h2>
        <p className="mt-5 max-w-md text-sm sm:text-base text-[#1a120c]/70 leading-relaxed">
          Raw, single-donor hair in three signature finishes — every bundle hand-inspected before it ships.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16">
          {PRODUCTS.map((p) => (
            <article key={p.id} className="group flex flex-col">
              <div className="relative overflow-hidden">
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  className="w-full aspect-[4/5] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                {p.tag && (
                  <span
                    className="absolute top-4 left-4 bg-white/20 backdrop-blur-md border border-white/40 text-[#FFF8F2] text-[10px] font-semibold uppercase px-3 py-1.5"
                    style={{ letterSpacing: '0.25em' }}
                  >
                    {p.tag}
                  </span>
                )}
              </div>
              <div className="flex items-baseline justify-between mt-5 gap-3">
                <h3 className="font-display text-2xl sm:text-3xl">{p.name}</h3>
                <span className="text-xs text-[#5A3224] font-medium whitespace-nowrap" style={{ letterSpacing: '0.15em' }}>
                  {p.lengths}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#1a120c]/70 leading-relaxed">{p.blurb}</p>
              <div className="mt-4 flex items-center gap-4">
                <button
                  className={`self-start ${ctaGlassOnLight}`}
                  style={ctaTracking}
                  onClick={() => addToCart({ id: p.id, name: p.name, price: p.price, image: p.image })}
                >
                  Add to Bag — ${p.price}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
