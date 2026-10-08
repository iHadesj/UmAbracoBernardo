import { motion } from 'framer-motion'
import type { Dispatch, SetStateAction } from 'react'
import { EXTRAS, type Product, type Selection } from '../data/products'
import { brl, onlyDigits } from '../lib/format'
import { Icon } from './Icon'
import { bouncy } from './motion'
import { Chips, Field } from './ui'
import { gap } from './style'

/** Personalização do produto: cores, tamanhos, nome, idade. */
export function ProductOptions({ product, value, onChange }: { product: Product; value: Selection; onChange: Dispatch<SetStateAction<Selection>> }) {
  const set = (id: string, v: string) => onChange((prev) => ({ ...prev, [id]: v }))

  return (
    <div className="stack" style={gap(20)}>
      {product.options.map((o) => {
        if (o.type === 'swatch') {
          const current = o.choices?.find((c) => c.id === value[o.id])
          return (
            <div className="opt" key={o.id}>
              <div className="opt__head">
                {o.label}
                <motion.span key={current?.label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  {current?.label}
                </motion.span>
              </div>
              <div className="swatches" role="radiogroup" aria-label={o.label}>
                {o.choices?.map((c) => (
                  <motion.button
                    key={c.id}
                    role="radio"
                    aria-checked={c.id === value[o.id]}
                    aria-label={c.label}
                    className="swatch"
                    style={{ background: c.hex }}
                    onClick={() => set(o.id, c.id)}
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    {c.id === value[o.id] && <motion.span layoutId={`ring-${product.id}-${o.id}`} className="swatch__ring" transition={bouncy} />}
                  </motion.button>
                ))}
              </div>
            </div>
          )
        }
        if (o.type === 'chips') {
          return (
            <div className="opt" key={o.id}>
              <div className="opt__head">{o.label}</div>
              <Chips
                id={`${product.id}-${o.id}`}
                label={o.label}
                value={value[o.id]}
                onChange={(v) => set(o.id, v)}
                items={(o.choices ?? []).map((c) => ({ value: c.id, label: c.price ? `${c.label} · +${brl(c.price).replace(',00', '')}` : c.label }))}
              />
            </div>
          )
        }
        return (
          <Field key={o.id} label={o.label} optional={!o.required}>
            <input
              className="input"
              value={value[o.id] ?? ''}
              maxLength={o.maxLength}
              inputMode={o.type === 'number' ? 'numeric' : 'text'}
              placeholder={o.placeholder}
              onChange={(e) => set(o.id, o.type === 'number' ? onlyDigits(e.target.value) : e.target.value)}
            />
          </Field>
        )
      })}
    </div>
  )
}

export function ExtrasList({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="checklist">
      {EXTRAS.map((x) => {
        const on = value.includes(x.id)
        return (
          <button key={x.id} className={`check ${on ? 'on' : ''}`} onClick={() => onChange(on ? value.filter((v) => v !== x.id) : [...value, x.id])} aria-pressed={on}>
            <motion.span className="check__box" animate={{ scale: on ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.3 }}>
              {on && (
                <motion.svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                  <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.25 }} />
                </motion.svg>
              )}
            </motion.span>
            {x.label}
            <span className="check__price">+ {brl(x.price)}</span>
          </button>
        )
      })}
    </div>
  )
}

export function Includes({ items }: { items: string[] }) {
  return (
    <ul className="includes">
      {items.map((i) => (
        <li key={i}>
          <Icon name="check" size={18} stroke={2} />
          {i}
        </li>
      ))}
    </ul>
  )
}
