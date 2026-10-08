import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { Footer } from '../components/Chrome'
import { Page, Reveal, SplitTitle } from '../components/motion'
import { ProductCard } from '../components/ProductCard'
import { gap } from '../components/style'
import { Chips } from '../components/ui'
import { CATEGORIES, OCCASIONS, PRODUCTS, type Category, type Occasion } from '../data/products'

type CatFilter = 'todos' | Category
type OccFilter = 'todas' | Occasion

export default function Products() {
  const [params, setParams] = useSearchParams()
  const cat = (params.get('cat') as CatFilter) || 'todos'
  const occ = (params.get('ocasiao') as OccFilter) || 'todas'

  const update = (k: string, v: string, empty: string) => {
    const next = new URLSearchParams(params)
    if (v === empty) next.delete(k)
    else next.set(k, v)
    setParams(next, { replace: true })
  }

  const list = PRODUCTS.filter((p) => (cat === 'todos' || p.category === cat) && (occ === 'todas' || p.occasions.includes(occ)))

  return (
    <Page>
      <div className="container">
        <section className="stack" style={{ ...gap(8), paddingTop: 24 }}>
          <span className="kicker">vitrine</span>
          <SplitTitle className="h1" text="Nossos *mimos*" />
          <p className="lead">Escolha, personalize e receba em casa.</p>
        </section>

        <div className="stack" style={{ ...gap(10), position: 'sticky', top: 62, zIndex: 5, padding: '14px 0 10px', background: 'var(--bg-a)', backdropFilter: 'blur(12px)', marginTop: 8 }}>
          <Chips
            id="cat"
            label="Categoria"
            value={cat}
            onChange={(v) => update('cat', v, 'todos')}
            items={[{ value: 'todos' as CatFilter, label: 'Todos' }, ...CATEGORIES.map((c) => ({ value: c.id as CatFilter, label: c.label, count: PRODUCTS.filter((p) => p.category === c.id).length }))]}
          />
          <Chips
            id="occ"
            label="Ocasião"
            value={occ}
            onChange={(v) => update('ocasiao', v, 'todas')}
            items={[{ value: 'todas' as OccFilter, label: 'Toda ocasião' }, ...OCCASIONS.map((o) => ({ value: o as OccFilter, label: o }))]}
          />
        </div>

        <LayoutGroup>
          <motion.div layout className="grid" style={{ marginTop: 10 }} initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }}>
            <AnimatePresence mode="popLayout">
              {list.map((p) => (
                <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>

        <AnimatePresence>
          {list.length === 0 && (
            <motion.p className="muted" style={{ textAlign: 'center', padding: '32px 0' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              Nada por aqui com esse filtro — que tal um orçamento sob medida?
            </motion.p>
          )}
        </AnimatePresence>

        <Reveal className="section">
          <div className="panel stack" style={gap(12)}>
            <h2 className="h3" style={{ fontSize: 22 }}>
              Não achou o que <em>imaginou</em>?
            </h2>
            <p className="small muted">Kits e arranjos sob medida, feitos a partir da sua ideia.</p>
            <Link to="/orcamento" className="btn btn--dark">
              Pedir um orçamento
            </Link>
          </div>
        </Reveal>
      </div>
      <Footer />
    </Page>
  )
}
