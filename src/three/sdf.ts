import * as THREE from 'three'

/**
 * Modelagem por campos de distância (SDF): cada parte do urso é uma soma suave de
 * formas simples (elipsoides, cones arredondados), o que dá as junções macias de
 * pelúcia recheada. A malha sai de "surface nets": um vértice por célula da grade
 * cruzada pela superfície, depois projetado nela, com a normal tirada do campo.
 */

export type Sdf = (x: number, y: number, z: number) => number
export type Vec3 = [number, number, number]

/** união suave (polinomial): k é o raio da "costura" */
export function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k
  return Math.min(a, b) - h * h * k * 0.25
}

export const smax = (a: number, b: number, k: number) => -smin(-a, -b, k)

/** elipsoide (aproximação de distância de Inigo Quilez), opcionalmente girado */
export function ellipsoid(c: Vec3, r: Vec3, rot?: Vec3): Sdf {
  const [cx, cy, cz] = c
  const [ix, iy, iz] = [1 / r[0], 1 / r[1], 1 / r[2]]
  const inside = -Math.min(...r)
  const m = rot ? new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rot)).invert().elements : null
  return (x, y, z) => {
    let dx = x - cx
    let dy = y - cy
    let dz = z - cz
    if (m) {
      const tx = m[0] * dx + m[4] * dy + m[8] * dz
      const ty = m[1] * dx + m[5] * dy + m[9] * dz
      dz = m[2] * dx + m[6] * dy + m[10] * dz
      dx = tx
      dy = ty
    }
    const ax = dx * ix
    const ay = dy * iy
    const az = dz * iz
    const k0 = Math.sqrt(ax * ax + ay * ay + az * az)
    const k1 = Math.sqrt(ax * ax * ix * ix + ay * ay * iy * iy + az * az * iz * iz)
    return k1 < 1e-9 ? inside : (k0 * (k0 - 1)) / k1
  }
}

/** cone com pontas arredondadas, de a (raio r1) até b (raio r2) */
export function roundCone(a: Vec3, b: Vec3, r1: number, r2: number): Sdf {
  const [bax, bay, baz] = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const l2 = bax * bax + bay * bay + baz * baz
  const rr = r1 - r2
  const a2 = l2 - rr * rr
  const il2 = 1 / l2
  const krr = Math.sign(rr) * rr * rr
  return (x, y, z) => {
    const pax = x - a[0]
    const pay = y - a[1]
    const paz = z - a[2]
    const py = pax * bax + pay * bay + paz * baz
    const pz = py - l2
    const xvx = pax * l2 - bax * py
    const xvy = pay * l2 - bay * py
    const xvz = paz * l2 - baz * py
    const x2 = xvx * xvx + xvy * xvy + xvz * xvz
    const y2 = py * py * l2
    const z2 = pz * pz * l2
    const k = krr * x2
    if (Math.sign(pz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2
    if (Math.sign(py) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1
    return (Math.sqrt(x2 * a2 * il2) + py * rr) * il2 - r1
  }
}

/** plano que passa por p com normal n (positivo do lado da normal) */
export function plane(p: Vec3, n: THREE.Vector3): Sdf {
  const d = n.x * p[0] + n.y * p[1] + n.z * p[2]
  return (x, y, z) => n.x * x + n.y * y + n.z * z - d
}

/** gradiente pelo "tetraedro" (4 amostras) */
export function gradient(f: Sdf, x: number, y: number, z: number, out: THREE.Vector3, h = 1e-3) {
  const a = f(x + h, y - h, z - h)
  const b = f(x - h, y - h, z + h)
  const c = f(x - h, y + h, z - h)
  const d = f(x + h, y + h, z + h)
  return out.set(a - b - c + d, -a - b + c + d, -a + b - c + d).multiplyScalar(1 / (4 * h))
}

/** anda de frente (de +z para -z) até tocar a superfície: para pôr olhos, nariz e boca */
export function surfaceFromFront(f: Sdf, x: number, y: number, lift = 0) {
  let z = 3
  for (let i = 0; i < 200; i++) {
    const d = f(x, y, z)
    if (d < 1e-5) break
    z -= Math.max(d * 0.9, 1e-4)
  }
  const n = gradient(f, x, y, z, new THREE.Vector3()).normalize()
  return { pos: new THREE.Vector3(x, y, z).addScaledVector(n, lift), normal: n }
}

// as 12 arestas de uma célula (cantos numerados por bits x, y, z)
const EDGES = [
  [0, 1], [2, 3], [4, 5], [6, 7],
  [0, 2], [1, 3], [4, 6], [5, 7],
  [0, 4], [1, 5], [2, 6], [3, 7],
]

/** Malha crua (arrays), para poder sair de um Web Worker sem cópia. */
export interface RawMesh {
  position: Float32Array
  normal: Float32Array
  index: Uint32Array
}

/** Gera a malha fechada da superfície f = 0 dentro da caixa [min, max]. */
export function polygonize(f: Sdf, min: Vec3, max: Vec3, cell: number): RawMesh {
  const [x0, y0, z0] = min
  const nx = Math.ceil((max[0] - x0) / cell) + 1
  const ny = Math.ceil((max[1] - y0) / cell) + 1
  const nz = Math.ceil((max[2] - z0) / cell) + 1
  // grade grossa (1 a cada S amostras): longe da superfície a amostra fina só precisa do sinal,
  // que é o mesmo do canto grosso mais próximo (a distância não muda mais rápido que 1 por unidade)
  const S = 4
  const gx = Math.ceil((nx - 1) / S) + 1
  const gy = Math.ceil((ny - 1) / S) + 1
  const gz = Math.ceil((nz - 1) / S) + 1
  const coarse = new Float32Array(gx * gy * gz)
  for (let z = 0, i = 0; z < gz; z++)
    for (let y = 0; y < gy; y++) for (let x = 0; x < gx; x++, i++) coarse[i] = f(x0 + x * S * cell, y0 + y * S * cell, z0 + z * S * cell)
  const far = cell * S * Math.sqrt(3) * 0.6
  const field = new Float32Array(nx * ny * nz)
  for (let z = 0, i = 0; z < nz; z++)
    for (let y = 0; y < ny; y++)
      for (let x = 0; x < nx; x++, i++) {
        const v = coarse[Math.round(x / S) + gx * (Math.round(y / S) + gy * Math.round(z / S))]
        field[i] = Math.abs(v) > far ? v : f(x0 + x * cell, y0 + y * cell, z0 + z * cell)
      }
  const at = (x: number, y: number, z: number) => field[x + nx * (y + ny * z)]

  // um vértice por célula cruzada: média dos pontos onde as arestas cortam a superfície
  const cx = nx - 1
  const cy = ny - 1
  const vert = new Int32Array(cx * cy * (nz - 1)).fill(-1)
  const pos: number[] = []
  const corner = new Float32Array(8)
  for (let z = 0; z < nz - 1; z++)
    for (let y = 0; y < cy; y++)
      for (let x = 0; x < cx; x++) {
        let mask = 0
        for (let i = 0; i < 8; i++) {
          const v = at(x + (i & 1), y + ((i >> 1) & 1), z + ((i >> 2) & 1))
          corner[i] = v
          if (v < 0) mask |= 1 << i
        }
        if (mask === 0 || mask === 255) continue
        let sx = 0
        let sy = 0
        let sz = 0
        let n = 0
        for (const [a, b] of EDGES) {
          const va = corner[a]
          const vb = corner[b]
          if (va < 0 === vb < 0) continue
          const t = va / (va - vb)
          sx += (a & 1) + ((b & 1) - (a & 1)) * t
          sy += ((a >> 1) & 1) + (((b >> 1) & 1) - ((a >> 1) & 1)) * t
          sz += ((a >> 2) & 1) + (((b >> 2) & 1) - ((a >> 2) & 1)) * t
          n++
        }
        vert[x + cx * (y + cy * z)] = pos.length / 3
        pos.push(x0 + (x + sx / n) * cell, y0 + (y + sy / n) * cell, z0 + (z + sz / n) * cell)
      }

  // uma face (quad) para cada aresta da grade que troca de sinal, ligando as 4 células em volta
  const quads: number[] = []
  const v = (x: number, y: number, z: number) => vert[x + cx * (y + cy * z)]
  for (let z = 1; z < nz - 1; z++)
    for (let y = 1; y < ny - 1; y++)
      for (let x = 1; x < nx - 1; x++) {
        const s = at(x, y, z) < 0
        if (s !== at(x + 1, y, z) < 0) quads.push(v(x, y - 1, z - 1), v(x, y, z - 1), v(x, y, z), v(x, y - 1, z))
        if (s !== at(x, y + 1, z) < 0) quads.push(v(x - 1, y, z - 1), v(x, y, z - 1), v(x, y, z), v(x - 1, y, z))
        if (s !== at(x, y, z + 1) < 0) quads.push(v(x - 1, y - 1, z), v(x, y - 1, z), v(x, y, z), v(x - 1, y, z))
      }

  // projeta cada vértice na superfície (um passo de Newton basta: ele já nasce perto) e pega a normal do campo
  const count = pos.length / 3
  const normals = new Float32Array(count * 3)
  const g = new THREE.Vector3()
  for (let i = 0; i < count; i++) {
    let px = pos[i * 3]
    let py = pos[i * 3 + 1]
    let pz = pos[i * 3 + 2]
    const d = f(px, py, pz)
    gradient(f, px, py, pz, g)
    const l2 = Math.max(g.lengthSq(), 1e-8)
    px -= (d * g.x) / l2
    py -= (d * g.y) / l2
    pz -= (d * g.z) / l2
    gradient(f, px, py, pz, g).normalize()
    pos[i * 3] = px
    pos[i * 3 + 1] = py
    pos[i * 3 + 2] = pz
    normals.set([g.x, g.y, g.z], i * 3)
  }

  // dois triângulos por quad, virados para fora (mesmo lado da normal do campo)
  const index: number[] = []
  const pa = new THREE.Vector3()
  const pb = new THREE.Vector3()
  const pc = new THREE.Vector3()
  const tri = (a: number, b: number, c: number) => {
    pa.fromArray(pos, a * 3)
    pb.fromArray(pos, b * 3).sub(pa)
    pc.fromArray(pos, c * 3).sub(pa)
    pb.cross(pc)
    const nx2 = normals[a * 3] + normals[b * 3] + normals[c * 3]
    const ny2 = normals[a * 3 + 1] + normals[b * 3 + 1] + normals[c * 3 + 1]
    const nz2 = normals[a * 3 + 2] + normals[b * 3 + 2] + normals[c * 3 + 2]
    if (pb.x * nx2 + pb.y * ny2 + pb.z * nz2 >= 0) index.push(a, b, c)
    else index.push(a, c, b)
  }
  for (let i = 0; i < quads.length; i += 4) {
    tri(quads[i], quads[i + 1], quads[i + 2])
    tri(quads[i], quads[i + 2], quads[i + 3])
  }

  return { position: new Float32Array(pos), normal: normals, index: new Uint32Array(index) }
}

/* ---------- ruído suave (o mesmo papel do vnoise do shader, calculado uma vez por vértice) ---------- */

function hash(ix: number, iy: number, iz: number) {
  let h = Math.imul(ix, 0x27d4eb2d) ^ Math.imul(iy, 0x165667b1) ^ Math.imul(iz, 0x9e3779b1)
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** value noise 3D em [0, 1) */
export function vnoise(x: number, y: number, z: number) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const iz = Math.floor(z)
  const fx = x - ix
  const fy = y - iy
  const fz = z - iz
  const u = fx * fx * (3 - 2 * fx)
  const v = fy * fy * (3 - 2 * fy)
  const w = fz * fz * (3 - 2 * fz)
  const l = (a: number, b: number, t: number) => a + (b - a) * t
  return l(
    l(l(hash(ix, iy, iz), hash(ix + 1, iy, iz), u), l(hash(ix, iy + 1, iz), hash(ix + 1, iy + 1, iz), u), v),
    l(l(hash(ix, iy, iz + 1), hash(ix + 1, iy, iz + 1), u), l(hash(ix, iy + 1, iz + 1), hash(ix + 1, iy + 1, iz + 1), u), v),
    w,
  )
}
