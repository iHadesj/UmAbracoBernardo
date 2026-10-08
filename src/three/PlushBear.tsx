import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { BOW_POS, buildBear, buildBow, buildCollar, COLLAR, NECK } from './bearGeometry'
import { createFurMaterial, createFurUniforms, type FurUniforms, type PartUniforms } from './furMaterial'
import { stepYaw, useStageClock, type StageController } from './stage'

export interface BearLook {
  fur: string
  ribbon: string
}

interface Brush {
  point: THREE.Vector3
  dir: THREE.Vector3
  last: THREE.Vector3
  lastT: number
  activeAt: number
}

const noRaycast = () => null
const { damp, smoothstep: ss, clamp } = THREE.MathUtils

/* ---------- gestos ---------- */

type Gesture = 'wave' | 'hug' | 'hop' | 'tilt' | 'ears'
const DURATION: Record<Gesture, number> = { wave: 2.6, hug: 1.7, hop: 1.1, tilt: 2.0, ears: 1.2 }
const IDLE_GESTURES: Gesture[] = ['wave', 'tilt', 'hop', 'ears', 'tilt', 'ears', 'wave']
const TAP_LINES = ['♡', 'que abraço bom!', 'de novo!', 'hihi', '♡♡']
const BACK_LINES = ['oi de novo!', 'voltou! ♡', 'oi!']

/** sobe no começo, segura, desce no fim */
const envelope = (u: number, up = 0.15, down = 0.8) => ss(u, 0, up) * (1 - ss(u, down, 1))
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]

/* ---------- pelagem ---------- */

function FurPart({
  geometry,
  shared,
  shells,
  brush,
  ctl,
  onTap,
}: {
  geometry: THREE.BufferGeometry
  shared: FurUniforms
  shells: number
  brush: Brush
  ctl: StageController
  onTap: (e: ThreeEvent<MouseEvent>) => void
}) {
  const uniforms = useMemo<PartUniforms>(
    () => ({ ...shared, uBrushPos: { value: new THREE.Vector3(99, 99, 99) }, uBrushDir: { value: new THREE.Vector3() } }),
    [shared],
  )
  const baseMat = useMemo(() => createFurMaterial(uniforms, true), [uniforms])
  const shellMat = useMemo(() => createFurMaterial(uniforms, false), [uniforms])
  useEffect(
    () => () => {
      baseMat.dispose()
      shellMat.dispose()
    },
    [baseMat, shellMat],
  )

  const ref = useRef<THREE.Mesh>(null)
  const inv = useMemo(() => new THREE.Matrix4(), [])
  useFrame(() => {
    const m = ref.current
    if (!m) return
    inv.copy(m.matrixWorld).invert()
    uniforms.uBrushPos.value.copy(brush.point).applyMatrix4(inv)
    const len = brush.dir.length()
    uniforms.uBrushDir.value.copy(brush.dir).transformDirection(inv).multiplyScalar(len)
  })

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    // no toque, só faz carinho durante um arraste horizontal (não ao rolar a página)
    if (e.nativeEvent.pointerType !== 'mouse' && ctl.gesture !== 'drag') return
    const now = performance.now()
    if (now - brush.lastT < 120) {
      brush.dir
        .copy(e.point)
        .sub(brush.last)
        .multiplyScalar(1 / Math.max((now - brush.lastT) / 1000, 1 / 120))
        .multiplyScalar(0.08)
        .clampLength(0, 1)
    }
    brush.point.copy(e.point)
    brush.last.copy(e.point)
    brush.lastT = now
    brush.activeAt = now
  }

  return (
    <>
      <mesh ref={ref} geometry={geometry} material={baseMat} onPointerMove={onMove} onClick={onTap} />
      <instancedMesh key={shells} args={[geometry, shellMat, shells]} raycast={noRaycast} frustumCulled={false} />
    </>
  )
}

function creamFor(fur: string) {
  return new THREE.Color(fur).getHSL({ h: 0, s: 0, l: 0 }).l > 0.6 ? '#FBF6EF' : '#EFE3D3'
}

/* ---------- urso ---------- */

export function PlushBear({
  look,
  ctl,
  shells,
  onTap,
}: {
  look: BearLook
  ctl: StageController
  shells: number
  onTap: (clientX: number, clientY: number) => void
}) {
  const geo = useMemo(buildBear, [])
  const bow = useMemo(buildBow, [])
  const collar = useMemo(buildCollar, [])
  const shared = useMemo(createFurUniforms, [])
  const brush = useMemo<Brush>(
    () => ({ point: new THREE.Vector3(99, 99, 99), dir: new THREE.Vector3(), last: new THREE.Vector3(), lastT: 0, activeAt: 0 }),
    [],
  )

  useEffect(() => {
    shared.uShells.value = shells
  }, [shared, shells])

  useEffect(() => {
    shared.uColor0.value.set(look.fur)
    shared.uColor1.value.set(creamFor(look.fur))
    shared.uColor2.value.set(look.fur).multiplyScalar(0.78)
  }, [shared, look.fur])

  const ribbonMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ roughness: 0.45, sheen: 1, sheenRoughness: 0.35, clearcoat: 0.25, clearcoatRoughness: 0.4 }),
    [],
  )
  const tailMat = useMemo(() => {
    const m = ribbonMat.clone()
    m.side = THREE.DoubleSide
    return m
  }, [ribbonMat])
  useEffect(() => {
    for (const m of [ribbonMat, tailMat]) {
      m.color.set(look.ribbon)
      m.sheenColor.set(look.ribbon).lerp(new THREE.Color('#ffffff'), 0.35)
    }
  }, [look.ribbon, ribbonMat, tailMat])

  const mats = useMemo(
    () => ({
      eye: new THREE.MeshPhysicalMaterial({ color: '#120b08', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03 }),
      nose: new THREE.MeshPhysicalMaterial({ color: '#2b1a12', roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
      mouth: new THREE.MeshStandardMaterial({ color: '#2b1a12', roughness: 0.8 }),
      bean: new THREE.MeshStandardMaterial({ color: '#E9AEA8', roughness: 0.75 }),
      shine: new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
    }),
    [],
  )

  const root = useRef<THREE.Group>(null)
  const squash = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const eyes = useRef<(THREE.Group | null)[]>([])
  const arms = useRef<(THREE.Group | null)[]>([])
  const ears = useRef<(THREE.Group | null)[]>([])
  const anim = useRef({
    tapAt: -10,
    prevYaw: 0,
    blinkAt: 2,
    nextBlink: 3,
    started: false,
    gesture: null as Gesture | null,
    gStart: 0,
    tiltDir: 1,
    queued: null as { g: Gesture; at: number; say?: string } | null,
    nextIdle: 9,
  })

  const handleTap = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 8) return
    e.stopPropagation()
    ctl.pendingTap = true
    onTap(e.nativeEvent.clientX, e.nativeEvent.clientY)
  }

  const clock = useStageClock()
  useFrame(() => {
    const { t, dt, resumed } = clock()
    const a = anim.current
    const now = performance.now()
    const start = (g: Gesture) => {
      a.gesture = g
      a.gStart = t
      a.tiltDir = Math.random() > 0.5 ? 1 : -1
    }

    // ao aparecer: acena dizendo oi; ao voltar para a tela (render estava pausado): acena de novo
    if (!a.started) {
      a.started = true
      a.queued = { g: 'wave', at: t + 0.7, say: 'oi!' }
      a.nextIdle = t + 9
    } else if (resumed && !a.queued) {
      a.queued = { g: 'wave', at: t + 0.35, say: pick(BACK_LINES) }
      a.nextIdle = t + 9
    }
    if (a.queued && t >= a.queued.at) {
      start(a.queued.g)
      if (a.queued.say) ctl.say(a.queued.say)
      a.queued = null
    }
    if (ctl.pendingTap) {
      ctl.pendingTap = false
      a.tapAt = t
      start('hug')
      if (Math.random() < 0.45) ctl.say(pick(TAP_LINES))
      a.nextIdle = t + 8
    }

    const userIdle = now - ctl.lastInteract > 3000 && now - brush.activeAt > 3000
    if (!a.gesture && !a.queued && t > a.nextIdle && userIdle) {
      start(pick(IDLE_GESTURES))
      a.nextIdle = t + 7 + Math.random() * 5
    }

    const u = a.gesture ? (t - a.gStart) / DURATION[a.gesture] : 1
    if (a.gesture && u >= 1) a.gesture = null

    /* ---- pose alvo do gesto ---- */
    const armZ = [0, 0]
    const armX = [0, 0]
    const earZ = [0, 0]
    let headTilt = 0
    let headPitch = 0
    let headYawExtra = 0
    let hopY = 0
    let lean = 0
    const g = a.gesture
    if (g === 'wave') {
      const e = envelope(u, 0.14, 0.82)
      // braço para o lado e para cima, longe da bochecha, balançando
      armZ[1] = e * 2.05 + e * Math.sin(u * Math.PI * 8) * 0.36
      armX[1] = e * 0.18
      headTilt = e * 0.14
      headYawExtra = e * 0.1
      lean = e * 0.06
      earZ[1] = e * Math.sin(u * Math.PI * 6) * 0.15
    } else if (g === 'hug') {
      const e = envelope(u, 0.16, 0.7)
      for (const i of [0, 1]) {
        armX[i] = -e * 1.2
        armZ[i] = (i === 0 ? -1 : 1) * e * 0.5
      }
      headPitch = e * 0.12
      earZ[0] = -e * 0.12
      earZ[1] = e * 0.12
    } else if (g === 'hop') {
      const k = clamp(u * 1.2, 0, 1)
      hopY = Math.sin(Math.PI * k) * 0.3
      const flail = Math.sin(Math.PI * k)
      armZ[0] = -flail * 0.7
      armZ[1] = flail * 0.7
      earZ[0] = flail * 0.2
      earZ[1] = -flail * 0.2
    } else if (g === 'tilt') {
      const e = envelope(u, 0.2, 0.75)
      headTilt = e * 0.3 * a.tiltDir
      earZ[0] = e * Math.sin(u * Math.PI * 4) * 0.18
      earZ[1] = -e * Math.sin(u * Math.PI * 4 + 1) * 0.18
    } else if (g === 'ears') {
      const e = envelope(u, 0.1, 0.85)
      earZ[0] = e * Math.sin(u * Math.PI * 9) * 0.3
      earZ[1] = e * Math.sin(u * Math.PI * 9 + Math.PI) * 0.3
    }

    /* ---- giro + inércia da pelagem ---- */
    const yaw = stepYaw(ctl, t, dt)
    if (root.current) root.current.rotation.y = yaw
    const spin = clamp((yaw - a.prevYaw) / dt, -5, 5)
    a.prevYaw = yaw
    shared.uSpin.value = damp(shared.uSpin.value, spin, 10, dt)
    shared.uTime.value = t

    /* ---- abraço (squash & stretch) + respiração + pulinho ---- */
    const tau = t - a.tapAt
    const sq = tau < 2.5 ? Math.exp(-tau * 4.5) * Math.sin(tau * 15) : 0
    const land = g === 'hop' && u > 0.8 ? Math.sin(((u - 0.8) / 0.2) * Math.PI) * 0.6 : 0
    const breathe = Math.sin(t * 2.2) * 0.01
    if (squash.current) {
      squash.current.scale.set(1 + 0.06 * sq + 0.05 * land, 1 - 0.07 * sq + breathe - 0.06 * land, 1 + 0.06 * sq + 0.05 * land)
      squash.current.position.y = damp(squash.current.position.y, hopY, 18, dt)
      squash.current.rotation.z = damp(squash.current.rotation.z, lean, 6, dt)
    }
    shared.uBounce.value = damp(shared.uBounce.value, sq * 6 + (g === 'hop' ? Math.cos(Math.PI * u) * 2 : 0), 12, dt)

    /* ---- carinho: força decai quando o ponteiro para ---- */
    const petting = now - brush.activeAt < 140
    shared.uBrushStrength.value = damp(shared.uBrushStrength.value, petting ? 1 : 0, petting ? 14 : 3, dt)
    if (!petting) brush.dir.multiplyScalar(Math.exp(-dt * 4))

    /* ---- cabeça: segue o ponteiro (limitado); parado, olha em volta ---- */
    if (head.current) {
      const following = now - ctl.look.t < 2500
      const px = following ? ctl.look.x : Math.sin(t * 0.6) * 0.45
      const py = following ? ctl.look.y : Math.sin(t * 0.43) * 0.3
      const tapTilt = tau < 2 ? Math.exp(-tau * 2.2) * Math.sin(tau * 7) * 0.16 : 0
      head.current.rotation.y = damp(head.current.rotation.y, px * 0.36 + headYawExtra, 4, dt)
      head.current.rotation.x = damp(head.current.rotation.x, -py * 0.1 - headPitch + 0.02, 4, dt)
      head.current.rotation.z = damp(head.current.rotation.z, 0.07 + tapTilt + headTilt - px * 0.05, 6, dt)
    }

    /* ---- braços e orelhas ---- */
    arms.current.forEach((arm, i) => {
      if (!arm) return
      const side = i === 0 ? -1 : 1
      arm.rotation.z = damp(arm.rotation.z, armZ[i] + side * Math.sin(t * 2.2) * 0.025, 10, dt)
      arm.rotation.x = damp(arm.rotation.x, armX[i], 10, dt)
    })
    ears.current.forEach((ear, i) => {
      if (!ear) return
      ear.rotation.z = damp(ear.rotation.z, earZ[i] + Math.sin(t * 1.3 + i * 2) * 0.03, 14, dt)
    })

    /* ---- piscadas (e olhinhos apertados no abraço) ---- */
    if (t > a.nextBlink) {
      a.blinkAt = t
      a.nextBlink = t + 2.4 + Math.random() * 3.2
    }
    const k = clamp((t - a.blinkAt) / 0.16, 0, 1)
    const blink = Math.sin(k * Math.PI)
    const happy = tau < 0.9 ? Math.sin((tau / 0.9) * Math.PI) * 0.6 : 0
    for (const e of eyes.current) e?.scale.set(1, Math.max(0.1, 1 - 0.9 * blink - happy), 1)
  })

  return (
    <group ref={root}>
      <group ref={squash}>
        <FurPart geometry={geo.body} shared={shared} shells={shells} brush={brush} ctl={ctl} onTap={handleTap} />
        {geo.beans.map((b, i) => (
          <mesh key={i} position={b.pos} quaternion={b.quat} scale={b.scale} material={mats.bean}>
            <sphereGeometry args={[1, 18, 12]} />
          </mesh>
        ))}

        {geo.arms.map((arm, i) => (
          <group key={i} position={arm.pivot} ref={(g) => void (arms.current[i] = g)}>
            <FurPart geometry={arm.geo} shared={shared} shells={shells} brush={brush} ctl={ctl} onTap={handleTap} />
          </group>
        ))}

        <group ref={head} position={NECK}>
          <FurPart geometry={geo.head} shared={shared} shells={shells} brush={brush} ctl={ctl} onTap={handleTap} />
          {geo.ears.map((ear, i) => (
            <group key={i} position={ear.pivot} ref={(g) => void (ears.current[i] = g)}>
              <FurPart geometry={ear.geo} shared={shared} shells={shells} brush={brush} ctl={ctl} onTap={handleTap} />
            </group>
          ))}
          {geo.eyes.map((e, i) => (
            <group key={i} position={e.pos} quaternion={e.quat} ref={(g) => void (eyes.current[i] = g)}>
              <mesh material={mats.eye} scale={[0.088, 0.096, 0.056]}>
                <sphereGeometry args={[1, 28, 20]} />
              </mesh>
              {/* dois brilhos deixam o olhar "vivo" */}
              <mesh position={[-0.028, 0.034, 0.046]} material={mats.shine}>
                <sphereGeometry args={[0.024, 12, 10]} />
              </mesh>
              <mesh position={[0.026, -0.026, 0.05]} material={mats.shine}>
                <sphereGeometry args={[0.011, 10, 8]} />
              </mesh>
            </group>
          ))}
          <group position={geo.nose} rotation={[-0.2, 0, 0]}>
            <mesh scale={[0.1, 0.068, 0.064]} material={mats.nose}>
              <sphereGeometry args={[1, 24, 16]} />
            </mesh>
          </group>
          <mesh geometry={geo.mouth} material={mats.mouth} />
        </group>

        <group position={[0, COLLAR.y, COLLAR.z]} rotation={[0.12, 0, 0]}>
          <mesh geometry={collar} material={ribbonMat} />
        </group>
        <group position={BOW_POS} rotation={[0.16, 0, 0]}>
          <mesh geometry={bow.loops} material={ribbonMat} />
          <mesh geometry={bow.tails} material={tailMat} />
        </group>
      </group>
    </group>
  )
}
