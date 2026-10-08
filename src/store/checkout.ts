import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CepAddress } from '../lib/cep'

export type Period = 'manha' | 'tarde'
export type PayMethod = 'pix' | 'card'

export interface CheckoutState {
  cep: string
  address: CepAddress | null
  number: string
  complement: string
  recipient: string
  date: string
  period: Period
  note: string
  phone: string
  method: PayMethod
  set: (patch: Partial<Omit<CheckoutState, 'set' | 'reset'>>) => void
  reset: () => void
}

const initial = {
  cep: '',
  address: null,
  number: '',
  complement: '',
  recipient: '',
  date: '',
  period: 'tarde' as Period,
  note: '',
  phone: '',
  method: 'pix' as PayMethod,
}

/** Rascunho do checkout — fica na sessão para o usuário não perder o que digitou. */
export const useCheckout = create<CheckoutState>()(
  persist(
    (set) => ({
      ...initial,
      set: (patch) => set(patch),
      reset: () => set({ ...initial }),
    }),
    { name: 'uab-checkout', storage: createJSONStorage(() => sessionStorage) },
  ),
)
