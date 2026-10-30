import { useEffect } from 'react'
import { sfx } from '../../lib/sound'
import { A, type State } from './state'

/**
 * Same hotkeys on the control panel and on the overlay itself (for OBS "Interact"):
 * 1 / 2 goal for home / away (Shift removes one), Space start or pause the clock, Esc hide the pop-up.
 */
export function useScoreHotkeys(update: (fn: (s: State) => State) => void, opts: { sounds: boolean; ignoreEsc?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.code === 'Space' && (e.target as HTMLElement).closest('button, a, [role="switch"]')) || (e.target as HTMLElement).closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return
      const play = (n: Parameters<typeof sfx.play>[0]) => opts.sounds && sfx.play(n)
      if (e.code === 'Digit1') { e.preventDefault(); if (e.shiftKey) { update(s => A.score(s, 'home', -1)); play('back') } else { update(s => A.goal(s, 'home', '')); play('goal') } }
      else if (e.code === 'Digit2') { e.preventDefault(); if (e.shiftKey) { update(s => A.score(s, 'away', -1)); play('back') } else { update(s => A.goal(s, 'away', '')); play('goal') } }
      else if (e.code === 'Space') { e.preventDefault(); update(A.toggle); play('whistle') }
      else if (e.key === 'Escape' && !opts.ignoreEsc) update(A.clearEvent)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [update, opts.sounds, opts.ignoreEsc])
}
