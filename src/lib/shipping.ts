import type { CepAddress } from './cep'
import { onlyDigits } from './format'

export interface ShippingQuote {
  available: boolean
  zone: string
  fee: number
  /** Valor do frete antes de promoções */
  baseFee: number
  eta: string
  freeAbove?: number
  note?: string
}

/**
 * Tabela de frete por região a partir do ateliê no Jardim Prainha (Grajaú, SP).
 * As faixas usam o prefixo do CEP e a cidade retornada pelo ViaCEP — ajuste
 * os valores aqui quando a loja definir a tabela real.
 */
const GRANDE_SP = [
  'Diadema',
  'São Bernardo do Campo',
  'Santo André',
  'São Caetano do Sul',
  'Embu das Artes',
  'Embu-Guaçu',
  'Itapecerica da Serra',
  'Taboão da Serra',
  'Cotia',
  'Osasco',
  'Mauá',
  'Ribeirão Pires',
  'Guarulhos',
]

export const FREE_SHIPPING_ABOVE = 199

export function quoteShipping(addr: CepAddress, subtotal = 0): ShippingQuote {
  const prefix = Number(onlyDigits(addr.cep).slice(0, 5))
  const city = addr.localidade

  let q: ShippingQuote
  if (addr.uf !== 'SP') {
    q = { available: false, zone: 'Fora da área', fee: 0, baseFee: 0, eta: '', note: 'Ainda não entregamos aí. Fala com a gente no WhatsApp!' }
  } else if (city === 'São Paulo' && prefix >= 4800 && prefix <= 4899) {
    q = { available: true, zone: 'Grajaú e vizinhança', fee: 9.9, baseFee: 9.9, eta: 'No mesmo dia (pedidos até 14h)', freeAbove: FREE_SHIPPING_ABOVE }
  } else if (city === 'São Paulo' && ((prefix >= 4600 && prefix <= 4999) || (prefix >= 5700 && prefix <= 5899))) {
    q = { available: true, zone: 'Zona Sul', fee: 16.9, baseFee: 16.9, eta: 'Em até 1 dia útil' }
  } else if (city === 'São Paulo') {
    q = { available: true, zone: 'São Paulo capital', fee: 26.9, baseFee: 26.9, eta: 'Em até 2 dias úteis' }
  } else if (GRANDE_SP.includes(city)) {
    q = { available: true, zone: 'Grande SP', fee: 34.9, baseFee: 34.9, eta: 'Em até 2 dias úteis' }
  } else {
    q = { available: false, zone: 'Fora da área', fee: 0, baseFee: 0, eta: '', note: 'Ainda não entregamos nessa cidade. Chama no WhatsApp que a gente vê!' }
  }

  if (q.available && q.freeAbove && subtotal >= q.freeAbove) q = { ...q, fee: 0 }
  return q
}
