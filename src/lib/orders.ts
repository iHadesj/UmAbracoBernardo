import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '../store/cart'
import type { CepAddress } from './cep'
import type { Period } from '../store/checkout'
import { firebaseEnabled, getFirebase } from './firebase'

export interface Order {
  id: string
  createdAt: number
  items: CartItem[]
  subtotal: number
  shipping: number
  total: number
  address: CepAddress & { number: string; complement: string }
  recipient: string
  date: string
  period: Period
  /** Bilhete que vai no cartão */
  note: string
  /** Observações para a loja (referência, horário, etc.) */
  obs: string
  /** Sem conta: uid = GUEST_UID */
  customer: { uid: string; name: string; email: string | null; phone: string }
  /** Por enquanto o pedido é fechado e pago pelo WhatsApp */
  channel: 'whatsapp'
}

export const GUEST_UID = 'convidado'

export const newOrderId = () => 'UAB-' + Date.now().toString(36).slice(-4).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase()

/** Cópia local dos pedidos (modo demonstração e cache do Firestore). */
export const useOrders = create<{ orders: Order[]; put: (o: Order) => void }>()(
  persist(
    (set) => ({
      orders: [],
      put: (o) => set((s) => ({ orders: [o, ...s.orders.filter((x) => x.id !== o.id)].slice(0, 30) })),
    }),
    { name: 'uab-orders' },
  ),
)

export async function saveOrder(order: Order, demoUser: boolean) {
  useOrders.getState().put(order)
  if (!firebaseEnabled || demoUser) return
  const [{ db }, { doc, setDoc }] = await Promise.all([getFirebase(), import('firebase/firestore')])
  // Firestore rejeita campos `undefined`; o round-trip em JSON remove esses campos.
  await setDoc(doc(db, 'orders', order.id), JSON.parse(JSON.stringify(order)))
}

export async function fetchOrders(uid: string, demoUser: boolean): Promise<Order[]> {
  const local = useOrders.getState().orders.filter((o) => o.customer.uid === uid)
  if (!firebaseEnabled || demoUser) return local
  try {
    const [{ db }, { collection, getDocs, query, where }] = await Promise.all([getFirebase(), import('firebase/firestore')])
    const snap = await getDocs(query(collection(db, 'orders'), where('customer.uid', '==', uid)))
    const remote = snap.docs.map((d) => d.data() as Order)
    return remote.sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return local
  }
}
