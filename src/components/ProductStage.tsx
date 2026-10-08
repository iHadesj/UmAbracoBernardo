import { motion } from 'framer-motion'
import { lazy, Suspense, useMemo, useState } from 'react'
import { looksFor, type Product, type Selection } from '../data/products'
import { slowConnection } from '../lib/device'
import { ProductArt } from './ProductArt'
import { ProductVisual } from './ProductVisual'

const loadBear = () => import('../three/BearStage')
const loadBubble = () => import('../three/BubbleStage')
const BearStage = lazy(loadBear)
const BubbleStage = lazy(loadBubble)

let webgl: boolean | undefined
function hasWebGL() {
  if (webgl === undefined) {
    try {
      webgl = !!document.createElement('canvas').getContext('webgl2')
    } catch {
      webgl = false
    }
  }
  return webgl
}

/**
 * Mostra o modelo 3D interativo do produto (urso ou bubble). A ilustração aparece
 * na hora e o 3D entra por cima, em fade, só depois do primeiro quadro desenhado.
 * Sem WebGL fica só a ilustração; com economia de dados/2G, o 3D vira opcional.
 */
export function ProductStage({ product, selection, hint }: { product: Product; selection: Selection; hint?: string }) {
  const look = looksFor(product, selection)
  const canRender = useMemo(hasWebGL, [])
  const [want3d, setWant3d] = useState(() => !slowConnection())
  const [ready, setReady] = useState(false)

  const poster = (
    <div className="stage-fallback">
      {product.image ? <ProductVisual product={product} sizes="(min-width: 900px) 45vw, 100vw" eager /> : <ProductArt kind={product.art} look={look} className="art" />}
    </div>
  )
  if (product.image || !product.model || !canRender) return poster

  const load = () => {
    void (product.model === 'bear' ? loadBear() : loadBubble())
    setWant3d(true)
  }

  return (
    <>
      <motion.div style={{ position: 'absolute', inset: 0 }} animate={{ opacity: ready ? 0 : 1 }} transition={{ duration: 0.5 }} aria-hidden={ready}>
        {poster}
        {want3d && !ready && <div className="shimmer" />}
      </motion.div>

      {want3d ? (
        <motion.div style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}>
          <Suspense fallback={null}>
            {product.model === 'bear' ? (
              <BearStage look={{ fur: look.fur, ribbon: look.ribbon }} hint={hint} onReady={() => setReady(true)} />
            ) : (
              <BubbleStage look={{ inner: look.inner, ribbon: look.ribbon, name: look.name, age: look.age }} hint={hint} onReady={() => setReady(true)} />
            )}
          </Suspense>
        </motion.div>
      ) : (
        <motion.button className="btn btn--soft btn--sm stage-load" onClick={load} initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileTap={{ scale: 0.95 }}>
          Ver em 3D
        </motion.button>
      )}
    </>
  )
}
