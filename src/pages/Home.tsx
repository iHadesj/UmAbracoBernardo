import { AnimatePresence, LayoutGroup, motion, useAnimate, useScroll, useTransform } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCepLookup } from '../components/CepChecker'
import { Icon } from '../components/Icon'
import { bouncy, Page, staggerChild, staggerParent } from '../components/motion'
import { ProductCard } from '../components/ProductCard'
import { ProductStage } from '../components/ProductStage'
import { ProductVisual } from '../components/ProductVisual'
import { defaultSelection, getProduct, MASCOT, PRODUCTS, type Occasion, type Product } from '../data/products'
import { finePointer } from '../lib/device'
import { brl } from '../lib/format'
import { WA_GENERAL } from '../lib/whatsapp'
import { useCheckout } from '../store/checkout'
import { useUI } from '../store/ui'
import '../styles/home.css'

const EASE = [0.2, 0.7, 0.2, 1] as const

/** Convites que aparecem conforme os abraços no urso */
const REWARDS = [
  { at: 3, title: 'Ele gostou de você ♡', text: 'Que tal mandar um abraço desses para alguém?' },
  { at: 10, title: '10 abraços!', text: 'O Bernardo já quer ir para casa com alguém especial.' },
  { at: 25, title: 'Abraço campeão ♡', text: 'Ninguém abraçou tanto hoje. Monte um presente do seu jeito.' },
]

/* ------------------------------------------------------------------ */
/* 1. Abertura: o urso e a frase girando em volta dele, nada mais      */
/* ------------------------------------------------------------------ */

const PHRASE = 'presentes montados à mão · para quem merece um '

/** a frase da marca contorna o urso, como um carimbo de ateliê que gira devagar */
function PhraseRing() {
  return (
    <svg className="ring" viewBox="0 0 500 500" aria-hidden="true">
      <defs>
        <path id="ring-path" d="M250 250m-214 0a214 214 0 1 1 428 0a214 214 0 1 1 -428 0" />
      </defs>
      <text className="ring__text">
        <textPath href="#ring-path" textLength="1340" lengthAdjust="spacing">
          {PHRASE}
          <tspan className="ring__em">abraço</tspan> de perto ·
        </textPath>
      </text>
    </svg>
  )
}

function Hero() {
  const bear = MASCOT
  const hugs = useUI((s) => s.hugs)
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bearY = useTransform(scrollYProgress, [0, 1], ['0%', '-8%'])
  const [ring, animateRing] = useAnimate()
  const first = useRef(true)
  const mouse = useMemo(finePointer, [])
  // o convite só aparece com abraços dados nesta visita (o contador é salvo no navegador)
  const hugsAtLoad = useRef(hugs)
  const [closedAt, setClosedAt] = useState(0)
  const reward = [...REWARDS].reverse().find((r) => hugs >= r.at && hugsAtLoad.current < r.at && r.at > closedAt)

  // cada abraço no urso "aperta" o anel
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    animateRing(ring.current, { scale: [1, 0.94, 1.02, 1] }, { duration: 0.6, ease: EASE })
  }, [hugs, animateRing, ring])

  return (
    <section className="hero4" ref={ref}>
      <h1 className="sr-only">Um abraço, Bernardo: presentes montados à mão, para quem merece um abraço de perto.</h1>
      <div className="hero4__stage">
        <motion.div ref={ring} className="hero4__ring" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 1, ease: EASE }}>
          <PhraseRing />
        </motion.div>

        <motion.div className="hero4__bear" style={{ y: bearY }} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35, duration: 0.9, ease: EASE }}>
          <ProductStage product={bear} selection={defaultSelection(bear)} hint="" />
        </motion.div>

        <AnimatePresence mode="wait">
          {hugs === 0 ? (
            <motion.div key="hint" className="hero4__touch" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ delay: 1.4 }}>
              {mouse ? 'clique nele' : 'toque nele'} ♡
            </motion.div>
          ) : (
            <motion.div key="count" className="hero4__touch" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <motion.span key={hugs} initial={{ scale: 1.4 }} animate={{ scale: 1 }} transition={bouncy}>
                {hugs}
              </motion.span>{' '}
              {hugs === 1 ? 'abraço' : 'abraços'} ♡
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {reward && (
            <motion.div
              key={reward.at}
              className="hug-reward"
              role="status"
              initial={{ opacity: 0, y: 24, scale: 0.9, rotate: -3 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: -1.5 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={bouncy}
            >
              <button className="hug-reward__close" onClick={() => setClosedAt(reward.at)} aria-label="Fechar">
                <Icon name="close" size={14} />
              </button>
              <b>{reward.title}</b>
              <span>{reward.text}</span>
              <Link to="/monte" className="btn btn--primary btn--sm">
                Monte um presente <Icon name="arrow" size={15} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div className="hero4__cta" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.6, ease: EASE }}>
        <motion.div whileTap={{ scale: 0.97 }}>
          <Link to="/presentes" className="btn btn--primary">
            Ver presentes <Icon name="arrow" size={17} />
          </Link>
        </motion.div>
        <span className="hero4__note">entrega no mesmo dia no Grajaú</span>
      </motion.div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 1b. Os mais pedidos, logo abaixo da abertura                        */
/* ------------------------------------------------------------------ */

function BestSellers() {
  const list = useMemo(() => [...PRODUCTS].sort((a, b) => Number(!!b.featured) - Number(!!a.featured)), [])
  return (
    <section className="container rail" aria-labelledby="mais-pedidos">
      <div className="rail__head">
        <motion.h2 id="mais-pedidos" className="sec-title" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          Os mais pedidos
        </motion.h2>
        <Link to="/presentes" className="link-arrow">
          Ver todos <Icon name="arrow" size={15} />
        </Link>
      </div>
      {/* layoutId próprio: os cards daqui não se confundem com as sugestões mais abaixo */}
      <LayoutGroup id="mais-pedidos">
        <motion.div className="carousel rail__track" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={staggerParent}>
          {list.map((p) => (
            <motion.div key={p.id} variants={staggerChild}>
              <ProductCard product={p} />
            </motion.div>
          ))}
        </motion.div>
      </LayoutGroup>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 2. Frase para completar → sugestões                                 */
/* ------------------------------------------------------------------ */

const RECIPIENTS = [
  { id: 'especial', label: 'alguém especial', boost: ['bubble-urso-aniversario', 'buque-urso-algodao', 'box-amor'] },
  { id: 'mae', label: 'minha mãe', boost: ['bubble-buque-lilas', 'box-amor', 'bubble-buque-mosquitinho'] },
  { id: 'amor', label: 'meu amor', boost: ['box-amor', 'bubble-urso-aniversario', 'buque-urso-algodao'] },
  { id: 'amiga', label: 'uma amiga', boost: ['bubble-buque-mosquitinho', 'buque-urso-algodao', 'bubble-urso-aniversario'] },
  { id: 'formando', label: 'quem se formou', boost: ['buque-urso-formatura', 'bubble-box-formatura', 'mini-buque-formatura'] },
  { id: 'bebe', label: 'um bebê que chegou', boost: ['bubble-urso-aniversario', 'buque-urso-algodao', 'mini-buque-formatura'] },
]

const REASONS: { label: string; occasion: Occasion }[] = [
  { label: 'só porque sim', occasion: 'Só porque sim' },
  { label: 'um aniversário', occasion: 'Aniversário' },
  { label: 'o Dia das Mães', occasion: 'Dia das Mães' },
  { label: 'dizer que ama', occasion: 'Amor' },
  { label: 'a formatura', occasion: 'Formatura' },
  { label: 'dar as boas-vindas', occasion: 'Nascimento' },
  { label: 'desejar melhoras', occasion: 'Melhoras' },
]

function suggest(recipient: (typeof RECIPIENTS)[number], occasion: Occasion): Product[] {
  const score = (p: Product) => {
    const b = recipient.boost.indexOf(p.id)
    return (p.occasions.includes(occasion) ? 2 : 0) + (b >= 0 ? 1.6 - b * 0.3 : 0) + (p.featured ? 0.3 : 0)
  }
  return [...PRODUCTS].sort((a, b) => score(b) - score(a)).slice(0, 3)
}

function InlinePick({ value, options, onChange, label }: { value: number; options: string[]; onChange: (i: number) => void; label: string }) {
  return (
    <span className="pick-inline">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={value} initial={{ y: '40%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-40%', opacity: 0 }} transition={{ duration: 0.22 }} style={{ display: 'inline-block' }}>
          {options[value]}
        </motion.span>
      </AnimatePresence>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        <path d="M6 9l6 6 6-6" />
      </svg>
      <select aria-label={label} value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((o, i) => (
          <option key={o} value={i}>
            {o}
          </option>
        ))}
      </select>
    </span>
  )
}

function PriceTag({ price, delay = 0 }: { price: number; delay?: number }) {
  return (
    <motion.span
      className="price-tag"
      initial={{ rotate: 24, opacity: 0 }}
      whileInView={{ rotate: [24, -8, 5, -2, 0], opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.4, delay, ease: 'easeOut' }}
    >
      {brl(price).replace(',00', '')}
    </motion.span>
  )
}

function Pick({ p, big, i }: { p: Product; big: boolean; i: number }) {
  return (
    <motion.article
      layout
      className={`pick ${big ? 'pick--big' : ''}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.45, delay: i * 0.06, ease: EASE }}
    >
      <Link to={`/produto/${p.id}`} className="pick__link">
        <motion.div className="pick__frame" layoutId={`art-${p.id}`} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
          <ProductVisual product={p} sizes={big ? '(min-width: 900px) 50vw, 100vw' : '(min-width: 900px) 25vw, 50vw'} />
        </motion.div>
        <PriceTag price={p.price} delay={0.2 + i * 0.1} />
        <h3 className="pick__name">{p.name}</h3>
        <p className="pick__desc">{p.short}</p>
      </Link>
    </motion.article>
  )
}

function GiftSentence() {
  const [r, setR] = useState(0)
  const [o, setO] = useState(0)
  const picks = useMemo(() => suggest(RECIPIENTS[r], REASONS[o].occasion), [r, o])

  return (
    <section className="container gift">
      <motion.p className="sentence" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, ease: EASE }}>
        Quero mandar um abraço para <InlinePick label="Para quem" value={r} onChange={setR} options={RECIPIENTS.map((x) => x.label)} /> por{' '}
        <InlinePick label="Motivo" value={o} onChange={setO} options={REASONS.map((x) => x.label)} />.
      </motion.p>

      <div className="picks">
        <AnimatePresence mode="popLayout" initial={false}>
          {picks.map((p, i) => (
            <Pick key={p.id} p={p} big={i === 0} i={i} />
          ))}
        </AnimatePresence>
      </div>

      <p className="browse">
        Ou procure entre <Link to="/presentes?cat=ursos">ursos</Link>, <Link to="/presentes?cat=baloes">balões</Link>, <Link to="/presentes?cat=flores">flores</Link> e{' '}
        <Link to="/presentes?cat=kits">kits</Link>.
      </p>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 3. O bilhete                                                        */
/* ------------------------------------------------------------------ */

function NoteCard() {
  const saved = useCheckout((s) => s.note)
  const set = useCheckout((s) => s.set)
  const toast = useUI((s) => s.toast)
  const [draft, setDraft] = useState(saved)
  const [card, animateCard] = useAnimate()

  const save = () => {
    set({ note: draft.trim() })
    animateCard(card.current, { rotateX: [0, 58, 0], y: [0, -10, 0] }, { duration: 0.7, ease: EASE })
    toast(draft.trim() ? 'Bilhete guardado, vai junto no pedido' : 'Bilhete apagado')
  }

  return (
    <section className="container note">
      <div className="note__copy">
        <motion.h2 className="sec-title" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          O bilhete vai junto.
        </motion.h2>
        <p className="lead">Escreva agora. A gente passa à mão para um cartão de papel kraft, do jeitinho que está aqui.</p>
      </div>

      <motion.div
        className="note__stage"
        initial={{ opacity: 0, rotate: 6, y: 40 }}
        whileInView={{ opacity: 1, rotate: -2.5, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
      >
        <div ref={card} className="note__card">
          <span className="note__hole" aria-hidden="true" />
          <span className="note__to">para você,</span>
          <textarea
            value={draft}
            maxLength={160}
            rows={4}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="que merece um abraço apertado hoje e em todos os outros dias…"
            aria-label="Mensagem do bilhete"
          />
          <span className="note__from">com carinho ♡</span>
        </div>
      </motion.div>

      <div className="note__actions">
        <span className="small muted">{draft.length}/160</span>
        <motion.button className="btn btn--ghost btn--sm" onClick={save} whileTap={{ scale: 0.95 }} disabled={draft.trim() === saved.trim()}>
          {draft.trim() === saved.trim() && saved ? 'Guardado ♡' : 'Guardar para o pedido'}
        </motion.button>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 4. Entrega em uma frase                                             */
/* ------------------------------------------------------------------ */

function Delivery() {
  const { cep, setCep, state } = useCepLookup(0)
  return (
    <section className="container deliver">
      <motion.p className="sentence sentence--sm" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        No Grajaú, o abraço chega <em>no mesmo dia</em> para pedidos até as 14h.
      </motion.p>
      <label className="deliver__ask">
        <span>E no seu CEP?</span>
        <input className="inline-input" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={cep} onChange={(e) => setCep(e.target.value)} />
        {state.status === 'loading' && <span className="spin" />}
      </label>
      <AnimatePresence mode="wait">
        {state.status === 'ok' && (
          <motion.p key={state.address.cep} className="deliver__result" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {state.quote.available ? (
              <>
                <b>{state.address.bairro || state.address.localidade}</b>: {state.quote.eta.charAt(0).toLowerCase() + state.quote.eta.slice(1)}, frete de {brl(state.quote.fee)}.
              </>
            ) : (
              state.quote.note
            )}
          </motion.p>
        )}
        {state.status === 'error' && (
          <motion.p key="err" className="deliver__result" style={{ color: 'var(--red)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {state.message}
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 5. Mural de polaroids                                               */
/* ------------------------------------------------------------------ */

const SHOTS: { id: string; caption: string; rot: number }[] = [
  { id: 'box-amor', caption: 'box pro dia dos namorados', rot: -4 },
  { id: 'bubble-urso-aniversario', caption: 'um bubble de aniversário', rot: 3 },
  { id: 'buque-urso-formatura', caption: 'diploma na mão', rot: -2 },
  { id: 'bubble-buque-lilas', caption: 'tudo em lilás', rot: 5 },
  { id: 'buque-urso-algodao', caption: 'algodão e folhagens', rot: -3 },
]

function Mural() {
  return (
    <section className="mural">
      <div className="container mural__head">
        <motion.h2 className="sec-title" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          Saindo do ateliê
        </motion.h2>
        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="link-arrow">
          Instagram <Icon name="arrow" size={15} />
        </a>
      </div>
      <div className="mural__track">
        {SHOTS.map((s, i) => (
          <motion.figure
            key={s.caption}
            className="polaroid"
            style={{ zIndex: i }}
            initial={{ opacity: 0, y: -40, rotate: s.rot * 3 }}
            whileInView={{ opacity: 1, y: 0, rotate: s.rot }}
            whileHover={{ rotate: 0, y: -10, zIndex: 20, scale: 1.04 }}
            whileTap={{ rotate: 0, scale: 1.04, zIndex: 20 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ type: 'spring', stiffness: 160, damping: 16, delay: i * 0.08 }}
          >
            <Link to={`/produto/${s.id}`} className="polaroid__img" draggable={false}>
              <ProductVisual product={getProduct(s.id)!} sizes="240px" />
            </Link>
            <figcaption>{s.caption}</figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 6. Despedida                                                        */
/* ------------------------------------------------------------------ */

function SignOff() {
  return (
    <footer className="signoff">
      <motion.p className="signoff__big" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE }}>
        com carinho,
      </motion.p>
      <motion.p className="signoff__name" initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.25, ease: EASE }}>
        Bernardo{' '}
        <motion.span style={{ display: 'inline-block' }} animate={{ scale: [1, 1.18, 1, 1.1, 1] }} transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.2 }}>
          ♡
        </motion.span>
      </motion.p>
      <nav className="signoff__links" aria-label="Rodapé">
        <Link to="/presentes">Presentes</Link>
        <Link to="/monte">Monte o seu</Link>
        <Link to="/orcamento">Orçamento</Link>
        <Link to="/sobre">Sobre & entrega</Link>
        <a href={WA_GENERAL} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
      </nav>
      <small>Jardim Prainha · Grajaú, São Paulo · © {new Date().getFullYear()} Um abraço, Bernardo</small>
    </footer>
  )
}

export default function Home() {
  return (
    <Page className="home">
      <Hero />
      <BestSellers />
      <GiftSentence />
      <NoteCard />
      <Delivery />
      <Mural />
      <SignOff />
    </Page>
  )
}
