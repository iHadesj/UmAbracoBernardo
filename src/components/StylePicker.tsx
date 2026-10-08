import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useUI } from '../store/ui'
import { FONT_SETS, PALETTES, preloadAllFonts, type FontSetId, type PaletteId } from '../theme/styles'
import { Icon } from './Icon'
import { bouncy } from './motion'

const FLAG = 'uab-style-picker'

/** Aparece no `npm run dev` ou abrindo o site com `?estilo` (para mostrar a quem vai decidir). */
function pickerEnabled() {
  try {
    if (new URLSearchParams(location.search).has('estilo')) localStorage.setItem(FLAG, '1')
    return import.meta.env.DEV || localStorage.getItem(FLAG) === '1'
  } catch {
    return import.meta.env.DEV
  }
}

/** Seletor temporário de paleta e fontes para comparar as opções no site de verdade. */
export function StylePicker() {
  const [enabled] = useState(pickerEnabled)
  const [open, setOpen] = useState(false)
  const palette = useUI((s) => s.palette)
  const fonts = useUI((s) => s.fonts)
  const setPalette = useUI((s) => s.setPalette)
  const setFonts = useUI((s) => s.setFonts)

  useEffect(() => {
    if (open) preloadAllFonts()
  }, [open])

  if (!enabled) return null

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            className="style-fab"
            onClick={() => setOpen(true)}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            whileTap={{ scale: 0.92 }}
            transition={bouncy}
          >
            <Icon name="sparkle" size={17} /> Estilo
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            className="style-panel"
            role="dialog"
            aria-label="Estilo do site"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            exit={{ y: '110%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            <div className="style-panel__head">
              <div>
                <b>Estilo do site</b>
                <span className="small muted">Compare ao vivo, navegando pelas páginas.</span>
              </div>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Fechar">
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="style-panel__label">Cores</div>
            <div className="style-row">
              {(Object.keys(PALETTES) as PaletteId[]).map((id) => {
                const p = PALETTES[id]
                const on = id === palette
                return (
                  <motion.button key={id} className={`style-opt ${on ? 'on' : ''}`} onClick={() => setPalette(id)} whileTap={{ scale: 0.96 }} aria-pressed={on}>
                    {on && <motion.span layoutId="style-ring-p" className="style-opt__ring" transition={bouncy} />}
                    <span className="style-dots" style={{ background: p.light.bg }}>
                      {[p.light.soft, p.light.red, p.light['red-2'], p.light.ink, p.light.leaf].map((c, i) => (
                        <span key={i} style={{ background: c }} />
                      ))}
                    </span>
                    <b>{p.label}</b>
                    <span>{p.desc}</span>
                  </motion.button>
                )
              })}
            </div>

            <div className="style-panel__label">Fontes</div>
            <div className="style-row">
              {(Object.keys(FONT_SETS) as FontSetId[]).map((id) => {
                const f = FONT_SETS[id]
                const on = id === fonts
                return (
                  <motion.button key={id} className={`style-opt ${on ? 'on' : ''}`} onClick={() => setFonts(id)} whileTap={{ scale: 0.96 }} aria-pressed={on}>
                    {on && <motion.span layoutId="style-ring-f" className="style-opt__ring" transition={bouncy} />}
                    <span style={{ fontFamily: f.display, fontWeight: f.weight, fontSize: 24, lineHeight: 1.1, color: 'var(--ink)' }}>
                      Um <em style={{ fontStyle: f.italic ? 'italic' : 'normal', color: 'var(--red)' }}>abraço</em>
                    </span>
                    <span style={{ fontFamily: f.hand, fontSize: 18 * f.handScale, color: 'var(--red)', lineHeight: 1 }}>em forma de abraço</span>
                    <b style={{ fontFamily: f.body }}>{f.label}</b>
                    <span style={{ fontFamily: f.body }}>{f.desc}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
