import { loadRaw } from '../../lib/storage'
import { useSynced, useUndoable } from '../../lib/synced'

// On-stream graphics other than the scoreboard: lower thirds, prediction card, player ratings and the lineup card.
// One graphic is on air at a time. Synced to /overlay/graphics the same way as the scoreboard.
export type Graphic = 'lower' | 'prediction' | 'ratings' | 'lineup'
export type LowerItem = { id: number; name: string; title: string; color: string }
export type PTeam = { name: string; code: string; color: string; score: number }
export type Rated = { name: string; pos: string; score: number | null }
export type Side = 'left' | 'center' | 'right'
export type GState = {
  v: 1
  updatedAt: number
  onAir: Graphic | null
  /** When the current graphic went on air (for the lower-third auto-hide). */
  shownAt: number
  lower: { items: LowerItem[]; cur: number; side: Side; autoHide: number }
  prediction: { home: PTeam; away: PTeam; by: string; note: string }
  ratings: { team: string; color: string; players: Rated[]; motm: number }
  lineup: { team: string; color: string; formation: string; names: string[]; numbers: string[]; subs: string; coach: string }
  style: { size: number; theme: 'night' | 'light' }
}

export const GRAPHIC_NAME: Record<Graphic, string> = { lower: 'Lower third', prediction: 'Prediction card', ratings: 'Player ratings', lineup: 'Lineup card' }
export const LOWER_COLORS = ['#ffb31a', '#3157ff', '#e5484d', '#1f9d55', '#5ad1ff', '#7c3aed', '#ffffff']

export const GDEFAULT: GState = {
  v: 1, updatedAt: 0, onAir: null, shownAt: 0,
  lower: { items: [{ id: 1, name: 'Your name', title: 'Watch-along host', color: '#ffb31a' }], cur: 0, side: 'left', autoHide: 0 },
  prediction: {
    home: { name: 'Home', code: 'HOM', color: '#3157ff', score: 2 },
    away: { name: 'Away', code: 'AWY', color: '#e5484d', score: 1 },
    by: '', note: '',
  },
  ratings: { team: 'Home', color: '#3157ff', players: [], motm: -1 },
  lineup: { team: 'Home', color: '#3157ff', formation: '4-3-3', names: Array(11).fill(''), numbers: Array(11).fill(''), subs: '', coach: '' },
  style: { size: 1, theme: 'night' },
}

const KEY = 'pitchlab:graphics'
const CHANNEL = 'pitchlab-graphics'

function readStored(): GState {
  const raw = loadRaw<Partial<GState>>(KEY)
  if (!raw || raw.v !== 1) return GDEFAULT
  const d = GDEFAULT
  return {
    ...d, ...raw,
    lower: { ...d.lower, ...raw.lower, items: raw.lower?.items?.length ? raw.lower.items : d.lower.items },
    prediction: { ...d.prediction, ...raw.prediction, home: { ...d.prediction.home, ...raw.prediction?.home }, away: { ...d.prediction.away, ...raw.prediction?.away } },
    ratings: { ...d.ratings, ...raw.ratings },
    lineup: { ...d.lineup, ...raw.lineup },
    style: { ...d.style, ...raw.style },
  } as GState
}

export const useGraphics = () => useSynced<GState>(KEY, CHANNEL, readStored)
/** Graphics state with undo history and Ctrl Z, for the control pages. */
export function useGraphicsControl() { return useUndoable(useGraphics()) }

/** Is this graphic showing on the overlay right now? Lower thirds can hide themselves after a few seconds. */
export function isLive(s: GState, g: Graphic, now: number) {
  if (s.onAir !== g) return false
  return !(g === 'lower' && s.lower.autoHide > 0 && now - s.shownAt > s.lower.autoHide * 1000)
}

// ---------- actions (pure) ----------
export const G = {
  show(s: GState, g: Graphic): GState { return { ...s, onAir: g, shownAt: Date.now() } },
  hide(s: GState): GState { return { ...s, onAir: null } },
  /** Show, or hide if it's already showing. */
  toggle(s: GState, g: Graphic, now = Date.now()): GState { return isLive(s, g, now) ? G.hide(s) : G.show(s, g) },
  lowerPatch(s: GState, i: number, p: Partial<LowerItem>): GState {
    return { ...s, lower: { ...s.lower, items: s.lower.items.map((x, k) => (k === i ? { ...x, ...p } : x)) } }
  },
  lowerAdd(s: GState): GState {
    const id = Math.max(0, ...s.lower.items.map(x => x.id)) + 1
    const items = [...s.lower.items, { id, name: '', title: '', color: s.lower.items[s.lower.cur]?.color ?? '#ffb31a' }]
    return { ...s, lower: { ...s.lower, items, cur: items.length - 1 } }
  },
  lowerRemove(s: GState, i: number): GState {
    if (s.lower.items.length <= 1) return s
    const items = s.lower.items.filter((_, k) => k !== i)
    const cur = Math.min(items.length - 1, s.lower.cur > i ? s.lower.cur - 1 : s.lower.cur)
    return { ...s, lower: { ...s.lower, items, cur }, onAir: s.onAir === 'lower' && s.lower.cur === i ? null : s.onAir }
  },
  /** Pick a lower third. If lower thirds are on air, the new one goes on air straight away. */
  lowerPick(s: GState, i: number): GState {
    const next = { ...s, lower: { ...s.lower, cur: i } }
    return s.onAir === 'lower' ? { ...next, shownAt: Date.now() } : next
  },
  ratingsSet(s: GState, i: number, p: Partial<Rated>): GState {
    return { ...s, ratings: { ...s.ratings, players: s.ratings.players.map((x, k) => (k === i ? { ...x, ...p } : x)) } }
  },
}

/** Ratings run 1 to 10 in half steps. */
export const clampRating = (n: number) => Math.max(1, Math.min(10, Math.round(n * 2) / 2))
export const ratingColor = (n: number) => (n >= 8 ? '#3ddc84' : n >= 6.5 ? '#ffb31a' : n >= 5 ? '#ff8a1a' : '#ff5d5d')
