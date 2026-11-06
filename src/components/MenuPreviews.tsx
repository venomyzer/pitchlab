// Drawn previews for the menu's right-hand panel. They reuse the real views (scoreboard, pitch) with demo data,
// so what you see in the menu is what the tool looks like.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { byName, positions } from '../data/formations'
import { SCENARIOS } from '../data/fouls'
import { table, TEAMS } from '../data/leagues'
import { lineupSpots } from '../data/lineup'
import { isOffsidePosition, LESSONS, secondLast } from '../data/offside'
import { SET_PIECES, SHIRTS } from '../data/setpieces'
import { WORDS } from '../data/words'
import { GraphicsView } from '../features/graphics/GraphicsView'
import { GDEFAULT, type Graphic, type GState } from '../features/graphics/state'
import { FormationLines } from '../features/pitch/Lines'
import { Ball, Pitch, Token } from '../features/pitch/Pitch'
import { ScoreboardView } from '../features/scoreboard/ScoreboardView'
import { DEFAULT, type State } from '../features/scoreboard/state'

const BG = `${import.meta.env.BASE_URL}bg/menu-1920.jpg`

const DEMO: State = {
  ...DEFAULT,
  home: { ...DEFAULT.home, name: 'Blue', code: 'BLU', score: 2 },
  away: { ...DEFAULT.away, name: 'Red', code: 'RED', score: 1 },
  period: '2H',
  clock: { running: false, baseMs: (67 * 60 + 12) * 1000, startedAt: null },
  event: { id: 1, kind: 'goal', team: 'home', text: '', minute: "67'", at: 0 },
}

/** A 1920 x 1080 stream stage scaled into the preview box, over a dimmed stadium "stream". */
function StreamStage({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.4)
  useEffect(() => {
    const el = box.current; if (!el) return
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 1920))
    ro.observe(el); return () => ro.disconnect()
  }, [])
  return (
    <div ref={box} className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(4,16,11,.25), rgba(4,16,11,.45)), url(${BG})` }}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: 1920, height: 1080, transform: `scale(${scale})` }}>{children}</div>
      <span className="absolute right-4 bottom-4 text-[12px] tracking-[0.14em] uppercase text-white/80 bg-night-950/70 px-2 py-1 rounded-sm">Overlay preview</span>
    </div>
  )
}

/** The real on-stream scoreboard, mid-match with a goal pop-up. */
export function ScoreboardPreview() {
  return <StreamStage><ScoreboardView s={DEMO} now={0} reduce /></StreamStage>
}

const GDEMO: GState = {
  ...GDEFAULT,
  lower: { ...GDEFAULT.lower, items: [{ id: 1, name: 'Your name', title: 'Watch-along host', color: '#ffb31a' }] },
  prediction: { ...GDEFAULT.prediction, home: { name: 'Blue', code: 'BLU', color: '#3157ff', score: 2 }, away: { name: 'Red', code: 'RED', color: '#e5484d', score: 1 }, note: 'First goal before half-time' },
  ratings: { team: 'Blue', color: '#3157ff', motm: 3, players: [['GK', 'Keeper', 7], ['RB', 'Right back', 6.5], ['CB', 'Centre-back', 7], ['CM', 'Midfielder', 8.5], ['ST', 'Striker', 6], ['LW', 'Winger', 4.5]]
    .map(([pos, name, score]) => ({ pos: pos as string, name: name as string, score: score as number })) },
}
/** One of the stream graphics, drawn by the real overlay view with demo data. */
export function GraphicPreview({ g }: { g: Graphic }) {
  return <StreamStage><GraphicsView s={{ ...GDEMO, onAir: g }} now={0} reduce /></StreamStage>
}

function PitchFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-turf-2 p-3">
      <Pitch className="block h-full w-auto max-w-full">{children}</Pitch>
    </div>
  )
}

/** 4-3-3 building up against a 4-4-2 block, with formation lines. */
export function FormationPreview() {
  const f = byName('4-3-3'), o = byName('4-4-2')
  const b = positions(f, 'build'), r = positions(o, 'def', true)
  return (
    <PitchFrame>
      <FormationLines f={f} ph="build" pts={b} color="#e3e9ff" />
      {r.map((p, i) => <Token key={'r' + i} x={p.x} y={p.y} team="away" label={o.s[i][0]} />)}
      {b.map((p, i) => <Token key={'b' + i} x={p.x} y={p.y} team="home" label={f.s[i][0]} />)}
    </PitchFrame>
  )
}

/** A drawn move: a pass, a run and a shaded zone. */
export function SandboxPreview() {
  const f = byName('4-3-3'), o = byName('4-4-2')
  const b = positions(f, 'att'), r = positions(o, 'low', true)
  const ball = { x: b[6].x + 1.6, y: b[6].y + 1.2 }
  return (
    <PitchFrame>
      <rect x="88.5" y="13.84" width="16.5" height="40.32" fill="#ffb31a" fillOpacity=".18" stroke="#ffb31a" strokeWidth=".35" strokeDasharray="1 .6" />
      <line x1={ball.x} y1={ball.y} x2={b[8].x - 1.4} y2={b[8].y + 1.2} stroke="#fff" strokeWidth=".55" markerEnd="url(#arrW)" />
      <line x1={b[8].x} y1={b[8].y} x2={97} y2={20} stroke="#ffb31a" strokeWidth=".5" strokeDasharray="1.2 .8" markerEnd="url(#arrY)" />
      {r.map((p, i) => <Token key={'r' + i} x={p.x} y={p.y} team="away" label={o.s[i][0]} />)}
      {b.map((p, i) => <Token key={'b' + i} x={p.x} y={p.y} team="home" label={f.s[i][0]} />)}
      <Ball x={ball.x} y={ball.y} />
    </PitchFrame>
  )
}

/** Offside lesson 2: the receiver beyond the line, ringed. */
export function OffsidePreview() {
  const l = LESSONS[1], ps = l.players, sl = secondLast(ps)
  const pas = ps.find(p => p.id === l.passer)!, ballX = pas.x + 1.6
  return (
    <PitchFrame>
      <rect x={sl} y="0" width={105 - sl} height="68" fill="#ffb31a" opacity=".13" />
      <line x1={sl} x2={sl} y1="-1" y2="69" stroke="#ffb31a" strokeWidth=".55" strokeDasharray="1.6 1" />
      <text x={sl} y="-1.8" fontSize="2.3" fill="#ffb31a" textAnchor="middle" fontFamily="Saira Condensed, sans-serif" fontWeight={800}>OFFSIDE LINE</text>
      {ps.map(p => <Token key={p.id} x={p.x} y={p.y} team={p.team === 'blue' ? 'home' : 'away'} label={p.tag} ring={isOffsidePosition(p, ps, ballX)} />)}
      <Ball x={ballX} y={pas.y + 1.2} />
    </PitchFrame>
  )
}

/** The three OBS setups, so streamers can see which one fits before opening the guide. */
export function GuidePreview() {
  const rows = [
    ['Panel in OBS', 'Overlay and control panel both run inside OBS. Best for one screen.'],
    ['Hotkeys only', 'Press 1, 2 and Space in the overlay’s Interact window. No second window.'],
    ['Browser window', 'Overlay in Chrome, captured with a green-screen key.'],
  ]
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-3 px-10">
      {rows.map(([t, d]) => (
        <div key={t} className="border-l-[3px] border-flood-500 bg-night-950/60 px-5 py-3.5">
          <div className="font-display font-bold uppercase tracking-[0.1em] text-[22px] leading-none">{t}</div>
          <div className="mt-1.5 text-mist-300 text-[15px]">{d}</div>
        </div>
      ))}
    </div>
  )
}

/** The lineup card's pitch: a 4-3-3 with shirt numbers. */
export function LineupPreview() {
  const spots = lineupSpots('4-3-3'), nums = ['1', '2', '4', '5', '3', '8', '6', '10', '7', '9', '11']
  return (
    <PitchFrame>
      {spots.map((p, i) => <Token key={i} x={p.x} y={p.y} team="home" label={nums[i]} />)}
    </PitchFrame>
  )
}

/** A corner routine with its arrows. */
export function SetPiecePreview() {
  const sp = SET_PIECES[0]
  return (
    <PitchFrame>
      {sp.d.map((d, i) => d.t === 'pass'
        ? <line key={i} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke="#fff" strokeWidth=".55" markerEnd="url(#arrW)" />
        : <line key={i} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke="#ffb31a" strokeWidth=".5" strokeDasharray="1.2 .8" markerEnd="url(#arrY)" />)}
      {sp.r.map((p, i) => <Token key={'r' + i} x={p.x} y={p.y} team="away" label={SHIRTS[i]} />)}
      {sp.b.map((p, i) => <Token key={'b' + i} x={p.x} y={p.y} team="home" label={SHIRTS[i]} />)}
      <Ball x={sp.ball.x} y={sp.ball.y} />
    </PitchFrame>
  )
}

/** A rebuilt move: the pass and run, with a caption over the pitch. */
export function RebuildPreview() {
  return (
    <div className="absolute inset-0">
      <SandboxPreview />
      <span className="absolute left-5 bottom-5 font-display font-extrabold uppercase -skew-x-6 text-white bg-night-950/75 rounded px-3 py-1.5 text-[22px]">Frame 3 · The cut-back</span>
    </div>
  )
}

/** Foul scenario 3 at the moment of the late tackle, with the yellow card. */
export function FoulsPreview() {
  const s = SCENARIOS[2]
  return (
    <div className="absolute inset-0">
      <PitchFrame>
        <g transform={`translate(${s.spot.x} ${s.spot.y})`}>
          <circle r="4.2" fill="#ffb31a" opacity=".18" />
          <path d="M-1.6 -1.6L1.6 1.6M1.6 -1.6L-1.6 1.6" stroke="#ffb31a" strokeWidth=".7" strokeLinecap="round" />
        </g>
        {s.players.map(p => { const m = s.moves[p.id] ?? p; return <Token key={p.id} x={m.x} y={m.y} team={p.team === 'blue' ? 'home' : 'away'} label={p.tag} halo={p.id === 'd'} /> })}
        <Ball x={s.ballTo.x} y={s.ballTo.y} />
      </PitchFrame>
      <div className="absolute right-6 top-6 h-24 w-16 rounded-md bg-[#ffd400] rotate-[8deg] shadow-[0_12px_30px_-8px_rgba(0,0,0,.7)]" />
    </div>
  )
}

/** A finished mini league table. */
export function LeaguesPreview() {
  const rows = table([[2, 1], [0, 0], [3, 1], [1, 2], [1, 1], [2, 2]])
  return (
    <div className="absolute inset-0 flex items-center justify-center p-10">
      <div className="w-full max-w-[560px] bg-night-950/70 border border-line/60 rounded-sm">
        {rows.map((r, i) => (
          <div key={r.t} className={`flex items-center gap-4 px-5 h-14 border-b border-night-800 font-display font-bold uppercase tracking-wide text-[22px] ${i === 0 ? 'bg-flood-500/15' : ''}`}>
            <span className="w-6 text-mist-400">{i + 1}</span>
            <i className="h-4 w-4 rounded-full" style={{ background: TEAMS[r.t].color }} />
            <span className="flex-1">{TEAMS[r.t].name}</span>
            <span className="text-mist-400 text-[18px] w-16 text-right tabular">{r.gf - r.ga > 0 ? '+' : ''}{r.gf - r.ga}</span>
            <span className="w-12 text-right tabular">{r.pts}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Three glossary cards. */
export function WordsPreview() {
  const pick = ['Nutmeg', 'Clean sheet', 'Low block'].map(t => WORDS.find(w => w.term === t)!)
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-3 px-10">
      {pick.map(w => (
        <div key={w.term} className="border-l-[3px] border-flood-500 bg-night-950/60 px-5 py-3.5">
          <div className="font-display font-extrabold uppercase -skew-x-6 text-[26px] leading-none">{w.term}</div>
          <div className="mt-1.5 text-mist-300 text-[15px]">{w.def}</div>
        </div>
      ))}
    </div>
  )
}

/** A quiz question with the right answer marked. */
export function QuizPreview() {
  const opts = ['9.15 m', '11 m', '16.5 m', '5.5 m']
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-3 px-10">
      <div className="text-[13px] tracking-[0.14em] uppercase text-mist-300">Question 4 of 10 · Rules</div>
      <div className="font-display font-extrabold uppercase -skew-x-6 text-[34px] leading-[1.05]">How far is the penalty mark from the goal line?</div>
      <div className="grid grid-cols-2 gap-2 mt-1">
        {opts.map((o, i) => (
          <div key={o} className={`rounded-sm border px-4 py-3 text-[17px] font-semibold ${i === 1 ? 'border-ok bg-ok/15' : 'border-night-600 bg-night-950/50'}`}>
            <span className="font-mono text-[12px] text-mist-400 mr-2">{i + 1}</span>{o}{i === 1 && <span className="text-ok ml-2">✓</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

