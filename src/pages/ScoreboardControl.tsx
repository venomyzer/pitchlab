import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CopyField } from '../components/CopyField'
import { Shell } from '../components/Shell'
import { IconPause, IconPlay, IconUndo } from '../components/Icons'
import { Btn, Kbd, Label, Panel, Segmented, Toggle } from '../components/ui'
import { IS_PREVIEW } from '../config'
import { appUrl, useScoreControl } from '../features/scoreboard/control'
import { ScoreboardView } from '../features/scoreboard/ScoreboardView'
import { A, clockText, PERIODS, SWATCHES, useNow, type EventKind, type Position, type Side, type State } from '../features/scoreboard/state'
import { useReducedMotion } from '../lib/settings'
import { sfx } from '../lib/sound'
import { load, save } from '../lib/storage'

export default function ScoreboardControl() {
  // Esc stays "go back" here; the OBS dock uses it to hide the pop-up
  const { s, update, undo, canUndo } = useScoreControl({ ignoreEsc: true })
  const now = useNow(200)
  const reduce = useReducedMotion()

  const c = clockText(s, now)
  return (
    <Shell back="/stream" eyebrow="Streamer tools" title="Match Scoreboard" wide
      actions={<Btn size="sm" variant="ghost" sound={null} onClick={undo} disabled={!canUndo} hint="Ctrl Z"><IconUndo className="h-4 w-4" />Undo</Btn>}>
      <ObsSetup />
      <div className="max-w-[1600px] mx-auto grid gap-4 grid-cols-1 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] items-start">
        {/* LEFT: preview + connect */}
        <div className="flex flex-col gap-4 min-w-0">
          <Panel className="p-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <Label>On stream now</Label>
              <span className="flex items-center gap-2 text-[12px] text-mist-400"><span className="h-2 w-2 rounded-full bg-ok animate-pulse" />Saves automatically</span>
            </div>
            <Preview s={s} now={now} reduce={reduce} />
          </Panel>
          <EventLog s={s} />
        </div>

        {/* RIGHT: controls */}
        <div className="flex flex-col gap-4 min-w-0">
          <Panel className="p-4">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
              <TeamControl side="home" s={s} update={update} hotkey="1" />
              <div className="pt-10 font-display font-extrabold text-3xl text-mist-400">–</div>
              <TeamControl side="away" s={s} update={update} hotkey="2" />
            </div>
            <div className="mt-3 pt-3 border-t border-line/40 flex items-center gap-x-4 gap-y-1 flex-wrap text-[13px] text-mist-400">
              <span className="inline-flex gap-1.5 items-center"><Kbd>1</Kbd><Kbd>2</Kbd> goal</span>
              <span className="inline-flex gap-1.5 items-center"><Kbd>⇧1</Kbd><Kbd>⇧2</Kbd> remove goal</span>
              <span className="inline-flex gap-1.5 items-center"><Kbd>Space</Kbd> clock</span>
              <span>Also work in the OBS dock and on the overlay.</span>
            </div>
          </Panel>

          <Panel className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="font-display font-extrabold tabular text-[54px] leading-none -skew-x-6">{c.main}<span className="text-flood-400 text-3xl ml-2">{c.over}</span></div>
              <Btn variant={s.clock.running ? 'solid' : 'primary'} size="lg" sound="whistle" hint="Space" className="ml-auto min-w-[170px]" onClick={() => update(A.toggle)}>
                {s.clock.running ? <><IconPause className="h-5 w-5" />Pause</> : <><IconPlay className="h-5 w-5" />Start</>}
              </Btn>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {PERIODS.map(p => (
                <button key={p.v} type="button" aria-pressed={s.period === p.v} onClick={() => { sfx.play('toggle'); update(st => A.period(st, p.v)) }}
                  className={`focus-invert h-10 rounded-md border text-[14px] font-semibold ${s.period === p.v ? 'bg-flood-500 border-flood-500 text-night-950' : 'border-night-600 hover:border-flood-500'}`}>{p.label}</button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[13px] text-mist-400 mr-1">Adjust</span>
              {[[-60000, '−1m'], [-10000, '−10s'], [-1000, '−1s'], [1000, '+1s'], [10000, '+10s'], [60000, '+1m']].map(([ms, l]) => (
                <Btn key={l} size="sm" variant="ghost" sound="toggle" onClick={() => update(st => A.adjust(st, ms as number))}>{l}</Btn>
              ))}
              <SetTime onSet={ms => update(st => A.setTime(st, ms))} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] text-mist-400 mr-1">Added time board</span>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 10].map(n => (
                <button key={n} type="button" aria-pressed={s.added === n} onClick={() => { sfx.play('toggle'); update(st => ({ ...st, added: n })) }}
                  className={`focus-invert h-8 min-w-8 px-2 rounded-md border text-[13px] font-mono ${s.added === n ? 'bg-flood-500 border-flood-500 text-night-950' : 'border-night-600 hover:border-flood-500'}`}>{n ? `+${n}` : 'Off'}</button>
              ))}
            </div>
          </Panel>

          <EventControls s={s} update={update} />
          <StylePanel s={s} update={update} />
          <ResetMatch onReset={() => update(A.resetMatch)} />
        </div>
      </div>
    </Shell>
  )
}

function Preview({ s, now, reduce }: { s: State; now: number; reduce: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.4)
  useEffect(() => {
    const el = box.current; if (!el) return
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 1920))
    ro.observe(el); return () => ro.disconnect()
  }, [])
  return (
    <div ref={box} className="relative w-full aspect-video rounded-lg overflow-hidden ring-1 ring-night-600"
      style={{ background: 'repeating-conic-gradient(#173328 0% 25%, #112a20 0% 50%) 50% / 28px 28px' }}>
      <div className="absolute inset-0 grid place-items-center text-[13px] text-mist-400/70 pointer-events-none">Your stream is here</div>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: 1920, height: 1080, transform: `scale(${scale})` }}>
        <ScoreboardView s={s} now={now} reduce={reduce} />
      </div>
    </div>
  )
}

function TeamControl({ side, s, update, hotkey }: { side: Side; s: State; update: (fn: (st: State) => State) => void; hotkey: string }) {
  const t = s[side]
  const set = (patch: Partial<State['home']>) => update(st => ({ ...st, [side]: { ...st[side], ...patch } }))
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="flex items-center gap-2">
        <span className="h-4 w-4 rounded-sm shrink-0 ring-1 ring-white/30" style={{ background: t.color }} />
        <input aria-label={`${side} team name`} value={t.name} maxLength={24} onChange={e => set({ name: e.target.value })}
          className="min-w-0 flex-1 h-9 bg-transparent border-b border-night-600 focus:border-flood-500 outline-none font-semibold text-[16px]" />
        <input aria-label={`${side} short code`} value={t.code} maxLength={4} onChange={e => set({ code: e.target.value.toUpperCase() })}
          className="w-[64px] h-9 text-center rounded-md bg-night-900 border border-night-600 focus:border-flood-500 outline-none font-display font-bold text-[18px] tracking-wider" />
      </div>
      <div className="flex items-center justify-center gap-3 py-1">
        <button type="button" aria-label={`Remove a goal from ${t.name}`} onClick={() => { sfx.play('back'); update(st => A.score(st, side, -1)) }} disabled={t.score === 0}
          className="focus-invert h-12 w-12 rounded-lg border border-night-600 text-2xl text-mist-300 hover:border-flood-500 disabled:opacity-30">−</button>
        <span className="font-display font-extrabold tabular text-[64px] leading-none w-[1.4em] text-center">{t.score}</span>
        <button type="button" aria-label={`Add a goal to ${t.name} without a pop-up`} onClick={() => { sfx.play('toggle'); update(st => A.score(st, side, 1)) }}
          className="focus-invert h-12 w-12 rounded-lg border border-night-600 text-2xl text-mist-300 hover:border-flood-500">+</button>
      </div>
      <GoalButton side={side} name={t.name} hotkey={hotkey} update={update} />
      <div className="flex flex-wrap gap-1">
        {SWATCHES.map(c => (
          <button key={c} type="button" aria-label={`Colour ${c}`} aria-pressed={t.color === c} onClick={() => { sfx.play('toggle'); set({ color: c }) }}
            className={`h-6 w-6 rounded-sm ring-1 ${t.color === c ? 'ring-2 ring-flood-400 ring-offset-2 ring-offset-night-850' : 'ring-white/20'}`} style={{ background: c }} />
        ))}
        <label className="h-6 w-6 rounded-sm ring-1 ring-white/20 overflow-hidden cursor-pointer relative" title="Custom colour">
          <input type="color" value={t.color} onChange={e => set({ color: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Custom colour" />
          <span className="absolute inset-0 grid place-items-center text-[11px] text-mist-300 bg-night-700">+</span>
        </label>
      </div>
    </div>
  )
}

function GoalButton({ side, name, hotkey, update }: { side: Side; name: string; hotkey: string; update: (fn: (st: State) => State) => void }) {
  const [scorer, setScorer] = useState('')
  const go = () => { sfx.play('goal'); update(st => A.goal(st, side, scorer)); setScorer('') }
  return (
    <div className="flex flex-col gap-1.5">
      <input value={scorer} onChange={e => setScorer(e.target.value)} placeholder="Scorer (optional)" maxLength={40} onKeyDown={e => { if (e.key === 'Enter') go() }}
        aria-label={`${name} goal scorer`} className="h-9 rounded-md bg-night-900 border border-night-600 focus:border-flood-500 outline-none px-2.5 text-[14px]" />
      <Btn variant="primary" sound={null} onClick={go} hint={hotkey}>Goal {name}</Btn>
    </div>
  )
}

function SetTime({ onSet }: { onSet: (ms: number) => void }) {
  const [v, setV] = useState('')
  const parse = () => {
    const m = v.trim().match(/^(\d{1,3})(?::(\d{1,2}))?$/); if (!m) return
    onSet((+m[1] * 60 + (+m[2] || 0)) * 1000); setV(''); sfx.play('select')
  }
  return (
    <span className="ml-auto flex items-center gap-1">
      <input value={v} onChange={e => setV(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') parse() }} placeholder="mm:ss" aria-label="Set clock to"
        className="w-[78px] h-8 rounded-md bg-night-900 border border-night-600 focus:border-flood-500 outline-none px-2 text-[14px] font-mono" />
      <Btn size="sm" variant="ghost" sound={null} onClick={parse} disabled={!/^\d{1,3}(:\d{1,2})?$/.test(v.trim())}>Set</Btn>
    </span>
  )
}

function EventControls({ s, update }: { s: State; update: (fn: (st: State) => State) => void }) {
  const [who, setWho] = useState('')
  const [side, setSide] = useState<Side>('home')
  const fire = (kind: EventKind, team: Side | null) => {
    sfx.play(kind === 'var' ? 'whistle' : 'card'); update(st => A.event(st, kind, team, who)); setWho('')
  }
  const active = s.event && Date.now() - s.event.at < 9000
  return (
    <Panel className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between"><Label>Pop-ups</Label>
        <Btn size="sm" variant="ghost" sound="back" disabled={!active} onClick={() => update(A.clearEvent)}>Hide pop-up</Btn></div>
      <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
        <Segmented size="sm" value={side} onChange={setSide} options={[{ value: 'home', label: s.home.code || 'Home' }, { value: 'away', label: s.away.code || 'Away' }]} />
        <input value={who} onChange={e => setWho(e.target.value)} placeholder="Player (optional)" maxLength={40} aria-label="Player for the pop-up"
          className="h-10 rounded-md bg-night-900 border border-night-600 focus:border-flood-500 outline-none px-2.5 text-[14px] min-w-0" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Btn sound={null} onClick={() => fire('yellow', side)}><i className="h-4 w-3 rounded-[2px] bg-[#ffd400] inline-block" />Yellow</Btn>
        <Btn sound={null} onClick={() => fire('red', side)}><i className="h-4 w-3 rounded-[2px] bg-away inline-block" />Red</Btn>
        <Btn sound={null} onClick={() => fire('sub', side)}>Sub</Btn>
        <Btn sound={null} onClick={() => fire('var', null)}>VAR check</Btn>
      </div>
    </Panel>
  )
}

function StylePanel({ s, update }: { s: State; update: (fn: (st: State) => State) => void }) {
  const st = s.style
  const set = (p: Partial<State['style']>) => update(x => ({ ...x, style: { ...x.style, ...p } }))
  const pos: Position[] = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']
  return (
    <Panel className="p-4 flex flex-col gap-3">
      <Label>Look</Label>
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 items-center">
        <span className="text-[14px] text-mist-300">Position</span>
        <div className="grid grid-cols-3 gap-1 w-[150px]">
          {pos.map(p => (
            <button key={p} type="button" aria-label={p.replace('-', ' ')} aria-pressed={st.position === p} onClick={() => { sfx.play('toggle'); set({ position: p }) }}
              className={`focus-invert h-8 rounded border ${st.position === p ? 'bg-flood-500 border-flood-500' : 'border-night-600 hover:border-flood-500'}`} />
          ))}
        </div>
        <span className="text-[14px] text-mist-300">Size</span>
        <div className="flex items-center gap-3">
          <input type="range" min={0.6} max={1.6} step={0.05} value={st.size} onChange={e => set({ size: +e.target.value })} aria-label="Scoreboard size" className="flex-1 accent-[#ffb31a]" />
          <span className="font-mono text-[13px] w-12 text-right">{Math.round(st.size * 100)}%</span>
        </div>
        <span className="text-[14px] text-mist-300">Theme</span>
        <Segmented size="sm" value={st.theme} onChange={v => set({ theme: v })} options={[{ value: 'night', label: 'Night' }, { value: 'light', label: 'Light' }]} />
      </div>
      <div className="-mx-3">
        <Toggle on={st.showPeriod} onChange={v => set({ showPeriod: v })} label="Show period (1H, 2H, FT)" />
        <Toggle on={st.events} onChange={v => set({ events: v })} label="Show pop-ups on stream" />
        <Toggle on={st.sounds} onChange={v => set({ sounds: v })} label="Pop-up sounds on stream" />
      </div>
      {st.sounds && <p className="text-[13px] text-mist-400 -mt-1">In OBS, tick “Control audio via OBS” on the browser source so you can set the volume.</p>}
    </Panel>
  )
}

function EventLog({ s }: { s: State }) {
  if (!s.log.length) return null
  return (
    <Panel className="p-4">
      <Label>Match log</Label>
      <ul className="flex flex-col divide-y divide-night-700 max-h-[260px] overflow-auto -mx-1 px-1">
        {s.log.map(e => (
          <li key={e.id} className="flex items-center gap-3 py-2 text-[14px]">
            <span className="font-mono text-mist-400 w-14 shrink-0">{e.minute}</span>
            <span className="font-semibold">{{ goal: 'Goal', yellow: 'Yellow card', red: 'Red card', var: 'VAR check', sub: 'Substitution' }[e.kind]}</span>
            <span className="text-mist-300 truncate">{[e.team ? s[e.team].name : '', e.text].filter(Boolean).join(' · ')}</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

const SETUP_KEY = 'pitchlab:obs-setup-open'

/** Step-by-step "Add to OBS" card. Fold it away once you're set up; it remembers that in this browser. */
function ObsSetup() {
  const [open, setOpen] = useState(() => load(SETUP_KEY, true))
  const toggle = () => { sfx.play('toggle'); setOpen(o => { save(SETUP_KEY, !o); return !o }) }
  const overlay = IS_PREVIEW ? '' : appUrl('overlay/scoreboard')
  const dock = IS_PREVIEW ? '' : appUrl('stream/dock')
  if (!open) {
    return (
      <div className="max-w-[1600px] mx-auto mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-scrim backdrop-blur-sm px-4 py-2.5">
        <span className="font-display font-bold uppercase tracking-wide text-[18px]">Add to OBS</span>
        <span className="text-[14px] text-mist-400">Overlay and dock links, setup steps</span>
        <Btn size="sm" className="ml-auto" sound={null} onClick={toggle}>Show steps</Btn>
      </div>
    )
  }
  return (
    <section aria-labelledby="obs-setup" className="max-w-[1600px] mx-auto mb-4 rounded-xl border-2 border-flood-500/70 bg-scrim backdrop-blur-sm p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 id="obs-setup" className="font-display font-extrabold uppercase -skew-x-6 text-[30px] leading-none">Add to OBS</h2>
        <span className="text-[15px] text-mist-300">Two links, about two minutes. Use OBS 31 or newer.</span>
        <span className="ml-auto flex items-center gap-2">
          <Link to="/stream/guide" onClick={() => sfx.play('select')} className="focus-invert h-8 px-3 inline-flex items-center rounded-md border border-line text-[13px] font-semibold hover:bg-white/10">Full guide</Link>
          <Btn size="sm" variant="ghost" sound={null} onClick={toggle}>Done, hide steps</Btn>
        </span>
      </div>
      {IS_PREVIEW ? (
        <p className="mt-3 text-[15px] text-mist-300">The OBS links appear here once the app is running on its own website.</p>
      ) : (
        <ol className="mt-4 grid gap-4 lg:grid-cols-3">
          <Step n={1} title="Show the scoreboard on stream">
            <p>In OBS: <b>Sources</b> → <b>+</b> → <b>Browser</b>. Paste this link:</p>
            <CopyField value={overlay} label="overlay link" />
            <p className="flex flex-wrap gap-1.5 items-center">Then set <Chip>Width 1920</Chip><Chip>Height 1080</Chip> and click <b>OK</b>.</p>
          </Step>
          <Step n={2} title="Put the controls in OBS">
            <p>In OBS: <b>Docks</b> → <b>Custom Browser Docks</b>. Name it <Chip>Scoreboard</Chip> and paste this link:</p>
            <CopyField value={dock} label="dock link" />
            <p>Click <b>Apply</b>. Drag the dock next to your scenes.</p>
          </Step>
          <Step n={3} title="Test it before you go live">
            <p>Press <b>Goal</b> in the dock. The score and pop-up should appear on the overlay within a second.</p>
            <p>Mistake? Press <b>Undo</b> or <Kbd>Ctrl</Kbd> <Kbd>Z</Kbd>.</p>
            <p className="text-mist-400 text-[13px]">Capturing a browser window instead? Use the green-screen link: <a href={overlay + '?bg=green'} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-mist-100">open</a> it and add a Chroma Key filter.</p>
          </Step>
        </ol>
      )}
    </section>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="rounded-lg border border-line bg-night-950/60 p-4 flex flex-col gap-3 text-[15px] leading-relaxed min-w-0">
      <div className="flex items-center gap-3">
        <span className="h-9 w-9 shrink-0 rounded-md bg-flood-500 text-night-950 font-display font-extrabold text-xl grid place-items-center">{n}</span>
        <h3 className="font-display font-bold uppercase tracking-wide text-[20px] leading-tight">{title}</h3>
      </div>
      {children}
    </li>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="inline-block rounded border border-flood-500/60 bg-flood-500/15 px-1.5 py-px font-mono text-[13px] text-flood-400 whitespace-nowrap">{children}</span>
}

function ResetMatch({ onReset }: { onReset: () => void }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 3500); return () => clearTimeout(t) }, [armed])
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-mist-400">{armed ? 'This sets the score to 0–0 and the clock to 00:00. Team names and colours stay.' : 'New match? Team names and colours are kept.'}</span>
      <Btn size="sm" variant={armed ? 'danger' : 'ghost'} sound={armed ? 'back' : 'toggle'} onClick={() => { if (armed) { onReset(); setArmed(false) } else setArmed(true) }}>
        {armed ? 'Confirm reset' : 'Reset match'}
      </Btn>
    </div>
  )
}

