import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Selection } from '../data/products'

export interface CartItem {
  key: string
  productId: string
  name: string
  unitPrice: number
  qty: number
  selection: Selection
  extras: string[]
  summary: string[]
  /** Ocasião escolhida no "Monte o seu" */
  occasion?: string
}

interface CartState {
  items: CartItem[]
  add: (item: Omit<CartItem, 'key' | 'qty'>, qty?: number) => void
  setQty: (key: string, qty: number) => void
  remove: (key: string) => void
  clear: () => void
}

const keyOf = (i: Pick<CartItem, 'productId' | 'selection' | 'extras'>) =>
  `${i.productId}|${JSON.stringify(i.selection)}|${[...i.extras].sort().join(',')}`

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, qty = 1) =>
        set((s) => {
          const key = keyOf(item)
          const found = s.items.find((i) => i.key === key)
          if (found) return { items: s.items.map((i) => (i.key === key ? { ...i, qty: Math.min(i.qty + qty, 20) } : i)) }
          return { items: [...s.items, { ...item, key, qty }] }
        }),
      setQty: (key, qty) =>
        set((s) => ({ items: qty <= 0 ? s.items.filter((i) => i.key !== key) : s.items.map((i) => (i.key === key ? { ...i, qty: Math.min(qty, 20) } : i)) })),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'uab-cart' },
  ),
)

export const cartCount = (items: CartItem[]) => items.reduce((a, i) => a + i.qty, 0)
export const cartSubtotal = (items: CartItem[]) => Math.round(items.reduce((a, i) => a + i.unitPrice * i.qty, 0) * 100) / 100
