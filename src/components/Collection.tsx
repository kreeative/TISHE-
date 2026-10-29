import { Link } from 'react-router-dom'
import { useProducts } from '../lib/useProducts'
import { ctaGlassOnLight, ctaTracking } from './cta'
import Reveal from './Reveal'
import { formatMoneyShort } from '../lib/money'
import { isOnSale } from '../lib/sale'
import { useStore } from './StoreContext'

export default function Collection() {
  const { products } = useProducts()
  const { sale } = useStore()

  return (
    <section id="collections" className="bg-[#FAF7F3] text-[#1B1113] py-20 sm:py-28 px-5 sm:px-10 md:px-16">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <p className="text-xs font-medium uppercase text-[#5A3224]" style={{ letterSpacing: '0.06em' }}>
            The Collection
          </p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mt-6 max-w-2xl leading-[1.16]" style={{ textWrap: 'balance' }}>
            Textures worth the obsession
          </h2>
          <p className="mt-6 max-w-md text-sm sm:text-base text-[#1B1113]/70 leading-[1.85]">
            Raw Vietnamese hair from a single donor, cuticle-aligned Indian hair, and glueless half wigs. Every texture is labelled exactly as it is.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16">
          {products.map((p, i) => {
            const minPrice = p.priceRange.minVariantPrice
            const maxPrice = p.priceRange.maxVariantPrice
            const hasRange = minPrice.amount !== maxPrice.amount
            // shortest to longest inch value across every variant, so mixed
            // sets like 20" / 22" / 24" don't end up as the label's upper bound
            const inches = p.variants
              .flatMap((v) => (v.selectedOptions.find((o) => o.name.toLowerCase() === 'length')?.value ?? '').match(/\d+/g) ?? [])
              .map(Number)
            const shortest = inches.length ? Math.min(...inches) : 0
            const longest = inches.length ? Math.max(...inches) : 0
            const lengthLabel = !inches.length ? '' : shortest === longest ? `${shortest}"` : `${shortest}" – ${longest}"`
            const isCampaign = p.tags.some((t) => t.toLowerCase() === 'campaign')
            // on sale: show the cheapest variant's old price struck through
            const onSale = isOnSale(sale, p.handle)
            const cheapest = p.variants.reduce<(typeof p.variants)[number] | undefined>(
              (best, v) => (!best || Number(v.price.amount) < Number(best.price.amount) ? v : best),
              undefined,
            )
            const wasPrice = onSale && cheapest?.compareAtPrice && Number(cheapest.compareAtPrice.amount) > Number(cheapest.price.amount)
              ? cheapest.compareAtPrice
              : null

            return (
              <Reveal key={p.id} delay={i * 0.1} className="group flex flex-col">
                <Link to={`/products/${p.handle}`} className="block">
                  <div
                    className="relative overflow-hidden transition-shadow duration-500"
                    style={{ boxShadow: '0 1px 2px rgba(26,18,12,0.06)' }}
                  >
                    {p.featuredImage && (
                      <img
                        src={p.featuredImage.thumb}
                        srcSet={`${p.featuredImage.thumb} 640w, ${p.featuredImage.url} 1600w`}
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        alt={p.featuredImage.altText ?? p.title}
                        loading="lazy"
                        className="w-full aspect-[4/5] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                      />
                    )}
                    <div
                      className="absolute inset-0 opacity-70 group-hover:opacity-90 transition-opacity duration-500 pointer-events-none"
                      style={{ background: 'linear-gradient(180deg, rgba(26,18,12,0.28) 0%, rgba(26,18,12,0) 35%, rgba(26,18,12,0) 70%, rgba(26,18,12,0.25) 100%)' }}
                    />
                    {onSale && (
                      <span
                        className="absolute top-4 right-4 bg-[#c99b6f] text-[#1B1113] text-[10px] font-bold uppercase px-3 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
                        style={{ letterSpacing: '0.1em' }}
                      >
                        {sale?.name ?? 'Sale'}
                      </span>
                    )}
                    {isCampaign && (
                      <span
                        className="absolute top-4 left-4 bg-white/20 backdrop-blur-md border border-white/40 text-[#FAF7F3] text-[10px] font-semibold uppercase px-3 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
                        style={{ letterSpacing: '0.1em' }}
                      >
                        Campaign 01
                      </span>
                    )}
                  </div>
                </Link>
                <div className="flex items-baseline justify-between mt-5 gap-3">
                  <Link to={`/products/${p.handle}`}>
                    <h3 className="font-display text-2xl sm:text-3xl hover:text-[#5A3224] transition-colors">{p.title}</h3>
                  </Link>
                  {lengthLabel && (
                    <span className="text-xs text-[#5A3224] font-medium whitespace-nowrap" style={{ letterSpacing: '0.08em' }}>
                      {lengthLabel}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <Link to={`/products/${p.handle}`} className={`self-start ${ctaGlassOnLight}`} style={ctaTracking}>
                    {hasRange ? 'Shop Options · from ' : 'Shop · '}
                    {wasPrice && (
                      <s className="opacity-50 mr-1.5">{formatMoneyShort(wasPrice.amount, wasPrice.currencyCode)}</s>
                    )}
                    {formatMoneyShort(minPrice.amount, minPrice.currencyCode)}
                  </Link>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
