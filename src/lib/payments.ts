/**
 * Gateway de pagamento SIMULADO.
 *
 * Em produção, a cobrança precisa ser criada no servidor (ex.: Cloud Function
 * chamando Mercado Pago / Pagar.me / Stripe) e o cartão deve ser tokenizado
 * pelo SDK do provedor — dados de cartão nunca devem passar pelo nosso backend.
 * Mantenha a mesma interface abaixo e troque a implementação.
 */

import { onlyDigits } from './format'

export type CardBrand = 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'desconhecida'

export interface CardInput {
  number: string
  name: string
  expiry: string // MM/AA
  cvv: string
  installments: number
}

export interface PaymentResult {
  status: 'approved' | 'declined'
  transactionId: string
  message?: string
}

export interface PixCharge {
  txid: string
  copyPaste: string
  expiresAt: number
  amount: number
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const rid = (n = 10) => Array.from({ length: n }, () => '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 34)]).join('')

export function detectBrand(raw: string): CardBrand {
  const n = onlyDigits(raw)
  if (/^3[47]/.test(n)) return 'amex'
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(n)) return 'elo'
  if (/^(606282|3841)/.test(n)) return 'hipercard'
  if (/^4/.test(n)) return 'visa'
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'mastercard'
  return 'desconhecida'
}

export function luhn(raw: string) {
  const n = onlyDigits(raw)
  if (n.length < 13) return false
  let sum = 0
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i])
    if (i % 2 === 1) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return sum % 10 === 0
}

export function maskCard(raw: string) {
  const n = onlyDigits(raw).slice(0, 19)
  if (detectBrand(n) === 'amex') return n.replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '))
  return n.replace(/(\d{4})(?=\d)/g, '$1 ')
}

export function maskExpiry(raw: string) {
  const d = onlyDigits(raw).slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

export function expiryValid(exp: string) {
  const [mm, yy] = exp.split('/').map(Number)
  if (!mm || mm > 12 || yy === undefined || Number.isNaN(yy)) return false
  const now = new Date()
  const year = 2000 + yy
  return year > now.getFullYear() || (year === now.getFullYear() && mm >= now.getMonth() + 1)
}

export function validateCard(c: CardInput) {
  const errors: Partial<Record<keyof CardInput, string>> = {}
  if (!luhn(c.number)) errors.number = 'Número de cartão inválido'
  if (c.name.trim().split(/\s+/).length < 2) errors.name = 'Nome como está no cartão'
  if (!expiryValid(c.expiry)) errors.expiry = 'Validade inválida'
  const cvvLen = detectBrand(c.number) === 'amex' ? 4 : 3
  if (onlyDigits(c.cvv).length !== cvvLen) errors.cvv = `${cvvLen} dígitos`
  return errors
}

/** Cartões terminados em 0002 são recusados — útil para testar o fluxo de erro. */
export async function payWithCard(card: CardInput, _amount: number): Promise<PaymentResult> {
  await wait(1800 + Math.random() * 800)
  if (onlyDigits(card.number).endsWith('0002')) {
    return { status: 'declined', transactionId: rid(), message: 'Pagamento recusado pelo banco emissor. Tente outro cartão ou Pix.' }
  }
  return { status: 'approved', transactionId: rid() }
}

export async function createPixCharge(amount: number): Promise<PixCharge> {
  await wait(700)
  const txid = rid(25)
  const value = amount.toFixed(2)
  // Formato inspirado no BR Code — não é um Pix pagável.
  const copyPaste = `00020126580014BR.GOV.BCB.PIX0136demo-umabracobernardo-${txid.slice(0, 8).toLowerCase()}52040000530398654${String(value.length).padStart(2, '0')}${value}5802BR5920UM ABRACO BERNARDO6009SAO PAULO62290525${txid}6304${rid(4)}`
  return { txid, copyPaste, expiresAt: Date.now() + 15 * 60 * 1000, amount }
}

export async function confirmPix(charge: PixCharge): Promise<PaymentResult> {
  await wait(1500)
  return { status: 'approved', transactionId: charge.txid }
}

export const PIX_DISCOUNT = 0.05
export const MAX_INSTALLMENTS = 3
