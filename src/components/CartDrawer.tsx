import { X, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useStore } from './StoreContext'
import { ctaGlassOnLight, ctaTracking } from './cta'

export default function CartDrawer() {
  const { cart, setQty, cartOpen, setCartOpen } = useStore()
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const strands = Math.round(subtotal)

  return (
    <>
      {cartOpen && (
        <button
          aria-label="Close bag"
          className="fixed inset-0 z-[110] bg-[#1a120c]/40 backdrop-blur-sm cursor-default"
          onClick={() => setCartOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-[120] w-full sm:w-[420px] bg-[#FFF8F2] text-[#1a120c] border-l border-[#5A3224]/15 flex flex-col transition-transform duration-500 ease-out ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!cartOpen}
      >
        <div className="flex items-center justify-between p-6 border-b border-[#5A3224]/15">
          <h2 className="font-display text-2xl">Your Bag</h2>
          <button
            onClick={() => setCartOpen(false)}
            aria-label="Close"
            className="text-[#1a120c]/60 hover:text-[#5A3224] transition-colors"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-[#1a120c]/55 px-8 text-center">
            <ShoppingBag size={32} strokeWidth={1.5} />
            <p className="text-sm leading-relaxed">Your bag is empty — the half-wig edit is waiting.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-4">
                <img src={item.image} alt={item.name} className="w-20 h-24 object-cover" />
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between gap-2">
                    <h3 className="font-display text-lg leading-tight">{item.name}</h3>
                    <span className="text-sm font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      ${item.price * item.qty}
                    </span>
                  </div>
                  <div className="mt-auto flex items-center gap-3">
                    <button
                      onClick={() => setQty(item.id, item.qty - 1)}
                      aria-label={`Decrease ${item.name} quantity`}
                      className="p-1.5 border border-[#5A3224]/30 text-[#1a120c]/70 hover:border-[#5A3224] hover:text-[#5A3224] transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm w-4 text-center font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>{item.qty}</span>
                    <button
                      onClick={() => setQty(item.id, item.qty + 1)}
                      aria-label={`Increase ${item.name} quantity`}
                      className="p-1.5 border border-[#5A3224]/30 text-[#1a120c]/70 hover:border-[#5A3224] hover:text-[#5A3224] transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => setQty(item.id, 0)}
                      className="ml-auto text-xs font-medium text-[#1a120c]/50 hover:text-[#5A3224] uppercase transition-colors"
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
            <span className="text-[#1a120c]/70">Subtotal</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>${subtotal}</span>
          </div>
          {strands > 0 && (
            <p className="text-xs font-semibold text-[#5A3224]" style={{ letterSpacing: '0.15em' }}>
              CIRCLE MEMBERS EARN {strands} STRANDS ON THIS ORDER
            </p>
          )}
          <button className={`${ctaGlassOnLight} w-full`} style={ctaTracking} disabled={cart.length === 0}>
            Checkout
          </button>
          <p className="text-[11px] text-[#1a120c]/45 text-center">
            Secure checkout activates at launch. Free shipping over $250.
          </p>
        </div>
      </aside>
    </>
  )
}
