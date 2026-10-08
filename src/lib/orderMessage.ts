import { getProduct, labeledSelection } from '../data/products'
import { PERIOD_LABEL } from '../store/checkout'
import type { CartItem } from '../store/cart'
import { brl, maskCep } from './format'
import type { Order } from './orders'

/*
 * Texto padronizado do pedido, enviado para o WhatsApp da loja.
 * Usa só a formatação do WhatsApp (*negrito*, _itálico_) e evita emojis,
 * que alguns clientes (WhatsApp Web/desktop) trocam por "?" em links wa.me.
 */

const SEP = '──────────────'

function longDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const s = new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function itemDetails(i: CartItem) {
  const p = getProduct(i.productId)
  const lines = p ? labeledSelection(p, i.selection, i.extras) : i.summary
  return i.occasion ? [`Ocasião: ${i.occasion}`, ...lines] : lines
}

export function orderMessage(o: Order): string {
  const a = o.address
  const out: string[] = []
  const section = (title: string, ...lines: (string | false | null | undefined)[]) => {
    out.push('', `*${title}*`, ...lines.filter((l): l is string => !!l))
  }

  out.push('*NOVO PEDIDO · Um abraço, Bernardo*', SEP, `Pedido: *${o.id}*`, `Feito em: ${new Date(o.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`)

  section(
    'ITENS',
    ...o.items.flatMap((i, n) => [
      `${n + 1}. ${i.qty}x *${i.name}* — ${brl(i.unitPrice * i.qty)}${i.qty > 1 ? ` (${brl(i.unitPrice)} cada)` : ''}`,
      ...itemDetails(i).map((d) => `     ◦ ${d}`),
    ]),
  )

  section('VALORES', `Subtotal: ${brl(o.subtotal)}`, `Entrega: ${o.shipping === 0 ? 'Grátis' : brl(o.shipping)}`, `*Total: ${brl(o.total)}*`)

  section(
    'ENTREGA',
    `Quem recebe: ${o.recipient}`,
    `Data: ${longDate(o.date)}`,
    `Período: ${PERIOD_LABEL[o.period]}`,
    `Endereço: ${a.logradouro}, ${a.number}${o.address.complement ? ` — ${o.address.complement}` : ''}`,
    `Bairro: ${a.bairro} — ${a.localidade}/${a.uf}`,
    `CEP: ${maskCep(a.cep)}`,
  )

  if (o.note) section('BILHETE DO CARTÃO', `_"${o.note}"_`)

  section('CLIENTE', `Nome: ${o.customer.name}`, `WhatsApp: ${o.customer.phone}`, o.customer.email && `E-mail: ${o.customer.email}`)

  if (o.obs) section('OBSERVAÇÕES', o.obs)

  out.push('', SEP, 'Pagamento: a combinar por aqui.', 'Aguardo a confirmação, obrigado(a)!')
  return out.join('\n')
}
