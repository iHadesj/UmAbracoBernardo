import { AnimatePresence, motion } from 'framer-motion'
import { useState, type CSSProperties, type Dispatch, type MouseEvent, type SetStateAction } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { AnimatedPrice, bouncy, Page } from '../components/motion'
import { ExtrasList, ProductOptions } from '../components/Options'
import { ProductArt } from '../components/ProductArt'
import { ProductStage } from '../components/ProductStage'
import { gap } from '../components/style'
import { defaultSelection, describeSelection, looksFor, missingRequired, OCCASIONS, PRODUCTS, unitPrice, type Occasion, type Selection } from '../data/products'
import { brl } from '../lib/format'
import { useCart } from '../store/cart'
import { useUI } from '../store/ui'

const STEPS = ['Presente', 'Ocasião', 'Personalize', 'Finalize']
const OCC_EMOJI: Record<Occasion, string> = { Aniversário: '🎂', Amor: '❤️', 'Dia das Mães': '💐', Nascimento: '🍼', Melhoras: '🌼', 'Só porque sim': '✨' }

const variants = {
  enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
}

export default function Builder() {
  const navigate = useNavigate()
  const add = useCart((s) => s.add)
  const toast = useUI((s) => s.toast)
  const fly = useUI((s) => s.fly)
  const [[step, dir], setStep] = useState<[number, number]>([0, 1])
  const [productId, setProductId] = useState(PRODUCTS[0].id)
  const [occasion, setOccasion] = useState<Occasion>('Aniversário')
  const [selections, setSelections] = useState<Record<string, Selection>>({})
  const [extras, setExtras] = useState<string[]>([])

  const product = PRODUCTS.find((p) => p.id === productId)!
  const sel = selections[productId] ?? defaultSelection(product)
  const setSel: Dispatch<SetStateAction<Selection>> = (u) =>
    setSelections((all) => {
      const cur = all[productId] ?? defaultSelection(product)
      return { ...all, [productId]: typeof u === 'function' ? u(cur) : u }
    })
  const price = unitPrice(product, sel, extras)

  const go = (to: number) => {
    if (to > step && step === 2) {
      const missing = missingRequired(product, sel)
      if (missing.length) return toast(`Preencha: ${missing.map((m) => m.label.toLowerCase()).join(', ')}`, 'error')
    }
    setStep([to, to > step ? 1 : -1])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const finish = (e: MouseEvent<HTMLButtonElement>) => {
    add({ productId, name: product.name, unitPrice: price, selection: sel, extras, summary: [occasion, ...describeSelection(product, sel, extras)] })
    fly(e.currentTarget)
    toast('Presente montado e na sacola ♡')
    setTimeout(() => navigate('/sacola'), 650)
  }

  return (
    <Page bar>
      <div className="container narrow" style={{ paddingTop: 22 }}>
        <span className="kicker">do seu jeitinho</span>
        <h1 className="h2" style={{ margin: '4px 0 16px' }}>
          Monte seu <em>presente</em>
        </h1>
        <div className="progress" aria-hidden="true">
          <motion.div className="progress__bar" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }} />
        </div>
        <div className="progress-labels" style={{ '--n': STEPS.length } as CSSProperties}>
          {STEPS.map((s, i) => (
            <span key={s} className={i <= step ? 'on' : ''} style={{ fontWeight: i === step ? 500 : 400 }}>
              {i + 1}. {s}
            </span>
          ))}
        </div>

        <div style={{ position: 'relative', marginTop: 22 }}>
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.section key={step} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}>
              {step === 0 && (
                <div className="stack" style={gap(10)}>
                  <h2 className="h3">
                    Qual é o <em>presente</em>?
                  </h2>
                  {PRODUCTS.map((p) => {
                    const on = p.id === productId
                    return (
                      <motion.button key={p.id} className={`method ${on ? 'on' : ''}`} onClick={() => setProductId(p.id)} whileTap={{ scale: 0.98 }} layout>
                        <span className="arch" style={{ width: 56, height: 64, flex: 'none', borderRadius: '28px 28px 10px 10px' }}>
                          <ProductArt kind={p.art} look={looksFor(p, selections[p.id] ?? defaultSelection(p))} className="art" />
                        </span>
                        <span className="method__text">
                          <b>{p.name}</b>
                          <span>
                            {p.short} · {brl(p.price)}
                          </span>
                        </span>
                        <span className="radio">{on && <motion.i layoutId="builder-radio" transition={bouncy} />}</span>
                      </motion.button>
                    )
                  })}
                </div>
              )}

              {step === 1 && (
                <div className="stack" style={gap(14)}>
                  <h2 className="h3">
                    Para qual <em>ocasião</em>?
                  </h2>
                  <div className="grid-fields">
                    {OCCASIONS.map((o) => {
                      const on = o === occasion
                      return (
                        <motion.button
                          key={o}
                          className={`method ${on ? 'on' : ''}`}
                          style={{ justifyContent: 'center', flexDirection: 'column', gap: 4, padding: '16px 8px' }}
                          onClick={() => setOccasion(o)}
                          whileTap={{ scale: 0.95 }}
                          animate={{ scale: on ? 1.02 : 1 }}
                        >
                          <span style={{ fontSize: 26 }}>{OCC_EMOJI[o]}</span>
                          <b style={{ color: 'var(--ink)' }}>{o}</b>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="stack" style={gap(18)}>
                  <div className="arch arch--product" style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
                    <ProductStage product={product} selection={sel} hint="Prévia ao vivo · arraste para girar" />
                  </div>
                  <ProductOptions product={product} value={sel} onChange={setSel} />
                </div>
              )}

              {step === 3 && (
                <div className="stack" style={gap(16)}>
                  <div className="panel row" style={gap(14)}>
                    <span className="arch" style={{ width: 74, height: 86, flex: 'none', borderRadius: '37px 37px 12px 12px' }}>
                      <ProductArt kind={product.art} look={looksFor(product, sel)} className="art" />
                    </span>
                    <div className="stack" style={gap(4)}>
                      <span className="eyebrow">{occasion}</span>
                      <b className="pcard__name" style={{ fontSize: 19 }}>
                        {product.name}
                      </b>
                      <span className="small muted">{describeSelection(product, sel, []).join(' · ')}</span>
                    </div>
                  </div>
                  <h2 className="h3">
                    Quer <em>complementar</em>?
                  </h2>
                  <ExtrasList value={extras} onChange={setExtras} />
                  <p className="small muted">Data e endereço de entrega você escolhe no checkout.</p>
                </div>
              )}
            </motion.section>
          </AnimatePresence>
        </div>
      </div>

      <div className="actionbar">
        <div className="actionbar__inner">
          <motion.button className="btn btn--ghost" style={{ flex: 'none' }} onClick={() => go(step - 1)} disabled={step === 0} whileTap={{ scale: 0.95 }} aria-label="Voltar">
            <Icon name="back" size={18} />
          </motion.button>
          <div className="actionbar__total">
            <small>Estimativa</small>
            <AnimatedPrice value={price} />
          </div>
          {step < STEPS.length - 1 ? (
            <motion.button className="btn btn--primary" onClick={() => go(step + 1)} whileTap={{ scale: 0.96 }}>
              Continuar <Icon name="arrow" size={18} />
            </motion.button>
          ) : (
            <motion.button className="btn btn--primary" onClick={finish} whileTap={{ scale: 0.96 }}>
              <Icon name="bag" size={18} /> Pôr na sacola
            </motion.button>
          )}
        </div>
      </div>
    </Page>
  )
}
