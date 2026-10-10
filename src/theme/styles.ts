/**
 * Opções de identidade visual. Cada paleta define os tokens de cor (variáveis
 * CSS) para claro e escuro; cada conjunto de fontes define título, texto e a
 * letra "manuscrita" dos detalhes. O nome da marca segue em Leckerli One, que
 * conversa com o letreiro da logo.
 */

type Tokens = Record<
  'bg' | 'bg-a' | 'sf' | 'soft' | 'kraft' | 'tx' | 'ink' | 'mu' | 'red' | 'red-2' | 'on-red' | 'tan' | 'leaf' | 'ln' | 'bd' | 'sh' | 'arch',
  string
>

export interface Palette {
  label: string
  desc: string
  light: Tokens
  dark: Tokens
}

export const PALETTES = {
  rosa: {
    label: 'Rosa abraço',
    desc: 'Branco rosado e vermelho-cereja das rosas',
    light: {
      bg: '#FFF8F6', 'bg-a': 'rgba(255,248,246,.86)', sf: '#FFFFFF', soft: '#FCEAE8', kraft: '#F1C9C4',
      tx: '#3A2A30', ink: '#2E1A22', mu: '#7E6870', red: '#C2334A', 'red-2': '#E07A8A', 'on-red': '#FFFFFF',
      tan: '#B76E79', leaf: '#6E8B5B', ln: 'rgba(194,51,74,.16)', bd: 'rgba(46,26,34,.12)', sh: 'rgba(150,60,80,.18)',
      arch: 'linear-gradient(170deg,#FFF2EF,#FADCDA)',
    },
    dark: {
      bg: '#231A1F', 'bg-a': 'rgba(35,26,31,.9)', sf: '#2D2128', soft: '#382932', kraft: '#4A3640',
      tx: '#F5E8EC', ink: '#FFF0F4', mu: '#B8999E', red: '#D84A62', 'red-2': '#E87A90', 'on-red': '#FFF8F9',
      tan: '#D4A5B0', leaf: '#8DB88A', ln: 'rgba(216,74,98,.15)', bd: 'rgba(245,232,236,.08)', sh: 'rgba(50,25,35,.35)',
      arch: 'linear-gradient(170deg,#2E222A,#1F171C)',
    },
  },
  jardim: {
    label: 'Jardim',
    desc: 'Verde-sálvia das folhas com rosas vermelhas',
    light: {
      bg: '#F7F8F3', 'bg-a': 'rgba(247,248,243,.86)', sf: '#FFFFFF', soft: '#E8EFE3', kraft: '#C9D8C0',
      tx: '#26302A', ink: '#1D2B22', mu: '#66756B', red: '#B8323F', 'red-2': '#D2646F', 'on-red': '#FFFFFF',
      tan: '#5E7D57', leaf: '#5E7D57', ln: 'rgba(94,125,87,.22)', bd: 'rgba(29,43,34,.12)', sh: 'rgba(50,80,55,.18)',
      arch: 'linear-gradient(170deg,#F1F5EC,#DCE7D4)',
    },
    dark: {
      bg: '#141A16', 'bg-a': 'rgba(20,26,22,.86)', sf: '#1E2620', soft: '#26312A', kraft: '#3E5341',
      tx: '#E9F0E6', ink: '#F2F7EF', mu: '#A9B8AC', red: '#E9707B', 'red-2': '#F0939C', 'on-red': '#141A16',
      tan: '#9FC093', leaf: '#9FC093', ln: 'rgba(159,192,147,.2)', bd: 'rgba(233,240,230,.12)', sh: 'rgba(0,0,0,.55)',
      arch: 'linear-gradient(170deg,#24302A,#18201B)',
    },
  },
  festa: {
    label: 'Festa de balão',
    desc: 'Azul-bebê, coral e amarelo — mais alegre',
    light: {
      bg: '#F7FAFD', 'bg-a': 'rgba(247,250,253,.86)', sf: '#FFFFFF', soft: '#E6F0FA', kraft: '#BBD5EE',
      tx: '#23304A', ink: '#1B2540', mu: '#65708A', red: '#D63C43', 'red-2': '#F07C82', 'on-red': '#FFFFFF',
      tan: '#D08A0E', leaf: '#3F9A6E', ln: 'rgba(80,120,180,.2)', bd: 'rgba(27,37,64,.12)', sh: 'rgba(40,70,120,.18)',
      arch: 'linear-gradient(170deg,#EEF5FC,#D9E8F7)',
    },
    dark: {
      bg: '#121826', 'bg-a': 'rgba(18,24,38,.86)', sf: '#1B2333', soft: '#222D42', kraft: '#34507A',
      tx: '#E8EEF8', ink: '#F2F6FC', mu: '#A7B3C8', red: '#FF6B70', 'red-2': '#FF9599', 'on-red': '#121826',
      tan: '#F5C04E', leaf: '#7CCB9F', ln: 'rgba(150,180,230,.2)', bd: 'rgba(232,238,248,.12)', sh: 'rgba(0,0,0,.55)',
      arch: 'linear-gradient(170deg,#202B40,#161D2C)',
    },
  },
  neutro: {
    label: 'Creme & vermelho',
    desc: 'Claro e neutro; o marrom fica só no urso',
    light: {
      bg: '#FFFCF8', 'bg-a': 'rgba(255,252,248,.86)', sf: '#FFFFFF', soft: '#F5F0EA', kraft: '#E5DCD0',
      tx: '#2A2523', ink: '#171313', mu: '#6F6762', red: '#B3242F', 'red-2': '#D4505A', 'on-red': '#FFFFFF',
      tan: '#A07C4E', leaf: '#6E8B5B', ln: 'rgba(23,19,19,.1)', bd: 'rgba(23,19,19,.12)', sh: 'rgba(30,20,15,.14)',
      arch: 'linear-gradient(170deg,#FBF6F0,#F1E9DF)',
    },
    dark: {
      bg: '#141212', 'bg-a': 'rgba(20,18,18,.86)', sf: '#1E1B1A', soft: '#282423', kraft: '#4A423C',
      tx: '#F3EEE9', ink: '#FFFFFF', mu: '#B5ABA4', red: '#EF5B64', 'red-2': '#F28088', 'on-red': '#141212',
      tan: '#D2B080', leaf: '#9CBB8A', ln: 'rgba(243,238,233,.12)', bd: 'rgba(243,238,233,.12)', sh: 'rgba(0,0,0,.55)',
      arch: 'linear-gradient(170deg,#262221,#1A1817)',
    },
  },
  chocolate: {
    label: 'Chocolate (atual)',
    desc: 'A versão de antes, toda em tons de marrom',
    light: {
      bg: '#FBF5EC', 'bg-a': 'rgba(251,245,236,.86)', sf: '#FFFDF9', soft: '#F4E8D8', kraft: '#DCC19B',
      tx: '#3E2418', ink: '#4A2619', mu: '#7D6152', red: '#A8323A', 'red-2': '#C0565E', 'on-red': '#FFF8F0',
      tan: '#B98556', leaf: '#6B8455', ln: 'rgba(120,78,50,.2)', bd: 'rgba(62,36,24,.13)', sh: 'rgba(96,54,30,.22)',
      arch: 'linear-gradient(170deg,#FBEFE2,#F1DCCB)',
    },
    dark: {
      bg: '#1C120D', 'bg-a': 'rgba(28,18,13,.86)', sf: '#281A13', soft: '#33231A', kraft: '#8B6B47',
      tx: '#F6EADC', ink: '#F6EADC', mu: '#C7AE9C', red: '#DD6A71', 'red-2': '#E88A90', 'on-red': '#1C120D',
      tan: '#C9945F', leaf: '#9CB486', ln: 'rgba(217,180,140,.2)', bd: 'rgba(246,234,220,.12)', sh: 'rgba(0,0,0,.55)',
      arch: 'linear-gradient(170deg,#3A281E,#2A1C15)',
    },
  },
} satisfies Record<string, Palette>

export type PaletteId = keyof typeof PALETTES

export interface FontSet {
  label: string
  desc: string
  display: string
  body: string
  hand: string
  /** peso dos títulos */
  weight: number
  /** peso dos títulos grandes (hero) */
  light: number
  /** a fonte de título tem itálico de verdade? senão a ênfase fica só na cor */
  italic: boolean
  /** ajuste de tamanho da letra manuscrita */
  handScale: number
  href: string
}

const G = 'https://fonts.googleapis.com/css2?display=swap&'

export const FONT_SETS = {
  romantica: {
    label: 'Romântica',
    desc: 'Playfair + DM Sans, pesos leves',
    display: "'Playfair', 'Playfair Display', Georgia, serif",
    body: "'DM Sans', system-ui, sans-serif",
    hand: "'Dancing Script', cursive",
    weight: 400,
    light: 300,
    italic: true,
    handScale: 1,
    href: G + 'family=Playfair:ital,opsz,wght@0,5..1200,300..700;1,5..1200,300..700&family=DM+Sans:ital,opsz,wght@0,9..40,200..700;1,9..40,200..700&family=Dancing+Script:wght@400..600',
  },
  fofa: {
    label: 'Fofinha',
    desc: 'Baloo 2 + Nunito',
    display: "'Baloo 2', system-ui, sans-serif",
    body: "'Nunito', system-ui, sans-serif",
    hand: "'Gochi Hand', cursive",
    weight: 700,
    light: 500,
    italic: false,
    handScale: 0.92,
    href: G + 'family=Baloo+2:wght@500..800&family=Nunito:wght@400..800&family=Gochi+Hand',
  },
  moderna: {
    label: 'Moderna',
    desc: 'Bricolage Grotesque + Plus Jakarta Sans',
    display: "'Bricolage Grotesque', system-ui, sans-serif",
    body: "'Plus Jakarta Sans', system-ui, sans-serif",
    hand: "'Caveat', cursive",
    weight: 650,
    light: 400,
    italic: false,
    handScale: 1,
    href: G + 'family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Plus+Jakarta+Sans:wght@400..800&family=Caveat:wght@500;600',
  },
  classica: {
    label: 'Clássica',
    desc: 'DM Serif Display + Figtree',
    display: "'DM Serif Display', Georgia, serif",
    body: "'Figtree', system-ui, sans-serif",
    hand: "'Caveat', cursive",
    weight: 400,
    light: 400,
    italic: true,
    handScale: 1,
    href: G + 'family=DM+Serif+Display:ital@0;1&family=Figtree:wght@400..800&family=Caveat:wght@500;600',
  },
  atual: {
    label: 'Atual',
    desc: 'Fraunces + Nunito',
    display: "'Fraunces', Georgia, serif",
    body: "'Nunito', system-ui, sans-serif",
    hand: "'Caveat', cursive",
    weight: 460,
    light: 300,
    italic: true,
    handScale: 1,
    href: G + 'family=Caveat:wght@500;600&family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,0..100;1,9..144,300..700,0..100&family=Nunito:wght@400..800',
  },
} satisfies Record<string, FontSet>

export type FontSetId = keyof typeof FONT_SETS

export const DEFAULT_PALETTE: PaletteId = 'rosa'
export const DEFAULT_FONTS: FontSetId = 'romantica'

function ensureStylesheet(href: string) {
  if (document.querySelector(`link[data-font="${CSS.escape(href)}"]`)) return
  const l = document.createElement('link')
  l.rel = 'stylesheet'
  l.href = href
  l.dataset.font = href
  document.head.appendChild(l)
}

/** Aplica paleta + fontes como variáveis CSS e guarda para o próximo carregamento (evita "piscar"). */
export function applyStyle(palette: PaletteId, fonts: FontSetId, theme: 'light' | 'dark') {
  const root = document.documentElement
  const p = (PALETTES[palette] ?? PALETTES[DEFAULT_PALETTE])[theme]
  const f: FontSet = FONT_SETS[fonts] ?? FONT_SETS[DEFAULT_FONTS]
  ensureStylesheet(f.href)
  const vars: Record<string, string> = {
    '--font-display': f.display,
    '--font-body': f.body,
    '--font-hand': f.hand,
    '--display-weight': String(f.weight),
    '--display-light': String(f.light),
    '--em-style': f.italic ? 'italic' : 'normal',
    '--hand-scale': String(f.handScale),
  }
  for (const [k, v] of Object.entries(p)) vars[`--${k}`] = v
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', p.bg)
  try {
    localStorage.setItem('uab-vars', JSON.stringify({ vars, href: f.href }))
  } catch {
    /* sem armazenamento: aplica só nesta sessão */
  }
}

/** Carrega todas as fontes de uma vez (para as prévias do seletor). */
export function preloadAllFonts() {
  Object.values(FONT_SETS).forEach((f) => ensureStylesheet(f.href))
}
