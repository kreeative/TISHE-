import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Minus, Plus, ChevronLeft } from 'lucide-react'
import { useProduct } from '../lib/useProduct'
import { useStore } from './StoreContext'
import { ctaGlassOnLight, ctaTracking } from './cta'
import Reveal from './Reveal'
import { trackAddToCart, trackViewItem } from '../lib/analytics'
import type { ProductMedia, ShopifyVariant } from '../lib/shopify'
import { formatMoney, formatMoneyShort } from '../lib/money'
import { SALE, formatTimeLeft, isSaleProduct } from '../lib/sale'
import { useSaleClock } from './SaleCountdown'
import { Stars, reviewCountLabel } from './Reviews'
import { useReviews } from '../lib/useReviews'
import { findVariantByTitle, parseShopTheModel, selectionOf } from '../lib/shopTheModel'

// Best-selling combination, flagged with a badge on the option pills.
// Values are matched on digits only, so 18" / 18 inch / 18 all match.
const HOT_PICK: Record<string, string> = { length: '18', density: '250' }
const HOT_LABEL = 'Hot'

const digitsOf = (s: string) => s.replace(/[^0-9]/g, '')

function isHotValue(optionName: string, value: string): boolean {
  const key = Object.keys(HOT_PICK).find((k) => optionName.toLowerCase().includes(k))
  return key ? digitsOf(value) === HOT_PICK[key] : false
}

// true only when every flagged option is currently selected
function isHotCombination(selected: Record<string, string>): boolean {
  const names = Object.keys(selected)
  const flagged = names.filter((n) => Object.keys(HOT_PICK).some((k) => n.toLowerCase().includes(k)))
  return flagged.length > 0 && flagged.every((n) => isHotValue(n, selected[n]))
}

function findVariant(variants: ShopifyVariant[], selection: Record<string, string>): ShopifyVariant | undefined {
  return variants.find((v) => v.selectedOptions.every((o) => selection[o.name] === o.value))
}

export default function ProductPage() {
  const { handle } = useParams<{ handle: string }>()
  const { product, loading, error } = useProduct(handle)
  const { addToCart, cartLoading, cartError } = useStore()
  const [selection, setSelection] = useState<Record<string, string>>({})
  const [activeImage, setActiveImage] = useState(0)
  const [qty, setQty] = useState(1)
  const [justAdded, setJustAdded] = useState(false)

  const [params] = useSearchParams()
  const requestedVariant = params.get('variant')

  // seed the option selection once the product loads: the variant named in
  // the link (?variant=3 Bundles / 22"), otherwise the first one in stock
  const initialSelection = useMemo(() => {
    if (!product) return {}
    const chosen =
      findVariantByTitle(product.variants, requestedVariant) ??
      product.variants.find((v) => v.availableForSale) ??
      product.variants[0]
    return chosen ? selectionOf(chosen) : {}
  }, [product, requestedVariant])

  // a "shop the look" link can point back at this same page with another variant
  useEffect(() => {
    if (!requestedVariant) return
    setSelection({})
    document.getElementById('buy-box')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [requestedVariant])

  // report the product view once, when it first resolves
  useEffect(() => {
    if (!product) return
    trackViewItem({
      id: product.id,
      name: product.title,
      price: Number(product.priceRange.minVariantPrice.amount),
      currency: product.priceRange.minVariantPrice.currencyCode,
    })
  }, [product])

  const active = Object.keys(selection).length ? selection : initialSelection
  const matchedVariant = product ? findVariant(product.variants, active) : undefined
  const displayPrice = matchedVariant?.price ?? product?.priceRange.minVariantPrice
  // crossed-out "was" price, only when Shopify has a higher compare-at on this variant
  const comparePrice = matchedVariant?.compareAtPrice
  const saving = comparePrice && displayPrice ? Number(comparePrice.amount) - Number(displayPrice.amount) : 0
  // a sale product only shows its old price while the countdown is running
  const saleClock = useSaleClock()
  const reviews = useReviews()
  const saleProduct = isSaleProduct(handle)
  const saleRunning = saleProduct && saleClock.ms > 0
  const showCompare = !!comparePrice && saving > 0 && (!saleProduct || saleRunning)
  // gallery: full media list (images + videos) with image-only fallback
  const gallery: ProductMedia[] = product?.media.length
    ? product.media
    : (product?.images.length ? product.images : product?.featuredImage ? [product.featuredImage] : []).map((img) => ({
        type: 'image' as const,
        url: img.url,
        previewUrl: img.url,
        altText: img.altText,
      }))
  // photos whose alt text ends in "Shop the model: <variant>" get a button
  // that selects that variant, and the rest of the alt text as a caption
  const look = parseShopTheModel(gallery[activeImage]?.altText)
  const lookVariant = look && product ? findVariantByTitle(product.variants, look.variantTitle) : undefined

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-5 sm:px-10 md:px-16 py-24">
        <p className="text-sm text-[#1B1113]/50">Loading…</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="max-w-6xl mx-auto px-5 sm:px-10 md:px-16 py-24">
        <p className="text-sm text-[#1B1113]/50 max-w-md">
          {error ?? 'That product could not be found.'}
        </p>
        <Link to="/collections" className="inline-block mt-6 text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.08em' }}>
          ← Back to the collection
        </Link>
      </div>
    )
  }

  return (
    <section className="bg-[#FAF7F3] text-[#1B1113] py-12 sm:py-16 px-5 sm:px-10 md:px-16">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/collections"
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-[#1B1113]/50 hover:text-[#5A3224] transition-colors"
          style={{ letterSpacing: '0.08em' }}
        >
          <ChevronLeft size={14} /> Collection
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mt-6">
          <Reveal>
            <div className="relative overflow-hidden shadow-[0_1px_2px_rgba(26,18,12,0.06)]">
              {gallery[activeImage]?.type === 'video' ? (
                <video
                  key={gallery[activeImage].url}
                  src={gallery[activeImage].url}
                  poster={gallery[activeImage].previewUrl ?? undefined}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full aspect-[4/5] object-cover bg-[#1B1113]"
                />
              ) : gallery[activeImage]?.type === 'external_video' ? (
                <iframe
                  key={gallery[activeImage].url}
                  src={gallery[activeImage].url}
                  title={product.title}
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full aspect-[4/5] bg-[#1B1113]"
                />
              ) : (
                gallery[activeImage] && (
                  <img
                    src={gallery[activeImage].url}
                    alt={gallery[activeImage].altText ?? product.title}
                    className="w-full aspect-[4/5] object-cover"
                  />
                )
              )}
              {lookVariant && (
                <button
                  type="button"
                  onClick={() => {
                    setSelection(selectionOf(lookVariant))
                    document.getElementById('buy-box')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className="absolute left-4 bottom-4 bg-[#FAF7F3]/90 backdrop-blur-sm text-[#1B1113] text-[10px] font-semibold uppercase px-3.5 py-2 shadow-[0_6px_20px_-6px_rgba(26,18,12,0.45)] hover:bg-[#FAF7F3] transition-colors"
                  style={{ letterSpacing: '0.1em' }}
                >
                  Shop the model · {lookVariant.title}
                </button>
              )}
            </div>
            {look?.caption && <p className="mt-3 text-xs italic text-[#1B1113]/55">{look.caption}</p>}
            {gallery.length > 1 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {gallery.map((item, i) => (
                  <button
                    key={item.url}
                    onClick={() => setActiveImage(i)}
                    aria-label={item.type === 'image' ? `Image ${i + 1}` : `Video ${i + 1}`}
                    className={`relative w-16 h-20 overflow-hidden border transition-colors ${
                      i === activeImage ? 'border-[#5A3224]' : 'border-[#5A3224]/20 hover:border-[#5A3224]/50'
                    }`}
                  >
                    {item.previewUrl ? (
                      <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="block w-full h-full bg-[#1B1113]" />
                    )}
                    {item.type !== 'image' && (
                      <span className="absolute inset-0 grid place-items-center bg-[#1B1113]/25">
                        <span className="grid place-items-center w-6 h-6 rounded-full bg-[#FAF7F3]/90">
                          <svg width="9" height="10" viewBox="0 0 9 10" aria-hidden="true">
                            <path d="M0.5 0.8 L8.4 5 L0.5 9.2 Z" fill="#1B1113" />
                          </svg>
                        </span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </Reveal>

          <Reveal delay={0.1}>
            <h1 id="buy-box" className="font-display text-4xl sm:text-5xl leading-[1.16] scroll-mt-28" style={{ textWrap: 'balance' }}>
              {product.title}
            </h1>
            {displayPrice && (
              <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <span className="text-2xl font-medium">{formatMoney(displayPrice.amount, displayPrice.currencyCode)}</span>
                {showCompare && comparePrice && (
                  <>
                    <s className="text-lg text-[#1B1113]/40">{formatMoney(comparePrice.amount, comparePrice.currencyCode)}</s>
                    <span
                      className="self-center bg-[#c99b6f] text-[#1B1113] text-[10px] font-bold uppercase px-2 py-1"
                      style={{ letterSpacing: '0.1em' }}
                    >
                      Save {formatMoneyShort(saving, displayPrice.currencyCode)}
                    </span>
                  </>
                )}
              </p>
            )}
            {reviews && reviews.count > 0 && (
              <button
                type="button"
                onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
                className="mt-3 flex items-center gap-2 text-xs text-[#1B1113]/60 hover:text-[#5A3224] transition-colors"
              >
                <Stars rating={reviews.average} size={13} />
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {reviews.average.toFixed(1)} · {reviewCountLabel(reviews.count)}
                </span>
              </button>
            )}
            {saleRunning && (
              <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#5A3224]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#c99b6f]" />
                {SALE.name} ends in {formatTimeLeft(saleClock)}
              </p>
            )}

            {product.options
              .filter((opt) => !(opt.values.length === 1 && opt.values[0] === 'Default Title'))
              .map((opt) => (
                <div key={opt.name} className="mt-7">
                  <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.1em' }}>
                    {opt.name}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-5">
                    {opt.values.map((value) => {
                      const isActive = active[opt.name] === value
                      const wouldMatch = findVariant(product.variants, { ...active, [opt.name]: value })
                      const disabled = !wouldMatch?.availableForSale
                      const hot = isHotValue(opt.name, value) && !disabled
                      return (
                        <button
                          key={value}
                          disabled={disabled}
                          onClick={() => setSelection({ ...active, [opt.name]: value })}
                          className={`relative px-5 py-2.5 text-xs font-semibold border transition-all duration-300 ${
                            isActive
                              ? 'bg-[#5A3224] border-[#5A3224] text-[#FAF7F3] shadow-[0_8px_22px_-8px_rgba(90,50,36,0.6)] -translate-y-0.5'
                              : disabled
                                ? 'bg-transparent border-[#5A3224]/10 text-[#1B1113]/25 line-through cursor-not-allowed'
                                : hot
                                  ? 'bg-white/40 backdrop-blur-sm border-[#c99b6f] text-[#1B1113]/80 hover:border-[#5A3224] hover:text-[#1B1113] hover:-translate-y-0.5'
                                  : 'bg-white/40 backdrop-blur-sm border-[#5A3224]/25 text-[#1B1113]/65 hover:border-[#5A3224] hover:text-[#1B1113] hover:-translate-y-0.5'
                          }`}
                          style={{ letterSpacing: '0.08em' }}
                        >
                          {value}
                          {hot && (
                            <span
                              className="absolute -top-2.5 -right-1.5 bg-[#c99b6f] text-[#1B1113] text-[8px] font-bold uppercase px-1.5 py-0.5 pointer-events-none"
                              style={{ letterSpacing: '0.1em' }}
                            >
                              {HOT_LABEL}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

            {isHotCombination(active) && (
              <p className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#5A3224]">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#c99b6f]" />
                Our best-selling combination
              </p>
            )}

            <div className="mt-8 flex items-center gap-3">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="p-2.5 border border-[#5A3224]/30 text-[#1B1113]/70 hover:border-[#5A3224] hover:text-[#5A3224] transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="text-sm w-6 text-center font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
                className="p-2.5 border border-[#5A3224]/30 text-[#1B1113]/70 hover:border-[#5A3224] hover:text-[#5A3224] transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            {cartError && <p className="mt-4 text-xs text-red-700">{cartError}</p>}

            <button
              className={`${ctaGlassOnLight} mt-6 w-full sm:w-auto`}
              style={ctaTracking}
              disabled={!matchedVariant || !matchedVariant.availableForSale || cartLoading}
              onClick={async () => {
                if (!matchedVariant) return
                await addToCart(matchedVariant.id, qty)
                trackAddToCart({
                  id: matchedVariant.id,
                  name: `${product.title} ${matchedVariant.title}`.trim(),
                  price: Number(matchedVariant.price.amount),
                  currency: matchedVariant.price.currencyCode,
                  quantity: qty,
                })
                setJustAdded(true)
                setTimeout(() => setJustAdded(false), 2000)
              }}
            >
              {!matchedVariant || !matchedVariant.availableForSale
                ? 'Out of Stock'
                : justAdded
                  ? 'Added ✓'
                  : `Add to Bag · ${formatMoney(matchedVariant.price.amount, matchedVariant.price.currencyCode)}`}
            </button>

            {/* Shipping is no longer included in the price, so say so here
                rather than letting it surprise her at the checkout step. */}
            <p className="mt-3 text-xs text-[#1B1113]/50">
              Shipping calculated at checkout. First order over $200 ships free with code FREESHIP200.
            </p>

            {/* Full description stays on the page (and indexable) but closed,
                so the buy box is not buried under sizing and care copy. */}
            {product.descriptionHtml && (
              <details className="group mt-8 max-w-md border-t border-[#5A3224]/15">
                <summary className="flex items-center justify-between cursor-pointer list-none py-4 text-xs font-semibold uppercase text-[#1B1113] [&::-webkit-details-marker]:hidden" style={{ letterSpacing: '0.08em' }}>
                  Product details
                  <span className="text-lg leading-none transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <div
                  className="product-desc pb-6 text-sm text-[#1B1113]/75 leading-[1.85]"
                  dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                />
              </details>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
