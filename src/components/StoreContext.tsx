import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { buildCart, loadLines, saveLines, type Cart, type StoredLine } from '../lib/cart'
import { BUNDLED_PRODUCTS, buildProducts, type Currency, type Product, type RawProduct } from '../lib/catalog'
import { SHIPPING, currencyFor, guessCountry, shipsTo, type ShippingData } from '../lib/shipping'
import type { Sale } from '../lib/sale'
import { api } from '../lib/api'
import { shopifyCheckoutUrl } from '../lib/shopify'
import { trackBeginCheckout } from '../lib/analytics'
import { clearSession, fetchCustomer, saveSession, savedSession, type Customer } from '../lib/account'

// Stripe takes payments once VITE_CHECKOUT=stripe is set in Vercel; until
// then the bag is handed to the old Shopify checkout.
export const STRIPE_CHECKOUT = import.meta.env.VITE_CHECKOUT === 'stripe'

export interface CheckoutDetails {
  code?: string
  email?: string
}

const PREFS_KEY = 'tis-ship-to'

// what /api/store serves: the catalog and settings as edited in the dashboard
interface LiveStore {
  products: RawProduct[]
  site: { announcements: string[]; sale: Sale | null }
  shipping: ShippingData
  freeShipping: { code: string; minSubtotal: Record<Currency, number> | null; firstOrderOnly: boolean } | null
}

// what the site shows before the live version arrives (or if it can't load)
const BUNDLED: LiveStore = {
  products: BUNDLED_PRODUCTS,
  site: {
    announcements: ['1st order over $200 ships free · FREESHIP200', 'Install in sixty seconds', 'Luxury raw hair, redefined'],
    sale: null,
  },
  shipping: SHIPPING,
  freeShipping: { code: 'FREESHIP200', minSubtotal: { USD: 200, CAD: 280 }, firstOrderOnly: true },
}

function savedShipTo(): { country: string; province: string } | null {
  try {
    const s = JSON.parse(localStorage.getItem(PREFS_KEY) ?? 'null')
    return s && shipsTo(s.country) ? s : null
  } catch {
    return null
  }
}

interface StoreState {
  // where the order ships, which also sets the currency (CAD for Canada, USD elsewhere)
  country: string
  province: string
  currency: Currency
  setShipTo: (country: string, province?: string) => void
  products: Product[]
  announcements: string[]
  sale: Sale | null
  shipping: ShippingData
  freeShipping: LiveStore['freeShipping']
  cart: Cart
  cartLoading: boolean
  cartError: string | null
  addToCart: (variantId: string, quantity?: number) => Promise<void>
  setLineQty: (variantId: string, quantity: number) => Promise<void>
  clearCart: () => void
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  checkout: (details: CheckoutDetails) => Promise<void>
  customer: Customer | null
  customerLoading: boolean
  signIn: (session: { token: string; expiresAt: number }) => Promise<void>
  logout: () => void
  refreshCustomer: () => Promise<void>
}

const StoreContext = createContext<StoreState | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [shipTo, setShipToState] = useState(() => savedShipTo() ?? { country: guessCountry(), province: 'ON' })
  const [lines, setLines] = useState<StoredLine[]>(() => loadLines())
  const [live, setLive] = useState<LiveStore>(BUNDLED)

  useEffect(() => {
    api<LiveStore>('store')
      .then((data) => {
        if (Array.isArray(data.products) && data.products.length) setLive(data)
      })
      .catch(() => {
        // keep the bundled catalog
      })
  }, [])
  const [cartLoading, setCartLoading] = useState(false)
  const [cartError, setCartError] = useState<string | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerLoading, setCustomerLoading] = useState(false)

  const currency = currencyFor(shipTo.country)
  const products = useMemo(() => buildProducts(live.products, currency), [live.products, currency])
  const cart = useMemo(() => buildCart(lines, products, currency), [lines, products, currency])

  const setShipTo = (country: string, province?: string) => {
    const next = { country, province: province ?? shipTo.province }
    setShipToState(next)
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next))
    } catch {
      // private mode
    }
  }

  // ask the server which country the visitor is in, unless they already chose
  useEffect(() => {
    if (savedShipTo()) return
    api<{ country: string }>('geo')
      .then(({ country }) => {
        if (country && shipsTo(country) && !savedShipTo()) setShipToState((s) => ({ ...s, country }))
      })
      .catch(() => {
        // keep the guess
      })
  }, [])

  const update = (next: StoredLine[]) => {
    setLines(next)
    saveLines(next)
  }

  // another tab changed the bag
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'tis-cart') setLines(loadLines())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const refreshCustomer = async () => {
    const token = savedSession()
    if (!token) return
    setCustomerLoading(true)
    try {
      setCustomer(await fetchCustomer(token))
    } catch {
      clearSession()
      setCustomer(null)
    } finally {
      setCustomerLoading(false)
    }
  }

  // restore the member session, if it is still valid
  useEffect(() => {
    void refreshCustomer()
  }, [])

  const signIn = async (session: { token: string; expiresAt: number }) => {
    saveSession(session.token, session.expiresAt)
    await refreshCustomer()
  }

  const logout = () => {
    clearSession()
    setCustomer(null)
  }

  const addToCart = async (variantId: string, quantity = 1) => {
    setCartError(null)
    const existing = lines.find((l) => l.variantId === variantId)
    update(
      existing
        ? lines.map((l) => (l.variantId === variantId ? { ...l, quantity: l.quantity + quantity } : l))
        : [...lines, { variantId, quantity }],
    )
    setCartOpen(true)
  }

  const setLineQty = async (variantId: string, quantity: number) => {
    setCartError(null)
    update(
      quantity <= 0
        ? lines.filter((l) => l.variantId !== variantId)
        : lines.map((l) => (l.variantId === variantId ? { ...l, quantity } : l)),
    )
  }

  const clearCart = () => update([])

  const checkout = async (details: CheckoutDetails) => {
    if (!cart.lines.length) return
    setCartLoading(true)
    setCartError(null)
    trackBeginCheckout(cart.subtotal, cart.currencyCode, cart.totalQuantity)
    const items = cart.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity }))
    try {
      const url = STRIPE_CHECKOUT
        ? (
            await api<{ url: string }>('checkout', {
              items,
              country: shipTo.country,
              province: shipTo.country === 'CA' ? shipTo.province : undefined,
              code: details.code,
              email: details.email || customer?.email,
            })
          ).url
        : await shopifyCheckoutUrl(items)
      window.location.href = url
    } catch (err) {
      setCartError(err instanceof Error ? err.message : 'Could not start checkout.')
      setCartLoading(false)
      throw err
    }
  }

  return (
    <StoreContext.Provider
      value={{
        country: shipTo.country,
        province: shipTo.province,
        currency,
        setShipTo,
        products,
        announcements: live.site.announcements,
        sale: live.site.sale,
        shipping: live.shipping,
        freeShipping: live.freeShipping,
        cart,
        cartLoading,
        cartError,
        addToCart,
        setLineQty,
        clearCart,
        cartOpen,
        setCartOpen,
        checkout,
        customer,
        customerLoading,
        signIn,
        logout,
        refreshCustomer,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
