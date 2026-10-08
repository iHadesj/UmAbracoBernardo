import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { firstName } from '../lib/format'
import { WA_GENERAL } from '../lib/whatsapp'
import { cartCount, useCart } from '../store/cart'
import { useUI } from '../store/ui'
import { Icon, type IconName } from './Icon'
import { bouncy } from './motion'
import { gap } from './style'

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Início', icon: 'home' },
  { to: '/presentes', label: 'Presentes', icon: 'gift' },
  { to: '/monte', label: 'Monte o seu', icon: 'wand' },
  { to: '/sacola', label: 'Sacola', icon: 'bag' },
]

const isActive = (path: string, to: string) => (to === '/' ? path === '/' : path.startsWith(to) || (to === '/presentes' && path.startsWith('/produto')))

function CartBadge() {
  const count = useCart((s) => cartCount(s.items))
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span key={count} className="badge" initial={{ scale: 0.3 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={bouncy}>
          {count}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

export function Header() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const theme = useUI((s) => s.theme)
  const toggleTheme = useUI((s) => s.toggleTheme)
  const [hidden, setHidden] = useState(false)
  const { scrollY } = useScroll()

  // some ao rolar para baixo, volta ao rolar para cima
  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setHidden(y > prev && y > 160)
  })

  return (
    <motion.header className="topbar" animate={{ y: hidden ? '-100%' : '0%' }} transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}>
      <div className="container topbar__inner">
        <Link to="/" className="brand" aria-label="Um abraço, Bernardo — início">
          <motion.img
            src="/brand/logo.png"
            alt=""
            className="brand__logo"
            initial={{ rotate: -120, scale: 0.4, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            whileHover={{ rotate: -8, scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            transition={bouncy}
          />
          <span className="brand__name">
            Um abraço, Bernardo
            <small>flores · ursos · presentes</small>
          </span>
        </Link>

        <nav className="topnav" aria-label="Principal">
          {NAV.slice(0, 3).map((n) => (
            <NavLink key={n.to} to={n.to} className={isActive(pathname, n.to) ? 'active' : ''}>
              {n.label}
              {isActive(pathname, n.to) && <motion.span layoutId="topnav-line" className="topnav__line" transition={bouncy} />}
            </NavLink>
          ))}
          <NavLink to="/sobre" className={pathname.startsWith('/sobre') ? 'active' : ''}>
            Sobre & entrega
            {pathname.startsWith('/sobre') && <motion.span layoutId="topnav-line" className="topnav__line" transition={bouncy} />}
          </NavLink>
        </nav>

        <motion.button className="icon-btn" onClick={toggleTheme} aria-label="Alternar tema" whileTap={{ scale: 0.85, rotate: -30 }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={theme} initial={{ rotate: -90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 90, opacity: 0, scale: 0.5 }} transition={{ duration: 0.25 }}>
              <Icon name={theme === 'light' ? 'moon' : 'sun'} size={19} />
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <Link to="/conta" className="icon-btn" aria-label={user ? `Conta de ${firstName(user.name)}` : 'Entrar'}>
          {user ? (
            <span className="avatar avatar--sm">{user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : firstName(user.name).charAt(0).toUpperCase()}</span>
          ) : (
            <Icon name="user" size={19} />
          )}
        </Link>

        <Link to="/sacola" className="icon-btn desk-only" aria-label="Sacola" data-cart-target>
          <Icon name="bag" size={19} />
          <CartBadge />
        </Link>
      </div>
    </motion.header>
  )
}


// telas com barra de ação fixa própria escondem a navegação inferior
const HIDE_NAV = ['/produto', '/checkout', '/monte', '/sacola']

export function BottomNav() {
  const { pathname } = useLocation()
  if (HIDE_NAV.some((p) => pathname.startsWith(p))) return null
  return (
    <motion.nav className="bottomnav" aria-label="Navegação" initial={{ y: 100 }} animate={{ y: 0 }} transition={{ ...bouncy, delay: 0.2 }}>
      {NAV.map((n) => {
        const on = isActive(pathname, n.to)
        return (
          <Link key={n.to} to={n.to} className={`bottomnav__item ${on ? 'active' : ''}`} {...(n.to === '/sacola' ? { 'data-cart-target': '' } : {})}>
            {on && <motion.span layoutId="bottomnav-pill" className="bottomnav__pill" transition={bouncy} />}
            <motion.span className="bottomnav__icon" animate={{ y: on ? -1 : 0, scale: on ? 1.08 : 1 }} transition={bouncy}>
              <Icon name={n.icon} size={22} stroke={on ? 1.9 : 1.6} />
              {n.to === '/sacola' && <CartBadge />}
            </motion.span>
            <span>{n.label}</span>
          </Link>
        )
      })}
    </motion.nav>
  )
}

const FAB_ROUTES = ['/', '/presentes', '/sobre', '/orcamento']

export function WhatsAppFab() {
  const { pathname } = useLocation()
  const [show, setShow] = useState(false)
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (y) => setShow(y > 320))
  const visible = show && FAB_ROUTES.includes(pathname)
  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href={WA_GENERAL}
          target="_blank"
          rel="noreferrer"
          className="fab"
          aria-label="Falar no WhatsApp"
          initial={{ scale: 0.4, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.4, opacity: 0, y: 30 }}
          whileTap={{ scale: 0.9 }}
          transition={bouncy}
        >
          <Icon name="whatsapp" size={26} />
        </motion.a>
      )}
    </AnimatePresence>
  )
}

export function Toasts() {
  const toasts = useUI((s) => s.toasts)
  return (
    <div className="toasts" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            className={`toast ${t.tone === 'error' ? 'toast--error' : ''}`}
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={bouncy}
          >
            <Icon name={t.tone === 'error' ? 'info' : 'heart'} size={17} fill={t.tone !== 'error'} stroke={t.tone === 'error' ? 1.8 : 0} />
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/** Coração que voa do botão "adicionar" até o ícone da sacola visível. */
export function FlyLayer() {
  const flyers = useUI((s) => s.flyers)
  const land = useUI((s) => s.landFlyer)
  const [target, setTarget] = useState({ x: 0, y: 0 })
  useEffect(() => {
    if (!flyers.length) return
    const el = [...document.querySelectorAll('[data-cart-target]')].find((e) => e.getBoundingClientRect().width > 0)
    const r = el?.getBoundingClientRect()
    if (r) setTarget({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
  }, [flyers.length])

  return (
    <>
      {flyers.map((f) => (
        <motion.svg
          key={f.id}
          className="flyer"
          viewBox="0 0 24 24"
          style={{ color: f.color }}
          initial={{ x: f.x - 13, y: f.y - 13, scale: 0.6, opacity: 1 }}
          animate={{
            x: [f.x - 13, (f.x + target.x) / 2 - 13, target.x - 13],
            y: [f.y - 13, Math.min(f.y, target.y) - 120, target.y - 13],
            scale: [0.6, 1.5, 0.5],
            rotate: [0, -20, 10],
            opacity: [1, 1, 0.2],
          }}
          transition={{ duration: 0.85, ease: [0.4, 0, 0.2, 1], times: [0, 0.45, 1] }}
          onAnimationComplete={() => land(f.id)}
        >
          <path fill="currentColor" d="M12 20s-7-4.3-8.9-8.6C1.7 8.2 3.6 4.6 7 4.6c1.9 0 3.3 1 4.1 2.4.8-1.4 2.3-2.4 4.1-2.4 3.4 0 5.3 3.6 3.9 6.8C19 15.7 12 20 12 20z" />
        </motion.svg>
      ))}
    </>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="stack" style={gap(10)}>
          <div className="row">
            <img src="/brand/logo.png" alt="" width={56} height={56} style={{ borderRadius: '50%' }} />
            <div>
              <div className="brand__name" style={{ fontSize: 22 }}>
                Um abraço, Bernardo
              </div>
              <div className="kicker" style={{ fontSize: 19 }}>
                em forma de abraço ♡
              </div>
            </div>
          </div>
          <p className="small muted">Jardim Prainha · Grajaú, São Paulo. Pedidos pelo site ou WhatsApp.</p>
        </div>
        <div className="footer__links">
          <Link to="/presentes">Presentes</Link>
          <Link to="/monte">Monte o seu</Link>
          <Link to="/orcamento">Orçamento</Link>
          <Link to="/sobre">Sobre & entrega</Link>
          <Link to="/conta">Minha conta</Link>
          <a href={WA_GENERAL} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        </div>
        <div className="stack small muted" style={gap(6)}>
          <span>Recomendamos 48h de antecedência</span>
          <span>Pagamento seguro · Pix e cartão</span>
          <span>© {new Date().getFullYear()} Um abraço, Bernardo</span>
        </div>
      </div>
    </footer>
  )
}
