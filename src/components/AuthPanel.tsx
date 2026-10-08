import { AnimatePresence, motion } from 'framer-motion'
import { useState, type FormEvent } from 'react'
import { authMessage, useAuth } from '../auth/AuthProvider'
import { firstName } from '../lib/format'
import { GoogleMark, Icon } from './Icon'
import { bouncy } from './motion'
import { Field } from './ui'

/** Login só é pedido na hora de comprar: Google ou e-mail e senha (Firebase Auth). */
export function AuthPanel({ intro = 'Entre para finalizar a compra e acompanhar seus pedidos.' }: { intro?: string }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, mode } = useAuth()
  const [tab, setTab] = useState<'in' | 'up'>('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState<'google' | 'email' | null>(null)
  const [error, setError] = useState('')

  const run = async (kind: 'google' | 'email', fn: () => Promise<void>) => {
    setBusy(kind)
    setError('')
    try {
      await fn()
    } catch (e) {
      setError(authMessage(e))
    } finally {
      setBusy(null)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run('email', () => (tab === 'in' ? signInWithEmail(email.trim(), password) : signUpWithEmail(name.trim() || firstName(email), email.trim(), password)))
  }

  return (
    <div className="auth-box">
      <p className="muted small">{intro}</p>
      <motion.button className="btn btn--block google-btn" onClick={() => run('google', signInWithGoogle)} disabled={!!busy} whileTap={{ scale: 0.97 }}>
        {busy === 'google' ? <span className="spin" /> : <GoogleMark />}
        Continuar com Google
      </motion.button>

      <div className="or">ou com e-mail</div>

      <div className="segmented" role="tablist">
        {(['in', 'up'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {tab === t && <motion.span layoutId="auth-tab" className="segmented__pill" transition={bouncy} />}
            {t === 'in' ? 'Entrar' : 'Criar conta'}
          </button>
        ))}
      </div>

      <form className="stack" onSubmit={submit}>
        <AnimatePresence initial={false}>
          {tab === 'up' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
              <Field label="Seu nome">
                <input className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como podemos te chamar?" />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>
        <Field label="E-mail">
          <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
        </Field>
        <Field label="Senha" hint={tab === 'up' ? 'Mínimo de 6 caracteres' : undefined}>
          <input
            className="input"
            type="password"
            autoComplete={tab === 'in' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <AnimatePresence>
          {error && (
            <motion.p className="field__error" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }} exit={{ opacity: 0 }}>
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        <motion.button className="btn btn--dark btn--block" disabled={!!busy} whileTap={{ scale: 0.97 }}>
          {busy === 'email' ? <span className="spin" /> : <Icon name="lock" size={17} />}
          {tab === 'in' ? 'Entrar' : 'Criar conta'}
        </motion.button>
      </form>

      {mode === 'demo' && (
        <div className="notice">
          <Icon name="info" size={16} />
          <span>
            Modo demonstração: o login é simulado neste navegador. Para usar o Firebase de verdade, preencha as variáveis <code>VITE_FIREBASE_*</code> no <code>.env</code>.
          </span>
        </div>
      )}
    </div>
  )
}
