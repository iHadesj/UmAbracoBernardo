import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { bouncy, Page } from '../components/motion'
import { gap } from '../components/style'
import { brl, prettyDate } from '../lib/format'
import { orderMessage } from '../lib/orderMessage'
import { useOrders } from '../lib/orders'
import { waLink } from '../lib/whatsapp'

function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        x: (Math.random() - 0.5) * 340,
        y: -140 - Math.random() * 200,
        r: Math.random() * 360,
        d: Math.random() * 0.3,
        s: 0.6 + Math.random() * 0.8,
        c: ['var(--red)', 'var(--red-2)', '#D9B66E', 'var(--leaf)', 'var(--kraft)'][i % 5],
        heart: i % 3 === 0,
      })),
    [],
  )
  return (
    <div style={{ position: 'absolute', left: '50%', top: 70, pointerEvents: 'none' }} aria-hidden="true">
      {bits.map((b, i) => (
        <motion.span
          key={i}
          style={{ position: 'absolute', width: 10, height: b.heart ? 10 : 6, borderRadius: 2, background: b.heart ? 'none' : b.c, color: b.c, fontSize: 14, lineHeight: 1 }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 260], rotate: b.r, opacity: [1, 1, 0], scale: b.s }}
          transition={{ duration: 2.2, delay: 0.35 + b.d, ease: [0.15, 0.6, 0.4, 1] }}
        >
          {b.heart ? '♥' : null}
        </motion.span>
      ))}
    </div>
  )
}

export default function OrderSuccess() {
  const { id } = useParams()
  const order = useOrders((s) => s.orders.find((o) => o.id === id))

  if (!order) {
    return (
      <Page>
        <div className="container narrow empty">
          <h1 className="h2">Pedido não encontrado</h1>
          <p className="muted">Ele pode ter sido feito em outro aparelho. Veja seus pedidos na sua conta.</p>
          <Link to="/conta" className="btn btn--primary">
            Minha conta
          </Link>
        </div>
      </Page>
    )
  }

  const wa = waLink(orderMessage(order))

  return (
    <Page>
      <div className="container narrow success" style={{ position: 'relative' }}>
        <Confetti />
        <motion.div className="success__check" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...bouncy, delay: 0.1 }}>
          <svg viewBox="0 0 24 24" width={46} height={46} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.45 }} />
          </svg>
        </motion.div>
        <motion.div className="stack" style={{ ...gap(6), alignItems: 'center' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <span className="kicker">quase lá!</span>
          <h1 className="h2">
            Pedido <em>montado</em>
          </h1>
          <p className="muted">
            Nº <b style={{ color: 'var(--ink)' }}>{order.id}</b> · abrimos o WhatsApp com tudo escrito. Envie a mensagem por lá para confirmarmos e combinarmos o pagamento.
          </p>
        </motion.div>

        <motion.div className="panel order-card stack" style={gap(4)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          {order.items.map((i) => (
            <div key={i.key} className="sum-row">
              <span>
                {i.qty}× {i.name}
              </span>
              <span>{brl(i.unitPrice * i.qty)}</span>
            </div>
          ))}
          <div className="sum-row">
            <span>Entrega · {prettyDate(order.date)}</span>
            <span>{order.shipping === 0 ? 'Grátis' : brl(order.shipping)}</span>
          </div>
          <div className="sum-row sum-row--total">
            <b>Total</b>
            <span className="price">{brl(order.total)}</span>
          </div>
          <p className="small muted" style={{ marginTop: 6 }}>
            Para {order.recipient} · {order.address.logradouro}, {order.address.number} — {order.address.bairro}
          </p>
        </motion.div>

        <motion.div className="stack" style={{ ...gap(10), width: '100%' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
          <a href={wa} target="_blank" rel="noreferrer" className="btn btn--primary btn--block">
            <Icon name="whatsapp" size={19} /> Abrir o WhatsApp de novo
          </a>
          <Link to="/presentes" className="btn btn--ghost btn--block">
            Continuar comprando
          </Link>
        </motion.div>
      </div>
    </Page>
  )
}
