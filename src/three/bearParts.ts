import { useEffect, useState } from 'react'
import { buildFurParts, type FurParts } from './bearGeometry'

let pending: Promise<FurParts> | undefined

/**
 * Gera as malhas do urso num Web Worker, sem travar a rolagem da página, e guarda
 * o resultado para as próximas vezes. Sem Worker (ou se ele falhar), gera aqui mesmo.
 */
export function loadBearParts() {
  pending ??= new Promise<FurParts>((resolve) => {
    const here = () => setTimeout(() => resolve(buildFurParts()), 0)
    try {
      const worker = new Worker(new URL('./bearParts.worker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = (e: MessageEvent<FurParts>) => {
        resolve(e.data)
        worker.terminate()
      }
      worker.onerror = () => {
        worker.terminate()
        here()
      }
    } catch {
      here()
    }
  })
  return pending
}

/** As malhas do urso, ou null enquanto ainda estão sendo geradas. */
export function useBearParts() {
  const [parts, setParts] = useState<FurParts | null>(null)
  useEffect(() => {
    let alive = true
    void loadBearParts().then((p) => alive && setParts(p))
    return () => {
      alive = false
    }
  }, [])
  return parts
}
