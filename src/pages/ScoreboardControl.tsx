import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shell } from '../components/Shell'
import { IconCopy, IconExternal, IconPause, IconPlay, IconUndo } from '../components/Icons'
import { Btn, Kbd, Label, Panel, Segmented, Toggle } from '../components/ui'
import { IS_PREVIEW } from '../config'
import { ScoreboardView } from '../features/scoreboard/ScoreboardView'
import { useScoreHotkeys } from '../features/scoreboard/hotkeys'
import { A, clockText, PERIODS, SWATCHES, useNow, useScoreboard, type EventKind, type Position, type Side, type State } from '../features/scoreboard/state'
import { useReducedMotion } from '../lib/settings'
import { sfx } from '../lib/sound'

export default function ScoreboardControl() {
  const { state: s, update: rawUpdate, commit } = useScoreboard()
  const now = useNow(200)
  const reduce = useReducedMotion()
  const history = useRef<State[]>([])
  const [canUndo, setCanUndo] = useState(false)
  // every change from this panel goes through here, so it can be undone
  const update = (fn: (st: State) => State) => {
    rawUpdate(st => { history.current = [...history.current.slice(-40), st]; return fn(st) })
    setCanUndo(true)
  }
  const undo = () => {
    const prev = history.current.pop(); if (!prev) return
    sfx.play('back'); commit({ ...prev }); setCanUndo(history.current.length > 0)
  }
  const updRef = useRef(update); updRef.current = update
  const stableUpdate = useRef((fn: (st: State) => State) => updRef.current(fn)).current
  useScoreHotkeys(stableUpdate, { sounds: true, ignoreEsc: true })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !(e.target as HTMLElement).closest('input')) { e.preventDefault(); undo() } }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  })

  const c = clockText(s, now)
  return (
    <Shell back="/stream" eyebrow="Streamer tools" title="Match Scoreboard" wide
      actions={<Btn size="sm" variant="ghost" sound={null} onClick={undo} disabled={!canUndo} hint="Ctrl Z"><IconUndo className="h-4 w-4" />Undo</Btn>}>
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
          <ConnectPanel />
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

function ConnectPanel() {
  const url = IS_PREVIEW ? '' : `${window.location.origin}${import.meta.env.BASE_URL.replace(/^\.\//, '/')}overlay/scoreboard`.replace(/([^:]\/)\/+/g, '$1')
  const [copied, setCopied] = useState('')
  const copy = (u: string, label: string) => {
    navigator.clipboard?.writeText(u).then(() => { setCopied(label); sfx.play('select'); setTimeout(() => setCopied(''), 2000) }).catch(() => setCopied('select'))
  }
  return (
    <Panel className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between"><Label>Add to OBS</Label><Link to="/stream/guide" className="text-[13px] text-flood-400 hover:underline">Step-by-step guide</Link></div>
      {IS_PREVIEW ? (
        <p className="text-[14px] text-mist-300">The overlay link appears here once PitchLab is running on its own website.</p>
      ) : (<>
        <div className="flex gap-2">
          <input readOnly value={url} onFocus={e => e.currentTarget.select()} aria-label="Overlay link" className="flex-1 min-w-0 h-10 rounded-md bg-night-900 border border-night-600 px-3 text-[13px] font-mono text-mist-300" />
          <Btn sound={null} onClick={() => copy(url, 'link')}><IconCopy className="h-4 w-4" />{copied === 'link' ? 'Copied' : 'Copy'}</Btn>
        </div>
        <p className="text-[13px] text-mist-400 leading-snug">OBS: Sources → + → Browser → paste the link, width 1920, height 1080. Keep this panel open in an OBS dock or a browser tab to control it.</p>
        <div className="flex flex-wrap gap-2">
          <a href={url} target="_blank" rel="noreferrer" onClick={() => sfx.play('select')} className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-night-600 text-[13px] font-semibold hover:border-flood-500"><IconExternal className="h-4 w-4" />Open overlay</a>
          <Btn size="sm" variant="ghost" sound={null} onClick={() => copy(url + '?bg=green', 'green')}>{copied === 'green' ? 'Copied' : 'Copy green-screen link'}</Btn>
        </div>
      </>)}
      <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[13px] text-mist-400 border-t border-night-700 pt-3">
        <span className="inline-flex gap-1.5 items-center"><Kbd>1</Kbd><Kbd>2</Kbd> goal</span>
        <span className="inline-flex gap-1.5 items-center"><Kbd>⇧1</Kbd><Kbd>⇧2</Kbd> remove goal</span>
        <span className="inline-flex gap-1.5 items-center"><Kbd>Space</Kbd> clock</span>
        <span>These also work on the overlay itself.</span>
      </div>
    </Panel>
  )
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

