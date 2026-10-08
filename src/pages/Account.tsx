import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { AuthPanel } from '../components/AuthPanel'
import { Icon } from '../components/Icon'
import { bouncy, Page, staggerChild, staggerParent } from '../components/motion'
import { gap } from '../components/style'
import { brl, firstName, prettyDate } from '../lib/format'
import { fetchOrders, type Order } from '../lib/orders'

export default function Account() {
  const { user, ready, signOut, mode } = useAuth()
  const [orders, setOrders] = useState<Order[] | null>(null)

  useEffect(() => {
    if (!user) return
    let alive = true
    fetchOrders(user.uid, user.provider === 'demo').then((o) => alive && setOrders(o))
    return () => {
      alive = false
    }
  }, [user])

  return (
    <Page>
      <div className="container narrow" style={{ paddingTop: 24 }}>
        <AnimatePresence mode="wait">
          {!ready ? (
            <motion.div key="l" style={{ display: 'grid', placeItems: 'center', padding: 60 }}>
              <span className="spin" />
            </motion.div>
          ) : !user ? (
            <motion.div key="out" className="stack" style={gap(14)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <span className="kicker">bem-vindo(a)</span>
              <h1 className="h2">
                Sua <em>conta</em>
              </h1>
              <AuthPanel intro="Entre para acompanhar seus pedidos. Você também pode entrar só na hora de finalizar a compra." />
            </motion.div>
          ) : (
            <motion.div key="in" className="stack" style={gap(18)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="user-chip">
                <motion.span className="avatar" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={bouncy}>
                  {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : firstName(user.name).charAt(0).toUpperCase()}
                </motion.span>
                <div className="stack spacer" style={{ ...gap(0), minWidth: 0 }}>
                  <b style={{ color: 'var(--ink)', fontSize: 17 }}>Olá, {firstName(user.name)} ♡</b>
                  <span className="small muted">
                    {user.email} {mode === 'demo' && '· demonstração'}
                  </span>
                </div>
                <motion.button className="icon-btn" onClick={signOut} aria-label="Sair" whileTap={{ scale: 0.9 }}>
                  <Icon name="logout" size={18} />
                </motion.button>
              </div>

              <h2 className="h3">Seus pedidos</h2>
              {orders === null ? (
                <span className="spin" />
              ) : orders.length === 0 ? (
                <div className="panel panel--soft stack" style={{ ...gap(10), alignItems: 'flex-start' }}>
                  <p className="muted">Você ainda não fez pedidos.</p>
                  <Link to="/presentes" className="btn btn--primary btn--sm">
                    Escolher um presente
                  </Link>
                </div>
              ) : (
                <motion.ul className="stack" style={{ ...gap(10), padding: 0, margin: 0, listStyle: 'none' }} variants={staggerParent} initial="hidden" animate="show">
                  {orders.map((o) => (
                    <motion.li key={o.id} variants={staggerChild}>
                      <Link to={`/pedido/${o.id}`} className="panel row" style={{ ...gap(12), padding: 16 }}>
                        <span className="method__icon">
                          <Icon name="gift" size={19} />
                        </span>
                        <div className="stack spacer" style={gap(2)}>
                          <b style={{ color: 'var(--ink)' }}>{o.id}</b>
                          <span className="small muted">
                            {o.items.reduce((a, i) => a + i.qty, 0)} {o.items.length === 1 && o.items[0].qty === 1 ? 'item' : 'itens'} · entrega {prettyDate(o.date)}
                          </span>
                        </div>
                        <span className="price">{brl(o.total)}</span>
                      </Link>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Page>
  )
}
