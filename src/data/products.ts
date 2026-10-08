import { brl } from '../lib/format'

export type Category ='ursos' | 'baloes' | 'flores' | 'kits'

export type ArtKind =
  | 'bear'
  | 'bear-roses'
  | 'bear-giant'
  | 'bear-bubble'
  | 'bubble'
  | 'bubble-age'
  | 'balloon-bouquet'
  | 'table'
  | 'roses'
  | 'basket'

export type ModelKind = 'bear' | 'bubble'

export interface OptionChoice {
  id: string
  label: string
  hex?: string
  /** Acréscimo no preço base */
  price?: number
  hint?: string
}

export interface ProductOption {
  id: string
  label: string
  type: 'swatch' | 'chips' | 'text' | 'number'
  choices?: OptionChoice[]
  placeholder?: string
  maxLength?: number
  required?: boolean
}

export interface Extra {
  id: string
  label: string
  price: number
}

export interface Product {
  id: string
  name: string
  category: Category
  price: number
  short: string
  description: string
  includes: string[]
  occasions: Occasion[]
  /** Ilustração usada quando não há foto */
  art: ArtKind
  /** Foto padronizada em /public/products/<image>.webp (4:5, com versão -sm) */
  image?: string
  model?: ModelKind
  options: ProductOption[]
  badge?: string
  featured?: boolean
}

export const OCCASIONS = ['Aniversário', 'Amor', 'Formatura', 'Dia das Mães', 'Nascimento', 'Melhoras', 'Só porque sim'] as const
export type Occasion = (typeof OCCASIONS)[number]

export const CATEGORIES: { id: Category; label: string; art: ArtKind }[] = [
  { id: 'ursos', label: 'Ursos', art: 'bear' },
  { id: 'baloes', label: 'Balões', art: 'bubble' },
  { id: 'flores', label: 'Flores', art: 'roses' },
  { id: 'kits', label: 'Kits', art: 'basket' },
]

/* ---------- opções reutilizáveis ---------- */

export const FUR: ProductOption = {
  id: 'pelucia',
  label: 'Pelúcia',
  type: 'swatch',
  choices: [
    { id: 'chocolate', label: 'Chocolate', hex: '#6E4A33' },
    { id: 'caramelo', label: 'Caramelo', hex: '#A8743F' },
    { id: 'mel', label: 'Mel', hex: '#C99A62' },
    { id: 'creme', label: 'Creme', hex: '#E6D7C3' },
  ],
}

export const RIBBON: ProductOption = {
  id: 'laco',
  label: 'Laço',
  type: 'swatch',
  choices: [
    { id: 'vermelho', label: 'Vermelho', hex: '#B3242F' },
    { id: 'rose', label: 'Rosé', hex: '#D98E96' },
    { id: 'dourado', label: 'Dourado', hex: '#C9A15A' },
    { id: 'azul', label: 'Azul-bebê', hex: '#9EC3DE' },
  ],
}

const PHRASE: ProductOption = {
  id: 'frase',
  label: 'Frase no balão',
  type: 'text',
  placeholder: 'Ex.: Feliz aniversário, Helena!',
  maxLength: 40,
  required: true,
}

const GRAD_NAME: ProductOption = {
  id: 'nome',
  label: 'Nome do formando',
  type: 'text',
  placeholder: 'Ex.: Helena',
  maxLength: 16,
  required: true,
}

const GRAD_COLOR: ProductOption = {
  id: 'cor',
  label: 'Cor',
  type: 'swatch',
  choices: [
    { id: 'rosa', label: 'Rosa', hex: '#EDB9C2' },
    { id: 'azul', label: 'Azul', hex: '#9EC9D8' },
  ],
}

const BASE: ProductOption = {
  id: 'baloes',
  label: 'Cor da base',
  type: 'swatch',
  choices: [
    { id: 'lilas', label: 'Lilás e champanhe', hex: '#C9B8E3' },
    { id: 'rose', label: 'Rosé e champanhe', hex: '#E0A3A3' },
    { id: 'azul', label: 'Azul e champanhe', hex: '#A9CBE6' },
    { id: 'branco', label: 'Branco e dourado', hex: '#F7F3EE' },
  ],
}

const ROSE_COLOR: ProductOption = {
  id: 'cor',
  label: 'Cor das rosas',
  type: 'swatch',
  choices: [
    { id: 'azul', label: 'Azul', hex: '#5FA8D8' },
    { id: 'rosa', label: 'Rosa', hex: '#E59AAE' },
    { id: 'vermelho', label: 'Vermelho', hex: '#B3242F' },
    { id: 'branco', label: 'Branco', hex: '#F4EFE8' },
  ],
}

const GYPSO_COLOR: ProductOption = {
  id: 'cor',
  label: 'Cor do buquê',
  type: 'swatch',
  choices: [
    { id: 'lilas', label: 'Lilás', hex: '#C3A3D6' },
    { id: 'rosa', label: 'Rosa', hex: '#E7A9C4' },
    { id: 'branco', label: 'Branco', hex: '#F4EFE8' },
  ],
}

const MINI_BEAR: ProductOption = {
  id: 'pelucia',
  label: 'Ursinho',
  type: 'swatch',
  choices: [
    { id: 'caramelo', label: 'Caramelo', hex: '#B87335' },
    { id: 'creme', label: 'Creme', hex: '#E6D7C3' },
  ],
}

export const INNER: ProductOption = {
  id: 'baloes',
  label: 'Cor dos balões',
  type: 'swatch',
  choices: [
    { id: 'rose', label: 'Rosé', hex: '#E0A3A3' },
    { id: 'vermelho', label: 'Vermelho', hex: '#C0303A' },
    { id: 'dourado', label: 'Dourado', hex: '#D9B66E' },
    { id: 'branco', label: 'Branco', hex: '#F7F3EE' },
    { id: 'lilas', label: 'Lilás', hex: '#C9B8E3' },
    { id: 'azul', label: 'Azul-bebê', hex: '#A9CBE6' },
    { id: 'salvia', label: 'Sálvia', hex: '#B5CBB0' },
  ],
}

export const EXTRAS: Extra[] = [
  { id: 'cartao', label: 'Cartão escrito à mão', price: 4.9 },
  { id: 'bombons', label: 'Caixa de bombons', price: 24.9 },
  { id: 'coracao', label: 'Balão coração metalizado', price: 12.9 },
  { id: 'premium', label: 'Embalagem premium', price: 9.9 },
]

/* ---------- mascote ---------- */

/** O Bernardo do 3D da home. Não é vendido na vitrine. */
export const MASCOT: Product = {
  id: 'urso-bernardo',
  name: 'Ursinho Bernardo',
  category: 'ursos',
  price: 0,
  short: '',
  description: '',
  includes: [],
  occasions: [],
  art: 'bear',
  model: 'bear',
  options: [FUR, RIBBON],
}

/* ---------- catálogo ---------- */

export const PRODUCTS: Product[] = [
  {
    id: 'bubble-urso-aniversario',
    name: 'Bubble com ursinho',
    category: 'baloes',
    price: 159.9,
    short: 'Ursinho dentro do bubble, sobre base de balões.',
    description:
      'Um ursinho de pelúcia segurando um coração, dentro de um bubble cristal com a frase que você escolher. Vai montado sobre uma base de balões perolados.',
    includes: ['Bubble cristal 24"', 'Ursinho de pelúcia com coração', 'Frase em vinil', 'Base com balões perolados'],
    occasions: ['Aniversário', 'Amor', 'Nascimento', 'Só porque sim'],
    art: 'bear-bubble',
    image: 'bubble-urso-aniversario',
    options: [PHRASE, BASE],
    badge: 'Mais amado',
    featured: true,
  },
  {
    id: 'box-amor',
    name: 'Box Amor',
    category: 'kits',
    price: 249.9,
    short: 'Rosas vermelhas, ursinho, bombons e balões de coração.',
    description:
      'Box com rosas vermelhas, cravos e eucalipto, um ursinho de blusinha vermelha, bombons e dois balões metalizados de coração. Para dizer que ama sem precisar falar.',
    includes: ['Box redondo', 'Rosas vermelhas, cravos e eucalipto', 'Ursinho de pelúcia', 'Bombons', '2 balões de coração metalizados'],
    occasions: ['Amor', 'Aniversário', 'Dia das Mães'],
    art: 'bear-roses',
    image: 'box-amor',
    options: [],
    badge: 'Novo',
    featured: true,
  },
  {
    id: 'buque-urso-algodao',
    name: 'Buquê Ursinho Algodão',
    category: 'ursos',
    price: 169.9,
    short: 'Ursinho entre flores de algodão e folhagens.',
    description:
      'Buquê com ursinho de pelúcia, flores de algodão e folhagens delicadas, embrulhado em papel verde-sálvia e poá, com laço de cetim e cartão.',
    includes: ['Ursinho de pelúcia', 'Flores de algodão e folhagens', 'Papel sálvia e poá', 'Laço de cetim', 'Cartão com mensagem'],
    occasions: ['Aniversário', 'Amor', 'Melhoras', 'Só porque sim'],
    art: 'bear-roses',
    image: 'buque-urso-algodao',
    options: [],
    featured: true,
  },
  {
    id: 'bubble-buque-lilas',
    name: 'Bubble Buquê Lilás',
    category: 'flores',
    price: 219.9,
    short: 'Flores lilás e ursinho dentro do bubble.',
    description:
      'Bubble cristal recheado de flores em tons de lilás e branco, com um ursinho de crochê e a frase que você escolher. Finalizado com papel lilás e laço de cetim.',
    includes: ['Bubble cristal', 'Flores lilás e brancas', 'Ursinho de crochê', 'Frase em vinil', 'Papel e laço de cetim'],
    occasions: ['Aniversário', 'Formatura', 'Dia das Mães', 'Amor'],
    art: 'bubble',
    image: 'bubble-buque-lilas',
    options: [PHRASE],
    featured: true,
  },
  {
    id: 'bubble-buque-mosquitinho',
    name: 'Bubble Buquê Mosquitinho',
    category: 'flores',
    price: 199.9,
    short: 'Bubble com balões e mosquitinho colorido.',
    description:
      'Bubble cristal com mini balões e confete, sobre um buquê farto de mosquitinho. A frase vai escrita à mão no balão.',
    includes: ['Bubble cristal com confete', 'Mini balões internos', 'Buquê de mosquitinho', 'Frase no balão', 'Papel e fitas'],
    occasions: ['Aniversário', 'Amor', 'Só porque sim'],
    art: 'bubble',
    image: 'bubble-buque-mosquitinho',
    options: [PHRASE, GYPSO_COLOR],
  },
  {
    id: 'buque-urso-formatura',
    name: 'Buquê Formatura',
    category: 'ursos',
    price: 189.9,
    short: 'Ursinho de beca com rosas e margaridas.',
    description:
      'Ursinho formando, de beca e capelo, num buquê com rosas, tulipa e margaridas. O presente para comemorar o diploma.',
    includes: ['Ursinho de beca e capelo', 'Rosas, tulipa e margaridas', 'Papel e laço de cetim', 'Tag decorativa'],
    occasions: ['Formatura'],
    art: 'bear-roses',
    image: 'buque-urso-formatura',
    options: [ROSE_COLOR],
  },
  {
    id: 'bubble-box-formatura',
    name: 'Bubble Box Formatura',
    category: 'baloes',
    price: 179.9,
    short: 'Ursinho formando e flores dentro do bubble.',
    description:
      'Bubble cristal sobre caixinha, com ursinho de capelo, flores e o nome do formando. Escolha entre rosa e azul.',
    includes: ['Bubble cristal', 'Ursinho de capelo', 'Flores', 'Nome em vinil', 'Caixinha e fita'],
    occasions: ['Formatura'],
    art: 'bear-bubble',
    image: 'bubble-box-formatura',
    options: [GRAD_COLOR, GRAD_NAME],
  },
  {
    id: 'mini-buque-formatura',
    name: 'Mini Buquê Formatura',
    category: 'ursos',
    price: 69.9,
    short: 'Ursinho de capelo com flor de crochê.',
    description: 'Mini buquê com ursinho de capelo e diploma, flores de crochê e papel kraft. Lembrancinha perfeita para a turma.',
    includes: ['Ursinho de capelo e diploma', 'Flores de crochê', 'Papel e fita'],
    occasions: ['Formatura'],
    art: 'bear',
    image: 'mini-buque-formatura',
    options: [MINI_BEAR],
  },
]

export const getProduct = (id: string | undefined) => PRODUCTS.find((p) => p.id === id)

/* ---------- seleção / preço ---------- */

export type Selection = Record<string, string>

export function defaultSelection(p: Product): Selection {
  const sel: Selection = {}
  for (const o of p.options) {
    if (o.choices?.length) sel[o.id] = o.choices[0].id
    else sel[o.id] = ''
  }
  return sel
}

export function choiceOf(p: Product, optionId: string, sel: Selection) {
  const opt = p.options.find((o) => o.id === optionId)
  return opt?.choices?.find((c) => c.id === sel[optionId])
}

export function unitPrice(p: Product, sel: Selection, extras: string[]) {
  let total = p.price
  for (const o of p.options) total += o.choices?.find((c) => c.id === sel[o.id])?.price ?? 0
  for (const e of EXTRAS) if (extras.includes(e.id)) total += e.price
  return Math.round(total * 100) / 100
}

export function describeSelection(p: Product, sel: Selection, extras: string[]): string[] {
  const out: string[] = []
  for (const o of p.options) {
    const v = sel[o.id]
    if (!v) continue
    const label = o.choices?.find((c) => c.id === v)?.label ?? v
    out.push(o.type === 'number' ? `${label} anos` : label)
  }
  for (const e of EXTRAS) if (extras.includes(e.id)) out.push(e.label)
  return out
}

/** Linhas "Opção: valor" para o texto do pedido. */
export function labeledSelection(p: Product, sel: Selection, extras: string[]): string[] {
  const out: string[] = []
  for (const o of p.options) {
    const v = sel[o.id]?.trim()
    if (!v) continue
    const label = o.choices?.find((c) => c.id === v)?.label ?? v
    out.push(`${o.label}: ${o.type === 'number' ? `${label} anos` : label}`)
  }
  for (const e of EXTRAS) if (extras.includes(e.id)) out.push(`Adicional: ${e.label} (+ ${brl(e.price)})`)
  return out
}

export function missingRequired(p: Product, sel: Selection) {
  return p.options.filter((o) => o.required && !sel[o.id]?.trim())
}

/** Cores derivadas da seleção, para arte SVG e modelos 3D */
export function looksFor(p: Product, sel: Selection) {
  return {
    fur: choiceOf(p, 'pelucia', sel)?.hex ?? FUR.choices![0].hex!,
    ribbon: choiceOf(p, 'laco', sel)?.hex ?? RIBBON.choices![0].hex!,
    inner: choiceOf(p, 'baloes', sel)?.hex ?? INNER.choices![0].hex!,
    name: sel.nome ?? '',
    age: sel.idade ?? '',
  }
}
