import type { CSSProperties } from 'react'

/** Define o espaçamento de `.stack` / `.row` via variável CSS. */
export const gap = (px: number) => ({ '--gap': `${px}px` }) as CSSProperties
