const brlFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const brl = (v: number) => brlFmt.format(v)

export const onlyDigits = (s: string) => s.replace(/\D/g, '')

export function maskCep(s: string) {
  const d = onlyDigits(s).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export function maskPhone(s: string) {
  const d = onlyDigits(s).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** yyyy-mm-dd no fuso local */
export function isoDate(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function addDays(d: Date, n: number) {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

export function prettyDate(iso: string) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

export const firstName = (s: string | null | undefined) => (s ?? '').trim().split(/\s+/)[0] ?? ''
