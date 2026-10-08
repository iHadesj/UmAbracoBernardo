import { lazy, Suspense, useMemo } from 'react'
import { looksFor, type Product, type Selection } from '../data/products'
import { ProductArt } from './ProductArt'

const BearStage = lazy(() => import('../three/BearStage'))
const BubbleStage = lazy(() => import('../three/BubbleStage'))

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
 * Mostra o modelo 3D interativo do produto (urso ou bubble). Sem WebGL, ou
 * enquanto o 3D carrega, mostra a ilustração.
 */
export function ProductStage({ product, selection, hint }: { product: Product; selection: Selection; hint?: string }) {
  const look = looksFor(product, selection)
  const art = (
    <div className="stage-fallback">
      <ProductArt kind={product.art} look={look} className="art" />
    </div>
  )
  const canRender = useMemo(hasWebGL, [])
  if (!product.model || !canRender) return art

  const fallback = (
    <>
      {art}
      <div className="shimmer" />
    </>
  )

  return (
    <Suspense fallback={fallback}>
      {product.model === 'bear' ? (
        <BearStage look={{ fur: look.fur, ribbon: look.ribbon }} hint={hint} />
      ) : (
        <BubbleStage look={{ inner: look.inner, ribbon: look.ribbon, name: look.name, age: look.age }} hint={hint} />
      )}
    </Suspense>
  )
}
