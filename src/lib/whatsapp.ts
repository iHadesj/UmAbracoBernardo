/** WhatsApp da loja: +55 11 98336-0751. VITE_WHATSAPP_NUMBER pode sobrescrever. */
const STORE_NUMBER = '5511983360751'

function normalize(raw: string) {
  const d = raw.replace(/\D/g, '')
  // aceita o número sem DDI (DDD + número) e completa com o +55
  return d.length === 10 || d.length === 11 ? `55${d}` : d
}

export const WA_NUMBER = normalize(import.meta.env.VITE_WHATSAPP_NUMBER ?? '') || STORE_NUMBER

export function waLink(message: string) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`
}

export const WA_GENERAL = waLink('Olá, Um abraço, Bernardo! Gostaria de fazer um pedido 💛')
