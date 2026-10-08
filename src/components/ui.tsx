import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import { Icon } from './Icon'
import { bouncy } from './motion'

/* ---------- Chips com pílula animada ---------- */

export function Chips<T extends string>({
  items,
  value,
  onChange,
  id,
  label,
}: {
  items: { value: T; label: string; count?: number }[]
  value: T
  onChange: (v: T) => void
  id: string
  label: string
}) {
  return (
    <div className="chips" role="radiogroup" aria-label={label}>
      {items.map((it) => {
        const on = it.value === value
        return (
          <motion.button
            key={it.value}
            role="radio"
            aria-checked={on}
            className={`chip ${on ? 'on' : ''}`}
            onClick={() => onChange(it.value)}
            whileTap={{ scale: 0.94 }}
          >
            {on && <motion.span layoutId={`chip-${id}`} className="chip__pill" transition={bouncy} />}
            {it.label}
            {it.count !== undefined && <small>{it.count}</small>}
          </motion.button>
        )
      })}
    </div>
  )
}

/* ---------- Bottom sheet arrastável ---------- */

export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const controls = useDragControls()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="sheet-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            <div className="sheet__grab" onPointerDown={(e) => controls.start(e)}>
              <span />
            </div>
            <div className="sheet__head" onPointerDown={(e) => controls.start(e)}>
              <h2 className="h3" style={{ fontSize: 23 }}>
                {title}
              </h2>
              <button className="icon-btn" style={{ background: 'var(--soft)', border: 0 }} onClick={onClose} aria-label="Fechar">
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="sheet__body">{children}</div>
            {footer}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ---------- Campo de formulário ---------- */

export function Field({ label, hint, error, optional, children }: { label: string; hint?: string; error?: string; optional?: boolean; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field__label">
        {label}
        {optional && <span>opcional</span>}
      </span>
      {children}
      <AnimatePresence initial={false}>
        {error ? (
          <motion.span key="e" className="field__error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            {error}
          </motion.span>
        ) : hint ? (
          <span className="field__hint">{hint}</span>
        ) : null}
      </AnimatePresence>
    </label>
  )
}

/* ---------- Quantidade ---------- */

export function Qty({ value, onChange, min = 1 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="qty">
      <motion.button whileTap={{ scale: 0.8 }} onClick={() => onChange(Math.max(min, value - 1))} aria-label="Diminuir" disabled={value <= min && min > 0}>
        <Icon name={value <= 1 && min === 0 ? 'trash' : 'minus'} size={16} />
      </motion.button>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={value} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ duration: 0.18 }}>
          {value}
        </motion.span>
      </AnimatePresence>
      <motion.button whileTap={{ scale: 0.8 }} onClick={() => onChange(Math.min(20, value + 1))} aria-label="Aumentar">
        <Icon name="plus" size={16} />
      </motion.button>
    </div>
  )
}

/* ---------- Acordeão ---------- */

export function Accordion({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="accordion">
      <button className="accordion__btn" onClick={onToggle} aria-expanded={open}>
        {title}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={bouncy}>
          <Icon name="down" size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="accordion__body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------- Diamante divisor (do protótipo) ---------- */

export function Divider() {
  return (
    <div className="divider" aria-hidden="true">
      <Icon name="heart" size={12} fill stroke={0} />
    </div>
  )
}
