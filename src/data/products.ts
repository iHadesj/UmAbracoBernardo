export type Category = 'ursos' | 'baloes' | 'flores' | 'kits'

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
  art: ArtKind
  model?: ModelKind
  options: ProductOption[]
  badge?: string
  featured?: boolean
}

export const OCCASIONS = ['Aniversário', 'Amor', 'Dia das Mães', 'Nascimento', 'Melhoras', 'Só porque sim'] as const
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

const SIZE: ProductOption = {
  id: 'tamanho',
  label: 'Tamanho',
  type: 'chips',
  choices: [
    { id: 'p', label: '25 cm' },
    { id: 'm', label: '40 cm', price: 40 },
    { id: 'g', label: '60 cm', price: 110 },
  ],
}

const ROSES: ProductOption = {
  id: 'rosas',
  label: 'Rosas',
  type: 'chips',
  choices: [
    { id: '3', label: '3 rosas' },
    { id: '6', label: '6 rosas', price: 35 },
    { id: '12', label: '12 rosas', price: 85 },
  ],
}

const NAME: ProductOption = {
  id: 'nome',
  label: 'Nome no balão',
  type: 'text',
  placeholder: 'Ex.: Helena',
  maxLength: 12,
  required: true,
}

const AGE: ProductOption = {
  id: 'idade',
  label: 'Idade',
  type: 'number',
  placeholder: 'Ex.: 30',
  maxLength: 3,
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

/* ---------- catálogo ---------- */

export const PRODUCTS: Product[] = [
  {
    id: 'urso-bernardo',
    name: 'Ursinho Bernardo',
    category: 'ursos',
    price: 89.9,
    short: 'Pelúcia macia com laço de cetim.',
    description:
      'O nosso ursinho de pelúcia marrom, macio de verdade, com focinho claro e laço de cetim. Um abraço que fica.',
    includes: ['Urso de pelúcia antialérgico', 'Laço de cetim na cor escolhida', 'Papel kraft e fita', 'Tag com mensagem'],
    occasions: ['Aniversário', 'Amor', 'Nascimento', 'Melhoras', 'Só porque sim'],
    art: 'bear',
    model: 'bear',
    options: [FUR, RIBBON, SIZE],
    badge: 'Mais amado',
    featured: true,
  },
  {
    id: 'urso-buque',
    name: 'Urso + buquê de rosas',
    category: 'ursos',
    price: 169.9,
    short: 'O ursinho abraçando rosas vermelhas.',
    description:
      'Nosso urso segurando um buquê de rosas vermelhas com mosquitinho, embrulhado em papel kraft e laço. O presente da logo, em forma de abraço.',
    includes: ['Urso de pelúcia 25 cm', 'Buquê de rosas com mosquitinho', 'Papel kraft e laço', 'Cartão com mensagem'],
    occasions: ['Amor', 'Dia das Mães', 'Aniversário'],
    art: 'bear-roses',
    model: 'bear',
    options: [FUR, RIBBON, ROSES],
    featured: true,
  },
  {
    id: 'bubble-personalizado',
    name: 'Bubble personalizado',
    category: 'baloes',
    price: 49.9,
    short: 'Balão transparente com nome e mini balões.',
    description:
      'Bubble balloon cristal com o nome escolhido e balões internos na cor que você preferir. Delicado, alegre e pronto para presentear.',
    includes: ['Bubble cristal 18"', 'Nome em vinil', 'Mini balões internos', 'Fita e peso decorado'],
    occasions: ['Aniversário', 'Amor', 'Nascimento', 'Só porque sim'],
    art: 'bubble',
    model: 'bubble',
    options: [NAME, INNER],
    featured: true,
  },
  {
    id: 'bubble-idade',
    name: 'Bubble + idade',
    category: 'baloes',
    price: 54.9,
    short: 'Nome e idade em destaque.',
    description: 'O bubble personalizado com nome e idade em destaque. Perfeito para aniversários de qualquer idade.',
    includes: ['Bubble cristal 18"', 'Nome e idade em vinil', 'Mini balões internos', 'Fita e peso decorado'],
    occasions: ['Aniversário'],
    art: 'bubble-age',
    model: 'bubble',
    options: [NAME, AGE, INNER],
  },
  {
    id: 'urso-bubble',
    name: 'Ursinho no bubble',
    category: 'kits',
    price: 149.9,
    short: 'Ursinho dentro do balão cristal.',
    description: 'Um ursinho de pelúcia dentro de um bubble cristal com nome. Surpresa que encanta logo na porta.',
    includes: ['Urso de pelúcia 20 cm', 'Bubble cristal 24"', 'Nome em vinil', 'Base e fitas'],
    occasions: ['Nascimento', 'Aniversário', 'Amor'],
    art: 'bear-bubble',
    model: 'bear',
    options: [FUR, RIBBON, NAME],
    badge: 'Novo',
    featured: true,
  },
  {
    id: 'buque-baloes',
    name: 'Buquê de balões',
    category: 'baloes',
    price: 79.9,
    short: 'Cinco balões amarrados com laço.',
    description: 'Buquê com cinco balões de látex premium, fitas e laço. Cores combinadas do seu jeito.',
    includes: ['5 balões de látex premium', 'Fitas de cetim', 'Laço e peso decorado'],
    occasions: ['Aniversário', 'Melhoras', 'Só porque sim'],
    art: 'balloon-bouquet',
    options: [INNER],
  },
  {
    id: 'arranjo-mesa',
    name: 'Arranjo de mesa',
    category: 'baloes',
    price: 119.9,
    short: 'Balões montados sobre base.',
    description: 'Arranjo de balões montado à mão sobre base decorada. Ideal para mesa de bolo ou recepção.',
    includes: ['Base decorada', '12 balões em tamanhos variados', 'Nome em vinil (opcional)'],
    occasions: ['Aniversário', 'Nascimento', 'Dia das Mães'],
    art: 'table',
    options: [INNER, { ...NAME, required: false, label: 'Nome (opcional)' }],
  },
  {
    id: 'buque-rosas',
    name: 'Buquê de rosas',
    category: 'flores',
    price: 119.9,
    short: 'Rosas vermelhas com mosquitinho.',
    description: 'Rosas vermelhas frescas com mosquitinho e folhagem, embrulhadas em papel kraft e laço de cetim.',
    includes: ['Rosas vermelhas', 'Mosquitinho e folhagens', 'Papel kraft e laço', 'Cartão com mensagem'],
    occasions: ['Amor', 'Dia das Mães', 'Melhoras'],
    art: 'roses',
    options: [ROSES, RIBBON],
  },
  {
    id: 'cesta-abraco',
    name: 'Cesta Abraço',
    category: 'kits',
    price: 219.9,
    short: 'Urso, rosas e bombons na cesta.',
    description: 'Cesta artesanal com ursinho, mini buquê de rosas, bombons e cartão. O kit completo para um abraço caprichado.',
    includes: ['Cesta artesanal', 'Urso de pelúcia 25 cm', 'Mini buquê de rosas', 'Bombons sortidos', 'Cartão'],
    occasions: ['Dia das Mães', 'Amor', 'Aniversário'],
    art: 'basket',
    model: 'bear',
    options: [FUR, RIBBON],
    featured: true,
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
