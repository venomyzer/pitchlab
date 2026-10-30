import { useCallback, useEffect, useRef, useState } from 'react'
import { Shell } from '../components/Shell'
import { PitchTag, ToolLayout } from '../components/ToolLayout'
import { Btn, Kbd, Label, Segmented, Toggle } from '../components/ui'
import { byName, FORMATIONS, OPP_PHASE, PHASE_NAME, PHASES, positions, shapeOf, type Formation, type OppPhase, type Phase, type Pt } from '../data/formations'
import { roleOf } from '../data/roles'
import { FormationLines } from '../features/pitch/Lines'
import { Pitch, toPitch, Token } from '../features/pitch/Pitch'
import { Disc3D, Pitch3D, type Pitch3DHandle } from '../features/pitch/Pitch3D'
import { tween } from '../features/pitch/tween'
import { useReducedMotion } from '../lib/settings'
import { sfx } from '../lib/sound'
import { load, save } from '../lib/storage'
import { useNames } from '../lib/useNames'

const FKEYS = ['q', 'w', 'e', 'r', 't', 'y']
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const TEAMS_KEY = 'pitchlab:formation-teams'
const VIEW_KEY = 'pitchlab:formation-3d'
const OPP_NAME: Record<OppPhase, string> = { ...PHASE_NAME, low: 'Low block' }
type TeamIdx = 0 | 1
type Sel = { team: TeamIdx; i: number } | null

export default function FormationLab() {
  const reduce = useReducedMotion()
  const [teamNames, setTeamNames] = useState<[string, string]>(() => load(TEAMS_KEY, ['Team 1', 'Team 2']))
  const [tab, setTab] = useState<TeamIdx>(0)
  const [form, setForm] = useState('4-3-3')
  const [form2, setForm2] = useState('4-4-2')
  const [show2, setShow2] = useState(false)
  const [phase, setPhase] = useState<Phase>('def')
  const [lines, setLines] = useState(true)
  const [move, setMove] = useState(false)
  const [showNames, setShowNames] = useState(true)
  const [view3d, setView3d] = useState(() => load(VIEW_KEY, true))
  const [rawSel, setSel] = useState<Sel>(null)
  const [custom, setCustom] = useState(false)
  const team1 = useNames(), team2 = useNames('pitchlab:names2')
  const opp = show2 ? form2 : 'none'
  const sel = rawSel?.team === 1 && !show2 ? null : rawSel
  const f = byName(form), of = show2 ? byName(form2) : null
  const [blue, setBlue] = useState<Pt[]>(() => positions(byName('4-3-3'), 'def'))
  const [red, setRed] = useState<Pt[]>(() => Array.from({ length: 11 }, () => ({ x: 110, y: 34 })))
  const cancel = useRef<() => void>(() => {})
  const svg = useRef<SVGSVGElement>(null)
  const p3 = useRef<Pitch3DHandle>(null)
  const posRef = useRef({ blue, red }); posRef.current = { blue, red }

  useEffect(() => { save(TEAMS_KEY, teamNames) }, [teamNames])
  useEffect(() => { save(VIEW_KEY, view3d) }, [view3d])
  const nameOf = (t: TeamIdx) => teamNames[t].trim() || `Team ${t + 1}`
  const rename = (t: TeamIdx, v: string) => setTeamNames(n => (t === 0 ? [v, n[1]] : [n[0], v]))
  // Picking a formation for Team 2 also puts Team 2 on the pitch.
  const pick = useCallback((t: TeamIdx, name: string) => { sfx.play('select'); if (t === 0) setForm(name); else { setForm2(name); setShow2(true) } }, [])

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
      if (fi >= 0) pick(tab, FORMATIONS[fi].name)
      else if (e.code === 'Space') { e.preventDefault(); sfx.play('whoosh'); cyclePhase() }
      else if (['1', '2', '3'].includes(k)) { sfx.play('whoosh'); setPhase(PHASES[+k - 1]) }
      else if (k === 'l') { sfx.play('toggle'); setLines(v => !v) }
      else if (k === 'm') { sfx.play('toggle'); setMove(v => !v) }
      else if (k === 'n') { sfx.play('toggle'); setShowNames(v => !v) }
      else if (k === 'v') { sfx.play('toggle'); setView3d(v => !v) }
      else if (k === 'o') { sfx.play('toggle'); setShow2(v => !v) }
      else if (k === 'g') { sfx.play('toggle'); setTab(t => (t ? 0 : 1)) }
      else if (k === 'escape') setSel(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cyclePhase, pick, tab])

  // drag players to customise; tapping a player opens their team's tab
  const drag = useRef<{ team: 'b' | 'r'; i: number; dx: number; dy: number } | null>(null)
  const pointAt = (e: { clientX: number; clientY: number }) => (view3d ? p3.current?.toPitch(e) : svg.current ? toPitch(svg.current, e) : undefined)
  const onDown = (e: React.PointerEvent) => {
    const id = (e.target as Element).closest('[data-token]')?.getAttribute('data-token'); if (!id) return
    const [team, i] = id.split(':'); cancel.current()
    // keep the grab point under the pointer (in 3D the disc stands above its spot on the grass)
    const at = pointAt(e), own = (team === 'b' ? blue : red)[+i]
    drag.current = { team: team as 'b' | 'r', i: +i, dx: at ? own.x - at.x : 0, dy: at ? own.y - at.y : 0 }
    const t: TeamIdx = team === 'b' ? 0 : 1
    setSel({ team: t, i: +i }); setTab(t); sfx.play('hover')
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId); e.preventDefault()
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return
    const q = pointAt(e); if (!q) return
    const p = { x: clamp(q.x + d.dx, -1, 106), y: clamp(q.y + d.dy, -1, 69) }
    setCustom(true)
    if (d.team === 'b') setBlue(bs => bs.map((b, k) => (k === d.i ? p : b))); else setRed(rs => rs.map((r, k) => (k === d.i ? p : r)))
  }
  const onUp = () => { drag.current = null }
  const reset = () => { sfx.play('back'); cancel.current(); setCustom(false); cancel.current = tween([blue, red], [positions(f, phase), of ? positions(of, OPP_PHASE[phase], true) : red], reduce ? 1 : 700, ([b, r]) => { setBlue(b); setRed(r) }) }

  const shape = shapeOf(f, phase, positions(f, phase))
  const fromPh: Phase = phase === 'def' ? 'att' : PHASES[PHASES.indexOf(phase) - 1]
  const from = positions(f, fromPh), to = positions(f, phase)

  const ariaLabel = `${nameOf(0)} in ${form}, ${PHASE_NAME[phase]}${of ? `, ${nameOf(1)} in ${of.name}` : ''}`
  const painted = (<>
    {move && from.map((p, i) => {
      const q = to[i]; if (i === 0 || Math.hypot(q.x - p.x, q.y - p.y) < 2) return null
      return <g key={i} opacity=".85"><circle cx={p.x} cy={p.y} r="1.2" fill="none" stroke="#fff" strokeWidth=".25" opacity=".6" />
        <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#fff" strokeWidth=".35" strokeDasharray="1 .7" markerEnd="url(#arrW)" /></g>
    })}
    {lines && of && <FormationLines f={of} ph={OPP_PHASE[phase]} pts={red} color="#ffd6d6" />}
    {lines && <FormationLines f={f} ph={phase} pts={blue} color="#e3e9ff" />}
  </>)
  // both teams' players, each with what its disc needs
  const players = [
    ...(of ? red.map((p, i) => ({ ...p, key: 'r' + i, dataId: `r:${i}`, team: 'away' as const, label: of.s[i][0], name: showNames ? team2.names[i] : '', halo: sel?.team === 1 && sel.i === i })) : []),
    ...blue.map((p, i) => ({ ...p, key: 'b' + i, dataId: `b:${i}`, team: 'home' as const, label: f.s[i][0], name: showNames ? team1.names[i] : '', halo: sel?.team === 0 && sel.i === i })),
  ]
  const pitch = view3d ? (
    <Pitch3D ref={p3} thirds reduce={reduce} label={ariaLabel} ground={painted} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
      caption={<span className="font-display font-extrabold uppercase -skew-x-6 text-white/90 text-[clamp(13px,1.4vw,19px)] tracking-wide">{nameOf(0)} attacks →</span>}>
      {project => [...players].sort((a, b) => a.y - b.y).map(({ key, x, y, ...d }) => { const q = project(x, y); return <Disc3D key={key} {...d} x={q.x} y={q.y} s={q.s} /> })}
    </Pitch3D>
  ) : (
    <Pitch ref={svg} thirds onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} aria-label={ariaLabel}>
      <text x="-1.5" y="-4.4" fill="#fff" fontSize="2" fontFamily="Saira Condensed, sans-serif" fontWeight={800} opacity=".85">{nameOf(0).toUpperCase()} ATTACKS →</text>
      {painted}
      {players.map(({ key, ...d }) => <Token key={key} {...d} />)}
    </Pitch>
  )

  const tf = tab === 0 ? f : byName(form2)
  const tPhase: OppPhase = tab === 0 ? phase : OPP_PHASE[phase]
  const tNames = tab === 0 ? team1 : team2
  const selF = sel ? (sel.team === 0 ? f : of) : null
  const role = sel && selF ? roleOf(selF.s[sel.i][0]) : null
  const panel = (
    <>
      {/* Team tabs */}
      <div role="tablist" aria-label="Teams" className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-night-950/70 border border-line">
        {([0, 1] as const).map(t => (
          <button key={t} type="button" role="tab" id={`team-tab-${t}`} aria-selected={tab === t} aria-controls="team-panel" onClick={() => { sfx.play('toggle'); setTab(t) }}
            className={`focus-invert h-11 px-2 rounded-md flex items-center justify-center gap-2 min-w-0 font-display font-bold uppercase tracking-wide text-[17px] ${tab === t ? 'bg-flood-500 text-night-950' : 'text-mist-300 hover:bg-white/10'}`}>
            <span className={`h-3 w-3 rounded-full shrink-0 ring-1 ring-white/60 ${t === 0 ? 'bg-home' : 'bg-away'} ${t === 1 && !show2 ? 'opacity-40' : ''}`} />
            <span className="truncate">{nameOf(t)}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id="team-panel" aria-labelledby={`team-tab-${tab}`} className="flex flex-col gap-4">
        <div>
          <Label>Team name</Label>
          <input value={teamNames[tab]} maxLength={20} placeholder={`Team ${tab + 1}`} onChange={e => rename(tab, e.target.value)} aria-label={`Team ${tab + 1} name`}
            className="w-full h-10 rounded-md bg-night-900 border border-night-600 focus:border-flood-500 outline-none px-3 text-[15px] font-semibold" />
        </div>
        {tab === 1 && <div className="-mx-3"><Toggle on={show2} onChange={setShow2} label={`Show ${nameOf(1)} on the pitch`} hint="O" /></div>}
        <div>
          <Label>Formation</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {FORMATIONS.map((x, i) => {
              const on = x.name === (tab === 0 ? form : form2) && (tab === 0 || show2)
              return (
                <button key={x.name} type="button" aria-pressed={on} onClick={() => pick(tab, x.name)}
                  className={`focus-invert rounded-md border py-2 font-display font-extrabold text-[20px] leading-none tracking-wide transition-colors flex flex-col items-center gap-1
                    ${on ? 'bg-flood-500 border-flood-500 text-night-950' : 'border-night-600 hover:border-flood-500'}`}>
                  {x.name}<span className={`font-mono text-[10px] font-medium ${on ? 'text-night-950/60' : 'text-mist-400'}`}>{FKEYS[i].toUpperCase()}</span>
                </button>
              )
            })}
          </div>
        </div>
        {(tab === 0 || show2) && <ShapeCard f={tf} ph={tPhase} />}
        <Squad f={tf} names={tNames.names} setName={tNames.setName} team={tab} sel={sel} onPick={i => { sfx.play('hover'); setSel({ team: tab, i }) }} />
      </div>

      <div className="border-t border-line/50 pt-4">
        <Label>Phase of play ({nameOf(0)})</Label>
        <Segmented value={phase} onChange={setPhase} options={PHASES.map((p, i) => ({ value: p, label: PHASE_NAME[p], hint: String(i + 1) }))} />
        {of && <p className="mt-2 text-[13px] text-mist-400">{nameOf(1)}: {OPP_NAME[OPP_PHASE[phase]]}</p>}
      </div>
      <div className="rounded-lg border border-night-700 p-3.5 flex flex-col gap-2">
        {sel && role && selF ? (<>
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-mist-400">
            <span className={`h-2.5 w-2.5 rounded-full ${sel.team === 0 ? 'bg-home' : 'bg-away'}`} />{nameOf(sel.team)}
          </div>
          <div className="font-display font-extrabold uppercase text-[22px] -skew-x-6 leading-none">{selF.s[sel.i][0]} · {role[1]}</div>
          <p className="text-[14px] text-mist-300 leading-snug">{role[2]}</p>
        </>) : (<>
          <div className="font-display font-bold uppercase text-[18px] text-mist-300">Tap a player</div>
          <p className="text-[14px] text-mist-400 leading-snug">See what that position does, or drag them to copy what you see on TV.</p>
        </>)}
      </div>
      <div className="-mx-3">
        <Toggle on={lines} onChange={setLines} label="Show lines" hint="L" />
        <Toggle on={move} onChange={setMove} label={`Show movement (${nameOf(0)})`} hint="M" />
        <Toggle on={showNames} onChange={setShowNames} label="Show player names" hint="N" />
        <Toggle on={view3d} onChange={setView3d} label="3D view" hint="V" />
      </div>
      <Btn variant="ghost" onClick={reset} sound={null} disabled={!custom}>Reset positions</Btn>
    </>
  )

  return (
    <Shell back="/tactics" eyebrow="Tactic boards" title="Formation Lab" wide>
      <ToolLayout pitch={pitch} panel={panel}
        tagLeft={<PitchTag big>{custom ? `${form} · custom` : shape === form ? form : `${form} → ${shape}`}</PitchTag>}
        tagRight={<PitchTag>{PHASE_NAME[phase]}{of ? ` · vs ${nameOf(1)} (${of.name})` : ''}</PitchTag>}
        hotkeys={<><span className="inline-flex gap-1.5 items-center"><Kbd>Q</Kbd>–<Kbd>Y</Kbd> formation</span><span className="inline-flex gap-1.5 items-center"><Kbd>G</Kbd> switch team</span><span className="inline-flex gap-1.5 items-center"><Kbd>Space</Kbd> next phase</span><span className="inline-flex gap-1.5 items-center"><Kbd>O</Kbd> show team 2</span></>} />
      <p className="max-w-[1600px] mx-auto mt-3 text-[13px] text-mist-400">Shapes are typical modern versions, simplified. Real teams adjust every match.</p>
    </Shell>
  )
}

/** The team's shape in this phase (e.g. 2-3-5) and what it's doing. */
function ShapeCard({ f, ph }: { f: Formation; ph: OppPhase }) {
  const shape = shapeOf(f, ph, positions(f, ph))
  return (
    <div className="rounded-lg bg-night-900/70 border border-night-700 p-3.5">
      <div className="flex items-baseline gap-2">
        <span className="font-display font-extrabold text-[26px] -skew-x-6 leading-none text-flood-400">{shape}</span>
        <span className="text-[12px] uppercase tracking-[0.18em] text-mist-400">{OPP_NAME[ph]}</span>
      </div>
      <p className="mt-2 text-[15px] leading-relaxed text-mist-100">{ph === 'low' ? 'Defends deep and narrow, close to its own goal.' : f.d[ph]}</p>
    </div>
  )
}

/** All 11 positions with a name box each. Folded by default to keep the panel short. */
function Squad({ f, names, setName, team, sel, onPick }: { f: Formation; names: string[]; setName: (i: number, v: string) => void; team: TeamIdx; sel: Sel; onPick: (i: number) => void }) {
  const [open, setOpen] = useState(false)
  const filled = names.filter(n => n.trim()).length
  return (
    <div className="rounded-lg border border-night-700">
      <button type="button" aria-expanded={open} onClick={() => { sfx.play('toggle'); setOpen(o => !o) }}
        className="focus-invert w-full h-10 px-3 flex items-center gap-2 rounded-lg text-[12px] font-semibold tracking-[0.16em] uppercase text-mist-400">
        Player names<span className="normal-case tracking-normal font-normal">{filled}/11</span><span className="ml-auto text-[16px]">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <ol className="px-2 pb-2 flex flex-col gap-1">
          {f.s.map((slot, i) => {
            const on = sel?.team === team && sel.i === i
            return (
              <li key={i} className="flex items-center gap-2">
                <button type="button" onClick={() => onPick(i)} aria-label={`Select ${slot[0]}`}
                  className={`focus-invert w-12 h-8 shrink-0 rounded font-display font-bold text-[14px] tracking-wide border ${on ? 'bg-flood-500 border-flood-500 text-night-950' : 'border-night-600 hover:border-flood-500'}`}>{slot[0]}</button>
                <input value={names[i]} maxLength={16} placeholder="Name" onChange={e => setName(i, e.target.value)} onFocus={() => onPick(i)} aria-label={`${slot[0]} name`}
                  className="flex-1 min-w-0 h-8 rounded-md bg-night-900 border border-night-600 focus:border-flood-500 outline-none px-2.5 text-[14px]" />
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
