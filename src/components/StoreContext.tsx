import { createContext, useContext, useState, type ReactNode } from 'react'

export interface Product {
  id: string
  name: string
  price: number
  image: string
}

export interface CartItem extends Product {
  qty: number
}

interface StoreState {
  cart: CartItem[]
  addToCart: (p: Product) => void
  setQty: (id: string, qty: number) => void
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  accountOpen: boolean
  setAccountOpen: (open: boolean) => void
  memberName: string | null
  setMemberName: (name: string | null) => void
}

const StoreContext = createContext<StoreState | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [memberName, setMemberName] = useState<string | null>(null)

  const addToCart = (p: Product) => {
    setCart((c) => {
      const existing = c.find((i) => i.id === p.id)
      if (existing) return c.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i))
      return [...c, { ...p, qty: 1 }]
    })
    setCartOpen(true)
  }

  const setQty = (id: string, qty: number) => {
    setCart((c) => (qty <= 0 ? c.filter((i) => i.id !== id) : c.map((i) => (i.id === id ? { ...i, qty } : i))))
  }

  return (
    <StoreContext.Provider
      value={{ cart, addToCart, setQty, cartOpen, setCartOpen, accountOpen, setAccountOpen, memberName, setMemberName }}
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
