import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  shopifyConfigured,
  ensureMarket,
  createCart,
  getCart,
  addCartLine,
  updateCartLine,
  removeCartLine,
  type ShopifyCart,
} from '../lib/shopify'
import {
  customerLogin,
  customerLogout,
  customerRegister,
  fetchCustomer,
  type SukunduCustomer,
} from '../lib/customer'

const CART_ID_KEY = 'sukundu_cart_id'
const TOKEN_KEY = 'sukundu_customer_token'

interface StoreState {
  cart: ShopifyCart | null
  cartLoading: boolean
  cartError: string | null
  addToCart: (merchandiseId: string, quantity?: number) => Promise<void>
  setLineQty: (lineId: string, quantity: number) => Promise<void>
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  customer: SukunduCustomer | null
  customerLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshCustomer: () => Promise<void>
  adoptToken: (token: { accessToken: string; expiresAt: string }) => Promise<void>
}

const StoreContext = createContext<StoreState | null>(null)

function savedToken(): string | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { accessToken: string; expiresAt: string }
    if (new Date(parsed.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(TOKEN_KEY)
      return null
    }
    return parsed.accessToken
  } catch {
    return null
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<ShopifyCart | null>(null)
  const [cartLoading, setCartLoading] = useState(false)
  const [cartError, setCartError] = useState<string | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [customer, setCustomer] = useState<SukunduCustomer | null>(null)
  const [customerLoading, setCustomerLoading] = useState(false)

  // ask Shopify which country the visitor is in before anything asks for a
  // price, so the first render is already in their currency
  useEffect(() => {
    void ensureMarket()
  }, [])

  // restore an existing cart on load, if one was started before
  useEffect(() => {
    if (!shopifyConfigured) return
    const savedId = localStorage.getItem(CART_ID_KEY)
    if (!savedId) return
    getCart(savedId)
      .then((c) => {
        if (c) setCart(c)
        else localStorage.removeItem(CART_ID_KEY)
      })
      .catch(() => localStorage.removeItem(CART_ID_KEY))
  }, [])

  // restore the member session, if the token is still valid
  useEffect(() => {
    if (!shopifyConfigured) return
    const token = savedToken()
    if (!token) return
    setCustomerLoading(true)
    fetchCustomer(token)
      .then((c) => {
        if (c) setCustomer(c)
        else localStorage.removeItem(TOKEN_KEY)
      })
      .catch(() => undefined)
      .finally(() => setCustomerLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    setCustomerLoading(true)
    try {
      const token = await customerLogin(email, password)
      localStorage.setItem(TOKEN_KEY, JSON.stringify(token))
      setCustomer(await fetchCustomer(token.accessToken))
    } finally {
      setCustomerLoading(false)
    }
  }

  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    setCustomerLoading(true)
    try {
      const token = await customerRegister(firstName, lastName, email, password)
      localStorage.setItem(TOKEN_KEY, JSON.stringify(token))
      setCustomer(await fetchCustomer(token.accessToken))
    } finally {
      setCustomerLoading(false)
    }
  }

  const logout = async () => {
    const token = savedToken()
    localStorage.removeItem(TOKEN_KEY)
    setCustomer(null)
    if (token) await customerLogout(token)
  }

  const adoptToken = async (token: { accessToken: string; expiresAt: string }) => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(token))
    setCustomer(await fetchCustomer(token.accessToken))
  }

  const refreshCustomer = async () => {
    const token = savedToken()
    if (!token) return
    const c = await fetchCustomer(token)
    if (c) setCustomer(c)
  }

  const addToCart = async (merchandiseId: string, quantity = 1) => {
    setCartLoading(true)
    setCartError(null)
    try {
      const next = cart
        ? await addCartLine(cart.id, merchandiseId, quantity)
        : await createCart(merchandiseId, quantity)
      localStorage.setItem(CART_ID_KEY, next.id)
      setCart(next)
      setCartOpen(true)
    } catch (err) {
      setCartError(err instanceof Error ? err.message : 'Could not add that to your bag.')
    } finally {
      setCartLoading(false)
    }
  }

  const setLineQty = async (lineId: string, quantity: number) => {
    if (!cart) return
    setCartLoading(true)
    setCartError(null)
    try {
      const next = quantity <= 0 ? await removeCartLine(cart.id, lineId) : await updateCartLine(cart.id, lineId, quantity)
      setCart(next)
    } catch (err) {
      setCartError(err instanceof Error ? err.message : 'Could not update your bag.')
    } finally {
      setCartLoading(false)
    }
  }

  return (
    <StoreContext.Provider
      value={{
        cart,
        cartLoading,
        cartError,
        addToCart,
        setLineQty,
        cartOpen,
        setCartOpen,
        customer,
        customerLoading,
        login,
        register,
        logout,
        refreshCustomer,
        adoptToken,
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
