// Drawn previews for the menu's right-hand panel. They reuse the real views (scoreboard, pitch) with demo data,
// so what you see in the menu is what the tool looks like.
import { useEffect, useRef, useState } from 'react'
import { byName, positions } from '../data/formations'
import { isOffsidePosition, LESSONS, secondLast } from '../data/offside'
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

/** The real on-stream scoreboard, mid-match with a goal pop-up, over a dimmed stadium "stream". */
export function ScoreboardPreview() {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.4)
  useEffect(() => {
    const el = box.current; if (!el) return
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 1920))
    ro.observe(el); return () => ro.disconnect()
  }, [])
  return (
    <div ref={box} className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(4,16,11,.25), rgba(4,16,11,.45)), url(${BG})` }}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: 1920, height: 1080, transform: `scale(${scale})` }}>
        <ScoreboardView s={DEMO} now={0} reduce />
      </div>
      <span className="absolute right-4 bottom-4 text-[12px] tracking-[0.14em] uppercase text-white/80 bg-night-950/70 px-2 py-1 rounded-sm">Overlay preview</span>
    </div>
  )
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
      <FormationLines f={f} ph="build" pts={b} color="#e3e9ff" badges />
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
