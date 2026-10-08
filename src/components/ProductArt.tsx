import { useId, type ReactNode } from 'react'
import type { ArtKind } from '../data/products'

/**
 * Ilustrações vetoriais dos produtos no estilo da logo (urso marrom, laço
 * vermelho, papel kraft, coraçõezinhos). Servem de foto provisória: troque por
 * fotos reais quando houver.
 */

export interface ArtLook {
  fur?: string
  ribbon?: string
  inner?: string
  name?: string
  age?: string
}

function mix(hex: string, to: string, amt: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const a = p(hex.length === 4 ? '#' + [...hex.slice(1)].map((c) => c + c).join('') : hex)
  const b = p(to)
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * amt).toString(16).padStart(2, '0')).join('')
}
const light = (h: string, a: number) => mix(h, '#ffffff', a)
const dark = (h: string, a: number) => mix(h, '#000000', a)

const luma = (h: string) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b }

const DARK = '#2B1A12'
const KRAFT = '#D9BD94'
const LEAF = '#6F8A4E'

function Heart({ x, y, s = 1, color }: { x: number; y: number; s?: number; color: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 6 C-6 1-9-3-6-6.5-3.6-9.2 0-7.5 0-4.8 0-7.5 3.6-9.2 6-6.5 9-3 6 1 0 6Z"
      fill="none"
      style={{ stroke: color }}
      strokeWidth={1.6 / s}
      strokeLinejoin="round"
    />
  )
}

function Bear({ x, y, s = 1, fur, ribbon, uid }: { x: number; y: number; s?: number; fur: string; ribbon: string; uid: string }) {
  const g = `${uid}-fur`
  const cream = luma(fur) > 0.62 ? '#FFFBF5' : '#F1E6D7'
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <radialGradient id={g} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor={light(fur, 0.22)} />
          <stop offset="0.6" stopColor={fur} />
          <stop offset="1" stopColor={dark(fur, 0.22)} />
        </radialGradient>
      </defs>
      <g filter={`url(#${uid}-fuzz)`} fill={`url(#${g})`}>
        <circle cx={-38} cy={-88} r={15} />
        <circle cx={38} cy={-88} r={15} />
        <ellipse cx={0} cy={18} rx={40} ry={44} />
        <ellipse cx={-36} cy={8} rx={13} ry={25} transform="rotate(18 -36 8)" />
        <ellipse cx={36} cy={8} rx={13} ry={25} transform="rotate(-18 36 8)" />
        <ellipse cx={-26} cy={56} rx={21} ry={15} />
        <ellipse cx={26} cy={56} rx={21} ry={15} />
        <ellipse cx={0} cy={-60} rx={46} ry={40} />
      </g>
      <circle cx={-38} cy={-88} r={8.5} fill={dark(fur, 0.18)} />
      <circle cx={38} cy={-88} r={8.5} fill={dark(fur, 0.18)} />
      <ellipse cx={-31} cy={59} rx={11} ry={11.5} fill={cream} />
      <ellipse cx={31} cy={59} rx={11} ry={11.5} fill={cream} />
      <ellipse cx={0} cy={-45} rx={17.5} ry={12.5} fill={cream} />
      <ellipse cx={-27} cy={-50} rx={6} ry={3.8} fill="#D9727A" opacity={0.28} />
      <ellipse cx={27} cy={-50} rx={6} ry={3.8} fill="#D9727A" opacity={0.28} />
      <ellipse cx={0} cy={-50.5} rx={6.5} ry={4.5} fill={DARK} />
      <path d="M0 -46.5v4.2M-7 -41q3.5 3.5 7-1q3.5 4.5 7 1" stroke={DARK} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <circle cx={-15} cy={-64} r={4.3} fill={DARK} />
      <circle cx={15} cy={-64} r={4.3} fill={DARK} />
      <circle cx={-16.4} cy={-65.6} r={1.3} fill="#fff" />
      <circle cx={13.6} cy={-65.6} r={1.3} fill="#fff" />
      <Bow x={0} y={-21} color={ribbon} />
    </g>
  )
}

function Bow({ x, y, color, s = 1 }: { x: number; y: number; color: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-2 2 L-9 21 L-4.5 18.5 L-1 22 L2 3Z M2 2 L9 21 L4.5 18.5 L1 22 L-2 3Z" fill={dark(color, 0.12)} />
      <path d="M0 0C-9-11-25-13-26-3-27 7-11 8 0 0Z" fill={color} />
      <path d="M0 0C9-11 25-13 26-3 27 7 11 8 0 0Z" fill={color} />
      <path d="M-4-3C-12-8-20-8-22-3" stroke={light(color, 0.35)} strokeWidth={1.2} fill="none" strokeLinecap="round" opacity={0.7} />
      <ellipse cx={0} cy={0} rx={5} ry={6} fill={dark(color, 0.15)} />
    </g>
  )
}

function Balloon({ x, y, r, color, string = 40, uid, tilt = 0 }: { x: number; y: number; r: number; color: string; string?: number; uid: string; tilt?: number }) {
  const id = `${uid}-b${Math.round(x)}${Math.round(y)}`
  return (
    <g transform={`rotate(${tilt} ${x} ${y + r * 1.15 + string})`}>
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor={light(color, 0.55)} />
          <stop offset="0.45" stopColor={color} />
          <stop offset="1" stopColor={dark(color, 0.18)} />
        </radialGradient>
      </defs>
      {string > 0 && (
        <path d={`M${x} ${y + r * 1.15}q4 ${string / 3} -2 ${string / 1.6}t2 ${string / 2.6}`} stroke={dark(color, 0.1)} strokeWidth={0.9} fill="none" opacity={0.6} />
      )}
      <ellipse cx={x} cy={y} rx={r} ry={r * 1.15} fill={`url(#${id})`} />
      <path d={`M${x - 2.6} ${y + r * 1.15 + 3.4}L${x} ${y + r * 1.13}L${x + 2.6} ${y + r * 1.15 + 3.4}Z`} fill={dark(color, 0.12)} />
      <ellipse cx={x - r * 0.38} cy={y - r * 0.45} rx={r * 0.16} ry={r * 0.26} fill="#fff" opacity={0.55} transform={`rotate(-25 ${x - r * 0.38} ${y - r * 0.45})`} />
    </g>
  )
}

function Bubble({ x, y, r, inner, name, age, uid, ribbon, children }: { x: number; y: number; r: number; inner: string; name?: string; age?: string; uid: string; ribbon: string; children?: ReactNode }) {
  const id = `${uid}-bubble`
  const clip = `${uid}-clip`
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="50%" cy="50%" r="50%">
          <stop offset="0.7" stopColor="#fff" stopOpacity={0.05} />
          <stop offset="0.96" stopColor="#fff" stopOpacity={0.45} />
          <stop offset="1" stopColor="#fff" stopOpacity={0.8} />
        </radialGradient>
        <clipPath id={clip}>
          <circle cx={x} cy={y} r={r - 2} />
        </clipPath>
      </defs>
      <path d={`M${x} ${y + r}q6 22-3 40t3 40`} stroke="#E9DED2" strokeWidth={1.2} fill="none" />
      <g clipPath={`url(#${clip})`}>
        {children ?? (
          <>
            <Balloon uid={uid} x={x - r * 0.42} y={y + r * 0.45} r={r * 0.24} color={inner} string={0} tilt={-12} />
            <Balloon uid={uid} x={x + r * 0.4} y={y + r * 0.5} r={r * 0.22} color={light(inner, 0.4)} string={0} tilt={14} />
            <Balloon uid={uid} x={x + r * 0.02} y={y + r * 0.62} r={r * 0.2} color={inner} string={0} />
            <Balloon uid={uid} x={x - r * 0.12} y={y + r * 0.28} r={r * 0.17} color="#D9B66E" string={0} tilt={8} />
            <Balloon uid={uid} x={x + r * 0.18} y={y + r * 0.22} r={r * 0.15} color={inner} string={0} tilt={-8} />
          </>
        )}
      </g>
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} stroke="#fff" strokeOpacity={0.9} strokeWidth={1.2} />
      <path d={`M${x - r * 0.62} ${y - r * 0.42}a${r * 0.78} ${r * 0.78} 0 0 1 ${r * 0.5} -${r * 0.38}`} stroke="#fff" strokeWidth={r * 0.06} strokeLinecap="round" fill="none" opacity={0.85} />
      {name !== undefined && (
        <text x={x} y={age ? y - r * 0.28 : y - r * 0.12} textAnchor="middle" fontFamily="'Leckerli One', cursive" fontSize={r * 0.36} style={{ fill: 'var(--red)' }}>
          {name || 'Seu nome'}
        </text>
      )}
      {age && (
        <text x={x} y={y + r * 0.16} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fill: 'var(--red)' }} fontWeight={600} fontSize={r * 0.42}>
          {age}
        </text>
      )}
      <Bow x={x} y={y + r + 2} color={ribbon} s={0.55} />
    </g>
  )
}

function Rose({ x, y, r = 11 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="#B3202D" />
      <path
        d={`M${-r * 0.1} ${-r * 0.05}a${r * 0.25} ${r * 0.25} 0 1 1 ${r * 0.3} ${r * 0.25}a${r * 0.5} ${r * 0.5} 0 1 1 -${r * 0.75} -${r * 0.35}a${r * 0.75} ${r * 0.75} 0 1 1 ${r * 1.15} ${r * 0.6}`}
        stroke="#7E1520"
        strokeWidth={1.3}
        fill="none"
        strokeLinecap="round"
      />
      <circle r={r} fill="none" stroke="#C93A44" strokeWidth={0.8} opacity={0.6} />
    </g>
  )
}

function Bouquet({ x, y, s = 1, count = 5, ribbon }: { x: number; y: number; s?: number; count?: number; ribbon: string }) {
  const roses = [
    [-14, -18],
    [12, -20],
    [-1, -32],
    [-24, -32],
    [22, -36],
    [0, -12],
    [-10, -44],
    [12, -46],
  ].slice(0, count)
  const leaves = [
    [-30, -14, -40],
    [30, -16, 40],
    [-34, -40, -20],
    [34, -42, 25],
    [0, -52, 0],
  ]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {leaves.map(([lx, ly, rot], i) => (
        <ellipse key={i} cx={lx} cy={ly} rx={5} ry={11} fill={LEAF} transform={`rotate(${rot} ${lx} ${ly})`} />
      ))}
      {roses.map(([rx, ry], i) => (
        <Rose key={i} x={rx} y={ry} />
      ))}
      {[
        [-32, -26],
        [28, -28],
        [-6, -50],
        [18, -8],
        [-20, -6],
        [8, -38],
        [-16, -42],
        [34, -48],
      ].map(([bx, by], i) => (
        <g key={i} fill="#fff">
          <circle cx={bx} cy={by} r={1.9} />
          <circle cx={bx + 3} cy={by + 2} r={1.5} />
          <circle cx={bx - 2.5} cy={by + 2.6} r={1.3} />
        </g>
      ))}
      <path d="M-38 -14L38 -14L12 46L-12 46Z" fill={KRAFT} />
      <path d="M-38 -14L-6 -2L-12 46Z" fill={dark(KRAFT, 0.08)} />
      <path d="M38 -14L6 -2L12 46Z" fill={light(KRAFT, 0.15)} />
      <Bow x={0} y={20} color={ribbon} s={0.75} />
    </g>
  )
}

export function ProductArt({ kind, look = {}, className }: { kind: ArtKind; look?: ArtLook; className?: string }) {
  const uid = useId().replace(/:/g, '')
  const fur = look.fur ?? '#6E4A33'
  const ribbon = look.ribbon ?? '#B3242F'
  const inner = look.inner ?? '#E0A3A3'

  let body: ReactNode
  switch (kind) {
    case 'bear':
      body = <Bear uid={uid} x={100} y={142} fur={fur} ribbon={ribbon} />
      break
    case 'bear-giant':
      body = (
        <>
          <Bear uid={uid} x={100} y={150} s={1.14} fur={fur} ribbon={ribbon} />
          <g transform="translate(158 42) rotate(12)">
            <rect x={-17} y={-10} width={34} height={20} rx={4} fill={KRAFT} />
            <circle cx={-11} cy={0} r={2} fill="#fff" />
            <text x={4} y={4} textAnchor="middle" fontSize={10} fontWeight={600} style={{ fontFamily: 'var(--font-body)' }} fill={DARK}>
              80cm
            </text>
          </g>
        </>
      )
      break
    case 'bear-roses':
      body = (
        <>
          <Bear uid={uid} x={100} y={146} fur={fur} ribbon={ribbon} />
          <Bouquet x={84} y={154} s={0.62} ribbon={ribbon} />
        </>
      )
      break
    case 'bear-bubble':
      body = (
        <Bubble uid={uid} x={100} y={108} r={82} inner={inner} ribbon={ribbon} name={look.name}>
          <Bear uid={uid} x={100} y={138} s={0.62} fur={fur} ribbon={ribbon} />
        </Bubble>
      )
      break
    case 'bubble':
      body = <Bubble uid={uid} x={100} y={106} r={74} inner={inner} ribbon={ribbon} name={look.name ?? 'Helena'} />
      break
    case 'bubble-age':
      body = <Bubble uid={uid} x={100} y={106} r={74} inner={inner} ribbon={ribbon} name={look.name ?? 'Helena'} age={look.age || '30'} />
      break
    case 'balloon-bouquet':
      body = (
        <>
          <Balloon uid={uid} x={64} y={78} r={24} color={inner} string={96} tilt={-10} />
          <Balloon uid={uid} x={138} y={74} r={24} color={light(inner, 0.4)} string={100} tilt={10} />
          <Balloon uid={uid} x={100} y={52} r={27} color="#D9B66E" string={124} />
          <Balloon uid={uid} x={78} y={124} r={20} color={light(inner, 0.4)} string={56} tilt={-6} />
          <Balloon uid={uid} x={124} y={122} r={21} color={inner} string={58} tilt={6} />
          <Bow x={100} y={206} color={ribbon} s={0.7} />
        </>
      )
      break
    case 'table':
      body = (
        <>
          <Balloon uid={uid} x={58} y={128} r={22} color={inner} string={0} />
          <Balloon uid={uid} x={142} y={128} r={22} color={inner} string={0} />
          <Balloon uid={uid} x={76} y={160} r={18} color={light(inner, 0.45)} string={0} />
          <Balloon uid={uid} x={124} y={160} r={18} color={light(inner, 0.45)} string={0} />
          <Bubble uid={uid} x={100} y={92} r={50} inner={inner} ribbon={ribbon} name={look.name || 'Ana'} />
          <rect x={60} y={176} width={80} height={40} rx={8} fill="#F6EEE4" stroke={KRAFT} />
          <rect x={60} y={190} width={80} height={9} fill={ribbon} opacity={0.85} />
        </>
      )
      break
    case 'roses':
      body = <Bouquet x={100} y={142} s={1.55} count={8} ribbon={ribbon} />
      break
    case 'basket':
      body = (
        <>
          <path d="M44 150Q100 40 156 150" stroke="#A97E4B" strokeWidth={7} fill="none" strokeLinecap="round" />
          <Bear uid={uid} x={82} y={146} s={0.6} fur={fur} ribbon={ribbon} />
          <Bouquet x={130} y={140} s={0.55} count={6} ribbon={ribbon} />
          <path d="M34 148H166L152 212H48Z" fill="#C8A06A" />
          <path d="M38 166H162M42 184H158M46 200H154" stroke="#A97E4B" strokeWidth={2} />
          {[56, 76, 96, 116, 136].map((x) => (
            <path key={x} d={`M${x + 4} 150L${x + 2} 210`} stroke="#B48D59" strokeWidth={1.5} />
          ))}
          <rect x={86} y={158} width={28} height={16} rx={3} fill="#5A3622" />
          <rect x={86} y={164} width={28} height={4} fill={ribbon} />
        </>
      )
      break
  }

  return (
    <svg viewBox="0 0 200 240" className={className} aria-hidden="true">
      <defs>
        <filter id={`${uid}-fuzz`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={3.4} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <Heart x={34} y={46} color="var(--red-2)" />
      <Heart x={170} y={110} s={0.8} color="var(--red-2)" />
      {body}
    </svg>
  )
}
