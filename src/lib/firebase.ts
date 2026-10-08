import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** Sem as variáveis VITE_FIREBASE_* o site usa o modo demonstração. */
export const firebaseEnabled = Boolean(config.apiKey && config.projectId && config.appId)

interface Services {
  app: FirebaseApp
  auth: Auth
  db: Firestore
}

let services: Promise<Services> | null = null

/** Carrega o SDK sob demanda — o Firebase não entra no bundle inicial. */
export function getFirebase(): Promise<Services> {
  if (!firebaseEnabled) return Promise.reject(new Error('Firebase não configurado'))
  services ??= (async () => {
    const [{ initializeApp }, { getAuth }, { getFirestore }] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
    ])
    const app = initializeApp(config)
    const auth = getAuth(app)
    auth.languageCode = 'pt'
    return { app, auth, db: getFirestore(app) }
  })()
  return services
}
