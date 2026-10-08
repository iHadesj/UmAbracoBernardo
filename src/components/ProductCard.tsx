import { motion } from 'framer-motion'
import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { defaultSelection, describeSelection, looksFor, missingRequired, unitPrice, type Product } from '../data/products'
import { brl } from '../lib/format'
import { useCart } from '../store/cart'
import { useUI } from '../store/ui'
import { Icon } from './Icon'
import { ProductArt } from './ProductArt'

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add)
  const fly = useUI((s) => s.fly)
  const toast = useUI((s) => s.toast)
  const navigate = useNavigate()
  const btn = useRef<HTMLButtonElement>(null)
  const sel = defaultSelection(product)

  const quickAdd = () => {
    // produtos que exigem nome vão para a página de personalização
    if (missingRequired(product, sel).length) return navigate(`/produto/${product.id}`)
    add({ productId: product.id, name: product.name, unitPrice: unitPrice(product, sel, []), selection: sel, extras: [], summary: describeSelection(product, sel, []) })
    fly(btn.current)
    toast(`${product.name} na sacola`)
  }

  return (
    <motion.article className="pcard" whileHover={{ y: -4 }} transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}>
      {product.badge && <span className="pcard__badge">{product.badge}</span>}
      <Link to={`/produto/${product.id}`} aria-label={product.name}>
        <motion.div className="arch pcard__art" layoutId={`art-${product.id}`} whileTap={{ scale: 0.97 }}>
          <motion.div style={{ width: '100%', height: '100%' }} whileHover={{ scale: 1.05, rotate: -1.5 }} transition={{ duration: 0.5 }}>
            <ProductArt kind={product.art} look={looksFor(product, sel)} className="art" />
          </motion.div>
        </motion.div>
      </Link>
      <div className="pcard__body">
        <Link to={`/produto/${product.id}`} className="pcard__text">
          <span className="pcard__name">{product.name}</span>
          <span className="pcard__price">{brl(product.price)}</span>
        </Link>
        <motion.button ref={btn} className="pcard__add" onClick={quickAdd} aria-label={`Adicionar ${product.name} à sacola`} whileTap={{ scale: 0.82, rotate: -12 }} whileHover={{ scale: 1.08 }}>
          <Icon name="plus" size={18} stroke={2.2} />
        </motion.button>
      </div>
    </motion.article>
  )
}
