import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, ShoppingBag, User } from 'lucide-react'
import { useStore } from './StoreContext'
import { ctaGlassOnLight, ctaTracking } from './cta'

const NAV_LINKS = [
  { label: 'Our Hair', to: '/our-hair' },
  { label: 'Collections', to: '/collections' },
  { label: 'The Circle', to: '/circle' },
  { label: 'Contact', to: '/contact' },
]

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { cart, setCartOpen, setAccountOpen, memberName } = useStore()
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#FFF8F2] border-b border-[#5A3224]/15 flex items-center justify-between px-5 sm:px-8 h-16 sm:h-[72px]">
        <Link to="/" className="flex items-center shrink-0" onClick={() => setMenuOpen(false)}>
          <img src="/images/logo-mark-brown.webp" alt="The Ivory Sukundu" className="h-10 sm:h-12 w-auto" />
        </Link>

        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive ? 'text-[#5A3224]' : 'text-[#1a120c]/75 hover:text-[#5A3224]'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-5 sm:gap-6">
          <button
            className="text-[#1a120c]/75 hover:text-[#5A3224] transition-colors"
            onClick={() => setAccountOpen(true)}
            aria-label={memberName ? `Account: ${memberName}` : 'Account'}
          >
            <User size={20} strokeWidth={1.75} className={memberName ? 'text-[#5A3224]' : undefined} />
          </button>
          <button
            className="flex items-start gap-1 text-[#1a120c]/75 hover:text-[#5A3224] transition-colors"
            onClick={() => setCartOpen(true)}
            aria-label={`Bag, ${cartCount} items`}
          >
            <ShoppingBag size={20} strokeWidth={1.75} />
            {cartCount > 0 && (
              <span className="text-[11px] font-bold text-[#5A3224]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {cartCount}
              </span>
            )}
          </button>
          <button
            className="lg:hidden text-[#1a120c]/75 hover:text-[#5A3224] transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-[90] bg-[#FFF8F2] flex flex-col items-center justify-center gap-8">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="font-display text-3xl text-[#1a120c] hover:text-[#5A3224] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/collections" className={`${ctaGlassOnLight} mt-4`} style={ctaTracking} onClick={() => setMenuOpen(false)}>
            Shop Now
          </Link>
        </div>
      )}
    </>
  )
}
