import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Shell } from '../components/Shell'
import { PitchTag, ToolLayout } from '../components/ToolLayout'
import { Btn, Kbd, Label, Segmented } from '../components/ui'
import { CARD_NAME, FOUL_LEVELS, RESTART_NAME, SCENARIOS, type Card, type FP, type Restart } from '../data/fouls'
import { Ball, Pitch, Token } from '../features/pitch/Pitch'
import { easeOut, tween } from '../features/pitch/tween'
import { useReducedMotion } from '../lib/settings'
import { sfx } from '../lib/sound'

type Step = 'ready' | 'watched' | 'checked'
const RESTARTS: Restart[] = ['play', 'dfk', 'ifk', 'pen']
const CARDS: Card[] = ['none', 'yellow', 'red']

export default function Fouls() {
  const reduce = useReducedMotion()
  const [si, setSi] = useState(0)
  const [step, setStep] = useState<Step>('ready')
  const [players, setPlayers] = useState<FP[]>(() => SCENARIOS[0].players.map(p => ({ ...p })))
  const [ball, setBall] = useState(SCENARIOS[0].ball)
  const [restart, setRestart] = useState<Restart | null>(null)
  const [card, setCard] = useState<Card | null>(null)
  const [score, setScore] = useState<Record<number, boolean>>({})
  const cancel = useRef<() => void>(() => {})
  const sc = SCENARIOS[si]

  const load = useCallback((i: number) => {
    cancel.current()
    const n = (i + SCENARIOS.length) % SCENARIOS.length, s = SCENARIOS[n]
    setSi(n); setStep('ready'); setRestart(null); setCard(null)
    setPlayers(s.players.map(p => ({ ...p }))); setBall({ ...s.ball })
  }, [])

  const watch = useCallback(() => {
    const s = SCENARIOS[si]
    const from = s.players.map(p => ({ x: p.x, y: p.y })), to = s.players.map(p => s.moves[p.id] ?? { x: p.x, y: p.y })
    setPlayers(s.players.map(p => ({ ...p }))); setBall({ ...s.ball })
    sfx.play('whoosh')
    cancel.current = tween([from, [s.ball]], [to, [s.ballTo]], reduce ? 1 : 1300, ([ps, [b]]) => {
      setPlayers(cur => cur.map((p, i) => ({ ...p, ...ps[i] }))); setBall(b)
    }, () => { setStep(st => (st === 'ready' ? 'watched' : st)); sfx.play(s.answer.restart === 'play' ? 'toggle' : 'whistle') }, easeOut)
  }, [si, reduce])

  const check = useCallback(() => {
    if (!restart || !card) return
    const ok = restart === sc.answer.restart && card === sc.answer.card
    setStep('checked'); setScore(m => (si in m ? m : { ...m, [si]: ok }))
    sfx.play(ok ? 'select' : sc.answer.card === 'none' ? 'back' : 'card')
  }, [restart, card, sc, si])

  const primary = useCallback(() => {
    if (step === 'ready') watch()
    else if (step === 'watched') { if (restart && card) check(); else watch() }
    else load(si + 1)
  }, [step, watch, check, load, si, restart, card])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.code === 'Space' && (e.target as HTMLElement).closest('button, a, [role="switch"]')) || (e.target as HTMLElement).closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (e.code === 'Space') { e.preventDefault(); primary() }
      else if (k === 'r') { sfx.play('back'); load(si) }
      else if (e.key === 'ArrowRight') { sfx.play('hover'); load(si + 1) }
      else if (e.key === 'ArrowLeft') { sfx.play('hover'); load(si - 1) }
      else if (step === 'watched' && /^[1-4]$/.test(k)) { sfx.play('toggle'); setRestart(RESTARTS[+k - 1]) }
      else if (step === 'watched' && (k === 'n' || k === 'y' || k === 'c')) { sfx.play('toggle'); setCard(k === 'n' ? 'none' : k === 'y' ? 'yellow' : 'red') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [primary, load, si, step])

  const showSpot = step !== 'ready'
  const pitch = (
    <Pitch aria-label={`Foul scenario: ${sc.title}`}>
      {showSpot && (
        <g transform={`translate(${sc.spot.x} ${sc.spot.y})`}>
          <circle r="4.2" fill="#ffb31a" opacity=".18" />
          <path d="M-1.6 -1.6L1.6 1.6M1.6 -1.6L-1.6 1.6" stroke="#ffb31a" strokeWidth=".7" strokeLinecap="round" />
          <text y="-5" fontSize="2.2" fill="#ffb31a" textAnchor="middle" fontFamily="Saira Condensed, sans-serif" fontWeight={800}>{sc.spot.label}</text>
        </g>
      )}
      {players.map(p => (
        <g key={p.id}>
          <Token x={p.x} y={p.y} team={p.team === 'blue' ? 'home' : 'away'} label={p.tag} halo={p.id === 'd'} />
          {p.booked && <rect x={p.x + 2} y={p.y - 4.2} width="1.6" height="2.3" rx=".25" fill="#ffd400" stroke="#000" strokeWidth=".15" />}
        </g>
      ))}
      <Ball x={ball.x} y={ball.y} />
    </Pitch>
  )

  const correct = Object.values(score).filter(Boolean).length
  const ok = step === 'checked' && restart === sc.answer.restart && card === sc.answer.card
  const panel = (
    <>
      <div>
        <div className="flex items-baseline justify-between"><Label>Scenarios</Label><span className="text-[12px] text-mist-400">{correct} of {Object.keys(score).length} right</span></div>
        <div className="grid grid-cols-2 gap-1.5">
          {SCENARIOS.map((s, i) => (
            <button key={s.key} type="button" onClick={() => { sfx.play('select'); load(i) }} aria-current={i === si}
              className={`focus-invert flex items-baseline gap-2 text-left rounded-md border px-2.5 py-1.5 text-[13px] font-medium ${i === si ? 'bg-flood-500 border-flood-500 text-night-950' : 'border-night-600 hover:border-flood-500 text-mist-100'}`}>
              <span className={`font-mono text-[11px] ${i === si ? 'text-night-950/60' : 'text-mist-400'}`}>{i + 1}</span>
              <span className="truncate">{s.key}</span>
              {i in score && <span className={`ml-auto ${i === si ? '' : score[i] ? 'text-ok' : 'text-bad'}`}>{score[i] ? '✓' : '✗'}</span>}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h2 className="font-display font-extrabold uppercase text-3xl -skew-x-6 leading-none">{sc.title}</h2>
        <p className="mt-2 text-mist-300 leading-relaxed">{sc.text}</p>
      </div>
      <div className={step === 'ready' ? 'opacity-50 pointer-events-none' : ''} aria-disabled={step === 'ready' || undefined}>
        <Label>Your call: restart</Label>
        <Segmented size="sm" value={restart ?? ('' as Restart)} onChange={v => step !== 'checked' && setRestart(v)} options={RESTARTS.map((r, i) => ({ value: r, label: RESTART_NAME[r] === 'Indirect free kick' ? 'Indirect' : RESTART_NAME[r], hint: String(i + 1) }))} />
        <div className="mt-2"><Label>Card</Label></div>
        <Segmented size="sm" value={card ?? ('' as Card)} onChange={v => step !== 'checked' && setCard(v)} options={CARDS.map(c => ({ value: c, label: CARD_NAME[c], hint: { none: 'N', yellow: 'Y', red: 'C' }[c] }))} />
      </div>
      <Verdict show={step === 'checked'} ok={ok} answer={`${RESTART_NAME[sc.answer.restart]} · ${CARD_NAME[sc.answer.card]}`} why={sc.why} card={sc.answer.card} />
      <div className="flex gap-2">
        <Btn variant="primary" size="lg" className="flex-1" hint="Space" sound={null} onClick={primary}>
          {step === 'ready' ? 'Watch' : step === 'watched' ? (restart && card ? 'Check call' : 'Watch again') : 'Next one'}
        </Btn>
        <Btn size="lg" variant="ghost" hint="R" sound="back" onClick={() => load(si)}>Reset</Btn>
      </div>
      <div className="border-t border-night-700 pt-3">
        <Label>How hard was it?</Label>
        <ul className="flex flex-col gap-1 text-[13px]">
          {FOUL_LEVELS.map(([a, b]) => <li key={a} className="flex gap-2"><span className="font-semibold w-28 shrink-0">{a}</span><span className="text-mist-300">{b}</span></li>)}
        </ul>
        <p className="mt-2 text-[12px] text-mist-400 leading-relaxed">From the IFAB Laws of the Game, Law 12. Real decisions depend on the referee’s view of each moment; these scenes are simplified.</p>
      </div>
    </>
  )

  return (
    <Shell back="/learn" eyebrow="Learn football" title="Fouls & Cards" wide>
      <ToolLayout pitch={pitch} panel={panel}
        tagLeft={<PitchTag big>{`Scenario ${si + 1} · ${sc.key}`}</PitchTag>}
        tagRight={<PitchTag>{step === 'ready' ? 'Press Watch' : step === 'watched' ? 'Make your call' : ok ? 'You got it' : 'See why'}</PitchTag>}
        hotkeys={<><span className="inline-flex gap-1.5 items-center"><Kbd>Space</Kbd> watch / check</span><span className="inline-flex gap-1.5 items-center"><Kbd>1</Kbd>–<Kbd>4</Kbd> restart</span><span className="inline-flex gap-1.5 items-center"><Kbd>N</Kbd><Kbd>Y</Kbd><Kbd>C</Kbd> card</span><span className="inline-flex gap-1.5 items-center"><Kbd>←</Kbd><Kbd>→</Kbd> scenarios</span></>} />
    </Shell>
  )
}

function Verdict({ show, ok, answer, why, card }: { show: boolean; ok: boolean; answer: string; why: string; card: Card }) {
  return (
    <div className={`relative rounded-lg border p-3.5 flex gap-3 items-center min-h-[92px] ${!show ? 'border-night-600 bg-night-900/60' : ok ? 'border-ok/40 bg-ok/10' : 'border-bad/50 bg-bad/10'}`}>
      <svg viewBox="0 0 30 40" className="h-11 w-8 shrink-0" aria-hidden>
        <motion.rect x="5" y="4" width="20" height="30" rx="3" animate={{ fill: show ? (card === 'red' ? '#e5484d' : card === 'yellow' ? '#ffd400' : '#3a4a44') : '#3a4a44', rotate: show && card !== 'none' ? 8 : 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 16 }} style={{ originX: '15px', originY: '19px' }} />
      </svg>
      <AnimatePresence mode="wait">
        <motion.div key={show ? 'v' + answer : 'wait'} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }} className="min-w-0">
          {show ? <>
            <div className={`font-display font-extrabold uppercase text-[24px] leading-none -skew-x-6 ${ok ? 'text-ok' : 'text-bad'}`}>{ok ? 'Correct' : 'Not quite'}</div>
            <div className="text-[14px] font-semibold mt-1">{answer}</div>
            <div className="text-[13px] text-mist-300 mt-1 leading-snug">{why}</div>
          </> : <div className="text-[14px] text-mist-300 leading-snug">Watch the challenge, then pick a restart and a card. Press <b>Check call</b> to see the answer.</div>}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
