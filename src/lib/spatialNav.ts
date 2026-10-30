import { useEffect } from 'react'
import { sfx } from './sound'

/**
 * Console-style navigation: arrow keys (or W / S for up / down) move focus to the nearest [data-nav] element
 * in that direction. Enter/Space activate it (native button behaviour). Up / down skip the header tabs ([data-nav-tab]).
 */
export function useSpatialNav(enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      const dir = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down' }[key] as Dir | undefined
      if (!dir) return
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable="true"]')) return
      const cur = document.activeElement as HTMLElement | null
      // the header tabs (Kickoff / Settings / Donate) are reached with Q / E, so up / down never moves into them
      const fromTab = !!cur?.closest('[data-nav-tab]')
      const items = [...document.querySelectorAll<HTMLElement>('[data-nav]')].filter(el => isVisible(el) && (fromTab || dir === 'left' || dir === 'right' || !el.hasAttribute('data-nav-tab')))
      if (!items.length) return
      e.preventDefault()
      if (!cur || !items.includes(cur)) { items[0].focus(); sfx.play('hover'); return }
      const next = nearest(cur, items, dir)
      if (next) { next.focus(); next.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); sfx.play('hover') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}
type Dir = 'up' | 'down' | 'left' | 'right'
const isVisible = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.hasAttribute('disabled') }
function nearest(from: HTMLElement, items: HTMLElement[], dir: Dir) {
  const a = from.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2
  let best: HTMLElement | null = null, bestScore = Infinity
  for (const el of items) {
    if (el === from) continue
    const b = el.getBoundingClientRect(), bx = b.left + b.width / 2, by = b.top + b.height / 2
    const dx = bx - ax, dy = by - ay
    const along = dir === 'left' ? -dx : dir === 'right' ? dx : dir === 'up' ? -dy : dy
    const across = dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx)
    if (along <= 4) continue
    const score = along + across * 2.2
    if (score < bestScore) { bestScore = score; best = el }
  }
  return best
}
