import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Page } from '../components/motion'
import { ProductArt } from '../components/ProductArt'

export default function NotFound() {
  return (
    <Page>
      <div className="container narrow empty">
        <motion.div animate={{ rotate: [-4, 4, -4] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          <ProductArt kind="bear" className="art" />
        </motion.div>
        <h1 className="h2">
          Ops, essa página <em>se perdeu</em>
        </h1>
        <p className="muted">Mas o Bernardo ainda tem um abraço guardado para você.</p>
        <Link to="/" className="btn btn--primary">
          Voltar ao início
        </Link>
      </div>
    </Page>
  )
}
