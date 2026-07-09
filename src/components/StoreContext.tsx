import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  shopifyConfigured,
  createCart,
  getCart,
  addCartLine,
  updateCartLine,
  removeCartLine,
  type ShopifyCart,
} from '../lib/shopify'

const CART_ID_KEY = 'sukundu_cart_id'

interface StoreState {
  cart: ShopifyCart | null
  cartLoading: boolean
  cartError: string | null
  addToCart: (merchandiseId: string, quantity?: number) => Promise<void>
  setLineQty: (lineId: string, quantity: number) => Promise<void>
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  accountOpen: boolean
  setAccountOpen: (open: boolean) => void
  memberName: string | null
  setMemberName: (name: string | null) => void
}

const StoreContext = createContext<StoreState | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<ShopifyCart | null>(null)
  const [cartLoading, setCartLoading] = useState(false)
  const [cartError, setCartError] = useState<string | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [memberName, setMemberName] = useState<string | null>(null)

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
        accountOpen,
        setAccountOpen,
        memberName,
        setMemberName,
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
