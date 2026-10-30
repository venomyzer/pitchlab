import { AnimatePresence, motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReducedMotion } from '../lib/settings'
import { sfx } from '../lib/sound'
import { IconLock } from './Icons'

export type MenuItem = {
  /** Route to open. No `to` = locked "Soon" item (still focusable so keyboard users can read it). */
  to?: string
  label: string
  desc: string
  /** Section colour shown as a thin edge mark. */
  accent?: string
  badge?: string
  preview?: ReactNode
}

/**
 * Console-style menu: a vertical list on the left, the focused item's preview on the right.
 * Focus inverts to a solid light fill and moves instantly; hovering focuses too. Phones get the list only.
 */
export function MenuList({ items, heading }: { items: MenuItem[]; heading?: ReactNode }) {
  const nav = useNavigate()
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const cur = items[active]
  return (
    <div className="max-w-[1400px] mx-auto grid gap-10 md:grid-cols-[minmax(0,25rem)_minmax(0,1fr)] md:items-center md:min-h-[calc(100dvh-10rem)] pt-4 md:pt-0">
      <div className="flex flex-col min-w-0">
        {heading}
        <ul className="flex flex-col border-t border-line/40">
          {items.map((it, i) => {
            const locked = !it.to
            return (
              <motion.li key={it.label} className="border-b border-line/40 py-1"
                initial={reduce ? false : { opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.035 * i, duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}>
                <button type="button" data-nav="" autoFocus={i === 0} aria-disabled={locked || undefined} aria-describedby="menu-desc"
                  onMouseEnter={e => e.currentTarget.focus({ preventScroll: true })}
                  onFocus={() => { setActive(i); sfx.play('hover') }}
                  onClick={() => { if (locked) { sfx.play('back'); return } sfx.play('select'); nav(it.to!) }}
                  className="group w-full h-12 flex items-center gap-3 pr-3 text-left outline-none focus-visible:outline-none
                    font-display font-bold uppercase tracking-[0.12em] text-[21px] leading-none
                    text-mist-100 hover:bg-night-950/40 focus:bg-focus focus:text-night-950">
                  <span className="w-[3px] self-stretch" style={{ background: it.accent ?? 'transparent' }} />
                  <span className={`truncate ${locked ? 'text-mist-400 group-focus:text-night-950/70' : ''}`}>{it.label}</span>
                  {it.badge && (
                    <span className="ml-auto shrink-0 font-display font-bold text-[12px] tracking-[0.14em] px-1.5 py-0.5 rounded-sm text-night-950"
                      style={{ background: it.accent ?? 'var(--color-flood-500)' }}>{it.badge}</span>
                  )}
                  {locked && (
                    <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-[12px] tracking-[0.14em] text-mist-400 group-focus:text-night-950/70">
                      <IconLock className="h-3.5 w-3.5" />Soon
                    </span>
                  )}
                </button>
              </motion.li>
            )
          })}
        </ul>
        <p id="menu-desc" className="mt-4 min-h-[3.2em] text-[15px] text-mist-300 leading-snug max-w-[44ch]">{cur.desc}</p>
      </div>

      <div className="hidden md:block min-w-0">
        <div className="relative aspect-video max-w-[900px] ml-auto cut-corner overflow-hidden bg-night-950/70 backdrop-blur-sm">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={active} className="absolute inset-0"
              initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.12 }}>
              {cur.preview ?? <LockedPreview label={cur.label} />}
            </motion.div>
          </AnimatePresence>
          {/* hairline frame drawn on top so every preview gets the same edge */}
          <span className="absolute inset-0 cut-corner border border-line pointer-events-none" />
        </div>
      </div>
    </div>
  )
}

function LockedPreview({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center text-center">
      <div>
        <IconLock className="h-12 w-12 mx-auto text-mist-400" />
        <div className="mt-4 font-display font-extrabold uppercase -skew-x-6 text-4xl">{label}</div>
        <div className="mt-1 text-mist-400">Coming in a later update.</div>
      </div>
    </div>
  )
}
