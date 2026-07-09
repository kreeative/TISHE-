import { Link } from 'react-router-dom'
import { useProducts } from '../lib/useProducts'
import { ctaGlassOnLight, ctaTracking } from './cta'
import Reveal from './Reveal'

function formatMoney(amount: string, currencyCode: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(Number(amount))
}

export default function Collection() {
  const { products, loading, error } = useProducts()

  return (
    <section id="collections" className="bg-[#FFF8F2] text-[#1a120c] py-20 sm:py-28 px-5 sm:px-10 md:px-16">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <p className="text-xs font-medium uppercase text-[#5A3224]" style={{ letterSpacing: '0.35em' }}>
            The Collection
          </p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mt-4 max-w-2xl leading-[1.05]" style={{ textWrap: 'balance' }}>
            Textures worth the obsession
          </h2>
          <p className="mt-5 max-w-md text-sm sm:text-base text-[#1a120c]/70 leading-relaxed">
            Raw, single-donor hair in three signature finishes — every bundle hand-inspected before it ships.
          </p>
        </Reveal>

        {loading && (
          <p className="mt-16 text-sm text-[#1a120c]/50">Loading the collection…</p>
        )}

        {!loading && error && (
          <p className="mt-16 text-sm text-[#1a120c]/50 max-w-md">
            The shop isn't connected yet. Once products are added in Shopify, they'll appear here automatically.
          </p>
        )}

        {!loading && !error && products.length === 0 && (
          <p className="mt-16 text-sm text-[#1a120c]/50 max-w-md">
            No products in the store yet — add some in Shopify and they'll show up here automatically.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16">
          {products.map((p, i) => {
            const minPrice = p.priceRange.minVariantPrice
            const maxPrice = p.priceRange.maxVariantPrice
            const hasRange = minPrice.amount !== maxPrice.amount
            const lengths = p.variants
              .map((v) => v.selectedOptions.find((o) => o.name.toLowerCase() === 'length')?.value)
              .filter(Boolean)
            const lengthLabel = lengths.length > 1 ? `${lengths[0]} – ${lengths[lengths.length - 1]}` : lengths[0]
            const isCampaign = p.tags.some((t) => t.toLowerCase() === 'campaign')

            return (
              <Reveal key={p.id} delay={i * 0.1} className="group flex flex-col">
                <Link to={`/products/${p.handle}`} className="block">
                  <div
                    className="relative overflow-hidden transition-shadow duration-500"
                    style={{ boxShadow: '0 1px 2px rgba(26,18,12,0.06)' }}
                  >
                    {p.featuredImage && (
                      <img
                        src={p.featuredImage.url}
                        alt={p.featuredImage.altText ?? p.title}
                        loading="lazy"
                        className="w-full aspect-[4/5] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                      />
                    )}
                    <div
                      className="absolute inset-0 opacity-70 group-hover:opacity-90 transition-opacity duration-500 pointer-events-none"
                      style={{ background: 'linear-gradient(180deg, rgba(26,18,12,0.28) 0%, rgba(26,18,12,0) 35%, rgba(26,18,12,0) 70%, rgba(26,18,12,0.25) 100%)' }}
                    />
                    {isCampaign && (
                      <span
                        className="absolute top-4 left-4 bg-white/20 backdrop-blur-md border border-white/40 text-[#FFF8F2] text-[10px] font-semibold uppercase px-3 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
                        style={{ letterSpacing: '0.25em' }}
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
                    <span className="text-xs text-[#5A3224] font-medium whitespace-nowrap" style={{ letterSpacing: '0.15em' }}>
                      {lengthLabel}
                    </span>
                  )}
                </div>
                {p.descriptionHtml && (
                  <p
                    className="mt-2 text-sm text-[#1a120c]/70 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: p.descriptionHtml }}
                  />
                )}
                <div className="mt-4 flex items-center gap-4">
                  <Link to={`/products/${p.handle}`} className={`self-start ${ctaGlassOnLight}`} style={ctaTracking}>
                    {hasRange ? 'Shop Options — from ' : 'Shop — '}
                    {formatMoney(minPrice.amount, minPrice.currencyCode)}
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
