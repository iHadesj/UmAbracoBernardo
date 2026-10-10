import { AnimatePresence, MotionConfig } from 'framer-motion'
import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { BottomNav, FlyLayer, FloatingCartButton, Header, Toasts, WhatsAppFab } from './components/Chrome'
import About from './pages/About'
import Account from './pages/Account'
import Builder from './pages/Builder'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import OrderSuccess from './pages/OrderSuccess'
import ProductDetail from './pages/ProductDetail'
import Products from './pages/Products'
import Quote from './pages/Quote'
import { useUI } from './store/ui'
import { StylePicker } from './components/StylePicker'
import { applyStyle } from './theme/styles'

function useStyleSync() {
  const theme = useUI((s) => s.theme)
  const palette = useUI((s) => s.palette)
  const fonts = useUI((s) => s.fonts)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    applyStyle(palette, fonts, theme)
    try {
      localStorage.setItem('uab-theme', theme)
    } catch {
      /* sem armazenamento: o tema vale só nesta sessão */
    }
  }, [theme, palette, fonts])
}

export default function App() {
  const location = useLocation()
  useStyleSync()

  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <Header />
        <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/presentes" element={<Products />} />
            <Route path="/produto/:id" element={<ProductDetail />} />
            <Route path="/monte" element={<Builder />} />
            <Route path="/sacola" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pedido/:id" element={<OrderSuccess />} />
            <Route path="/conta" element={<Account />} />
            <Route path="/orcamento" element={<Quote />} />
            <Route path="/sobre" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
        <BottomNav />
        <WhatsAppFab />
        <FlyLayer />
        <FloatingCartButton />
        <Toasts />
        <StylePicker />
      </AuthProvider>
    </MotionConfig>
  )
}
