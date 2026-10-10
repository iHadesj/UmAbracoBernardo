import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_FONTS, DEFAULT_PALETTE, type FontSetId, type PaletteId } from '../theme/styles'

export type Theme = 'light' | 'dark'

export interface Flyer {
  id: number
  x: number
  y: number
  color: string
}

export interface Toast {
  id: number
  text: string
  tone?: 'ok' | 'error'
}

export interface GoToCart {
  id: number
  visible: boolean
}

interface UIState {
  theme: Theme
  palette: PaletteId
  fonts: FontSetId
  setPalette: (p: PaletteId) => void
  setFonts: (f: FontSetId) => void
  hugs: number
  flyers: Flyer[]
  toasts: Toast[]
  goToCart: GoToCart | null
  toggleTheme: () => void
  hug: () => void
  fly: (from: Element | null, color?: string) => void
  landFlyer: (id: number) => void
  toast: (text: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
  showGoToCart: () => void
  hideGoToCart: () => void
}

let seq = 0

const initialTheme = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      theme: initialTheme(),
      palette: DEFAULT_PALETTE,
      fonts: DEFAULT_FONTS,
      setPalette: (palette) => set({ palette }),
      setFonts: (fonts) => set({ fonts }),
      hugs: 0,
      flyers: [],
      toasts: [],
      goToCart: null,
      toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
      hug: () => set((s) => ({ hugs: s.hugs + 1 })),
      fly: (from, color = 'var(--red)') => {
        if (!from) return
        const r = from.getBoundingClientRect()
        set((s) => ({ flyers: [...s.flyers, { id: ++seq, x: r.left + r.width / 2, y: r.top + r.height / 2, color }] }))
      },
      landFlyer: (id) => set((s) => ({ flyers: s.flyers.filter((f) => f.id !== id) })),
      toast: (text, tone = 'ok') => {
        const id = ++seq
        set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, tone }] }))
        setTimeout(() => get().dismissToast(id), 2800)
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      showGoToCart: () => {
        const id = ++seq
        set({ goToCart: { id, visible: true } })
        setTimeout(() => get().hideGoToCart(), 2500)
      },
      hideGoToCart: () => set({ goToCart: null }),
    }),
    { name: 'uab-ui', partialize: (s) => ({ theme: s.theme, hugs: s.hugs, palette: s.palette, fonts: s.fonts }) },
  ),
)
