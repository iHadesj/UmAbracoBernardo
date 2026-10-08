import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { AuthPanel } from '../components/AuthPanel'
import { CepCheckerView, useCepLookup } from '../components/CepChecker'
import { Icon } from '../components/Icon'
import { AnimatedPrice, bouncy, Page } from '../components/motion'
import { gap } from '../components/style'
import { Chips, Field, Sheet } from '../components/ui'
import { addDays, brl, firstName, isoDate, maskPhone, onlyDigits, prettyDate } from '../lib/format'
import { newOrderId, saveOrder, type Order } from '../lib/orders'
import {
  confirmPix,
  createPixCharge,
  detectBrand,
  MAX_INSTALLMENTS,
  maskCard,
  maskExpiry,
  payWithCard,
  PIX_DISCOUNT,
  validateCard,
  type CardInput,
  type PixCharge,
} from '../lib/payments'
import { cartSubtotal, useCart } from '../store/cart'
import { useCheckout, type Period } from '../store/checkout'
import { useUI } from '../store/ui'

const STEPS = ['Entrega', 'Você', 'Pagamento', 'Revisão']

const slide = {
  enter: (d: number) => ({ x: d * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d * -40, opacity: 0 }),
}

export default function Checkout() {
  const items = useCart((s) => s.items)
  const clearCart = useCart((s) => s.clear)
  const co = useCheckout()
  const { user } = useAuth()
  const toast = useUI((s) => s.toast)
  const navigate = useNavigate()

  const [[step, dir], setStep] = useState<[number, number]>([0, 1])
  const [card, setCard] = useState<CardInput>({ number: '', name: '', expiry: '', cvv: '', installments: 1 })
  const [cardTouched, setCardTouched] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const [pix, setPix] = useState<PixCharge | null>(null)
  const [done, setDone] = useState(false)

  const subtotal = cartSubtotal(items)
  const lookup = useCepLookup(subtotal)
  const quote = lookup.state.status === 'ok' ? lookup.state.quote : null
  const shipping = quote?.available ? quote.fee : 0
  const discount = co.method === 'pix' ? Math.round(subtotal * PIX_DISCOUNT * 100) / 100 : 0
  const total = Math.round((subtotal - discount + shipping) * 100) / 100

  const minDate = isoDate(addDays(new Date(), 1))
  const cardErrors = validateCard(card)

  // pré-preenche o destinatário com o nome do usuário
  useEffect(() => {
    if (user && !co.recipient) co.set({ recipient: user.name })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const valid = [
    !!quote?.available && !!lookup.state && !!co.number.trim() && !!co.recipient.trim() && !!co.date && co.date >= minDate,
    !!user && onlyDigits(co.phone).length >= 10,
    co.method === 'pix' || Object.keys(cardErrors).length === 0,
    true,
  ]

  if (!items.length && !done) return <Navigate to="/sacola" replace />

  const go = (to: number) => {
    if (to > step && !valid[step]) {
      if (step === 2) setCardTouched(true)
      toast(step === 1 && !user ? 'Entre na sua conta para continuar' : 'Confira os campos destacados', 'error')
      return
    }
    setStep([to, to > step ? 1 : -1])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const finalize = async (payment: Order['payment']) => {
    if (!user || !co.address) return
    const order: Order = {
      id: newOrderId(),
      createdAt: Date.now(),
      items,
      subtotal,
      shipping,
      discount,
      total,
      address: { ...co.address, number: co.number, complement: co.complement },
      recipient: co.recipient,
      date: co.date,
      period: co.period,
      note: co.note,
      customer: { uid: user.uid, name: user.name, email: user.email, phone: co.phone },
      payment,
    }
    try {
      await saveOrder(order, user.provider === 'demo')
    } catch {
      toast('Pedido salvo só neste aparelho (sem conexão com o servidor)', 'error')
    }
    setDone(true)
    clearCart()
    co.reset()
    navigate(`/pedido/${order.id}`, { replace: true })
  }

  const pay = async () => {
    if (co.method === 'pix') {
      setProcessing('Gerando seu Pix…')
      const charge = await createPixCharge(total)
      setProcessing(null)
      setPix(charge)
      return
    }
    setProcessing('Processando pagamento…')
    const res = await payWithCard(card, total)
    setProcessing(null)
    if (res.status === 'declined') {
      toast(res.message ?? 'Pagamento recusado', 'error')
      setStep([2, -1])
      return
    }
    await finalize({ method: 'card', status: 'approved', transactionId: res.transactionId, installments: card.installments, last4: onlyDigits(card.number).slice(-4) })
  }

  const confirmPixPayment = async () => {
    if (!pix) return
    setProcessing('Confirmando seu Pix…')
    const res = await confirmPix(pix)
    setPix(null)
    setProcessing(null)
    await finalize({ method: 'pix', status: 'approved', transactionId: res.transactionId })
  }

  return (
    <Page bar>
      <div className="container" style={{ paddingTop: 18 }}>
        <Link to="/sacola" className="back">
          <Icon name="back" size={18} /> Sacola
        </Link>
        <div className="checkout-grid">
          <div>
            <h1 className="h2" style={{ margin: '4px 0 14px' }}>
              Finalizar <em>compra</em>
            </h1>
            <div className="progress">
              <motion.div className="progress__bar" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }} />
            </div>
            <div className="progress-labels" style={{ '--n': STEPS.length } as CSSProperties}>
              {STEPS.map((s, i) => (
                <button key={s} className={i <= step ? 'on' : ''} onClick={() => i < step && go(i)} style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', fontWeight: i === step ? 500 : 400, color: 'inherit', cursor: i < step ? 'pointer' : 'default' }}>
                  {i + 1}. {s}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 22 }}>
              <AnimatePresence mode="wait" custom={dir} initial={false}>
                <motion.section key={step} custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}>
                  {step === 0 && <DeliveryStep lookup={lookup} minDate={minDate} />}
                  {step === 1 && <AccountStep />}
                  {step === 2 && <PaymentStep card={card} setCard={setCard} errors={cardTouched ? cardErrors : {}} total={subtotal + shipping} pixTotal={subtotal - subtotal * PIX_DISCOUNT + shipping} />}
                  {step === 3 && <ReviewStep total={total} shipping={shipping} discount={discount} subtotal={subtotal} cardLast4={onlyDigits(card.number).slice(-4)} installments={card.installments} onEdit={(i) => go(i)} />}
                </motion.section>
              </AnimatePresence>
            </div>
          </div>

          <aside className="desk-only">
            <div className="panel" style={{ position: 'sticky', top: 100 }}>
              <h2 className="h3" style={{ marginBottom: 10 }}>
                Resumo
              </h2>
              <Totals subtotal={subtotal} shipping={quote?.available ? shipping : null} discount={discount} total={total} />
            </div>
          </aside>
        </div>
      </div>

      <div className="actionbar">
        <div className="actionbar__inner">
          {step > 0 && (
            <motion.button className="btn btn--ghost" style={{ flex: 'none', padding: '0 16px' }} onClick={() => go(step - 1)} whileTap={{ scale: 0.95 }} aria-label="Voltar">
              <Icon name="back" size={18} />
            </motion.button>
          )}
          <div className="actionbar__total">
            <small>Total</small>
            <AnimatedPrice value={total} />
          </div>
          {step < 3 ? (
            <motion.button className="btn btn--primary" onClick={() => go(step + 1)} whileTap={{ scale: 0.96 }} animate={{ opacity: valid[step] ? 1 : 0.6 }}>
              Continuar <Icon name="arrow" size={18} />
            </motion.button>
          ) : (
            <motion.button className="btn btn--primary" onClick={pay} whileTap={{ scale: 0.96 }} disabled={!!processing}>
              <Icon name={co.method === 'pix' ? 'pix' : 'lock'} size={18} />
              Pagar {brl(total)}
            </motion.button>
          )}
        </div>
      </div>

      <PixSheet charge={pix} onClose={() => setPix(null)} onPaid={confirmPixPayment} />
      <AnimatePresence>{processing && <Processing text={processing} />}</AnimatePresence>
    </Page>
  )
}

/* ---------------- Etapas ---------------- */

function DeliveryStep({ lookup, minDate }: { lookup: ReturnType<typeof useCepLookup>; minDate: string }) {
  const co = useCheckout()
  const ok = lookup.state.status === 'ok' && lookup.state.quote.available
  const addr = co.address

  return (
    <div className="stack" style={gap(16)}>
      <CepCheckerView lookup={lookup} label="CEP de entrega" />
      <AnimatePresence initial={false}>
        {ok && addr && (
          <motion.div className="stack" style={{ ...gap(14), overflow: 'hidden' }} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            {!addr.logradouro && (
              <Field label="Rua">
                <input className="input" autoComplete="address-line1" value={addr.logradouro} onChange={(e) => co.set({ address: { ...addr, logradouro: e.target.value } })} />
              </Field>
            )}
            <div className="grid-fields" style={{ '--cols': 2 } as CSSProperties}>
              <Field label="Número">
                <input className="input" inputMode="numeric" autoComplete="address-line2" value={co.number} onChange={(e) => co.set({ number: e.target.value })} placeholder="123" />
              </Field>
              <Field label="Complemento" optional>
                <input className="input" value={co.complement} onChange={(e) => co.set({ complement: e.target.value })} placeholder="Apto, bloco…" />
              </Field>
            </div>
            <Field label="Quem vai receber?">
              <input className="input" autoComplete="name" value={co.recipient} onChange={(e) => co.set({ recipient: e.target.value })} placeholder="Nome do presenteado" />
            </Field>
            <Field label="Data da entrega" hint="Recomendamos 48h de antecedência para personalizados." error={co.date && co.date < minDate ? 'Escolha a partir de amanhã' : undefined}>
              <input className="input" type="date" min={minDate} value={co.date} onChange={(e) => co.set({ date: e.target.value })} />
            </Field>
            <div className="opt">
              <div className="opt__head">Período</div>
              <Chips<Period>
                id="period"
                label="Período"
                value={co.period}
                onChange={(v) => co.set({ period: v })}
                items={[
                  { value: 'manha', label: 'Manhã · 9h–12h' },
                  { value: 'tarde', label: 'Tarde · 13h–18h' },
                ]}
              />
            </div>
            <Field label="Bilhete para o cartão" optional hint={`${co.note.length}/160`}>
              <textarea className="input" rows={3} maxLength={160} value={co.note} onChange={(e) => co.set({ note: e.target.value })} placeholder="Escreva sua mensagem com carinho…" />
            </Field>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AccountStep() {
  const { user, signOut } = useAuth()
  const co = useCheckout()
  return (
    <AnimatePresence mode="wait">
      {user ? (
        <motion.div key="in" className="stack" style={gap(16)} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
          <div className="user-chip">
            <motion.span className="avatar" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={bouncy}>
              {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : firstName(user.name).charAt(0).toUpperCase()}
            </motion.span>
            <div className="stack spacer" style={{ ...gap(0), minWidth: 0 }}>
              <b style={{ color: 'var(--ink)' }}>Olá, {firstName(user.name)}!</b>
              <span className="small muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </span>
            </div>
            <button className="link small" onClick={signOut}>
              Trocar
            </button>
          </div>
          <Field label="WhatsApp para contato" hint="Avisamos por aqui quando o presente sair para entrega.">
            <input className="input" type="tel" inputMode="tel" autoComplete="tel-national" value={co.phone} onChange={(e) => co.set({ phone: maskPhone(e.target.value) })} placeholder="(11) 90000-0000" />
          </Field>
        </motion.div>
      ) : (
        <motion.div key="out" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <h2 className="h3" style={{ marginBottom: 8 }}>
            Quase lá! <em>Quem</em> está presenteando?
          </h2>
          <AuthPanel />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PaymentStep({
  card,
  setCard,
  errors,
  total,
  pixTotal,
}: {
  card: CardInput
  setCard: (c: CardInput) => void
  errors: ReturnType<typeof validateCard>
  total: number
  pixTotal: number
}) {
  const co = useCheckout()
  const [flipped, setFlipped] = useState(false)
  const methods = [
    { id: 'pix' as const, icon: 'pix' as const, title: 'Pix', desc: `${brl(pixTotal)} · aprovação na hora`, badge: '5% off' },
    { id: 'card' as const, icon: 'card' as const, title: 'Cartão de crédito', desc: `Até ${MAX_INSTALLMENTS}x de ${brl(total / MAX_INSTALLMENTS)} sem juros` },
  ]
  const brand = detectBrand(card.number)

  return (
    <div className="stack" style={gap(12)}>
      {methods.map((m) => {
        const on = co.method === m.id
        return (
          <motion.button key={m.id} className={`method ${on ? 'on' : ''}`} onClick={() => co.set({ method: m.id })} whileTap={{ scale: 0.98 }}>
            <span className="method__icon">
              <Icon name={m.icon} size={20} />
            </span>
            <span className="method__text">
              <b>
                {m.title} {m.badge && <span className="pill">{m.badge}</span>}
              </b>
              <span>{m.desc}</span>
            </span>
            <span className="radio">{on && <motion.i layoutId="pay-radio" transition={bouncy} />}</span>
          </motion.button>
        )
      })}

      <AnimatePresence initial={false}>
        {co.method === 'card' && (
          <motion.div className="stack" style={{ ...gap(14), overflow: 'hidden', paddingTop: 8 }} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="card3d">
              <motion.div className="card3d__inner" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ type: 'spring', stiffness: 120, damping: 16 }}>
                <div className="card3d__face">
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="card3d__chip" />
                    <AnimatePresence mode="wait">
                      <motion.span key={brand} className="card3d__brand" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {brand === 'desconhecida' ? '♡' : brand}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <span className="card3d__num">{(card.number || '•••• •••• •••• ••••').padEnd(19, '•')}</span>
                  <div className="card3d__row">
                    <span>
                      <small>Titular</small>
                      {card.name || 'Seu nome'}
                    </span>
                    <span>
                      <small>Validade</small>
                      {card.expiry || 'MM/AA'}
                    </span>
                  </div>
                </div>
                <div className="card3d__face card3d__face--back">
                  <div className="card3d__stripe" />
                  <div className="card3d__cvv">{card.cvv.replace(/./g, '•') || 'CVV'}</div>
                </div>
              </motion.div>
            </div>

            <Field label="Número do cartão" error={errors.number}>
              <input className="input" inputMode="numeric" autoComplete="cc-number" value={card.number} onChange={(e) => setCard({ ...card, number: maskCard(e.target.value) })} placeholder="0000 0000 0000 0000" aria-invalid={!!errors.number} />
            </Field>
            <Field label="Nome impresso" error={errors.name}>
              <input className="input" autoComplete="cc-name" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })} placeholder="COMO NO CARTÃO" aria-invalid={!!errors.name} />
            </Field>
            <div className="grid-fields">
              <Field label="Validade" error={errors.expiry}>
                <input className="input" inputMode="numeric" autoComplete="cc-exp" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: maskExpiry(e.target.value) })} placeholder="MM/AA" aria-invalid={!!errors.expiry} />
              </Field>
              <Field label="CVV" error={errors.cvv}>
                <input
                  className="input"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={card.cvv}
                  maxLength={4}
                  onFocus={() => setFlipped(true)}
                  onBlur={() => setFlipped(false)}
                  onChange={(e) => setCard({ ...card, cvv: onlyDigits(e.target.value) })}
                  placeholder="123"
                  aria-invalid={!!errors.cvv}
                />
              </Field>
            </div>
            <div className="opt">
              <div className="opt__head">Parcelas</div>
              <Chips
                id="inst"
                label="Parcelas"
                value={String(card.installments)}
                onChange={(v) => setCard({ ...card, installments: Number(v) })}
                items={Array.from({ length: MAX_INSTALLMENTS }, (_, i) => ({ value: String(i + 1), label: `${i + 1}x ${brl(total / (i + 1))}` }))}
              />
            </div>
            <div className="notice">
              <Icon name="info" size={16} />
              <span>
                Pagamento simulado. Use um número válido de teste, como <b>4111 1111 1111 1111</b>. Cartões terminados em 0002 são recusados.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ReviewStep({
  subtotal,
  shipping,
  discount,
  total,
  cardLast4,
  installments,
  onEdit,
}: {
  subtotal: number
  shipping: number
  discount: number
  total: number
  cardLast4: string
  installments: number
  onEdit: (step: number) => void
}) {
  const co = useCheckout()
  const items = useCart((s) => s.items)
  const { user } = useAuth()
  const a = co.address

  const Block = ({ title, step, children }: { title: string; step: number; children: ReactNode }) => (
    <div className="panel stack" style={{ ...gap(6), padding: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="eyebrow">{title}</span>
        <button className="link small" style={{ padding: 0 }} onClick={() => onEdit(step)}>
          Editar
        </button>
      </div>
      {children}
    </div>
  )

  return (
    <motion.div className="stack" style={gap(12)} initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }}>
      {[
        <div key="items" className="panel stack" style={{ ...gap(4), padding: 16 }}>
          <span className="eyebrow">Itens</span>
          {items.map((i) => (
            <div key={i.key} className="sum-row" style={{ padding: '6px 0' }}>
              <span>
                {i.qty}× {i.name}
              </span>
              <span>{brl(i.unitPrice * i.qty)}</span>
            </div>
          ))}
        </div>,
        <Block key="addr" title="Entrega" step={0}>
          <b style={{ color: 'var(--ink)' }}>{co.recipient}</b>
          <span className="small muted">
            {a?.logradouro}, {co.number}
            {co.complement ? ` — ${co.complement}` : ''} · {a?.bairro}, {a?.localidade}/{a?.uf}
          </span>
          <span className="small">
            <Icon name="calendar" size={14} className="inline-icon" /> {prettyDate(co.date)} · {co.period === 'manha' ? 'manhã' : 'tarde'}
          </span>
          {co.note && <span className="small muted">“{co.note}”</span>}
        </Block>,
        <Block key="you" title="Contato" step={1}>
          <span className="small">
            {user?.name} · {co.phone}
          </span>
        </Block>,
        <Block key="pay" title="Pagamento" step={2}>
          <span className="small">{co.method === 'pix' ? 'Pix com 5% de desconto' : `Cartão final ${cardLast4} · ${installments}x de ${brl(total / installments)}`}</span>
        </Block>,
        <div key="tot" className="panel" style={{ padding: 16 }}>
          <Totals subtotal={subtotal} shipping={shipping} discount={discount} total={total} />
        </div>,
      ].map((el) => (
        <motion.div key={el.key} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>
          {el}
        </motion.div>
      ))}
    </motion.div>
  )
}

function Totals({ subtotal, shipping, discount, total }: { subtotal: number; shipping: number | null; discount: number; total: number }) {
  return (
    <div>
      <div className="sum-row">
        <span>Subtotal</span>
        <span>{brl(subtotal)}</span>
      </div>
      <div className="sum-row">
        <span>Entrega</span>
        <span>{shipping === null ? '—' : shipping === 0 ? <b className="free">Grátis</b> : brl(shipping)}</span>
      </div>
      <AnimatePresence initial={false}>
        {discount > 0 && (
          <motion.div className="sum-row" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <span>Desconto Pix</span>
            <span className="free">− {brl(discount)}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="sum-row sum-row--total">
        <b>Total</b>
        <AnimatedPrice value={total} />
      </div>
    </div>
  )
}

/* ---------------- Pix ---------------- */

/** QR decorativo e determinístico (não é um BR Code pagável). */
function FakeQR({ seed }: { seed: string }) {
  const n = 29
  const cells = useMemo(() => {
    let h = 2166136261
    for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
    const rand = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296
    const out: [number, number][] = []
    const finder = (x: number, y: number) => [[0, 0], [n - 7, 0], [0, n - 7]].some(([fx, fy]) => x >= fx - 1 && x <= fx + 7 && y >= fy - 1 && y <= fy + 7)
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!finder(x, y) && !(x > 11 && x < 17 && y > 11 && y < 17) && rand() > 0.52) out.push([x, y])
    return out
  }, [seed])
  const Finder = ({ x, y }: { x: number; y: number }) => (
    <g>
      <rect x={x} y={y} width={7} height={7} fill="#2B1A12" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="#2B1A12" />
    </g>
  )
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className="qr" shapeRendering="crispEdges">
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#2B1A12" />
      ))}
      <Finder x={0} y={0} />
      <Finder x={n - 7} y={0} />
      <Finder x={0} y={n - 7} />
      <path transform="translate(14.5 14.6) scale(.2)" d="M0 6C-6 1-9-3-6-6.5-3.6-9.2 0-7.5 0-4.8 0-7.5 3.6-9.2 6-6.5 9-3 6 1 0 6Z" style={{ fill: 'var(--red)' }} shapeRendering="auto" />
    </svg>
  )
}

function Countdown({ until }: { until: number }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const s = Math.max(0, Math.round((until - now) / 1000))
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')}
    </span>
  )
}

function PixSheet({ charge, onClose, onPaid }: { charge: PixCharge | null; onClose: () => void; onPaid: () => void }) {
  const toast = useUI((s) => s.toast)
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    if (!charge) return
    try {
      await navigator.clipboard.writeText(charge.copyPaste)
      setCopied(true)
      toast('Código Pix copiado')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast('Não foi possível copiar', 'error')
    }
  }
  return (
    <Sheet
      open={!!charge}
      onClose={onClose}
      title="Pague com Pix"
      footer={
        <div style={{ padding: '12px 20px 18px', borderTop: '1px solid var(--ln)' }}>
          <motion.button className="btn btn--primary btn--block" onClick={onPaid} whileTap={{ scale: 0.97 }}>
            <Icon name="check" size={18} /> Já paguei
          </motion.button>
        </div>
      }
    >
      {charge && (
        <div className="stack" style={{ ...gap(16), alignItems: 'stretch', textAlign: 'center' }}>
          <motion.div initial={{ scale: 0.8, opacity: 0, rotate: -4 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={bouncy}>
            <FakeQR seed={charge.txid} />
          </motion.div>
          <div>
            <div className="price" style={{ fontSize: 26 }}>
              {brl(charge.amount)}
            </div>
            <span className="small muted">
              Expira em <Countdown until={charge.expiresAt} />
            </span>
          </div>
          <div className="copy-box">
            <span>{charge.copyPaste}</span>
            <motion.button className="btn btn--sm btn--soft" onClick={copy} whileTap={{ scale: 0.92 }}>
              <Icon name={copied ? 'check' : 'copy'} size={15} /> {copied ? 'Copiado' : 'Copiar'}
            </motion.button>
          </div>
          <div className="notice" style={{ textAlign: 'left' }}>
            <Icon name="info" size={16} />
            <span>QR Code de demonstração — não é um Pix real. Toque em “Já paguei” para simular a confirmação.</span>
          </div>
        </div>
      )}
    </Sheet>
  )
}

function Processing({ text }: { text: string }) {
  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="overlay__box">
        <motion.svg viewBox="0 0 24 24" className="pulse-heart" animate={{ scale: [1, 1.18, 1, 1.12, 1] }} transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}>
          <path fill="currentColor" d="M12 20s-7-4.3-8.9-8.6C1.7 8.2 3.6 4.6 7 4.6c1.9 0 3.3 1 4.1 2.4.8-1.4 2.3-2.4 4.1-2.4 3.4 0 5.3 3.6 3.9 6.8C19 15.7 12 20 12 20z" />
        </motion.svg>
        <AnimatePresence mode="wait">
          <motion.b key={text} style={{ color: 'var(--ink)', fontSize: 17 }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {text}
          </motion.b>
        </AnimatePresence>
        <span className="small muted">Não feche esta página</span>
      </div>
    </motion.div>
  )
}
