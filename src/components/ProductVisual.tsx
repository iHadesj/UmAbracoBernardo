import { defaultSelection, looksFor, type Product, type Selection } from '../data/products'
import { ProductArt } from './ProductArt'

/** Foto do produto (4:5, recortada com object-fit) ou, sem foto, a ilustração. */
export function ProductVisual({ product, selection, sizes = '(min-width: 900px) 30vw, 50vw', eager }: { product: Product; selection?: Selection; sizes?: string; eager?: boolean }) {
  if (product.image) {
    const base = `/products/${product.image}`
    return (
      <img
        className="art photo"
        src={`${base}.webp`}
        srcSet={`${base}-sm.webp 540w, ${base}.webp 1080w`}
        sizes={sizes}
        width={1080}
        height={1350}
        alt={product.name}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
      />
    )
  }
  return <ProductArt kind={product.art} look={looksFor(product, selection ?? defaultSelection(product))} className="art" />
}
