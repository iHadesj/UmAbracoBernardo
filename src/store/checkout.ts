import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CepAddress } from '../lib/cep'

export type Period = 'manha' | 'tarde'

export const PERIOD_LABEL: Record<Period, string> = { manha: 'Manhã · 9h–12h', tarde: 'Tarde · 13h–18h' }

export interface CheckoutState {
  cep: string
  address: CepAddress | null
  number: string
  complement: string
  recipient: string
  date: string
  period: Period
  note: string
  name: string
  phone: string
  obs: string
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
  name: '',
  phone: '',
  obs: '',
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
