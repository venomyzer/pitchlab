import { useCallback, useEffect, useRef, useState } from 'react'
import { loadRaw, save } from '../../lib/storage'

export type Side = 'home' | 'away'
export type Team = { name: string; code: string; color: string; score: number }
export type EventKind = 'goal' | 'yellow' | 'red' | 'var' | 'sub'
export type SBEvent = { id: number; kind: EventKind; team: Side | null; text: string; minute: string; at: number }
export type Period = 'PRE' | '1H' | 'HT' | '2H' | 'ET1' | 'ET2' | 'PEN' | 'FT'
export type Position = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
export type Style = { position: Position; size: number; theme: 'night' | 'light'; showPeriod: boolean; events: boolean; sounds: boolean }
export type State = {
  v: 1
  updatedAt: number
  home: Team
  away: Team
  clock: { running: boolean; baseMs: number; startedAt: number | null }
  period: Period
  added: number
  event: SBEvent | null
  log: SBEvent[]
  style: Style
}

export const PERIODS: { v: Period; label: string; start: number | null; end: number | null }[] = [
  { v: 'PRE', label: 'Pre-match', start: 0, end: null },
  { v: '1H', label: '1st half', start: 0, end: 45 },
  { v: 'HT', label: 'Half-time', start: null, end: null },
  { v: '2H', label: '2nd half', start: 45, end: 90 },
  { v: 'ET1', label: 'ET 1st', start: 90, end: 105 },
  { v: 'ET2', label: 'ET 2nd', start: 105, end: 120 },
  { v: 'PEN', label: 'Penalties', start: null, end: null },
  { v: 'FT', label: 'Full-time', start: null, end: null },
]
export const SWATCHES = ['#3157ff', '#0b2a7a', '#5ad1ff', '#e5484d', '#9b1c31', '#ff8a1a', '#ffd400', '#1f9d55', '#0f5132', '#ffffff', '#1a1a1a', '#7c3aed']

export const DEFAULT: State = {
  v: 1, updatedAt: 0,
  home: { name: 'Home', code: 'HOM', color: '#3157ff', score: 0 },
  away: { name: 'Away', code: 'AWY', color: '#e5484d', score: 0 },
  clock: { running: false, baseMs: 0, startedAt: null },
  period: 'PRE', added: 0, event: null, log: [],
  style: { position: 'top-left', size: 1, theme: 'night', showPeriod: true, events: true, sounds: false },
}

const KEY = 'pitchlab:scoreboard'
const CHANNEL = 'pitchlab-scoreboard'

export function elapsedMs(s: State, now = Date.now()) {
  return s.clock.baseMs + (s.clock.running && s.clock.startedAt ? now - s.clock.startedAt : 0)
}
const pad = (n: number) => String(n).padStart(2, '0')
/** Main clock and stoppage time the way TV shows it: the clock holds at 45:00 and "+1:23" counts on. */
export function clockText(s: State, now = Date.now()) {
  const ms = Math.max(0, elapsedMs(s, now)), end = PERIODS.find(p => p.v === s.period)?.end
  if (end != null && ms >= end * 60000) {
    const over = Math.floor((ms - end * 60000) / 1000)
    return { main: `${end}:00`, over: `+${Math.floor(over / 60)}:${pad(over % 60)}` }
  }
  const sec = Math.floor(ms / 1000)
  return { main: `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`, over: '' }
}
export function minuteText(s: State, now = Date.now()) {
  const ms = elapsedMs(s, now), end = PERIODS.find(p => p.v === s.period)?.end
  const m = Math.floor(ms / 60000) + 1
  if (end != null && m > end) return `${end}+${m - end}'`
  return `${Math.max(1, m)}'`
}

function readStored(): State {
  const raw = loadRaw<Partial<State>>(KEY)
  if (!raw || raw.v !== 1) return DEFAULT
  return { ...DEFAULT, ...raw, home: { ...DEFAULT.home, ...raw.home }, away: { ...DEFAULT.away, ...raw.away }, style: { ...DEFAULT.style, ...raw.style }, clock: { ...DEFAULT.clock, ...raw.clock } } as State
}

/**
 * Shared scoreboard state. Every copy of the app open in the same browser stays in sync:
 * BroadcastChannel for instant updates, the storage event as a second path, and a slow poll as a last resort.
 * State is saved on every change, so a refresh or an OBS restart never loses the score.
 */
export function useScoreboard() {
  const [state, setState] = useState<State>(readStored)
  const ref = useRef(state); ref.current = state
  const chan = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    const accept = (s: State | null) => { if (s && s.v === 1 && s.updatedAt > ref.current.updatedAt) setState(s) }
    try {
      chan.current = new BroadcastChannel(CHANNEL)
      chan.current.onmessage = e => accept(e.data as State)
    } catch { chan.current = null }
    const onStorage = (e: StorageEvent) => { if (e.key === KEY && e.newValue) { try { accept(JSON.parse(e.newValue)) } catch { /* ignore */ } } }
    window.addEventListener('storage', onStorage)
    const poll = window.setInterval(() => accept(loadRaw<State>(KEY)), 1000)
    return () => { chan.current?.close(); window.removeEventListener('storage', onStorage); window.clearInterval(poll) }
  }, [])

  const commit = useCallback((next: State) => {
    const s = { ...next, updatedAt: Math.max(Date.now(), ref.current.updatedAt + 1) }
    ref.current = s
    setState(s)
    save(KEY, s)
    try { chan.current?.postMessage(s) } catch { /* ignore */ }
    return s
  }, [])
  const update = useCallback((fn: (s: State) => State) => commit(fn(ref.current)), [commit])
  return { state, update, commit }
}

/** A ticking "now" so clocks re-render. */
export function useNow(ms = 250) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), ms); return () => window.clearInterval(t) }, [ms])
  return now
}

// ---------- actions (pure) ----------
let eid = Date.now()
export const A = {
  score(s: State, side: Side, delta: number): State { return { ...s, [side]: { ...s[side], score: Math.max(0, s[side].score + delta) } } },
  event(s: State, kind: EventKind, team: Side | null, text: string): State {
    const e: SBEvent = { id: ++eid, kind, team, text: text.trim(), minute: minuteText(s), at: Date.now() }
    return { ...s, event: e, log: [e, ...s.log].slice(0, 40) }
  },
  goal(s: State, side: Side, scorer: string): State { return A.event(A.score(s, side, 1), 'goal', side, scorer) },
  clearEvent(s: State): State { return { ...s, event: null } },
  start(s: State): State { return s.clock.running ? s : { ...s, clock: { ...s.clock, running: true, startedAt: Date.now() } } },
  pause(s: State): State { return s.clock.running ? { ...s, clock: { running: false, startedAt: null, baseMs: elapsedMs(s) } } : s },
  toggle(s: State): State { return s.clock.running ? A.pause(s) : A.start(s) },
  adjust(s: State, deltaMs: number): State {
    const base = Math.max(0, elapsedMs(s) + deltaMs)
    return { ...s, clock: { ...s.clock, baseMs: base, startedAt: s.clock.running ? Date.now() : null } }
  },
  setTime(s: State, ms: number): State { return { ...s, clock: { ...s.clock, baseMs: Math.max(0, ms), startedAt: s.clock.running ? Date.now() : null } } },
  period(s: State, p: Period): State {
    const def = PERIODS.find(x => x.v === p)!
    const next = { ...s, period: p, added: 0 }
    if (def.start != null) return { ...next, clock: { running: false, startedAt: null, baseMs: def.start * 60000 } }
    return { ...next, clock: { running: false, startedAt: null, baseMs: elapsedMs(s) } }
  },
  resetMatch(s: State): State { return { ...DEFAULT, home: { ...s.home, score: 0 }, away: { ...s.away, score: 0 }, style: s.style } },
}
