import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Urso sentado modelado proceduralmente a partir de elipsoides, seguindo a
 * pelúcia de referência: marrom, focinho e solas claras, olhos pretos e laço
 * no pescoço. Proporções "chibi" (cabeça grande, corpo pequeno) para ficar fofo.
 * Braços e orelhas são peças separadas, com pivô, para poderem gesticular.
 * Unidades: ~3 de altura, chão em y = 0, frente em +z.
 */

type Vec3 = [number, number, number]
/** recebe o ponto na esfera unitária (antes de escalar) */
type UnitFn = (u: THREE.Vector3) => number

interface Part {
  center: Vec3
  radii: Vec3
  rot?: Vec3
  slot: 0 | 1 | 2 // 0 pelo principal · 1 creme (focinho/solas) · 2 interior da orelha
  fur: number | UnitFn
  /** 0..1: quanto o pelo puxa para o rosado (bochechas) */
  tint?: UnitFn
  parent?: THREE.Matrix4
  deform?: (u: THREE.Vector3) => void
  seg?: [number, number]
}

const { smoothstep: ss, lerp } = THREE.MathUtils
const tmp = new THREE.Vector3()

export function partMatrix(center: Vec3, radii: Vec3, rot: Vec3 = [0, 0, 0], parent?: THREE.Matrix4) {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...center),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
    new THREE.Vector3(...radii),
  )
  return parent ? m.premultiply(parent) : m
}

function ellipsoid(p: Part) {
  const [w, h] = p.seg ?? [44, 30]
  const g = new THREE.SphereGeometry(1, w, h)
  g.deleteAttribute('uv')
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  const fur = new Float32Array(pos.count)
  const tint = new Float32Array(pos.count)
  const slot = new Float32Array(pos.count).fill(p.slot)
  for (let i = 0; i < pos.count; i++) {
    tmp.fromBufferAttribute(pos, i)
    fur[i] = typeof p.fur === 'number' ? p.fur : p.fur(tmp)
    tint[i] = p.tint ? p.tint(tmp) : 0
    if (p.deform) {
      p.deform(tmp)
      pos.setXYZ(i, tmp.x, tmp.y, tmp.z)
    }
  }
  g.setAttribute('furLen', new THREE.BufferAttribute(fur, 1))
  g.setAttribute('tint', new THREE.BufferAttribute(tint, 1))
  g.setAttribute('slot', new THREE.BufferAttribute(slot, 1))
  g.applyMatrix4(partMatrix(p.center, p.radii, p.rot, p.parent))
  return g
}

interface Ellipse {
  c: Vec3
  r: Vec3
}

/** ponto na face frontal de um elipsoide sem rotação */
function onSurface(e: Ellipse, x: number, y: number, lift: number) {
  const dx = (x - e.c[0]) / e.r[0]
  const dy = (y - e.c[1]) / e.r[1]
  const z = e.c[2] + e.r[2] * Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy)) + lift
  return new THREE.Vector3(x, y, z)
}

/** normal do elipsoide (sem rotação) num ponto da superfície */
function normalAt(e: Ellipse, p: THREE.Vector3) {
  return new THREE.Vector3((p.x - e.c[0]) / e.r[0] ** 2, (p.y - e.c[1]) / e.r[1] ** 2, (p.z - e.c[2]) / e.r[2] ** 2).normalize()
}

const FUR = 0.085
const BODY: Ellipse = { c: [0, 0.88, -0.02], r: [0.74, 0.86, 0.66] }
const HEAD: Ellipse = { c: [0, 2.08, 0.06], r: [0.9, 0.8, 0.76] }
const MUZZLE: Ellipse = { c: [0, 1.88, 0.62], r: [0.32, 0.23, 0.24] }
/** onde cabeça e corpo se encontram: pivô da cabeça e posição da fita */
export const NECK = new THREE.Vector3(0, 1.43, 0.02)
export const COLLAR = { y: 1.43, rx: 0.6, rz: 0.55, z: 0.03 }
export const BOW_POS = new THREE.Vector3(0, 1.37, 0.6)

export interface Limb {
  geo: THREE.BufferGeometry
  /** pivô (em coordenadas do pai) — a geometria já vem centrada nele */
  pivot: THREE.Vector3
  side: 1 | -1
}

export interface Bean {
  pos: THREE.Vector3
  quat: THREE.Quaternion
  scale: THREE.Vector3
}

export interface BearGeometry {
  body: THREE.BufferGeometry
  head: THREE.BufferGeometry
  arms: Limb[]
  ears: Limb[]
  eyes: { pos: THREE.Vector3; quat: THREE.Quaternion }[]
  nose: THREE.Vector3
  mouth: THREE.BufferGeometry
  beans: Bean[]
}

const quatTo = (n: THREE.Vector3) => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n)

export function buildBear(): BearGeometry {
  const sides = [-1, 1] as const

  /* ---- corpo, pernas e solas ---- */
  const body: THREE.BufferGeometry[] = [
    ellipsoid({
      center: BODY.c,
      radii: BODY.r,
      slot: 0,
      fur: (u) => FUR * (1 - 0.55 * ss(u.y, 0.55, 0.75)),
      deform: (u) => {
        const k = 1 - 0.12 * u.y // formato de pera
        u.x *= k
        u.z *= k
        if (u.y < -0.7) u.y = -0.7 + (u.y + 0.7) * 0.45 // base achatada (sentado)
      },
    }),
  ]
  const beans: Bean[] = []
  for (const s of sides) {
    const legC: Vec3 = [s * 0.43, 0.28, 0.38]
    const legR: Vec3 = [0.31, 0.27, 0.47]
    const legRot: Vec3 = [-0.12, s * 0.32, 0]
    body.push(ellipsoid({ center: legC, radii: legR, rot: legRot, slot: 0, fur: (u) => lerp(FUR, 0.016, ss(u.z, 0.62, 0.86)) }))
    const legM = partMatrix(legC, legR, legRot)
    const padC: Vec3 = [0, 0.02, 0.86]
    const padR: Vec3 = [0.72, 0.84, 0.16]
    body.push(ellipsoid({ center: padC, radii: padR, slot: 1, fur: 0.02, parent: legM, seg: [32, 20] }))

    // almofadinhas: uma grande e três dedinhos
    const padM = partMatrix(padC, padR, [0, 0, 0], legM)
    const normalM = new THREE.Matrix3().getNormalMatrix(padM)
    const bean = (ux: number, uy: number, sx: number, sy: number) => {
      const u = new THREE.Vector3(ux, uy, Math.sqrt(Math.max(0, 1 - ux * ux - uy * uy)))
      const n = u.clone().applyMatrix3(normalM).normalize()
      const pos = u.clone().applyMatrix4(padM).addScaledVector(n, 0.024)
      beans.push({ pos, quat: quatTo(n), scale: new THREE.Vector3(sx, sy, 0.022) })
    }
    bean(0, -0.22, 0.085, 0.07)
    bean(-0.5, 0.42, 0.04, 0.045)
    bean(0, 0.6, 0.042, 0.048)
    bean(0.5, 0.42, 0.04, 0.045)
  }

  /* ---- braços (peças separadas, pivô no ombro) ---- */
  const arms: Limb[] = sides.map((s) => {
    const c: Vec3 = [s * 0.68, 0.98, 0.25]
    const r: Vec3 = [0.23, 0.42, 0.24]
    const rot: Vec3 = [-0.55, 0, s * 0.32]
    const pivot = new THREE.Vector3(0, 0.78, 0).applyMatrix4(partMatrix(c, r, rot))
    const geo = ellipsoid({ center: c, radii: r, rot, slot: 0, fur: FUR * 0.95, seg: [36, 26] })
    geo.translate(-pivot.x, -pivot.y, -pivot.z)
    return { geo, pivot, side: s }
  })

  /* ---- cabeça (coordenadas relativas ao pescoço) ---- */
  const cheek = (s: 1 | -1) => new THREE.Vector3(s * 0.556, -0.16, 0.815).normalize()
  const head: THREE.BufferGeometry[] = [
    ellipsoid({
      center: HEAD.c,
      radii: HEAD.r,
      slot: 0,
      fur: (u) => FUR * (1 - 0.38 * ss(u.z, 0.35, 0.85)) * (1 - 0.5 * ss(-u.y, 0.6, 0.85)),
      // bochechas rosadas na própria pelagem
      tint: (u) => Math.max(...sides.map((s) => 1 - ss(u.distanceTo(cheek(s)), 0.1, 0.34))),
    }),
    ellipsoid({ center: MUZZLE.c, radii: MUZZLE.r, slot: 1, fur: 0.032, seg: [36, 24] }),
  ]
  const headGeo = mergeGeometries(head)
  headGeo.translate(-NECK.x, -NECK.y, -NECK.z)

  /* ---- orelhas (peças separadas, pivô na base) ---- */
  const ears: Limb[] = sides.map((s) => {
    const c: Vec3 = [s * 0.62, 2.7, -0.02]
    const r: Vec3 = [0.29, 0.28, 0.12]
    const rot: Vec3 = [0, 0, -s * 0.32]
    const earM = partMatrix(c, r, rot)
    const parts = [
      ellipsoid({ center: c, radii: r, rot, slot: 0, fur: (u) => lerp(0.07, 0.02, ss(u.z, 0.3, 0.75)), seg: [32, 22] }),
      ellipsoid({ center: [0, -0.08, 0.72], radii: [0.6, 0.58, 0.36], slot: 2, fur: 0.03, parent: earM, seg: [28, 18] }),
    ]
    const geo = mergeGeometries(parts)
    parts.forEach((g) => g.dispose())
    const pivotWorld = new THREE.Vector3(0, -0.7, 0).applyMatrix4(earM)
    geo.translate(-pivotWorld.x, -pivotWorld.y, -pivotWorld.z)
    return { geo, pivot: pivotWorld.sub(NECK), side: s }
  })

  const bodyGeo = mergeGeometries(body)
  body.concat(head).forEach((g) => g.dispose())

  /* ---- rosto ---- */
  const local = (v: THREE.Vector3) => v.clone().sub(NECK)
  const eyes = sides.map((s) => {
    const p = onSurface(HEAD, s * 0.3, 2.15, 0.035)
    return { pos: local(p), quat: quatTo(normalAt(HEAD, p).lerp(new THREE.Vector3(0, 0, 1), 0.45).normalize()) }
  })
  const nose = local(onSurface(MUZZLE, 0, 1.96, 0.03))

  const smile = new THREE.CatmullRomCurve3(
    [
      [-0.13, 1.85],
      [-0.085, 1.818],
      [-0.04, 1.812],
      [0, 1.835],
      [0.04, 1.812],
      [0.085, 1.818],
      [0.13, 1.85],
    ].map(([x, y]) => local(onSurface(MUZZLE, x, y, 0.024))),
  )
  const philtrum = new THREE.LineCurve3(local(onSurface(MUZZLE, 0, 1.912, 0.026)), local(onSurface(MUZZLE, 0, 1.835, 0.024)))
  const mouthParts = [new THREE.TubeGeometry(smile, 48, 0.011, 6), new THREE.TubeGeometry(philtrum, 4, 0.011, 6)]
  const mouth = mergeGeometries(mouthParts)
  mouthParts.forEach((g) => g.dispose())

  return { body: bodyGeo, head: headGeo, arms, ears, eyes, nose, mouth, beans }
}

/* ---------- laço de fita ---------- */

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

export function buildBow() {
  const knot = new THREE.SphereGeometry(1, 20, 14)
  knot.scale(0.075, 0.085, 0.06)
  knot.translate(0, 0, 0.03)
  const loops = mergeGeometries([ribbonLoop(-1), ribbonLoop(1), knot])
  const tails = mergeGeometries([ribbonTail(-1), ribbonTail(1)])
  return { loops, tails }
}

export function buildCollar() {
  const g = new THREE.TorusGeometry(1, 0.024, 12, 80)
  g.rotateX(Math.PI / 2)
  g.scale(COLLAR.rx, 2.7, COLLAR.rz)
  return g
}
