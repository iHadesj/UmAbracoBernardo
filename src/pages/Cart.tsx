import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { CepCheckerView, useCepLookup } from '../components/CepChecker'
import { Icon } from '../components/Icon'
import { AnimatedPrice, Page } from '../components/motion'
import { ProductArt } from '../components/ProductArt'
import { ProductVisual } from '../components/ProductVisual'
import { gap } from '../components/style'
import { Qty } from '../components/ui'
import { getProduct } from '../data/products'
import { brl } from '../lib/format'
import { cartSubtotal, useCart, type CartItem } from '../store/cart'
import { useUI } from '../store/ui'

function Row({ item }: { item: CartItem }) {
  const setQty = useCart((s) => s.setQty)
  const remove = useCart((s) => s.remove)
  const toast = useUI((s) => s.toast)
  const x = useMotionValue(0)
  const reveal = useTransform(x, [-110, -30, 0], [1, 0.6, 0])
  const product = getProduct(item.productId)

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -100 || info.velocity.x < -650) {
      remove(item.key)
      toast('Removido da sacola')
    }
  }

  return (
    <motion.li
      layout
      className="cart-item"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -120, height: 0, marginBottom: 0, transition: { duration: 0.3 } }}
      style={{ listStyle: 'none' }}
    >
      <motion.div className="cart-item__delete" style={{ opacity: reveal }} aria-hidden="true">
        <Icon name="trash" size={18} /> Remover
      </motion.div>
      <motion.div className="cart-item__card" drag="x" dragDirectionLock dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0.7, right: 0 }} style={{ x }} onDragEnd={onDragEnd}>
        <Link to={`/produto/${item.productId}`} className="cart-item__thumb arch" draggable={false}>
          {product && <ProductVisual product={product} selection={item.selection} sizes="82px" />}
        </Link>
        <div className="cart-item__info">
          <b>{item.name}</b>
          <span className="cart-item__opts">{item.summary.join(' · ')}</span>
          <div className="row" style={{ marginTop: 'auto', justifyContent: 'space-between' }}>
            <Qty value={item.qty} min={0} onChange={(q) => setQty(item.key, q)} />
            <AnimatedPrice value={item.unitPrice * item.qty} />
          </div>
        </div>
      </motion.div>
    </motion.li>
  )
}

export default function Cart() {
  const items = useCart((s) => s.items)
  const navigate = useNavigate()
  const subtotal = cartSubtotal(items)
  const lookup = useCepLookup(subtotal)
  const { state } = lookup
  const shipping = state.status === 'ok' && state.quote.available ? state.quote.fee : null

  if (!items.length) {
    return (
      <Page>
        <div className="container narrow empty">
          <motion.div initial={{ scale: 0.6, rotate: -10, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              <ProductArt kind="bear" className="art" />
            </motion.div>
          </motion.div>
          <h1 className="h2">
            Sua sacola está <em>vazia</em>
          </h1>
          <p className="muted">O Bernardo está esperando um abraço. Que tal escolher um presente?</p>
          <Link to="/presentes" className="btn btn--primary">
            Ver presentes <Icon name="arrow" size={18} />
          </Link>
        </div>
      </Page>
    )
  }

  return (
    <Page bar>
      <div className="container narrow" style={{ paddingTop: 22 }}>
        <span className="kicker">quase lá</span>
        <h1 className="h2" style={{ margin: '4px 0 6px' }}>
          Sua <em>sacola</em>
        </h1>
        <p className="small muted" style={{ marginBottom: 16 }}>
          Arraste um item para a esquerda para remover.
        </p>

        <ul className="stack" style={{ ...gap(12), padding: 0, margin: 0 }}>
          <AnimatePresence initial={false}>
            {items.map((i) => (
              <Row key={i.key} item={i} />
            ))}
          </AnimatePresence>
        </ul>

        <motion.div layout className="panel" style={{ marginTop: 22 }}>
          <CepCheckerView lookup={lookup} />
          <div style={{ marginTop: 14 }}>
            <div className="sum-row">
              <span>Subtotal</span>
              <AnimatedPrice value={subtotal} className="" />
            </div>
            <div className="sum-row">
              <span>Entrega</span>
              <span>{shipping === null ? 'Informe o CEP' : shipping === 0 ? <b className="free">Grátis</b> : brl(shipping)}</span>
            </div>
          </div>
          <p className="small muted" style={{ marginTop: 10 }}>
            O pedido é enviado pelo WhatsApp e o pagamento é combinado por lá.
          </p>
        </motion.div>
      </div>

      <div className="actionbar">
        <div className="actionbar__inner">
          <div className="actionbar__total">
            <small>Total {shipping === null ? 'sem frete' : ''}</small>
            <AnimatedPrice value={subtotal + (shipping ?? 0)} />
          </div>
          <motion.button className="btn btn--primary" onClick={() => navigate('/checkout')} whileTap={{ scale: 0.96 }}>
            Finalizar pedido <Icon name="arrow" size={18} />
          </motion.button>
        </div>
      </div>
    </Page>
  )
}
