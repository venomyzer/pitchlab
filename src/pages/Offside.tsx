import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Shell } from '../components/Shell'
import { PitchTag, ToolLayout } from '../components/ToolLayout'
import { Btn, Kbd, Label } from '../components/ui'
import { HALF, isOffsidePosition, LESSONS, secondLast, type OP } from '../data/offside'
import { Ball, Pitch, toPitch, Token } from '../features/pitch/Pitch'
import { easeOut, tween } from '../features/pitch/tween'
import { useReducedMotion } from '../lib/settings'
import { sfx } from '../lib/sound'

type Verdict = { kind: 'wait' | 'ok' | 'bad'; title: string; why: string }
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export default function Offside() {
  const reduce = useReducedMotion()
  const [li, setLi] = useState(0)
  const [step, setStep] = useState(0)
  const [players, setPlayers] = useState<OP[]>([])
  const [ball, setBall] = useState({ x: 0, y: 0 })
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null)
  const [ringIds, setRingIds] = useState<string[]>([])
  const [verdict, setVerdict] = useState<Verdict>({ kind: 'wait', title: '', why: '' })
  const cancel = useRef<() => void>(() => {})
  const svg = useRef<SVGSVGElement>(null)
  const lesson = LESSONS[li]
  const sandbox = !!lesson.sandbox

  const load = useCallback((i: number) => {
    cancel.current()
    const n = (i + LESSONS.length) % LESSONS.length, l = LESSONS[n]
    setLi(n); setStep(0); setGhost(null); setRingIds([])
    const ps = l.players.map(p => ({ ...p }))
    setPlayers(ps)
    const pas = ps.find(p => p.id === l.passer)
    setBall(l.ball ? { ...l.ball } : { x: (pas?.x ?? 52) + 1.6, y: (pas?.y ?? 34) + 1.2 })
    setVerdict(l.sandbox ? { kind: 'wait', title: '', why: '' } : { kind: 'wait', title: 'Watch the pass', why: 'Where is number 11 right now? Make your call before the next step.' })
  }, [])
  useEffect(() => { load(0) }, [load])

  const playPass = useCallback(() => {
    const l = LESSONS[li], rec = players.find(p => p.id === l.rec)!
    setGhost({ x: rec.x, y: rec.y }); setRingIds(players.filter(p => isOffsidePosition(p, players, ball.x)).map(p => p.id))
    const end = l.run ?? { x: rec.x, y: rec.y }
    const target = { x: end.x - 1.2, y: end.y + 1 }
    sfx.play('whoosh')
    cancel.current = tween([[ball], [{ x: rec.x, y: rec.y }]], [[target], [end]], reduce ? 1 : 1500, ([[b], [r]]) => {
      setBall(b); setPlayers(ps => ps.map(p => (p.id === rec.id ? { ...p, x: r.x, y: r.y } : p)))
    }, () => {
      const [k, t, w] = l.verdict!
      setVerdict({ kind: k, title: t, why: w })
      sfx.play(k === 'bad' ? 'whistle' : 'select')
    }, easeOut)
  }, [li, players, ball, reduce])

  const next = useCallback(() => {
    if (sandbox) return
    if (step === 0) { setStep(1); sfx.play('toggle'); setVerdict({ kind: 'wait', title: 'Freeze', why: 'Offside is judged at the moment the ball is played. This yellow line is the second-last defender.' }) }
    else if (step === 1) { setStep(2); playPass() }
    else load(li)
  }, [sandbox, step, playPass, load, li])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.code === 'Space' && (e.target as HTMLElement).closest('button, a, [role="switch"]')) || (e.target as HTMLElement).closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.code === 'Space') { e.preventDefault(); next() }
      else if (e.key === 'r' || e.key === 'R') { sfx.play('back'); load(li) }
      else if (e.key === 'ArrowRight') { sfx.play('hover'); load(li + 1) }
      else if (e.key === 'ArrowLeft') { sfx.play('hover'); load(li - 1) }
      else if (/^[1-8]$/.test(e.key)) { sfx.play('hover'); load(+e.key - 1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, load, li])

  // sandbox dragging
  const drag = useRef<string | null>(null)
  const onDown = (e: React.PointerEvent) => {
    if (!sandbox) return
    const id = (e.target as Element).closest('[data-token]')?.getAttribute('data-token')
    if (!id) return
    drag.current = id; (e.currentTarget as Element).setPointerCapture(e.pointerId); e.preventDefault()
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || !svg.current) return
    const q = toPitch(svg.current, e), x = clamp(q.x, 0, 105), y = clamp(q.y, 0, 68)
    if (drag.current === 'ball') setBall({ x, y })
    else setPlayers(ps => ps.map(p => (p.id === drag.current ? { ...p, x, y } : p)))
  }
  const onUp = () => { drag.current = null }

  if (!players.length) return null
  const sl = secondLast(players)
  const showLine = sandbox || step >= 1
  const thr = Math.max(sl, ball.x, HALF)
  const showBallLine = showLine && ball.x > sl + 0.3
  const sandboxOff = players.filter(p => isOffsidePosition(p, players, ball.x))
  const sandboxVerdict: Verdict = sandboxOff.length
    ? { kind: 'bad', title: sandboxOff.length === 1 ? '1 in offside position' : `${sandboxOff.length} in offside position`, why: `Shirt ${sandboxOff.map(p => p.tag).join(', ')}. Only an offence if the ball is played to them or they get involved.` }
    : { kind: 'ok', title: 'All onside', why: 'No blue player is beyond both the yellow line and the ball.' }
  const v = sandbox ? sandboxVerdict : verdict

  const pitch = (
    <Pitch ref={svg} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} aria-label={`Offside lesson: ${lesson.title}`}>
      {lesson.half && <rect x="0" y="0" width={HALF} height="68" fill="#fff" opacity=".1" />}
      <g opacity={showLine ? 1 : 0} style={{ transition: 'opacity .35s' }}>
        <rect x={thr} y="0" width={Math.max(0, 105 - thr)} height="68" fill="#ffb31a" opacity=".13" />
        <line x1={sl} x2={sl} y1="-1" y2="69" stroke="#ffb31a" strokeWidth=".55" strokeDasharray="1.6 1" />
        <text x={sl} y="-1.8" fontSize="2.3" fill="#ffb31a" textAnchor="middle" fontFamily="Saira Condensed, sans-serif" fontWeight={800}>OFFSIDE LINE</text>
        {showBallLine && <><line x1={ball.x} x2={ball.x} y1="-1" y2="69" stroke="#fff" strokeWidth=".4" strokeDasharray=".8 .8" />
          <text x={ball.x} y="71" fontSize="2.1" fill="#fff" textAnchor="middle" fontFamily="Saira Condensed, sans-serif" fontWeight={700}>BALL</text></>}
      </g>
      {ghost && <circle cx={ghost.x} cy={ghost.y} r="2.15" fill="none" stroke="#fff" strokeWidth=".35" strokeDasharray=".6 .5" />}
      {players.map(p => <Token key={p.id} dataId={p.id} x={p.x} y={p.y} team={p.team === 'blue' ? 'home' : 'away'} label={p.tag}
        ring={sandbox ? sandboxOff.some(o => o.id === p.id) : ringIds.includes(p.id)} halo={!sandbox && p.id === lesson.rec} />)}
      <Ball x={ball.x} y={ball.y} />
    </Pitch>
  )

  const panel = (
    <>
      <div>
        <Label>Lessons</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {LESSONS.map((l, i) => (
            <button key={l.key} type="button" onClick={() => { sfx.play('select'); load(i) }} aria-current={i === li}
              className={`focus-invert flex items-baseline gap-2 text-left rounded-md border px-2.5 py-2 text-[14px] font-medium transition-colors ${l.sandbox ? 'col-span-2' : ''}
                ${i === li ? 'bg-flood-500 border-flood-500 text-night-950' : 'border-night-600 hover:border-flood-500 text-mist-100'}`}>
              <span className={`font-mono text-[11px] ${i === li ? 'text-night-950/60' : 'text-mist-400'}`}>{i + 1}</span>{l.key}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h2 className="font-display font-extrabold uppercase text-3xl -skew-x-6 leading-none">{lesson.title}</h2>
        <p className="mt-2 text-mist-300 leading-relaxed">{lesson.text}</p>
      </div>
      <VerdictCard v={v} />
      {!sandbox && (
        <div className="flex gap-2">
          <Btn variant="primary" size="lg" className="flex-1" hint="Space" sound={null} onClick={next}>{['Show the line', 'Play the pass', 'Watch again'][step]}</Btn>
          <Btn size="lg" variant="ghost" hint="R" sound="back" onClick={() => load(li)}>Reset</Btn>
        </div>
      )}
      <div className="flex gap-2 items-center text-[13px] text-mist-400">
        <span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-home inline-block" />Attacking</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-away inline-block" />Defending</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-0.5 w-4 bg-flood-500 inline-block" />Offside line</span>
      </div>
      <p className="text-[13px] text-mist-400 leading-relaxed border-t border-night-700 pt-3">
        No offside straight from a goal kick, throw-in or corner. Canada’s Premier League is trialling a “daylight” version in 2026; other competitions use the rule shown here.
      </p>
    </>
  )

  return (
    <Shell back="/learn" eyebrow="Learn football" title="The Offside Rule" wide>
      <ToolLayout pitch={pitch} panel={panel}
        tagLeft={<PitchTag big>{sandbox ? 'Sandbox' : `Lesson ${li + 1} · ${lesson.key}`}</PitchTag>}
        tagRight={<PitchTag>{sandbox ? 'Drag to test' : `Step ${Math.min(step + 1, 3)} of 3`}</PitchTag>}
        hotkeys={<><span className="inline-flex gap-1.5 items-center"><Kbd>Space</Kbd> next step</span><span className="inline-flex gap-1.5 items-center"><Kbd>←</Kbd><Kbd>→</Kbd> lessons</span><span className="inline-flex gap-1.5 items-center"><Kbd>R</Kbd> reset</span><span className="inline-flex gap-1.5 items-center"><Kbd>Esc</Kbd> back</span></>} />
    </Shell>
  )
}

function VerdictCard({ v }: { v: Verdict }) {
  const color = v.kind === 'ok' ? 'text-ok' : v.kind === 'bad' ? 'text-bad' : 'text-mist-300'
  return (
    <div className={`relative rounded-lg border p-3.5 flex gap-3 items-center min-h-[92px] overflow-hidden ${v.kind === 'bad' ? 'border-bad/50 bg-bad/10' : v.kind === 'ok' ? 'border-ok/40 bg-ok/10' : 'border-night-600 bg-night-900/60'}`}>
      <svg viewBox="0 0 44 52" className="h-12 w-11 shrink-0" aria-hidden>
        <rect x="10" y="6" width="3" height="44" rx="1.5" fill="#8f9bb8" />
        <motion.g style={{ originX: '12px', originY: '8px' }} animate={v.kind === 'bad' ? { rotate: 0, scale: 1, opacity: 1 } : { rotate: 80, scale: 0.6, opacity: 0.25 }} transition={{ type: 'spring', stiffness: 380, damping: 14 }}>
          <rect x="13" y="7" width="26" height="18" fill="#ffb31a" /><rect x="13" y="7" width="13" height="9" fill="#e5484d" /><rect x="26" y="16" width="13" height="9" fill="#e5484d" />
        </motion.g>
      </svg>
      <AnimatePresence mode="wait">
        <motion.div key={v.title} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }} className="min-w-0">
          <div className={`font-display font-extrabold uppercase text-[28px] leading-none -skew-x-6 ${color}`}>{v.title}</div>
          <div className="text-[14px] text-mist-300 mt-1.5 leading-snug">{v.why}</div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
