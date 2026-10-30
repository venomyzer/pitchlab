import { useEffect, useRef, useState } from 'react'
import { sfx } from '../../lib/sound'
import { useScoreHotkeys } from './hotkeys'
import { useScoreboard, type State } from './state'

/**
 * Everything a scoreboard control surface needs (full panel and OBS dock):
 * state, an `update` that records undo history, `undo`, the 1 / 2 / Space hotkeys and Ctrl Z.
 */
export function useScoreControl({ ignoreEsc }: { ignoreEsc: boolean }) {
  const { state, update: rawUpdate, commit } = useScoreboard()
  const history = useRef<State[]>([])
  const [canUndo, setCanUndo] = useState(false)
  // every change goes through here, so it can be undone
  const update = (fn: (st: State) => State) => {
    rawUpdate(st => { history.current = [...history.current.slice(-40), st]; return fn(st) })
    setCanUndo(true)
  }
  const undo = () => {
    const prev = history.current.pop(); if (!prev) return
    sfx.play('back'); commit({ ...prev }); setCanUndo(history.current.length > 0)
  }
  const updRef = useRef(update); updRef.current = update
  const stableUpdate = useRef((fn: (st: State) => State) => updRef.current(fn)).current
  useScoreHotkeys(stableUpdate, { sounds: true, ignoreEsc })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !(e.target as HTMLElement).closest('input')) { e.preventDefault(); undo() } }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  })
  return { s: state, update, undo, canUndo }
}

/** Full address of a page in this app (what OBS needs), e.g. appUrl('overlay/scoreboard'). */
export function appUrl(path: string) {
  return `${window.location.origin}${import.meta.env.BASE_URL.replace(/^\.\//, '/')}${path}`.replace(/([^:]\/)\/+/g, '$1')
}

/** Dark or light text, whichever reads better on a team colour. */
export function textOn(hex: string) {
  const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16)
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#04100b' : '#ffffff'
}
