const NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER ?? '').replace(/\D/g, '')

export function waLink(message: string) {
  const text = encodeURIComponent(message)
  return NUMBER ? `https://wa.me/${NUMBER}?text=${text}` : `https://wa.me/?text=${text}`
}

export const WA_GENERAL = waLink('Olá, Um abraço, Bernardo! Gostaria de fazer um pedido 💛')
