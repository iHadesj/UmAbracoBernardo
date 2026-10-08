import { motion, useAnimate } from 'framer-motion'
import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CepChecker } from '../components/CepChecker'
import { Icon } from '../components/Icon'
import { AnimatedPrice, Page } from '../components/motion'
import { ExtrasList, Includes, ProductOptions } from '../components/Options'
import { ProductStage } from '../components/ProductStage'
import { gap } from '../components/style'
import { Accordion, Qty } from '../components/ui'
import { CATEGORIES, defaultSelection, describeSelection, getProduct, missingRequired, unitPrice, type Product } from '../data/products'
import { brl } from '../lib/format'
import { waLink } from '../lib/whatsapp'
import { useCart } from '../store/cart'
import { useUI } from '../store/ui'
import NotFound from './NotFound'

export default function ProductDetail() {
  const { id } = useParams()
  const product = getProduct(id)
  if (!product) return <NotFound />
  return <Detail key={product.id} product={product} />
}

function Detail({ product }: { product: Product }) {
  const navigate = useNavigate()
  const add = useCart((s) => s.add)
  const fly = useUI((s) => s.fly)
  const toast = useUI((s) => s.toast)
  const [sel, setSel] = useState(() => defaultSelection(product))
  const [extras, setExtras] = useState<string[]>([])
  const [qty, setQty] = useState(1)
  const [open, setOpen] = useState<string | null>(null)
  const [scope, animate] = useAnimate()
  const addBtn = useRef<HTMLButtonElement>(null)

  const unit = unitPrice(product, sel, extras)
  const summary = describeSelection(product, sel, extras)
  const category = CATEGORIES.find((c) => c.id === product.category)?.label

  const addToCart = () => {
    const missing = missingRequired(product, sel)
    if (missing.length) {
      toast(`Preencha: ${missing.map((m) => m.label.toLowerCase()).join(', ')}`, 'error')
      animate(scope.current, { x: [0, -10, 10, -6, 6, 0] }, { duration: 0.45 })
      scope.current?.querySelector('input')?.focus()
      return
    }
    add({ productId: product.id, name: product.name, unitPrice: unit, selection: sel, extras, summary }, qty)
    fly(addBtn.current)
    toast(`${product.name} na sacola`)
  }

  const waMsg = [`Olá! Tenho interesse no ${product.name}:`, ...summary.map((s) => `• ${s}`), `Quantidade: ${qty}`, `Estimativa: ${brl(unit * qty)}`].join('\n')

  return (
    <Page bar>
      <div className="container pd">
        <div className="pd__visual">
          <button className="back" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/presentes'))}>
            <Icon name="back" size={18} /> Presentes
          </button>
          <motion.div className="arch arch--product" layoutId={`art-${product.id}`} transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
            <ProductStage product={product} selection={sel} />
          </motion.div>
        </div>

        <motion.div className="pd__info" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }}>
          {[
            <div key="t" className="stack" style={gap(8)}>
              <span className="eyebrow">{category}</span>
              <h1 className="h1" style={{ fontSize: 'clamp(28px, 7vw, 44px)' }}>
                {product.name}
              </h1>
              <div className="row" style={{ alignItems: 'baseline' }}>
                <AnimatedPrice value={unit} className="price" />
                {unit !== product.price && <span className="small muted">base {brl(product.price)}</span>}
              </div>
              <p className="muted">{product.description}</p>
            </div>,
            <div key="o" ref={scope}>
              <ProductOptions product={product} value={sel} onChange={setSel} />
            </div>,
            <div key="a">
              <Accordion title={`Adicionais${extras.length ? ` (${extras.length})` : ''}`} open={open === 'extras'} onToggle={() => setOpen(open === 'extras' ? null : 'extras')}>
                <div style={{ paddingBottom: 16 }}>
                  <ExtrasList value={extras} onChange={setExtras} />
                </div>
              </Accordion>
              <Accordion title="O que vem" open={open === 'inc'} onToggle={() => setOpen(open === 'inc' ? null : 'inc')}>
                <Includes items={product.includes} />
              </Accordion>
              <Accordion title="Entrega" open={open === 'cep'} onToggle={() => setOpen(open === 'cep' ? null : 'cep')}>
                <div style={{ paddingBottom: 16 }}>
                  <CepChecker compact subtotal={unit * qty} />
                </div>
              </Accordion>
            </div>,
            <a key="w" href={waLink(waMsg)} target="_blank" rel="noreferrer" className="row small muted" style={{ ...gap(8), justifyContent: 'center' }}>
              <Icon name="whatsapp" size={17} /> Prefere combinar pelo WhatsApp?
            </a>,
          ].map((el) => (
            <motion.div key={el.key} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
              {el}
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div className="actionbar" initial={{ y: 100 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}>
        <div className="actionbar__inner">
          <Qty value={qty} onChange={setQty} />
          <motion.button ref={addBtn} className="btn btn--primary" onClick={addToCart} whileTap={{ scale: 0.96 }}>
            <Icon name="bag" size={18} />
            <span>
              Adicionar · <AnimatedPrice value={unit * qty} className="" />
            </span>
          </motion.button>
        </div>
      </motion.div>
      <Link to="/sacola" className="sr-only">
        Ir para a sacola
      </Link>
    </Page>
  )
}
