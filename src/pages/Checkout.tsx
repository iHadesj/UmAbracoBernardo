import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { AuthPanel } from '../components/AuthPanel'
import { CepCheckerView, useCepLookup } from '../components/CepChecker'
import { Icon } from '../components/Icon'
import { AnimatedPrice, bouncy, Page } from '../components/motion'
import { gap } from '../components/style'
import { Accordion, Chips, Field } from '../components/ui'
import { addDays, brl, firstName, isoDate, maskPhone, onlyDigits, prettyDate } from '../lib/format'
import { orderMessage } from '../lib/orderMessage'
import { GUEST_UID, newOrderId, saveOrder, type Order } from '../lib/orders'
import { waLink } from '../lib/whatsapp'
import { cartSubtotal, useCart } from '../store/cart'
import { PERIOD_LABEL, useCheckout, type Period } from '../store/checkout'
import { useUI } from '../store/ui'

const STEPS = ['Entrega', 'Você', 'Revisão']

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
  const [done, setDone] = useState(false)

  const subtotal = cartSubtotal(items)
  const lookup = useCepLookup(subtotal)
  const quote = lookup.state.status === 'ok' ? lookup.state.quote : null
  const shipping = quote?.available ? quote.fee : 0
  const total = Math.round((subtotal + shipping) * 100) / 100

  const minDate = isoDate(addDays(new Date(), 1))

  // pré-preenche com os dados da conta, se houver
  useEffect(() => {
    if (!user) return
    co.set({ name: co.name || user.name, recipient: co.recipient || user.name })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const valid = [
    !!quote?.available && !!co.address && !!co.number.trim() && !!co.recipient.trim() && !!co.date && co.date >= minDate,
    !!co.name.trim() && onlyDigits(co.phone).length >= 10,
    true,
  ]

  if (!items.length && !done) return <Navigate to="/sacola" replace />

  const go = (to: number) => {
    if (to > step && !valid[step]) {
      toast('Confira os campos destacados', 'error')
      return
    }
    setStep([to, to > step ? 1 : -1])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const send = () => {
    if (!co.address || !valid[0] || !valid[1]) return
    const order: Order = {
      id: newOrderId(),
      createdAt: Date.now(),
      items,
      subtotal,
      shipping,
      total,
      address: { ...co.address, number: co.number.trim(), complement: co.complement.trim() },
      recipient: co.recipient.trim(),
      date: co.date,
      period: co.period,
      note: co.note.trim(),
      obs: co.obs.trim(),
      customer: { uid: user?.uid ?? GUEST_UID, name: co.name.trim(), email: user?.email ?? null, phone: co.phone },
      channel: 'whatsapp',
    }
    const url = waLink(orderMessage(order))

    // abre o WhatsApp ainda dentro do clique, para o navegador não bloquear
    const win = window.open(url, '_blank')
    if (win) win.opener = null

    // a cópia local é gravada na hora; o Firestore (só com conta) segue em segundo plano
    saveOrder(order, !user || user.provider === 'demo').catch(() => toast('Pedido salvo só neste aparelho (sem conexão com o servidor)', 'error'))
    setDone(true)
    clearCart()
    co.reset()
    if (win) navigate(`/pedido/${order.id}`, { replace: true })
    else window.location.assign(url) // pop-up bloqueado: vai direto para o WhatsApp
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
              Finalizar <em>pedido</em>
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
                  {step === 1 && <ContactStep />}
                  {step === 2 && <ReviewStep total={total} shipping={shipping} subtotal={subtotal} onEdit={(i) => go(i)} />}
                </motion.section>
              </AnimatePresence>
            </div>
          </div>

          <aside className="desk-only">
            <div className="panel" style={{ position: 'sticky', top: 100 }}>
              <h2 className="h3" style={{ marginBottom: 10 }}>
                Resumo
              </h2>
              <Totals subtotal={subtotal} shipping={quote?.available ? shipping : null} total={total} />
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
          {step < STEPS.length - 1 ? (
            <motion.button className="btn btn--primary" onClick={() => go(step + 1)} whileTap={{ scale: 0.96 }} animate={{ opacity: valid[step] ? 1 : 0.6 }}>
              Continuar <Icon name="arrow" size={18} />
            </motion.button>
          ) : (
            <motion.button className="btn btn--primary" onClick={send} whileTap={{ scale: 0.96 }}>
              <Icon name="whatsapp" size={18} /> Enviar pelo WhatsApp
            </motion.button>
          )}
        </div>
      </div>
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
                items={(Object.keys(PERIOD_LABEL) as Period[]).map((p) => ({ value: p, label: PERIOD_LABEL[p] }))}
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

function ContactStep() {
  const { user, signOut } = useAuth()
  const co = useCheckout()
  const [login, setLogin] = useState(false)

  return (
    <div className="stack" style={gap(16)}>
      <h2 className="h3">
        <em>Quem</em> está presenteando?
      </h2>
      {user && (
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
            Sair
          </button>
        </div>
      )}
      <Field label="Seu nome">
        <input className="input" autoComplete="name" value={co.name} onChange={(e) => co.set({ name: e.target.value })} placeholder="Como podemos te chamar?" />
      </Field>
      <Field label="Seu WhatsApp" hint="Para confirmarmos o pedido e avisarmos quando sair para entrega.">
        <input className="input" type="tel" inputMode="tel" autoComplete="tel-national" value={co.phone} onChange={(e) => co.set({ phone: maskPhone(e.target.value) })} placeholder="(11) 90000-0000" />
      </Field>
      <Field label="Observações" optional hint={`${co.obs.length}/300`}>
        <textarea className="input" rows={3} maxLength={300} value={co.obs} onChange={(e) => co.set({ obs: e.target.value })} placeholder="Ponto de referência, se é surpresa, melhor horário…" />
      </Field>
      {!user && (
        <Accordion title="Entrar na conta (opcional)" open={login} onToggle={() => setLogin(!login)}>
          <div style={{ paddingBottom: 16 }}>
            <AuthPanel intro="Com conta, seus pedidos ficam salvos para acompanhar depois." />
          </div>
        </Accordion>
      )}
    </div>
  )
}

function ReviewStep({ subtotal, shipping, total, onEdit }: { subtotal: number; shipping: number; total: number; onEdit: (step: number) => void }) {
  const co = useCheckout()
  const items = useCart((s) => s.items)
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
            <div key={i.key} className="stack" style={{ ...gap(0), padding: '6px 0' }}>
              <div className="sum-row" style={{ padding: 0 }}>
                <span>
                  {i.qty}× {i.name}
                </span>
                <span>{brl(i.unitPrice * i.qty)}</span>
              </div>
              {i.summary.length > 0 && <span className="small muted">{i.summary.join(' · ')}</span>}
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
            <Icon name="calendar" size={14} className="inline-icon" /> {prettyDate(co.date)} · {PERIOD_LABEL[co.period].toLowerCase()}
          </span>
          {co.note && <span className="small muted">“{co.note}”</span>}
        </Block>,
        <Block key="you" title="Contato" step={1}>
          <span className="small">
            {co.name} · {co.phone}
          </span>
          {co.obs && <span className="small muted">{co.obs}</span>}
        </Block>,
        <div key="tot" className="panel" style={{ padding: 16 }}>
          <Totals subtotal={subtotal} shipping={shipping} total={total} />
        </div>,
        <div key="how" className="notice">
          <Icon name="whatsapp" size={16} />
          <span>
            Ao enviar, abrimos o WhatsApp da loja com o pedido completo já escrito. É só tocar em <b>enviar</b> por lá — o pagamento é combinado na conversa.
          </span>
        </div>,
      ].map((el) => (
        <motion.div key={el.key} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>
          {el}
        </motion.div>
      ))}
    </motion.div>
  )
}

function Totals({ subtotal, shipping, total }: { subtotal: number; shipping: number | null; total: number }) {
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
      <div className="sum-row sum-row--total">
        <b>Total</b>
        <AnimatedPrice value={total} />
      </div>
    </div>
  )
}
