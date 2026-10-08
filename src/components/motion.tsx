import { animate, motion, useInView, useMotionValue, useTransform, type HTMLMotionProps, type Variants } from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'
import { brl } from '../lib/format'

export const spring = { type: 'spring', stiffness: 260, damping: 30 } as const
export const bouncy = { type: 'spring', stiffness: 400, damping: 18 } as const

/** Wrapper de página: entra subindo, sai em fade. */
export function Page({ children, className = '', bar = false }: { children: ReactNode; className?: string; bar?: boolean }) {
  return (
    <motion.main
      className={`page ${bar ? 'page--bar' : ''} ${className}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.2, 0.7, 0.2, 1] } }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
    >
      {children}
    </motion.main>
  )
}

/** Revela o conteúdo ao entrar na tela. */
export function Reveal({ children, delay = 0, y = 22, ...rest }: { children: ReactNode; delay?: number; y?: number } & HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: [0.2, 0.7, 0.2, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export const EASE = [0.2, 0.7, 0.2, 1] as const

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } },
}

/** Título com palavras surgindo uma a uma; *palavra* vira ênfase em itálico. */
export function SplitTitle({ text, as: Tag = 'h1', className, delay = 0 }: { text: string; as?: 'h1' | 'h2'; className?: string; delay?: number }) {
  const words = text.split(' ')
  const MotionTag = Tag === 'h1' ? motion.h1 : motion.h2
  return (
    <MotionTag className={className} initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: delay } } }}>
      {words.map((w, i) => {
        const em = w.startsWith('*')
        const clean = w.replace(/\*/g, '')
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.08em' }}>
            <motion.span
              style={{ display: 'inline-block' }}
              variants={{ hidden: { y: '110%', rotate: 4 }, show: { y: 0, rotate: 0, transition: { duration: 0.6, ease: [0.2, 0.75, 0.2, 1] } } }}
            >
              {em ? <em>{clean}</em> : clean}
              {i < words.length - 1 ? ' ' : ''}
            </motion.span>
          </span>
        )
      })}
    </MotionTag>
  )
}

/** Valor em reais que "rola" até o novo número. */
export function AnimatedPrice({ value, className = 'price' }: { value: number; className?: string }) {
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => brl(v))
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      mv.set(value)
      return
    }
    const c = animate(mv, value, { duration: 0.5, ease: [0.2, 0.7, 0.2, 1] })
    return () => c.stop()
  }, [mv, value])
  return <motion.span className={className}>{text}</motion.span>
}

/** Conta de 0 até o valor quando aparece na tela. */
export function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString('pt-BR') + suffix)
  useEffect(() => {
    if (!inView) return
    const c = animate(mv, to, { duration: 1.4, ease: [0.2, 0.7, 0.2, 1] })
    return () => c.stop()
  }, [inView, mv, to])
  return <motion.span ref={ref}>{text}</motion.span>
}
