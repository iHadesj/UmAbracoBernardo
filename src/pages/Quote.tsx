import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Icon } from '../components/Icon'
import { Page, SplitTitle } from '../components/motion'
import { gap } from '../components/style'
import { Chips, Field } from '../components/ui'
import { prettyDate } from '../lib/format'
import { waLink, WA_GENERAL } from '../lib/whatsapp'

const EVENTS = ['Aniversário', 'Chá de bebê', 'Casamento', 'Formatura', 'Dia das Mães', 'Evento corporativo', 'Outro']
const BUDGETS = ['Até R$100', 'R$100–200', 'R$200–400', 'Acima de R$400']

export default function Quote() {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [event, setEvent] = useState(EVENTS[0])
  const [budget, setBudget] = useState(BUDGETS[1])
  const [idea, setIdea] = useState('')
  const [sent, setSent] = useState(false)

  const msg = [
    'Olá, Um abraço, Bernardo! Gostaria de um orçamento:',
    name && `• Nome: ${name}`,
    date && `• Data: ${prettyDate(date)}`,
    `• Evento: ${event}`,
    `• Faixa: ${budget}`,
    idea && `• Ideia: ${idea}`,
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <Page>
      <div className="container narrow stack" style={{ ...gap(18), paddingTop: 24 }}>
        <div className="stack" style={gap(8)}>
          <span className="kicker">sob medida</span>
          <SplitTitle className="h2" as="h1" text="Quer algo *personalizado*?" />
          <p className="lead">Conte sua ideia e a gente monta uma proposta com carinho.</p>
        </div>

        <AnimatePresence>
          {sent && (
            <motion.div className="notice" style={{ background: 'var(--soft)' }} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Icon name="check" size={16} />
              <span>Abrimos o WhatsApp com os detalhes para você enviar ♡</span>
            </motion.div>
          )}
        </AnimatePresence>

        <Field label="Seu nome">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como podemos te chamar?" />
        </Field>
        <Field label="Data do evento" optional>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <div className="opt">
          <div className="opt__head">Tipo de evento</div>
          <Chips id="event" label="Tipo de evento" value={event} onChange={setEvent} items={EVENTS.map((e) => ({ value: e, label: e }))} />
        </div>
        <div className="opt">
          <div className="opt__head">Faixa de preço</div>
          <Chips id="budget" label="Faixa de preço" value={budget} onChange={setBudget} items={BUDGETS.map((b) => ({ value: b, label: b }))} />
        </div>
        <Field label="Conte sua ideia">
          <textarea className="input" rows={4} value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Cores, tema, nome, quantidade de balões…" />
        </Field>

        <motion.a href={waLink(msg)} target="_blank" rel="noreferrer" className="btn btn--primary btn--block" onClick={() => setSent(true)} whileTap={{ scale: 0.97 }}>
          <Icon name="whatsapp" size={19} /> Solicitar orçamento
        </motion.a>
        <a href={WA_GENERAL} target="_blank" rel="noreferrer" className="panel row" style={{ ...gap(12), padding: 16 }}>
          <span className="feature__icon">
            <Icon name="instagram" size={18} />
          </span>
          <span className="stack" style={gap(0)}>
            <b style={{ color: 'var(--ink)' }}>Tem fotos de referência?</b>
            <span className="small muted">Mande direto no WhatsApp</span>
          </span>
        </a>
      </div>
    </Page>
  )
}
