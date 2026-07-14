import { X, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useStore } from './StoreContext'
import { ctaGlassOnLight, ctaTracking } from './cta'

function formatMoney(amount: string, currencyCode: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(Number(amount))
}

export default function CartDrawer() {
  const { cart, cartLoading, cartError, setLineQty, cartOpen, setCartOpen } = useStore()
  const lines = cart?.lines ?? []
  const strands = cart ? Math.round(Number(cart.cost.subtotalAmount.amount)) : 0

  return (
    <>
      {cartOpen && (
        <button
          aria-label="Close bag"
          className="fixed inset-0 z-[110] bg-[#1B1113]/40 backdrop-blur-sm cursor-default"
          onClick={() => setCartOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-[120] w-full sm:w-[420px] bg-[#FAF7F3] text-[#1B1113] border-l border-[#5A3224]/15 flex flex-col transition-transform duration-500 ease-out ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!cartOpen}
      >
        <div className="flex items-center justify-between p-6 border-b border-[#5A3224]/15">
          <h2 className="font-display text-2xl">Your Bag</h2>
          <button
            onClick={() => setCartOpen(false)}
            aria-label="Close"
            className="text-[#1B1113]/60 hover:text-[#5A3224] transition-colors"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        {cartError && (
          <p className="mx-6 mt-4 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2">{cartError}</p>
        )}

        {lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-[#1B1113]/55 px-8 text-center">
            <ShoppingBag size={32} strokeWidth={1.5} />
            <p className="text-sm leading-[1.85]">Your bag is empty — the half-wig edit is waiting.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {lines.map((line) => (
              <div key={line.id} className="flex gap-4">
                {line.merchandise.product.featuredImage && (
                  <img
                    src={line.merchandise.product.featuredImage.url}
                    alt={line.merchandise.product.featuredImage.altText ?? line.merchandise.product.title}
                    className="w-20 h-24 object-cover"
                  />
                )}
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg leading-tight">{line.merchandise.product.title}</h3>
                      {line.merchandise.title !== 'Default Title' && (
                        <p className="text-xs text-[#1B1113]/50 mt-0.5">{line.merchandise.title}</p>
                      )}
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatMoney(String(Number(line.merchandise.price.amount) * line.quantity), line.merchandise.price.currencyCode)}
                    </span>
                  </div>
                  <div className="mt-auto flex items-center gap-3">
                    <button
                      onClick={() => setLineQty(line.id, line.quantity - 1)}
                      disabled={cartLoading}
                      aria-label={`Decrease ${line.merchandise.product.title} quantity`}
                      className="p-1.5 border border-[#5A3224]/30 text-[#1B1113]/70 hover:border-[#5A3224] hover:text-[#5A3224] transition-colors disabled:opacity-40"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm w-4 text-center font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>{line.quantity}</span>
                    <button
                      onClick={() => setLineQty(line.id, line.quantity + 1)}
                      disabled={cartLoading}
                      aria-label={`Increase ${line.merchandise.product.title} quantity`}
                      className="p-1.5 border border-[#5A3224]/30 text-[#1B1113]/70 hover:border-[#5A3224] hover:text-[#5A3224] transition-colors disabled:opacity-40"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => setLineQty(line.id, 0)}
                      disabled={cartLoading}
                      className="ml-auto text-xs font-medium text-[#1B1113]/50 hover:text-[#5A3224] uppercase transition-colors disabled:opacity-40"
                      style={{ letterSpacing: '0.15em' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-6 border-t border-[#5A3224]/15 flex flex-col gap-4">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-[#1B1113]/70">Subtotal</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {cart ? formatMoney(cart.cost.subtotalAmount.amount, cart.cost.subtotalAmount.currencyCode) : '$0.00'}
            </span>
          </div>
          {strands > 0 && (
            <p className="text-xs font-semibold text-[#5A3224]" style={{ letterSpacing: '0.15em' }}>
              CIRCLE MEMBERS EARN {strands} STRANDS ON THIS ORDER
            </p>
          )}
          {cart?.checkoutUrl ? (
            <a href={cart.checkoutUrl} className={`${ctaGlassOnLight} w-full text-center`} style={ctaTracking}>
              Checkout
            </a>
          ) : (
            <button className={`${ctaGlassOnLight} w-full`} style={ctaTracking} disabled>
              Checkout
            </button>
          )}
          <p className="text-[11px] text-[#1B1113]/45 text-center">Free shipping — already included in every price.</p>
        </div>
      </aside>
    </>
  )
}
