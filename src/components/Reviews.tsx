import { Star } from 'lucide-react'
import Reveal from './Reveal'
import { useReviews } from '../lib/useReviews'

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          strokeWidth={1.5}
          className={n <= Math.round(rating) ? 'fill-[#c99b6f] text-[#c99b6f]' : 'text-[#c99b6f]/40'}
        />
      ))}
    </span>
  )
}

export function reviewCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'review' : 'reviews'}`
}

const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

// Published Judge.me reviews. Renders nothing until there is at least one.
export default function Reviews() {
  const data = useReviews()
  if (!data || data.count === 0) return null

  return (
    <section
      id="reviews"
      className="bg-[#FAF7F3] text-[#1B1113] py-20 sm:py-24 px-5 sm:px-10 md:px-16 border-t border-[#5A3224]/10"
    >
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <p className="text-xs font-medium uppercase text-[#5A3224]" style={{ letterSpacing: '0.06em' }}>
            Reviews
          </p>
          <h2 className="font-display text-4xl sm:text-5xl mt-6 leading-[1.16]" style={{ textWrap: 'balance' }}>
            In their words
          </h2>
          <div className="mt-6 flex items-center gap-3 text-sm text-[#1B1113]/70">
            <Stars rating={data.average} size={16} />
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {data.average.toFixed(1)} · {reviewCountLabel(data.count)}
            </span>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.08}>
              <article className="h-full flex flex-col bg-white/60 border border-[#5A3224]/10 p-6 sm:p-7">
                <Stars rating={r.rating} />
                {r.body && (
                  <p className="mt-4 text-sm sm:text-base text-[#1B1113]/85 leading-[1.85]">“{r.body}”</p>
                )}
                {r.photos.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {r.photos.map((p) => (
                      <a key={p.full} href={p.full} target="_blank" rel="noopener noreferrer">
                        <img
                          src={p.thumb}
                          alt={`Photo shared by ${r.name}`}
                          loading="lazy"
                          className="w-20 h-20 object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
                <p className="mt-auto pt-5 text-xs text-[#1B1113]/55">
                  <span className="font-semibold text-[#1B1113]/80">{r.name}</span>
                  {r.verified && <span> · Verified buyer</span>}
                  <span> · {dateFmt.format(new Date(r.createdAt))}</span>
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
