import { buildFurParts, type FurMesh } from './bearGeometry'

// gera as malhas peludas fora da thread da página e devolve os arrays sem cópia
const parts = buildFurParts()
const buffers = (m: FurMesh) => [m.position, m.normal, m.index, m.furLen, m.slot, m.tint, m.occ, m.clump, m.shag].map((a) => a.buffer as ArrayBuffer)
postMessage(parts, { transfer: [parts.body, parts.head, ...parts.arms, ...parts.ears].flatMap(buffers) })
