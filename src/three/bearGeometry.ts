import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { ellipsoid, plane, polygonize, roundCone, smax, smin, surfaceFromFront, vnoise, type RawMesh, type Sdf, type Vec3 } from './sdf'

/**
 * Ursinho de pelúcia sentado, esculpido por campos de distância (ver sdf.ts) a
 * partir das proporções da pelúcia de referência: cabeça grande com bochechas
 * cheias e focinho saliente fundido no rosto, orelhas em concha nos cantos da
 * cabeça, braços grossos abertos para os lados e pernas que terminam em pés com
 * sola grande e achatada. Nariz e boca bordados, laço no pescoço.
 * Cabeça, braços e orelhas são malhas separadas, com pivô, para poderem gesticular.
 * Unidades: ~3 de altura, chão em y = 0, frente em +z.
 */

const { smoothstep: ss, lerp } = THREE.MathUtils
const sides = [-1, 1] as const

const FUR = 0.11
/** linha de bordado (boca, unhas) */
const THREAD = 0.012

/* ---------- cabeça ---------- */

const cranium = ellipsoid([0, 2.2, 0], [0.9, 0.78, 0.78])
const cheeks = sides.map((s) => ellipsoid([s * 0.38, 1.98, 0.22], [0.5, 0.42, 0.46]))
const muzzle = ellipsoid([0, 1.93, 0.66], [0.44, 0.32, 0.31])
const skull: Sdf = (x, y, z) => smin(smin(cranium(x, y, z), cheeks[0](x, y, z), 0.3), cheeks[1](x, y, z), 0.3)
const headSdf: Sdf = (x, y, z) => smin(skull(x, y, z), muzzle(x, y, z), 0.08)

/* ---------- orelhas: disco com uma concha cavada na frente ---------- */

const EARS = sides.map((s) => {
  const c: Vec3 = [s * 0.76, 2.7, -0.04]
  const rot: Vec3 = [0.12, s * 0.25, -s * 0.5]
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot))
  const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(q)
  const disc = ellipsoid(c, [0.32, 0.31, 0.12], rot)
  const cup = ellipsoid([c[0] + fwd.x * 0.17, c[1] + fwd.y * 0.17 - 0.02, c[2] + fwd.z * 0.17], [0.23, 0.22, 0.13], rot)
  const sdf: Sdf = (x, y, z) => smax(disc(x, y, z), -cup(x, y, z), 0.05)
  const pivot = new THREE.Vector3(0, -0.26, 0).applyQuaternion(q).add(new THREE.Vector3(...c))
  return { c, sdf, disc, cup, fwd, pivot }
})

/* ---------- corpo em pera, com as pernas fundidas ---------- */

const belly = ellipsoid([0, 0.8, 0.04], [0.74, 0.76, 0.64])
const chest = ellipsoid([0, 1.22, -0.02], [0.56, 0.5, 0.5])
const torso: Sdf = (x, y, z) => smax(smin(belly(x, y, z), chest(x, y, z), 0.35), 0.06 - y, 0.12)

const LEGS = sides.map((s) => {
  const thigh = roundCone([s * 0.34, 0.4, 0.16], [s * 0.6, 0.36, 0.64], 0.31, 0.25)
  const fc: Vec3 = [s * 0.68, 0.4, 0.78]
  const foot = ellipsoid(fc, [0.36, 0.4, 0.26])
  // sola achatada, virada para frente e um pouco para fora
  const soleN = new THREE.Vector3(s * 0.3, 0.12, 1).normalize()
  const soleP: Vec3 = [fc[0] + soleN.x * 0.13, fc[1] + soleN.y * 0.13, fc[2] + soleN.z * 0.13]
  const sole = plane(soleP, soleN)
  const sdf: Sdf = (x, y, z) => smin(thigh(x, y, z), smax(foot(x, y, z), sole(x, y, z), 0.04), 0.12)
  return { sdf, foot, sole, soleN, soleP }
})
const bodySdf: Sdf = (x, y, z) => smin(smin(torso(x, y, z), LEGS[0].sdf(x, y, z), 0.16), LEGS[1].sdf(x, y, z), 0.16)

/* ---------- braços: ombro, cotovelo e patinha ---------- */

const ARMS = sides.map((s) => {
  const shoulder: Vec3 = [s * 0.5, 1.22, 0.02]
  const upper = roundCone(shoulder, [s * 0.86, 0.94, 0.16], 0.26, 0.23)
  const lower = roundCone([s * 0.86, 0.94, 0.16], [s * 1.0, 0.72, 0.3], 0.23, 0.25)
  const sdf: Sdf = (x, y, z) => smin(upper(x, y, z), lower(x, y, z), 0.1)
  return { sdf, pivot: new THREE.Vector3(...shoulder) }
})

/** cada parte com uma esfera que a envolve, para pular as que estão longe */
const PARTS: { f: Sdf; c: Vec3; r: number }[] = [
  { f: bodySdf, c: [0, 0.85, 0.15], r: 1.4 },
  { f: headSdf, c: [0, 2.2, 0.06], r: 1.05 },
  ...sides.map((s, i) => ({ f: ARMS[i].sdf, c: [s * 0.75, 0.97, 0.16] as Vec3, r: 0.7 })),
  ...EARS.map((e) => ({ f: e.sdf, c: e.c, r: 0.36 })),
]

/** o urso inteiro parado, até ~0,3 de distância (é o que a sombra de contato enxerga) */
const bearSdf: Sdf = (x, y, z) => {
  let d = 0.3
  for (const p of PARTS) {
    const dx = x - p.c[0]
    const dy = y - p.c[1]
    const dz = z - p.c[2]
    if (Math.sqrt(dx * dx + dy * dy + dz * dz) - p.r < d) d = Math.min(d, p.f(x, y, z))
  }
  return d
}

/* ---------- malha com os atributos da pelagem ---------- */

/** comprimento do pelo, tipo (0 pelo · 1 creme · -1 dentro da orelha) e rosado das bochechas */
type FurAttrs = (p: THREE.Vector3, n: THREE.Vector3) => [fur: number, slot: number, tint: number]

/** Uma parte peluda pronta, só com arrays: assim pode vir de um Web Worker sem cópia. */
export interface FurMesh extends RawMesh {
  furLen: Float32Array
  slot: Float32Array
  tint: Float32Array
  occ: Float32Array
  /** ruído suave por vértice: variação do comprimento e para onde cada região é penteada */
  clump: Float32Array
  shag: Float32Array
}

export interface FurParts {
  body: FurMesh
  head: FurMesh
  arms: FurMesh[]
  ears: FurMesh[]
}

const AO_STEPS = [
  [0.05, 0.5],
  [0.12, 0.3],
  [0.24, 0.2],
] as const

/**
 * Sombra de contato: compara a distância até o urso em alguns passos ao longo da
 * normal com a distância que haveria numa superfície aberta. Escurece pescoço,
 * axilas, a base do focinho e onde as pernas encontram a barriga.
 */
function occlusion(p: THREE.Vector3, n: THREE.Vector3) {
  let s = 0
  for (const [h, w] of AO_STEPS) s += (w * Math.max(0, h - bearSdf(p.x + n.x * h, p.y + n.y * h, p.z + n.z * h))) / h
  return 1 - 0.55 * Math.min(1, s)
}

function furPart(f: Sdf, min: Vec3, max: Vec3, cell: number, attrs: FurAttrs): FurMesh {
  const mesh = polygonize(f, min, max, cell)
  const count = mesh.position.length / 3
  const furLen = new Float32Array(count)
  const slot = new Float32Array(count)
  const tint = new Float32Array(count)
  const occ = new Float32Array(count)
  const clump = new Float32Array(count)
  const shag = new Float32Array(count * 3)
  const p = new THREE.Vector3()
  const n = new THREE.Vector3()
  for (let i = 0; i < count; i++) {
    p.fromArray(mesh.position, i * 3)
    n.fromArray(mesh.normal, i * 3)
    ;[furLen[i], slot[i], tint[i]] = attrs(p, n)
    occ[i] = occlusion(p, n)
    clump[i] = vnoise(p.x * 5.5, p.y * 5.5, p.z * 5.5)
    for (let k = 0; k < 3; k++) shag[i * 3 + k] = vnoise(p.x * 3.1 + 11.7 * (k + 1), p.y * 3.1, p.z * 3.1) - 0.5
  }
  return { ...mesh, furLen, slot, tint, occ, clump, shag }
}

/**
 * Costura entre dois tecidos: 1 onde a > b. Numa união a superfície é da forma de
 * menor distância (focinho: skull > muzzle); numa interseção ou recorte, da maior
 * (sola: plano > pé; concha da orelha: -concha > disco).
 */
const seam = (a: number, b: number) => ss(a - b, -0.008, 0.008)

/** pivô da cabeça, onde ela encontra o corpo */
const NECK = new THREE.Vector3(0, 1.52, 0)
const EYES = sides.map((s) => surfaceFromFront(headSdf, s * 0.33, 2.28, 0.035))

/**
 * A parte pesada (~0,1 s num computador, bem mais num celular): gera as malhas
 * peludas. Roda num Web Worker (bearParts.worker.ts) para não travar a página.
 */
export function buildFurParts(): FurParts {
  const cheekAt = sides.map((s) => surfaceFromFront(headSdf, s * 0.52, 2.0).pos)
  const head = furPart(headSdf, [-1.04, 1.3, -0.92], [1.04, 3.1, 1.08], 0.045, (p, n) => {
    const m = seam(skull(p.x, p.y, p.z), muzzle(p.x, p.y, p.z))
    // rosto e queixo com pelo mais curto; em volta dos olhos, aparado
    let fur = FUR * (1 - 0.42 * ss(n.z, 0.3, 0.88)) * (1 - 0.45 * ss(-n.y, 0.55, 0.85))
    fur *= lerp(0.4, 1, ss(Math.min(...EYES.map((e) => p.distanceTo(e.pos))), 0.1, 0.18))
    const tint = Math.max(...cheekAt.map((c) => 1 - ss(p.distanceTo(c), 0.08, 0.3))) * (1 - m)
    return [lerp(fur, 0.028, m), m, tint]
  })

  const ears = EARS.map((e) => {
    const r = 0.4
    return furPart(e.sdf, [e.c[0] - r, e.c[1] - r, e.c[2] - r], [e.c[0] + r, e.c[1] + r, e.c[2] + r], 0.035, (p, n) => {
      const inner = seam(-e.cup(p.x, p.y, p.z), e.disc(p.x, p.y, p.z))
      const outer = lerp(0.085, 0.04, ss(n.dot(e.fwd), 0.2, 0.8))
      return [lerp(outer, 0.026, inner), -inner, 0]
    })
  })

  const body = furPart(bodySdf, [-1.14, -0.08, -0.74], [1.14, 1.82, 1.12], 0.05, (p, n) => {
    const sole = Math.max(...LEGS.map((l) => seam(l.sole(p.x, p.y, p.z), l.foot(p.x, p.y, p.z))))
    // em volta da sola o pelo encurta, para ela aparecer inteira
    const rim = Math.max(...LEGS.map((l) => (1 - ss(-l.sole(p.x, p.y, p.z), 0, 0.12)) * (1 - ss(l.foot(p.x, p.y, p.z), 0, 0.1))))
    let fur = FUR * (1 - 0.55 * ss(p.y, 1.45, 1.62)) * (1 - 0.15 * ss(n.z, 0.3, 0.8)) * lerp(1, 0.35, rim)
    // as pontas do laço amassam o pelo do peito (senão o pelo atravessa a fita)
    fur *= lerp(1, 0.3, (1 - ss(tailDistance(Math.abs(p.x), p.y), 0.07, 0.12)) * ss(n.z, 0.4, 0.7))
    return [lerp(fur, 0.025, sole), sole, 0]
  })

  const arms = sides.map((s, i) => {
    const lo: Vec3 = s < 0 ? [-1.32, 0.4, -0.3] : [0.18, 0.4, -0.3]
    const hi: Vec3 = s < 0 ? [-0.18, 1.54, 0.62] : [1.32, 1.54, 0.62]
    return furPart(ARMS[i].sdf, lo, hi, 0.045, () => [FUR * 0.95, 0, 0])
  })

  return { body, head, arms, ears }
}

/** geometria de uma parte, centrada no pivô (copia as posições: as partes ficam em cache) */
function toGeometry(m: FurMesh, pivot = new THREE.Vector3()) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(m.position.slice(), 3))
  g.setAttribute('normal', new THREE.BufferAttribute(m.normal, 3))
  g.setAttribute('furLen', new THREE.BufferAttribute(m.furLen, 1))
  g.setAttribute('slot', new THREE.BufferAttribute(m.slot, 1))
  g.setAttribute('tint', new THREE.BufferAttribute(m.tint, 1))
  g.setAttribute('occ', new THREE.BufferAttribute(m.occ, 1))
  g.setAttribute('clump', new THREE.BufferAttribute(m.clump, 1))
  g.setAttribute('shag', new THREE.BufferAttribute(m.shag, 3))
  g.setIndex(new THREE.BufferAttribute(m.index, 1))
  g.translate(-pivot.x, -pivot.y, -pivot.z)
  return g
}

/* ---------- interface ---------- */

export interface Limb {
  geo: THREE.BufferGeometry
  /** pivô (em coordenadas do pai) — a geometria já vem centrada nele */
  pivot: THREE.Vector3
  side: 1 | -1
}

export interface Placed {
  pos: THREE.Vector3
  quat: THREE.Quaternion
}

export interface BearGeometry {
  body: THREE.BufferGeometry
  head: THREE.BufferGeometry
  arms: Limb[]
  ears: Limb[]
  /** pivô da cabeça, onde ela encontra o corpo */
  neck: THREE.Vector3
  eyes: Placed[]
  nose: Placed
  mouth: THREE.BufferGeometry
  /** unhas bordadas nas solas */
  claws: THREE.BufferGeometry
  /** fita em volta do pescoço, laço na frente e as pontas dele, que descem pelo peito */
  collar: { y: number; rx: number; rz: number; z: number }
  bow: THREE.Vector3
  bowTails: THREE.BufferGeometry
}

const quatTo = (n: THREE.Vector3) => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n)

/** Monta o urso a partir das malhas peludas (rápido: o resto são peças pequenas). */
export function buildBear(parts: FurParts): BearGeometry {
  const neck = NECK.clone()
  const head = toGeometry(parts.head, neck)
  const ears: Limb[] = EARS.map((e, i) => ({ geo: toGeometry(parts.ears[i], e.pivot), pivot: e.pivot.clone().sub(neck), side: sides[i] }))
  const body = toGeometry(parts.body)
  const arms: Limb[] = ARMS.map((a, i) => ({ geo: toGeometry(parts.arms[i], a.pivot), pivot: a.pivot.clone(), side: sides[i] }))

  /* ---- unhas: três pontos bordados no alto de cada sola ---- */
  const claws: THREE.BufferGeometry[] = []
  for (const l of LEGS) {
    const up = new THREE.Vector3(0, 1, 0).addScaledVector(l.soleN, -l.soleN.y).normalize()
    const right = new THREE.Vector3().crossVectors(up, l.soleN)
    const center = new THREE.Vector3(...l.soleP).addScaledVector(l.soleN, 0.02)
    for (const x of [-1, 0, 1]) {
      const pts = [0.09, 0.15, 0.21].map((y, k) =>
        center
          .clone()
          .addScaledVector(up, y)
          .addScaledVector(right, x * (0.11 + k * 0.02)),
      )
      claws.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, THREAD, 6))
    }
  }
  const clawGeo = mergeGeometries(claws)
  claws.forEach((g) => g.dispose())

  /* ---- olhos, nariz e boca ---- */
  const local = (v: THREE.Vector3) => v.clone().sub(neck)
  const eyes = EYES.map((e) => ({ pos: local(e.pos), quat: quatTo(e.normal.clone().lerp(new THREE.Vector3(0, 0, 1), 0.45).normalize()) }))
  const noseAt = surfaceFromFront(headSdf, 0, 2.14, 0.012)
  const nose = { pos: local(noseAt.pos), quat: quatTo(noseAt.normal.clone().lerp(new THREE.Vector3(0, 0, 1), 0.2).normalize()) }

  const onFace = (x: number, y: number, lift: number) => local(surfaceFromFront(headSdf, x, y, lift).pos)
  const smile = new THREE.CatmullRomCurve3(
    [
      [-0.19, 1.905],
      [-0.12, 1.858],
      [-0.055, 1.842],
      [0, 1.862],
      [0.055, 1.842],
      [0.12, 1.858],
      [0.19, 1.905],
    ].map(([x, y]) => onFace(x, y, 0.028)),
  )
  const philtrum = new THREE.LineCurve3(onFace(0, 2.06, 0.03), onFace(0, 1.862, 0.028))
  const mouthParts = [new THREE.TubeGeometry(smile, 48, THREAD, 6), new THREE.TubeGeometry(philtrum, 6, THREAD, 6)]
  const mouth = mergeGeometries(mouthParts)
  mouthParts.forEach((g) => g.dispose())

  /* ---- fita: acompanha o pescoço, logo abaixo do queixo; o laço assenta no peito ---- */
  const collarY = 1.5
  const reach = (dx: number, dz: number) => {
    let t = 0
    while (t < 1.2 && bodySdf(dx * t, collarY, -0.02 + dz * t) < 0) t += 0.005
    return t
  }
  const collar = { y: collarY, rx: reach(1, 0) + 0.025, rz: reach(0, 1) + 0.025, z: -0.02 }
  const bow = surfaceFromFront(bodySdf, 0, BOW_Y, 0.06).pos
  const bowTails = ribbonTails()

  return { body, head, arms, ears, neck, eyes, nose, mouth, claws: clawGeo, collar, bow, bowTails }
}

/* ---------- nariz bordado ---------- */

/**
 * Triângulo arredondado (largo em cima, estreito embaixo) com o fundo achatado
 * para assentar no focinho. Os paralelos da esfera viram os pontos do bordado,
 * de um lado ao outro, como num nariz de ursinho feito à mão.
 */
export function buildNose() {
  const size = new THREE.Vector3(0.13, 0.088, 0.058)
  const width = (y: number) => lerp(0.5, 1, ss(y, -1.05, 0.65))
  const g = new THREE.SphereGeometry(1, 48, 32)
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  const nor = g.getAttribute('normal') as THREE.BufferAttribute
  const p = new THREE.Vector3()
  const n = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i)
    const k = width(p.y)
    const dk = (width(p.y + 1e-3) - width(p.y - 1e-3)) / 2e-3
    const flat = p.z < 0 ? 0.3 : 1
    // normal pela inversa transposta da deformação (evita costura nos polos)
    n.set(p.x / k, p.y - (p.x * dk * p.x) / k, p.z / flat).divide(size).normalize()
    nor.setXYZ(i, n.x, n.y, n.z)
    pos.setXYZ(i, p.x * k * size.x, p.y * size.y, p.z * flat * size.z)
  }
  return g
}

/** relevo dos pontos do bordado: um fio arredondado por repetição, na vertical da textura */
export function createStitchTexture(stitches: number) {
  const h = 32
  const data = new Uint8Array(h * 4)
  for (let y = 0; y < h; y++) {
    const v = Math.round(255 * Math.sqrt(Math.max(0, 1 - (((y + 0.5) / h) * 2 - 1) ** 2)))
    data.set([v, v, v, 255], y * 4)
  }
  const tex = new THREE.DataTexture(data, 1, h)
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, stitches)
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.needsUpdate = true
  return tex
}

/* ---------- laço de fita ---------- */

const BOW_Y = 1.42
/** caminho de cada ponta do laço no peito (lado direito; o esquerdo é espelhado) */
const TAIL = { from: [0.03, BOW_Y - 0.03], to: [0.23, BOW_Y - 0.43] } as const

/** distância (em x, y) até o caminho da ponta do laço */
function tailDistance(ax: number, y: number) {
  const [x0, y0] = TAIL.from
  const [x1, y1] = TAIL.to
  const dx = x1 - x0
  const dy = y1 - y0
  const t = Math.min(1, Math.max(0, ((ax - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(ax - x0 - dx * t, y - y0 - dy * t)
}

/** as duas pontas: tiras coladas no peito, com corte enviesado no fim */
function ribbonTails() {
  const seg = 16
  const width = 0.14
  const parts = sides.map((side) => {
    const pts = Array.from({ length: seg + 1 }, (_, i) => {
      const t = i / seg
      const x = side * lerp(TAIL.from[0], TAIL.to[0], t)
      return surfaceFromFront(bodySdf, x, lerp(TAIL.from[1], TAIL.to[1], t), 0.04)
    })
    const positions: number[] = []
    const indices: number[] = []
    pts.forEach(({ pos, normal }, i) => {
      const tan = pts[Math.min(i + 1, seg)].pos.clone().sub(pts[Math.max(i - 1, 0)].pos).normalize()
      const half = new THREE.Vector3().crossVectors(tan, normal).normalize().multiplyScalar(width / 2)
      const a = pos.clone().add(half)
      const b = pos.clone().sub(half)
      // corte enviesado: o lado de dentro termina antes
      if (i === seg) (side > 0 ? b : a).addScaledVector(tan, -0.07)
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z)
      if (i < seg) indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    g.setIndex(indices)
    g.computeVertexNormals()
    return g
  })
  const g = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return g
}

function ribbonLoop(side: 1 | -1) {
  const pts = [
    [0, 0.02],
    [0.12, 0.06],
    [0.3, 0.045],
    [0.37, -0.01],
    [0.3, -0.06],
    [0.11, -0.035],
  ].map(([x, z]) => new THREE.Vector3(side * x, 0, z))
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 72, 0.02, 10, true)
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    // estreita junto ao nó e abre na ponta, como uma pétala de fita
    const k = lerp(1.6, 5.2, ss(Math.abs(pos.getX(i)), 0.0, 0.24))
    pos.setY(i, pos.getY(i) * k)
  }
  g.rotateZ(side * 0.24)
  g.computeVertexNormals()
  return g
}

function ribbonTail(side: 1 | -1) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(side * 0.02, -0.02, 0.035),
    new THREE.Vector3(side * 0.08, -0.17, 0.05),
    new THREE.Vector3(side * 0.15, -0.34, 0.02),
  ])
  const seg = 14
  const width = 0.11
  const positions: number[] = []
  const indices: number[] = []
  for (let i = 0; i <= seg; i++) {
    const t = i / seg
    const c = curve.getPoint(t)
    const tan = curve.getTangent(t)
    const perp = new THREE.Vector3(-tan.y, tan.x, 0).normalize().multiplyScalar(width / 2)
    // corte em V na ponta
    const cut = i === seg ? 0.05 : 0
    positions.push(c.x - perp.x, c.y - perp.y + cut, c.z, c.x + perp.x, c.y + perp.y - cut * 0.2, c.z)
    if (i < seg) {
      const a = i * 2
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setIndex(indices)
  g.computeVertexNormals()
  return g
}

/** laço solto (alças, nó e pontas retas). No urso as pontas vêm de ribbonTails, coladas no peito. */
export function buildBow() {
  const knot = new THREE.SphereGeometry(1, 20, 14)
  knot.scale(0.075, 0.085, 0.06)
  knot.translate(0, 0, 0.03)
  const loops = mergeGeometries([ribbonLoop(-1), ribbonLoop(1), knot])
  const tails = mergeGeometries([ribbonTail(-1), ribbonTail(1)])
  return { loops, tails }
}

export function buildCollar({ rx, rz }: { rx: number; rz: number }) {
  const g = new THREE.TorusGeometry(1, 0.024, 12, 80)
  g.rotateX(Math.PI / 2)
  g.scale(rx, 2.7, rz)
  return g
}
