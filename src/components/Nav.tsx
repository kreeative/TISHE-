import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, ShoppingBag, User } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
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
  const [scrolled, setScrolled] = useState(false)
  const { cart, setCartOpen, setAccountOpen, memberName } = useStore()
  const cartCount = cart?.totalQuantity ?? 0
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] bg-[#FFF8F2]/95 backdrop-blur-md border-b flex items-center justify-between px-5 sm:px-8 h-16 sm:h-[72px] transition-shadow duration-300 ${
          scrolled ? 'border-[#5A3224]/15 shadow-[0_8px_30px_-16px_rgba(90,50,36,0.25)]' : 'border-transparent'
        }`}
      >
        <Link to="/" className="flex items-center shrink-0">
          <img src="/images/logo-mark-brown.webp" alt="The Ivory Sukundu" className="h-10 sm:h-12 w-auto" />
        </Link>

        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className="group relative text-sm font-medium whitespace-nowrap py-1">
              {({ isActive }) => (
                <>
                  <span className={`transition-colors ${isActive ? 'text-[#5A3224]' : 'text-[#1a120c]/75 group-hover:text-[#5A3224]'}`}>
                    {l.label}
                  </span>
                  <span
                    className={`absolute left-0 -bottom-0.5 h-px bg-[#5A3224] transition-all duration-300 ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </>
              )}
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
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[11px] font-bold text-[#5A3224]"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
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

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed inset-0 z-[90] bg-[#FFF8F2] flex flex-col items-center justify-center gap-8"
          >
            {NAV_LINKS.map((l, i) => (
              <motion.div
                key={l.to}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  to={l.to}
                  className="font-display text-3xl text-[#1a120c] hover:text-[#5A3224] transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </Link>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link to="/collections" className={`${ctaGlassOnLight} mt-4`} style={ctaTracking} onClick={() => setMenuOpen(false)}>
                Shop Now
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
