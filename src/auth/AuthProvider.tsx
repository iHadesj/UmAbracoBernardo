import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { firebaseEnabled, getFirebase } from '../lib/firebase'

export interface AppUser {
  uid: string
  name: string
  email: string | null
  photoURL: string | null
  provider: 'google' | 'password' | 'demo'
}

interface AuthContextValue {
  user: AppUser | null
  ready: boolean
  mode: 'firebase' | 'demo'
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const DEMO_KEY = 'uab-demo-user'
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

const ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'Não encontramos uma conta com esse e-mail.',
  'auth/email-already-in-use': 'Esse e-mail já tem conta. Tente entrar.',
  'auth/weak-password': 'A senha precisa de pelo menos 6 caracteres.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/too-many-requests': 'Muitas tentativas. Espere um pouco e tente de novo.',
  'auth/popup-closed-by-user': 'A janela do Google foi fechada antes de concluir.',
  'auth/network-request-failed': 'Sem conexão. Verifique sua internet.',
}

export function authMessage(e: unknown) {
  const code = (e as { code?: string })?.code
  return (code && ERRORS[code]) || (e as Error)?.message || 'Algo deu errado. Tente de novo.'
}

function fromFirebase(u: User): AppUser {
  const google = u.providerData.some((p) => p.providerId === 'google.com')
  return {
    uid: u.uid,
    name: u.displayName || u.email?.split('@')[0] || 'Cliente',
    email: u.email,
    photoURL: u.photoURL,
    provider: google ? 'google' : 'password',
  }
}

function readDemo(): AppUser | null {
  try {
    const raw = localStorage.getItem(DEMO_KEY)
    return raw ? (JSON.parse(raw) as AppUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => (firebaseEnabled ? null : readDemo()))
  const [ready, setReady] = useState(!firebaseEnabled)

  useEffect(() => {
    if (!firebaseEnabled) return
    let unsub: (() => void) | undefined
    let alive = true
    Promise.all([getFirebase(), import('firebase/auth')])
      .then(([{ auth }, { onAuthStateChanged, getRedirectResult }]) => {
        if (!alive) return
        getRedirectResult(auth).catch(() => {})
        unsub = onAuthStateChanged(auth, (u) => {
          setUser(u ? fromFirebase(u) : null)
          setReady(true)
        })
      })
      .catch(() => setReady(true))
    return () => {
      alive = false
      unsub?.()
    }
  }, [])

  const setDemo = useCallback((u: AppUser | null) => {
    try {
      if (u) localStorage.setItem(DEMO_KEY, JSON.stringify(u))
      else localStorage.removeItem(DEMO_KEY)
    } catch {
      /* armazenamento indisponível: segue só em memória */
    }
    setUser(u)
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!firebaseEnabled) {
      await wait(800)
      setDemo({ uid: 'demo-google', name: 'Cliente Demonstração', email: 'cliente@exemplo.com', photoURL: null, provider: 'demo' })
      return
    }
    const [{ auth }, m] = await Promise.all([getFirebase(), import('firebase/auth')])
    const provider = new m.GoogleAuthProvider()
    try {
      await m.signInWithPopup(auth, provider)
    } catch (e) {
      // Navegadores móveis às vezes bloqueiam popups: cai para redirect.
      if ((e as { code?: string }).code === 'auth/popup-blocked') await m.signInWithRedirect(auth, provider)
      else throw e
    }
  }, [setDemo])

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!firebaseEnabled) {
        await wait(700)
        if (password.length < 6) throw Object.assign(new Error(), { code: 'auth/invalid-credential' })
        setDemo({ uid: 'demo-' + email.toLowerCase(), name: email.split('@')[0], email, photoURL: null, provider: 'demo' })
        return
      }
      const [{ auth }, m] = await Promise.all([getFirebase(), import('firebase/auth')])
      await m.signInWithEmailAndPassword(auth, email, password)
    },
    [setDemo],
  )

  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      if (!firebaseEnabled) {
        await wait(900)
        if (password.length < 6) throw Object.assign(new Error(), { code: 'auth/weak-password' })
        setDemo({ uid: 'demo-' + email.toLowerCase(), name, email, photoURL: null, provider: 'demo' })
        return
      }
      const [{ auth }, m] = await Promise.all([getFirebase(), import('firebase/auth')])
      const cred = await m.createUserWithEmailAndPassword(auth, email, password)
      await m.updateProfile(cred.user, { displayName: name })
      setUser(fromFirebase(cred.user))
    },
    [setDemo],
  )

  const signOut = useCallback(async () => {
    if (!firebaseEnabled) return setDemo(null)
    const [{ auth }, m] = await Promise.all([getFirebase(), import('firebase/auth')])
    await m.signOut(auth)
  }, [setDemo])

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, mode: firebaseEnabled ? 'firebase' : 'demo', signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }),
    [user, ready, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
