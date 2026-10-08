/** Mouse/trackpad (computador) em vez de toque. */
export function finePointer() {
  try {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches
  } catch {
    return false
  }
}

/** Economia de dados ligada ou conexão 2G: melhor não baixar o 3D sozinho. */
export function slowConnection() {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  return !!c && (c.saveData === true || c.effectiveType === 'slow-2g' || c.effectiveType === '2g')
}
