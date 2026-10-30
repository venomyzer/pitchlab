import { useCallback, useEffect, useRef, useState } from 'react'
import { Shell } from '../components/Shell'
import { PitchTag, ToolLayout } from '../components/ToolLayout'
import { Btn, Kbd, Label, Segmented, Toggle } from '../components/ui'
import { byName, FORMATIONS, OPP_PHASE, PHASE_NAME, PHASES, positions, shapeOf, type Phase, type Pt } from '../data/formations'
import { roleOf } from '../data/roles'
import { FormationLines } from '../features/pitch/Lines'
import { Pitch, toPitch, Token } from '../features/pitch/Pitch'
import { tween } from '../features/pitch/tween'
import { useReducedMotion } from '../lib/settings'
import { sfx } from '../lib/sound'
import { useNames } from '../lib/useNames'

const FKEYS = ['q', 'w', 'e', 'r', 't', 'y']
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export default function FormationLab() {
  const reduce = useReducedMotion()
  const [form, setForm] = useState('4-3-3')
  const [phase, setPhase] = useState<Phase>('def')
  const [opp, setOpp] = useState<string>('none')
  const [lines, setLines] = useState(true)
  const [move, setMove] = useState(false)
  const [showNames, setShowNames] = useState(true)
  const [sel, setSel] = useState<number | null>(null)
  const [custom, setCustom] = useState(false)
  const { names, setName } = useNames()
  const f = byName(form), of = opp === 'none' ? null : byName(opp)
  const [blue, setBlue] = useState<Pt[]>(() => positions(byName('4-3-3'), 'def'))
  const [red, setRed] = useState<Pt[]>(() => Array.from({ length: 11 }, () => ({ x: 110, y: 34 })))
  const cancel = useRef<() => void>(() => {})
  const svg = useRef<SVGSVGElement>(null)
  const posRef = useRef({ blue, red }); posRef.current = { blue, red }

  // animate whenever the setup changes
  useEffect(() => {
    cancel.current()
    setCustom(false)
    const tb = positions(byName(form), phase)
    const tr = opp === 'none' ? posRef.current.red : positions(byName(opp), OPP_PHASE[phase], true)
    cancel.current = tween([posRef.current.blue, posRef.current.red], [tb, tr], reduce ? 1 : 850, ([b, r]) => { setBlue(b); setRed(r) })
    return () => cancel.current()
  }, [form, phase, opp, reduce])

  const cyclePhase = useCallback(() => setPhase(p => PHASES[(PHASES.indexOf(p) + 1) % 3]), [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.code === 'Space' && (e.target as HTMLElement).closest('button, a, [role="switch"]')) || (e.target as HTMLElement).closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      const fi = FKEYS.indexOf(k)
      if (fi >= 0) { sfx.play('select'); setForm(FORMATIONS[fi].name) }
      else if (e.code === 'Space') { e.preventDefault(); sfx.play('whoosh'); cyclePhase() }
      else if (['1', '2', '3'].includes(k)) { sfx.play('whoosh'); setPhase(PHASES[+k - 1]) }
      else if (k === 'l') { sfx.play('toggle'); setLines(v => !v) }
      else if (k === 'm') { sfx.play('toggle'); setMove(v => !v) }
      else if (k === 'n') { sfx.play('toggle'); setShowNames(v => !v) }
      else if (k === 'o') { sfx.play('toggle'); setOpp(o => { const all = ['none', ...FORMATIONS.map(x => x.name)]; return all[(all.indexOf(o) + 1) % all.length] }) }
      else if (k === 'escape') setSel(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cyclePhase])

  // drag players to customise
  const drag = useRef<{ team: 'b' | 'r'; i: number } | null>(null)
  const onDown = (e: React.PointerEvent) => {
    const id = (e.target as Element).closest('[data-token]')?.getAttribute('data-token'); if (!id) return
    const [team, i] = id.split(':'); cancel.current()
    drag.current = { team: team as 'b' | 'r', i: +i }
    if (team === 'b') { setSel(+i); sfx.play('hover') }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId); e.preventDefault()
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d || !svg.current) return
    const q = toPitch(svg.current, e), p = { x: clamp(q.x, -1, 106), y: clamp(q.y, -1, 69) }
    setCustom(true)
    if (d.team === 'b') setBlue(bs => bs.map((b, k) => (k === d.i ? p : b))); else setRed(rs => rs.map((r, k) => (k === d.i ? p : r)))
  }
  const onUp = () => { drag.current = null }
  const reset = () => { sfx.play('back'); cancel.current(); setCustom(false); cancel.current = tween([blue, red], [positions(f, phase), of ? positions(of, OPP_PHASE[phase], true) : red], reduce ? 1 : 700, ([b, r]) => { setBlue(b); setRed(r) }) }

  const shape = shapeOf(f, phase, positions(f, phase))
  const fromPh: Phase = phase === 'def' ? 'att' : PHASES[PHASES.indexOf(phase) - 1]
  const from = positions(f, fromPh), to = positions(f, phase)

  const pitch = (
    <Pitch ref={svg} thirds onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} aria-label={`${form} formation, ${PHASE_NAME[phase]}`}>
      <text x="-1.5" y="-4.4" fill="#fff" fontSize="2" fontFamily="Saira Condensed, sans-serif" fontWeight={800} opacity=".85">BLUE ATTACKS →</text>
      {move && from.map((p, i) => {
        const q = to[i]; if (i === 0 || Math.hypot(q.x - p.x, q.y - p.y) < 2) return null
        return <g key={i} opacity=".85"><circle cx={p.x} cy={p.y} r="1.2" fill="none" stroke="#fff" strokeWidth=".25" opacity=".6" />
          <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#fff" strokeWidth=".35" strokeDasharray="1 .7" markerEnd="url(#arrW)" /></g>
      })}
      {lines && of && <FormationLines f={of} ph={OPP_PHASE[phase]} pts={red} color="#ffd6d6" />}
      {lines && <FormationLines f={f} ph={phase} pts={blue} color="#e3e9ff" badges />}
      {of && red.map((p, i) => <Token key={'r' + i} dataId={`r:${i}`} x={p.x} y={p.y} team="away" label={of.s[i][0]} />)}
      {blue.map((p, i) => <Token key={'b' + i} dataId={`b:${i}`} x={p.x} y={p.y} team="home" label={f.s[i][0]} name={showNames ? names[i] : ''} halo={sel === i} />)}
    </Pitch>
  )

  const role = sel !== null ? roleOf(f.s[sel][0]) : null
  const panel = (
    <>
      <div>
        <Label>Formation</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {FORMATIONS.map((x, i) => (
            <button key={x.name} type="button" aria-pressed={x.name === form} onClick={() => { sfx.play('select'); setForm(x.name) }}
              className={`focus-invert rounded-md border py-2 font-display font-extrabold text-[20px] leading-none tracking-wide transition-colors flex flex-col items-center gap-1
                ${x.name === form ? 'bg-flood-500 border-flood-500 text-night-950' : 'border-night-600 hover:border-flood-500'}`}>
              {x.name}<span className={`font-mono text-[10px] font-medium ${x.name === form ? 'text-night-950/60' : 'text-mist-400'}`}>{FKEYS[i].toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Phase of play</Label>
        <Segmented value={phase} onChange={setPhase} options={PHASES.map((p, i) => ({ value: p, label: PHASE_NAME[p], hint: String(i + 1) }))} />
      </div>
      <div className="rounded-lg bg-night-900/70 border border-night-700 p-3.5">
        <div className="flex items-baseline gap-2">
          <span className="font-display font-extrabold text-[26px] -skew-x-6 leading-none text-flood-400">{shape}</span>
          <span className="text-[12px] uppercase tracking-[0.18em] text-mist-400">{PHASE_NAME[phase]}</span>
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-mist-100">{f.d[phase]}</p>
      </div>
      <div>
        <Label>Opponent</Label>
        <select value={opp} onChange={e => { sfx.play('toggle'); setOpp(e.target.value) }} id="opp"
          className="w-full h-10 rounded-md bg-night-900 border border-night-600 px-3 text-[15px]">
          <option value="none">No opponent</option>
          {FORMATIONS.map(x => <option key={x.name} value={x.name}>Opponent in {x.name}</option>)}
        </select>
      </div>
      <div className="-mx-3">
        <Toggle on={lines} onChange={setLines} label="Show lines" hint="L" />
        <Toggle on={move} onChange={setMove} label="Show movement" hint="M" />
        <Toggle on={showNames} onChange={setShowNames} label="Show names" hint="N" />
      </div>
      <div className="rounded-lg border border-night-700 p-3.5 flex flex-col gap-2">
        {role ? (<>
          <div className="font-display font-extrabold uppercase text-[22px] -skew-x-6 leading-none">{f.s[sel!][0]} · {role[1]}</div>
          <p className="text-[14px] text-mist-300 leading-snug">{role[2]}</p>
          <input id="pname" value={names[sel!]} maxLength={16} placeholder="Player name (optional)" onChange={e => setName(sel!, e.target.value)}
            className="h-10 rounded-md bg-night-900 border border-night-600 px-3 text-[15px]" />
        </>) : (<>
          <div className="font-display font-bold uppercase text-[18px] text-mist-300">Tap a player</div>
          <p className="text-[14px] text-mist-400 leading-snug">See what that position does, give them a name, or drag them to copy what you see on TV.</p>
        </>)}
      </div>
      <Btn variant="ghost" onClick={reset} sound={null} disabled={!custom}>Reset positions</Btn>
    </>
  )

  return (
    <Shell back="/tactics" eyebrow="Tactic boards" title="Formation Lab" wide>
      <ToolLayout pitch={pitch} panel={panel}
        tagLeft={<PitchTag big>{custom ? `${form} · custom` : shape === form ? form : `${form} → ${shape}`}</PitchTag>}
        tagRight={<PitchTag>{PHASE_NAME[phase]}{of ? ` · vs ${of.name}` : ''}</PitchTag>}
        hotkeys={<><span className="inline-flex gap-1.5 items-center"><Kbd>Q</Kbd>–<Kbd>Y</Kbd> formations</span><span className="inline-flex gap-1.5 items-center"><Kbd>Space</Kbd> next phase</span><span className="inline-flex gap-1.5 items-center"><Kbd>O</Kbd> opponent</span></>} />
      <p className="max-w-[1600px] mx-auto mt-3 text-[13px] text-mist-400">Shapes are typical modern versions, simplified. Real teams adjust every match.</p>
    </Shell>
  )
}
