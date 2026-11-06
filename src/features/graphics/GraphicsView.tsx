import { AnimatePresence, motion } from 'framer-motion'
import type { CSSProperties, ReactNode } from 'react'
import { lineupSpots } from '../../data/lineup'
import { onColor } from '../scoreboard/ScoreboardView'
import { isLive, ratingColor, type Graphic, type GState } from './state'

type Ink = { dark: string; dark2: string; ink: string; mute: string }
const inkFor = (s: GState): Ink => s.style.theme === 'light'
  ? { dark: '#ffffff', dark2: '#eef1f6', ink: '#0b0f1c', mute: '#5a6480' }
  : { dark: '#0b0f1c', dark2: '#141a2c', ink: '#ffffff', mute: '#9aa5c2' }
const SHADOW = 'shadow-[0_14px_40px_-12px_rgba(0,0,0,.6)]'
const unskew = { transform: 'skewX(8deg)' }

/**
 * The on-stream graphics, drawn on a 1920 x 1080 stage. Pure view: give it a state and a clock.
 * `only` limits it to one graphic, so streamers can give each graphic its own OBS source.
 */
export function GraphicsView({ s, now, reduce, only }: { s: GState; now: number; reduce?: boolean; only?: Graphic | null }) {
  const g = s.onAir && (!only || only === s.onAir) && isLive(s, s.onAir, now) ? s.onAir : null
  const k = inkFor(s)
  const key = g === 'lower' ? `lower-${s.lower.items[s.lower.cur]?.id}-${s.shownAt}` : g
  return (
    <AnimatePresence>
      {g && (
        <Enter key={key} reduce={reduce} from={g === 'ratings' ? 'right' : g === 'lineup' ? 'left' : 'below'} style={place(g, s)}>
          {g === 'lower' && <LowerThird s={s} k={k} reduce={reduce} />}
          {g === 'prediction' && <PredictionCard s={s} k={k} />}
          {g === 'ratings' && <RatingsCard s={s} k={k} />}
          {g === 'lineup' && <LineupCard s={s} k={k} />}
        </Enter>
      )}
    </AnimatePresence>
  )
}

function place(g: Graphic, s: GState): CSSProperties {
  const sc = s.style.size
  if (g === 'lower') {
    const side = s.lower.side
    const h = side === 'left' ? { left: 96 } : side === 'right' ? { right: 96 } : { left: '50%' }
    return { ...h, bottom: 110, transform: `${side === 'center' ? 'translateX(-50%) ' : ''}scale(${sc})`, transformOrigin: `${side} bottom` }
  }
  if (g === 'prediction') return { left: '50%', bottom: 110, transform: `translateX(-50%) scale(${sc})`, transformOrigin: 'center bottom' }
  if (g === 'ratings') return { right: 80, top: '50%', transform: `translateY(-50%) scale(${sc})`, transformOrigin: 'right center' }
  return { left: 80, top: '50%', transform: `translateY(-50%) scale(${sc})`, transformOrigin: 'left center' }
}

function Enter({ children, reduce, from, style }: { children: ReactNode; reduce?: boolean; from: 'left' | 'right' | 'below'; style: CSSProperties }) {
  const off = from === 'left' ? { x: -40 } : from === 'right' ? { x: 40 } : { y: 24 }
  return (
    <div className="absolute" style={style}>
      <motion.div initial={reduce ? { opacity: 0 } : { opacity: 0, ...off }} animate={{ opacity: 1, x: 0, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, ...off }} transition={{ duration: reduce ? 0.2 : 0.45, ease: [0.2, 0.8, 0.2, 1] }}>
        {children}
      </motion.div>
    </div>
  )
}

function LowerThird({ s, k, reduce }: { s: GState; k: Ink; reduce?: boolean }) {
  const it = s.lower.items[s.lower.cur]
  if (!it) return null
  return (
    <div className={`flex items-stretch font-broadcast ${SHADOW}`} style={{ transform: 'skewX(-8deg)' }}>
      <motion.span className="w-[14px] rounded-l-[6px]" style={{ background: it.color }}
        initial={reduce ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.3 }} />
      <div className="flex flex-col">
        <div className="px-7 pt-3 pb-2 min-w-[420px] rounded-tr-[6px]" style={{ background: k.dark, color: k.ink }}>
          <div className="font-extrabold uppercase text-[52px] leading-none tracking-wide max-w-[1100px] truncate" style={unskew}>{it.name || ' '}</div>
        </div>
        {it.title && (
          <div className="self-start px-7 py-1.5 rounded-br-[6px]" style={{ background: it.color, color: onColor(it.color) }}>
            <div className="font-bold uppercase text-[26px] leading-none tracking-[0.06em] max-w-[1100px] truncate" style={unskew}>{it.title}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function PredictionCard({ s, k }: { s: GState; k: Ink }) {
  const p = s.prediction
  const team = (t: GState['prediction']['home'], right?: boolean) => (
    <div className={`flex items-stretch ${right ? 'flex-row-reverse' : ''}`} style={{ background: k.dark2, color: k.ink }}>
      <span className="w-[12px]" style={{ background: t.color }} />
      <span className="flex items-center justify-center px-6 min-w-[150px] text-[44px] font-extrabold tracking-wide" style={unskew}>{t.code || '—'}</span>
    </div>
  )
  return (
    <div className="flex flex-col items-center font-broadcast">
      <div className="px-5 py-1.5 rounded-t-[6px] bg-[#ffb31a] text-[#0b0f1c] font-extrabold uppercase tracking-[0.16em] text-[24px]" style={{ transform: 'skewX(-8deg)' }}>
        <span className="block" style={unskew}>{p.by ? `${p.by}’s prediction` : 'My prediction'}</span>
      </div>
      <div className={`flex items-stretch h-[86px] ${SHADOW}`} style={{ transform: 'skewX(-8deg)' }}>
        <span className="rounded-l-[6px] overflow-hidden flex">{team(p.home)}</span>
        <div className="flex items-center px-7 bg-white text-[#0b0f1c]">
          <span className="tabular text-[60px] font-extrabold leading-none flex items-center gap-4" style={unskew}>{p.home.score}<span className="text-[38px] opacity-40">–</span>{p.away.score}</span>
        </div>
        <span className="rounded-r-[6px] overflow-hidden flex">{team(p.away, true)}</span>
      </div>
      {p.note && (
        <div className="mt-2 px-6 py-2 rounded-[6px] max-w-[900px]" style={{ background: k.dark, color: k.mute, transform: 'skewX(-8deg)' }}>
          <div className="font-semibold text-[24px] leading-tight truncate" style={unskew}>{p.note}</div>
        </div>
      )}
    </div>
  )
}

function RatingsCard({ s, k }: { s: GState; k: Ink }) {
  const r = s.ratings
  const rows = r.players.map((p, i) => ({ ...p, i })).filter(p => p.name.trim()).slice(0, 16)
  return (
    <div className={`w-[600px] font-broadcast rounded-[6px] overflow-hidden ${SHADOW}`} style={{ background: k.dark, color: k.ink }}>
      <div className="flex items-stretch" style={{ background: k.dark2 }}>
        <span className="w-[12px]" style={{ background: r.color }} />
        <div className="px-5 py-3 flex items-baseline gap-4 min-w-0">
          <span className="font-extrabold uppercase text-[34px] leading-none tracking-wide">Player ratings</span>
          <span className="font-bold uppercase text-[24px] leading-none truncate" style={{ color: k.mute }}>{r.team}</span>
        </div>
      </div>
      <ul className="py-1.5">
        {rows.length === 0 && <li className="px-5 py-3 text-[24px]" style={{ color: k.mute }}>No players yet</li>}
        {rows.map(p => (
          <li key={p.i} className="flex items-center gap-3 px-5 h-[46px]">
            <span className="w-[54px] text-[20px] font-bold uppercase" style={{ color: k.mute }}>{p.pos}</span>
            <span className="flex-1 min-w-0 truncate text-[28px] font-bold uppercase tracking-wide">{p.name}</span>
            {r.motm === p.i && <span className="px-2 py-0.5 rounded-[3px] bg-[#ffb31a] text-[#0b0f1c] text-[18px] font-extrabold tracking-[0.1em]">MOTM</span>}
            <span className="w-[64px] h-[36px] grid place-items-center rounded-[4px] tabular text-[26px] font-extrabold"
              style={p.score == null ? { background: k.dark2, color: k.mute } : { background: ratingColor(p.score), color: '#0b0f1c' }}>
              {p.score == null ? '–' : p.score.toFixed(1)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function LineupCard({ s, k }: { s: GState; k: Ink }) {
  const l = s.lineup
  const spots = lineupSpots(l.formation)
  const subs = l.subs.split(/[\n,]/).map(x => x.trim()).filter(Boolean).slice(0, 12)
  return (
    <div className={`w-[480px] font-broadcast rounded-[6px] overflow-hidden ${SHADOW}`} style={{ background: k.dark, color: k.ink }}>
      <div className="flex items-stretch" style={{ background: k.dark2 }}>
        <span className="w-[12px]" style={{ background: l.color }} />
        <div className="px-5 py-3 flex items-baseline gap-4 min-w-0 flex-1">
          <span className="font-extrabold uppercase text-[34px] leading-none tracking-wide truncate">{l.team || 'Lineup'}</span>
          <span className="ml-auto font-bold text-[26px] leading-none" style={{ color: k.mute }}>{l.formation}</span>
        </div>
      </div>
      <div className="p-4">
        <svg viewBox="-1 -1 70 107" className="block w-full h-auto rounded-[4px]" style={{ background: '#2b8146' }}>
          <g fill="none" stroke="#fff" strokeWidth=".35" opacity=".7">
            <rect x="0" y="0" width="68" height="105" /><line x1="0" y1="52.5" x2="68" y2="52.5" /><circle cx="34" cy="52.5" r="9.15" />
            <rect x="13.84" y="88.5" width="40.32" height="16.5" /><rect x="13.84" y="0" width="40.32" height="16.5" />
          </g>
          {spots.map((p, i) => {
            const x = p.y, y = 105 - p.x, num = l.numbers[i]?.trim(), name = l.names[i]?.trim()
            return (
              <g key={i} transform={`translate(${x} ${y})`}>
                <circle r="3" fill={l.color} stroke="#fff" strokeWidth=".45" />
                {num && <text y="1.05" fontSize="2.9" fontWeight={800} fill={onColor(l.color)} textAnchor="middle" fontFamily="Saira Condensed, sans-serif">{num}</text>}
                {name && <text y="6.6" fontSize="2.9" fontWeight={700} fill="#fff" textAnchor="middle" fontFamily="Saira Condensed, sans-serif"
                  stroke="rgba(0,30,10,.75)" strokeWidth=".6" paintOrder="stroke">{name.length > 14 ? name.slice(0, 13) + '…' : name}</text>}
              </g>
            )
          })}
        </svg>
        {(subs.length > 0 || l.coach) && (
          <div className="mt-3 text-[22px] leading-snug">
            {subs.length > 0 && <div><span className="font-extrabold uppercase tracking-[0.1em]" style={{ color: k.mute }}>Subs </span>{subs.join(', ')}</div>}
            {l.coach && <div className="mt-1"><span className="font-extrabold uppercase tracking-[0.1em]" style={{ color: k.mute }}>Coach </span>{l.coach}</div>}
          </div>
        )}
      </div>
    </div>
  )
}
