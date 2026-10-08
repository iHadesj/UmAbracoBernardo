import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from 'react'
import * as THREE from 'three'
import { FILL_DIR, KEY_DIR, RIM_DIR } from './furMaterial'
import { useUI } from '../store/ui'

/** Estado mutável compartilhado entre os gestos (DOM) e o loop de render (R3F). */
export interface StageController {
  yaw: number
  vel: number
  dragging: boolean
  lastInteract: number
  pendingTap: boolean
  /** 'scroll' = o dedo está rolando a página: o modelo ignora o gesto */
  gesture: 'idle' | 'pending' | 'drag' | 'scroll'
  /** para onde olhar, em -1..1 dentro do palco, e quando foi atualizado */
  look: { x: number; y: number; t: number }
  /** mostra um balãozinho de fala */
  say: (text: string) => void
}

export const createController = (): StageController => ({
  yaw: 0,
  vel: 0,
  dragging: false,
  lastInteract: 0,
  pendingTap: false,
  gesture: 'idle',
  look: { x: 0, y: 0, t: 0 },
  say: () => {},
})

export const isLowEnd = () =>
  typeof window !== 'undefined' && (matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency ?? 8) <= 4)

const { clamp } = THREE.MathUtils

/**
 * Gestos no palco. O canvas usa `touch-action: pan-y`: se o dedo começa indo na
 * vertical é rolagem da página e o modelo não reage (antes isso girava o urso e
 * entortava a cabeça dele). Só um arraste horizontal gira o modelo.
 */
function useStageGestures(c: StageController, wrap: RefObject<HTMLDivElement | null>, onFirst: () => void) {
  const start = useRef({ x: 0, y: 0 })
  const last = useRef({ x: 0, t: 0 })

  const lookAt = (e: ReactPointerEvent) => {
    const r = wrap.current?.getBoundingClientRect()
    if (!r) return
    c.look = {
      x: clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1),
      y: clamp(-(((e.clientY - r.top) / r.height) * 2 - 1), -1, 1),
      t: performance.now(),
    }
  }
  const end = () => {
    // inércia só vale para um arraste de verdade que terminou em movimento
    if (c.gesture !== 'drag' || performance.now() - last.current.t > 90) c.vel = 0
    c.gesture = 'idle'
    c.dragging = false
  }

  return {
    onPointerDown: (e: ReactPointerEvent) => {
      start.current = { x: e.clientX, y: e.clientY }
      last.current = { x: e.clientX, t: performance.now() }
      c.gesture = 'pending'
    },
    onPointerMove: (e: ReactPointerEvent) => {
      if (e.pointerType === 'mouse' || c.gesture === 'drag') lookAt(e)
      if (c.gesture === 'pending') {
        const dx = Math.abs(e.clientX - start.current.x)
        const dy = Math.abs(e.clientY - start.current.y)
        if (dx > 7 && dx > dy * 1.2) {
          c.gesture = 'drag'
          c.dragging = true
          c.vel = 0
          last.current = { x: e.clientX, t: performance.now() }
          onFirst()
        } else if (dy > 7) {
          c.gesture = 'scroll'
        }
      }
      if (c.gesture !== 'drag') return
      const now = performance.now()
      const d = (e.clientX - last.current.x) * 0.011
      c.yaw += d
      c.vel = clamp(d / Math.max((now - last.current.t) / 1000, 1 / 120), -9, 9)
      c.lastInteract = now
      last.current = { x: e.clientX, t: now }
    },
    onPointerUp: end,
    onPointerCancel: end,
    onPointerLeave: (e: ReactPointerEvent) => {
      if (e.pointerType === 'mouse') c.look.t = 0
      end()
    },
  }
}

/** Integra o giro: inércia ao soltar e um balanço suave quando ninguém mexe. */
export function stepYaw(c: StageController, t: number, dt: number, sway = 0.35) {
  if (!c.dragging) {
    c.yaw += c.vel * dt
    c.vel *= Math.exp(-dt * 3.2)
    if (performance.now() - c.lastInteract > 2600 && Math.abs(c.vel) < 0.3) {
      const turns = Math.round(c.yaw / (Math.PI * 2)) * Math.PI * 2
      c.yaw = THREE.MathUtils.damp(c.yaw, turns + Math.sin(t * 0.45) * sway, 1.4, dt)
    }
  }
  return c.yaw
}

export function StageLights() {
  return (
    <>
      <hemisphereLight args={['#fff4e8', '#8a6248', 0.85]} />
      <directionalLight position={KEY_DIR.clone().multiplyScalar(6)} intensity={2.1} color="#fff0e0" />
      <directionalLight position={FILL_DIR.clone().multiplyScalar(6)} intensity={0.55} color="#ffe2d2" />
      <directionalLight position={RIM_DIR.clone().multiplyScalar(6)} intensity={0.9} color="#ffd8b0" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} position={[2.5, 4, 3]} scale={[3, 2, 1]} />
        <Lightformer form="circle" intensity={1.4} position={[-3, 1, 2]} scale={2} />
        <Lightformer form="rect" intensity={1} position={[0, 3, -4]} scale={[4, 1, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#f3d9c4" position={[0, -3, 0]} rotation-x={Math.PI / 2} scale={[6, 6, 1]} />
      </Environment>
    </>
  )
}

interface Burst {
  id: number
  x: number
  y: number
}

const HEART = 'M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.6 4.5c2 0 3.6 1.1 4.4 2.6.8-1.5 2.4-2.6 4.4-2.6 3.6 0 5.7 3.9 4.2 7.3C19.5 16.4 12 21 12 21z'

function HeartBurst({ burst }: { burst: Burst }) {
  const parts = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const a = (-Math.PI / 2) + (i - 3) * 0.42 + (Math.random() - 0.5) * 0.3
        const dist = 60 + Math.random() * 50
        return { dx: Math.cos(a) * dist, dy: Math.sin(a) * dist - 30, s: 0.7 + Math.random() * 0.7, r: (Math.random() - 0.5) * 50, d: Math.random() * 0.12 }
      }),
    [],
  )
  return (
    <>
      {parts.map((p, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          className="stage-heart"
          style={{ left: burst.x, top: burst.y }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.dx, y: p.dy, scale: [0, p.s * 1.3, p.s], opacity: [1, 1, 0], rotate: p.r }}
          transition={{ duration: 1.1, delay: p.d, ease: [0.2, 0.7, 0.3, 1] }}
        >
          <path d={HEART} />
        </motion.svg>
      ))}
    </>
  )
}

interface StageShellProps {
  className?: string
  camera: { position: [number, number, number]; fov: number; target: [number, number, number] }
  hint?: string
  children: (ctl: StageController, onTap: (clientX: number, clientY: number) => void) => ReactNode
  shadowY?: number
}

/** Canvas + gestos + corações + dica. Pausa o render quando sai da tela. */
export function StageShell({ className = '', camera, hint, children, shadowY = 0 }: StageShellProps) {
  const ctl = useMemo(createController, [])
  const wrap = useRef<HTMLDivElement>(null)
  const inView = useInView(wrap, { margin: '160px' })
  const [bursts, setBursts] = useState<Burst[]>([])
  const [touched, setTouched] = useState(false)
  const [speech, setSpeech] = useState<{ id: number; text: string } | null>(null)
  const hug = useUI((s) => s.hug)
  const gestures = useStageGestures(ctl, wrap, () => setTouched(true))

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    ctl.say = (text) => {
      setSpeech({ id: Date.now(), text })
      clearTimeout(timer)
      timer = setTimeout(() => setSpeech(null), 2200)
    }
    return () => clearTimeout(timer)
  }, [ctl])
  // reduz a resolução se o aparelho não sustentar o FPS
  const [dpr, setDpr] = useState(1.75)

  const onTap = (cx: number, cy: number) => {
    const r = wrap.current?.getBoundingClientRect()
    if (!r) return
    const id = Date.now() + Math.random()
    setBursts((b) => [...b.slice(-4), { id, x: cx - r.left, y: cy - r.top }])
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1400)
    setTouched(true)
    hug()
    navigator.vibrate?.(12)
  }

  return (
    <div ref={wrap} className={`stage ${className}`} {...gestures}>
      <Canvas
        frameloop={inView ? 'always' : 'never'}
        dpr={[1, dpr]}
        camera={{ position: camera.position, fov: camera.fov }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }}
        onCreated={({ camera: cam }) => cam.lookAt(...camera.target)}
        style={{ touchAction: 'pan-y' }}
      >
        {/* desmonta fora da tela: a pausa do render não deve contar como queda de FPS */}
        {inView && <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.75)} flipflops={3} />}
        <StageLights />
        {children(ctl, onTap)}
        <ContactShadows position={[0, shadowY, 0]} opacity={0.32} scale={5} blur={2.6} far={2.2} color="#4a2a1a" frames={1} />
      </Canvas>
      {bursts.map((b) => (
        <HeartBurst key={b.id} burst={b} />
      ))}
      <AnimatePresence>
        {speech && (
          <motion.span
            key={speech.id}
            className="stage-speech"
            initial={{ opacity: 0, scale: 0.4, rotate: -12, y: 10 }}
            animate={{ opacity: 1, scale: 1, rotate: -4, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: -8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 16 }}
          >
            {speech.text}
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {hint && !touched && (
          <motion.span className="stage-hint" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ delay: 0.8 }}>
            {hint}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
