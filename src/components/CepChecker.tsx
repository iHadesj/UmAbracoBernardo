import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { CepError, lookupCep, type CepAddress } from '../lib/cep'
import { brl, maskCep, onlyDigits } from '../lib/format'
import { quoteShipping, type ShippingQuote } from '../lib/shipping'
import { useCheckout } from '../store/checkout'
import { Icon } from './Icon'
import { gap } from './style'

type State = { status: 'idle' } | { status: 'loading' } | { status: 'error'; message: string } | { status: 'ok'; address: CepAddress; quote: ShippingQuote }

/** Consulta o CEP no ViaCEP e mostra frete + prazo. Lembra o CEP para o checkout. */
export function useCepLookup(subtotal: number) {
  const cep = useCheckout((s) => s.cep)
  const address = useCheckout((s) => s.address)
  const set = useCheckout((s) => s.set)
  const [state, setState] = useState<State>(() => (address ? { status: 'ok', address, quote: quoteShipping(address, subtotal) } : { status: 'idle' }))

  useEffect(() => {
    const digits = onlyDigits(cep)
    if (digits.length !== 8) {
      setState({ status: 'idle' })
      return
    }
    if (address && onlyDigits(address.cep) === digits) {
      setState({ status: 'ok', address, quote: quoteShipping(address, subtotal) })
      return
    }
    const ctrl = new AbortController()
    setState({ status: 'loading' })
    lookupCep(digits, ctrl.signal)
      .then((a) => {
        set({ address: a })
        setState({ status: 'ok', address: a, quote: quoteShipping(a, subtotal) })
      })
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return
        set({ address: null })
        setState({ status: 'error', message: e instanceof CepError ? e.message : 'Não foi possível consultar o CEP.' })
      })
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cep, subtotal])

  return { cep, setCep: (v: string) => set({ cep: maskCep(v) }), state }
}

export function CepChecker({ subtotal = 0, compact = false }: { subtotal?: number; compact?: boolean }) {
  return <CepCheckerView lookup={useCepLookup(subtotal)} compact={compact} />
}

/** Mesma UI, usando uma consulta que a página já controla (evita buscar o CEP duas vezes). */
export function CepCheckerView({ lookup, compact = false, label = 'Calcule o frete' }: { lookup: ReturnType<typeof useCepLookup>; compact?: boolean; label?: string }) {
  const { cep, setCep, state } = lookup

  return (
    <div className="cep">
      <label className="field">
        {!compact && <span className="field__label">{label}</span>}
        <div className="input-wrap">
          <input
            className="input"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="Digite seu CEP"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            aria-invalid={state.status === 'error'}
          />
          <span className="input-wrap__icon">{state.status === 'loading' ? <span className="spin" /> : <Icon name="pin" size={19} />}</span>
        </div>
      </label>
      <AnimatePresence initial={false} mode="wait">
        {state.status === 'error' && (
          <motion.p key="err" className="field__error" style={{ marginTop: 8 }} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {state.message}
          </motion.p>
        )}
        {state.status === 'ok' && (
          <motion.div
            key={state.address.cep}
            className="cep__result"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <QuoteCard address={state.address} quote={state.quote} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function QuoteCard({ address, quote }: { address: CepAddress; quote: ShippingQuote }) {
  return (
    <div className="cep__card">
      <span className="cep__addr">
        {[address.logradouro, address.bairro].filter(Boolean).join(', ')}
        {address.logradouro || address.bairro ? ' — ' : ''}
        {address.localidade}/{address.uf}
      </span>
      {quote.available ? (
        <>
          <div className="cep__line">
            <span>{quote.zone}</span>
            {quote.fee === 0 ? (
              <motion.b className="free" initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
                Frete grátis ♡
              </motion.b>
            ) : (
              <b>{brl(quote.fee)}</b>
            )}
          </div>
          <div className="cep__line small">
            <span className="row" style={gap(6)}>
              <Icon name="clock" size={15} /> {quote.eta}
            </span>
          </div>
          {quote.freeAbove && quote.fee > 0 && <span className="small muted">Frete grátis no Grajaú acima de {brl(quote.freeAbove)}</span>}
        </>
      ) : (
        <span className="small" style={{ color: 'var(--red)', fontWeight: 500 }}>
          {quote.note}
        </span>
      )}
    </div>
  )
}
