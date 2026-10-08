import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { buildBow } from './bearGeometry'
import { FILL_DIR, KEY_DIR } from './furMaterial'
import { stepYaw, type StageController } from './stage'
import { useUI } from '../store/ui'
import { FONT_SETS, type FontSetId } from '../theme/styles'

export interface BubbleLook {
  inner: string
  ribbon: string
  name: string
  age: string
}

const R = 1.2

/** Plástico cristal: quase invisível no centro, reflexos e borda pelo efeito fresnel. */
function createBubbleMaterial(side: THREE.Side, strength: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side,
    uniforms: {
      uKey: { value: KEY_DIR.clone() },
      uFill: { value: FILL_DIR.clone() },
      uStrength: { value: strength },
    },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uKey;
      uniform vec3 uFill;
      uniform float uStrength;
      varying vec3 vN;
      varying vec3 vW;
      void main() {
        vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vW);
        if (!gl_FrontFacing) N = -N;
        float ndv = abs(dot(N, V));
        float fres = pow(1.0 - ndv, 2.6);
        float s1 = pow(max(dot(N, normalize(uKey + V)), 0.0), 220.0) * 2.4;
        float s2 = pow(max(dot(N, normalize(uFill + V)), 0.0), 90.0) * 0.7;
        vec3 R = reflect(-V, N);
        float band = smoothstep(0.93, 0.99, dot(R, normalize(vec3(-0.55, 0.55, 0.62))));
        float floor_ = smoothstep(0.2, -0.6, R.y) * 0.18;
        // leve iridescência na borda
        vec3 irid = 0.5 + 0.5 * cos(6.2831 * (fres * 1.4 + vec3(0.0, 0.33, 0.67)));
        // só clareia o fundo: cor sempre clara, a opacidade é que varia
        vec3 col = mix(vec3(1.0, 0.985, 0.97), irid, 0.22 * fres);
        float a = clamp(0.035 + fres * 0.55 + band * 0.75 + s1 + s2 + floor_ * 0.5, 0.0, 1.0) * uStrength;
        gl_FragColor = vec4(col, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
}

function useNameTexture(name: string, age: string, fonts: FontSetId) {
  const tex = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
  }, [])

  useEffect(() => {
    let alive = true
    // idade na fonte de título escolhida para o site
    const display = FONT_SETS[fonts].display
    const draw = () => {
      if (!alive) return
      const canvas = tex.image as HTMLCanvasElement
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#8C2A33'
      ctx.shadowColor = 'rgba(255,255,255,.65)'
      ctx.shadowBlur = 6
      const label = name.trim() || 'Seu nome'
      let size = 170
      ctx.font = `${size}px "Leckerli One", cursive`
      while (ctx.measureText(label).width > 900 && size > 70) {
        size -= 6
        ctx.font = `${size}px "Leckerli One", cursive`
      }
      ctx.globalAlpha = name.trim() ? 1 : 0.4
      ctx.fillText(label, 512, age ? 190 : 250)
      ctx.globalAlpha = 1
      if (age) {
        ctx.font = `600 190px ${display}`
        ctx.fillText(age, 512, 385)
      }
      tex.needsUpdate = true
    }
    draw()
    // redesenha quando as fontes do Google terminarem de carregar
    Promise.all([document.fonts.load('170px "Leckerli One"'), document.fonts.load(`600 190px ${display}`)]).then(draw, () => {})
    return () => {
      alive = false
    }
  }, [tex, name, age, fonts])

  useEffect(() => () => tex.dispose(), [tex])
  return tex
}

const INNER = [
  { p: [-0.42, -0.6, 0.22], s: 0.3 },
  { p: [0.38, -0.66, 0.12], s: 0.29 },
  { p: [0.04, -0.72, -0.32], s: 0.27 },
  { p: [-0.18, -0.42, -0.5], s: 0.26 },
  { p: [0.5, -0.34, -0.3], s: 0.25 },
  { p: [-0.56, -0.3, -0.42], s: 0.24 },
  { p: [0.1, -0.5, 0.3], s: 0.22 },
] as const

export function BubbleBalloon({ look, ctl, onTap }: { look: BubbleLook; ctl: StageController; onTap: (x: number, y: number) => void }) {
  const front = useMemo(() => createBubbleMaterial(THREE.FrontSide, 1), [])
  const back = useMemo(() => createBubbleMaterial(THREE.BackSide, 0.45), [])
  const fonts = useUI((s) => s.fonts)
  const nameTex = useNameTexture(look.name, look.age, fonts)
  const bow = useMemo(buildBow, [])

  const latex = useMemo(
    () => INNER.map(() => new THREE.MeshPhysicalMaterial({ roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.18, sheen: 0.4 })),
    [],
  )
  useEffect(() => {
    const base = new THREE.Color(look.inner)
    const light = base.clone().lerp(new THREE.Color('#ffffff'), 0.45)
    const gold = new THREE.Color('#D9B66E')
    latex.forEach((m, i) => {
      m.color.copy(i % 3 === 1 ? light : i === 4 ? gold : base)
      m.sheenColor.copy(m.color).lerp(new THREE.Color('#ffffff'), 0.5)
    })
  }, [look.inner, latex])

  const ribbonMat = useMemo(() => new THREE.MeshPhysicalMaterial({ roughness: 0.4, sheen: 1, sheenRoughness: 0.35, side: THREE.DoubleSide }), [])
  useEffect(() => {
    ribbonMat.color.set(look.ribbon)
    ribbonMat.sheenColor.set(look.ribbon).lerp(new THREE.Color('#ffffff'), 0.35)
  }, [look.ribbon, ribbonMat])

  const stringGeo = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -R - 0.02, 0),
      new THREE.Vector3(0.06, -1.6, 0.02),
      new THREE.Vector3(-0.05, -2.1, 0),
      new THREE.Vector3(0.04, -2.8, 0),
    ])
    return new THREE.TubeGeometry(c, 40, 0.009, 6)
  }, [])

  const root = useRef<THREE.Group>(null)
  const bubble = useRef<THREE.Group>(null)
  const inner = useRef<(THREE.Group | null)[]>([])
  const anim = useRef({ tapAt: -10, dirs: INNER.map(() => new THREE.Vector3().randomDirection()) })

  const handleTap = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 8) return
    e.stopPropagation()
    ctl.pendingTap = true
    onTap(e.nativeEvent.clientX, e.nativeEvent.clientY)
  }

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const t = state.clock.elapsedTime
    const a = anim.current
    if (ctl.pendingTap) {
      ctl.pendingTap = false
      a.tapAt = t
      a.dirs.forEach((d) => d.randomDirection())
    }
    const yaw = stepYaw(ctl, t, dt, 0.5)
    if (root.current) root.current.rotation.y = yaw

    const tau = t - a.tapAt
    const jolt = tau < 2.5 ? Math.exp(-tau * 3) * Math.sin(tau * 12) : 0
    if (bubble.current) {
      bubble.current.position.y = 0.35 + Math.sin(t * 0.9) * 0.05 + jolt * 0.06
      bubble.current.rotation.z = Math.sin(t * 0.7) * 0.03 + jolt * 0.04
      bubble.current.scale.setScalar(1 + jolt * 0.025)
    }
    inner.current.forEach((g, i) => {
      if (!g) return
      const [x, y, z] = INNER[i].p
      const d = a.dirs[i]
      g.position.set(
        x + Math.sin(t * 0.8 + i) * 0.02 + d.x * jolt * 0.1,
        y + Math.sin(t * 1.1 + i * 1.7) * 0.03 + Math.abs(d.y) * jolt * 0.12,
        z + d.z * jolt * 0.1,
      )
      g.rotation.z = Math.sin(t * 0.9 + i) * 0.15 + d.x * jolt * 0.4
    })
  })

  // segmento de esfera para o nome "colado" no balão
  const labelGeo = useMemo(() => new THREE.SphereGeometry(R + 0.006, 64, 32, Math.PI / 2 - 0.85, 1.7, Math.PI / 2 - 0.78, 1.0), [])

  return (
    <group ref={root}>
      <group ref={bubble} position={[0, 0.35, 0]}>
        {INNER.map((b, i) => (
          <group key={i} ref={(g) => void (inner.current[i] = g)} position={b.p as unknown as [number, number, number]}>
            <mesh material={latex[i]} scale={[b.s, b.s * 1.14, b.s]}>
              <sphereGeometry args={[1, 32, 24]} />
            </mesh>
            <mesh material={latex[i]} position={[0, -b.s * 1.14, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[b.s * 0.12, b.s * 0.2, 12]} />
            </mesh>
          </group>
        ))}
        <mesh material={back} renderOrder={1}>
          <sphereGeometry args={[R, 64, 48]} />
        </mesh>
        <mesh material={front} renderOrder={2} onClick={handleTap}>
          <sphereGeometry args={[R, 64, 48]} />
        </mesh>
        <mesh geometry={labelGeo} renderOrder={3}>
          <meshStandardMaterial map={nameTex} transparent depthWrite={false} roughness={0.35} metalness={0.1} />
        </mesh>
        <mesh geometry={stringGeo}>
          <meshStandardMaterial color="#f4ece4" roughness={0.6} />
        </mesh>
        <group position={[0, -R - 0.06, 0.02]} scale={0.55}>
          <mesh geometry={bow.loops} material={ribbonMat} />
          <mesh geometry={bow.tails} material={ribbonMat} />
        </group>
      </group>
    </group>
  )
}
