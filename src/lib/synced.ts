import { useCallback, useEffect, useRef, useState } from 'react'
import { sfx } from './sound'
import { loadRaw, save } from './storage'

type Versioned = { v: number; updatedAt: number }

/**
 * State shared by every copy of the app in this browser (same sync as the scoreboard):
 * BroadcastChannel for instant updates, the storage event as a backup, a 1 s poll as a last resort.
 * Newer `updatedAt` wins. Saved on every change, so reloads never lose anything.
 */
export function useSynced<T extends Versioned>(key: string, channel: string, read: () => T) {
  const [state, setState] = useState<T>(read)
  const ref = useRef(state); ref.current = state
  const chan = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    const accept = (s: T | null) => { if (s && s.v === ref.current.v && s.updatedAt > ref.current.updatedAt) setState(s) }
    try {
      chan.current = new BroadcastChannel(channel)
      chan.current.onmessage = e => accept(e.data as T)
    } catch { chan.current = null }
    const onStorage = (e: StorageEvent) => { if (e.key === key && e.newValue) { try { accept(JSON.parse(e.newValue)) } catch { /* ignore */ } } }
    window.addEventListener('storage', onStorage)
    const poll = window.setInterval(() => accept(loadRaw<T>(key)), 1000)
    return () => { chan.current?.close(); window.removeEventListener('storage', onStorage); window.clearInterval(poll) }
  }, [key, channel])

  const commit = useCallback((next: T) => {
    const s = { ...next, updatedAt: Math.max(Date.now(), ref.current.updatedAt + 1) }
    ref.current = s
    setState(s)
    save(key, s)
    try { chan.current?.postMessage(s) } catch { /* ignore */ }
    return s
  }, [key])
  const update = useCallback((fn: (s: T) => T) => commit(fn(ref.current)), [commit])
  return { state, update, commit }
}

/**
 * Undo history on top of useSynced. Typing in one field (same `merge` key, under 1.5 s apart)
 * makes one undo step, not one per letter. Ctrl Z undoes, except while typing in a field.
 */
export function useUndoable<T extends Versioned>(synced: ReturnType<typeof useSynced<T>>) {
  const { state, update: rawUpdate, commit } = synced
  const history = useRef<T[]>([])
  const last = useRef({ merge: '', at: 0 })
  const [canUndo, setCanUndo] = useState(false)
  const update = (fn: (s: T) => T, merge = '') => {
    const now = Date.now()
    const join = merge && last.current.merge === merge && now - last.current.at < 1500
    last.current = { merge, at: now }
    rawUpdate(s => { if (!join) history.current = [...history.current.slice(-40), s]; return fn(s) })
    setCanUndo(true)
  }
  const undo = () => {
    const prev = history.current.pop(); if (!prev) return
    last.current = { merge: '', at: 0 }
    sfx.play('back'); commit({ ...prev }); setCanUndo(history.current.length > 0)
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !(e.target as HTMLElement).closest('input, textarea')) { e.preventDefault(); undo() } }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  })
  return { s: state, update, undo, canUndo }
}
