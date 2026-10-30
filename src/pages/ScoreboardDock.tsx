import { useEffect, useState, type ReactNode } from 'react'
import { IconPause, IconPlay, IconUndo } from '../components/Icons'
import { Kbd, Segmented, Toggle } from '../components/ui'
import { APP_NAME } from '../config'
import { textOn, useScoreControl } from '../features/scoreboard/control'
import { A, clockText, PERIODS, SWATCHES, useNow, type EventKind, type Period, type Position, type Side, type State } from '../features/scoreboard/state'
import { sfx } from '../lib/sound'

type Update = (fn: (st: State) => State) => void

/**
 * Compact scoreboard controls for an OBS Custom Browser Dock (works from about 280px wide).
 * No menu, no background and no Esc-to-leave, so nothing here can navigate away mid-stream.
 */
export default function ScoreboardDock() {
  const { s, update, undo, canUndo } = useScoreControl({ ignoreEsc: false })
  const now = useNow(200)
  const [who, setWho] = useState('')
  const [tab, setTab] = useState<'live' | 'settings'>('live')
  useEffect(() => { document.title = `${APP_NAME} dock` }, [])

  const goal = (side: Side) => { sfx.play('goal'); update(st => A.goal(st, side, who.trim())); setWho('') }
  const popup = (kind: EventKind, team: Side | null) => { sfx.play(kind === 'var' ? 'whistle' : 'card'); update(st => A.event(st, kind, team, who.trim())); setWho('') }
  const active = s.event && now - s.event.at < 9000

  return (
    <div className="min-h-full bg-night-900 text-mist-100 p-3 flex flex-col gap-3 max-w-[560px] mx-auto text-[14px]">
      <header className="flex items-center gap-2">
        <span className="font-display font-extrabold uppercase -skew-x-6 text-[18px] tracking-wide">Scoreboard</span>
        <span className="flex items-center gap-1.5 text-[12px] text-mist-400"><span className="h-2 w-2 rounded-full bg-ok" />Auto-save</span>
        <button type="button" onClick={undo} disabled={!canUndo}
          className="focus-invert ml-auto h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-line bg-white/5 hover:bg-white/15 font-semibold disabled:opacity-40">
          <IconUndo className="h-4 w-4" />Undo
        </button>
      </header>

      <div role="tablist" aria-label="Dock sections" className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-night-950/70 border border-line">
        {([['live', 'Live controls'], ['settings', 'Settings']] as const).map(([v, l]) => (
          <button key={v} type="button" role="tab" id={`tab-${v}`} aria-selected={tab === v} aria-controls={`panel-${v}`} onClick={() => { sfx.play('toggle'); setTab(v) }}
            className={`focus-invert h-10 rounded-md font-display font-bold uppercase tracking-wide text-[16px] ${tab === v ? 'bg-flood-500 text-night-950' : 'text-mist-300 hover:bg-white/10'}`}>{l}</button>
        ))}
      </div>

      {tab === 'live' ? <div role="tabpanel" id="panel-live" aria-labelledby="tab-live" className="flex flex-col gap-3">
        {/* Clock */}
        <Clock s={s} update={update} now={now} />

        {/* Goals, with team names and colours set right here */}
        <div className="grid grid-cols-2 gap-2">
          {(['home', 'away'] as const).map((side, i) => <TeamCard key={side} side={side} hotkey={i + 1} s={s} update={update} onGoal={() => goal(side)} />)}
        </div>

        {/* Pop-ups */}
        <Section title="Pop-ups" right={<Small onClick={() => { sfx.play('back'); update(A.clearEvent) }} disabled={!active} label="Hide pop-up">Hide <Kbd>Esc</Kbd></Small>}>
          <input value={who} onChange={e => setWho(e.target.value)} placeholder="Player name (optional)" maxLength={40} aria-label="Player name for the next goal, card or sub"
            className="h-10 rounded-md bg-night-950 border border-line focus:border-focus outline-none px-3 min-w-0" />
          {(['home', 'away'] as const).map(side => (
            <div key={side} className="grid grid-cols-[3.5rem_1fr_1fr_1fr] gap-1 items-center">
              <span className="font-display font-bold uppercase tracking-wider truncate">{s[side].code || s[side].name}</span>
              <Small onClick={() => popup('yellow', side)} label={`Yellow card ${s[side].name}`}><i className="h-3.5 w-2.5 rounded-[2px] bg-[#ffd400]" />Yellow</Small>
              <Small onClick={() => popup('red', side)} label={`Red card ${s[side].name}`}><i className="h-3.5 w-2.5 rounded-[2px] bg-away" />Red</Small>
              <Small onClick={() => popup('sub', side)} label={`Substitution ${s[side].name}`}>Sub</Small>
            </div>
          ))}
          <Small onClick={() => popup('var', null)} label="VAR check">VAR check</Small>
          <p className="text-[12px] text-mist-400 -mt-0.5">The name goes on the next goal, card or sub, then clears.</p>
        </Section>

      </div> : <div role="tabpanel" id="panel-settings" aria-labelledby="tab-settings" className="flex flex-col gap-3">
        <Look s={s} update={update} />
        <Section title="Match"><Reset onReset={() => update(A.resetMatch)} /></Section>
      </div>}

      <footer className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-mist-400 pt-1">
        <span><Kbd>1</Kbd> <Kbd>2</Kbd> goal</span><span><Kbd>⇧1</Kbd> <Kbd>⇧2</Kbd> remove</span><span><Kbd>Space</Kbd> clock</span><span><Kbd>Ctrl Z</Kbd> undo</span>
        <span className="w-full">Click inside this dock first so the keys reach it.</span>
      </footer>
    </div>
  )
}

function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-night-950/40 p-2.5 flex flex-col gap-2">
      <div className="flex items-center"><h2 className="text-[12px] font-semibold tracking-[0.16em] uppercase text-mist-400">{title}</h2><span className="ml-auto">{right}</span></div>
      {children}
    </section>
  )
}

function Small({ children, onClick, disabled, label }: { children: ReactNode; onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label}
      className="focus-invert h-9 px-2 rounded-md border border-line bg-white/5 hover:bg-white/15 font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-35 min-w-0">
      {children}
    </button>
  )
}

const MAIN: Period[] = ['1H', 'HT', '2H', 'FT']
const MORE: Period[] = ['PRE', 'ET1', 'ET2', 'PEN']
const short = (p: Period) => (p === 'PRE' ? 'Pre' : p === 'PEN' ? 'Pens' : p)

/** Time, Start/Pause, the four main periods and added time. Extra time and clock nudges sit behind "More". */
function Clock({ s, update, now }: { s: State; update: Update; now: number }) {
  const [more, setMore] = useState(false)
  const c = clockText(s, now)
  const setPeriod = (p: Period) => { sfx.play('toggle'); update(st => A.period(st, p)) }
  const label = (p: Period) => PERIODS.find(x => x.v === p)!.label
  const periodBtn = (p: Period) => (
    <button key={p} type="button" aria-pressed={s.period === p} title={label(p)} onClick={() => setPeriod(p)}
      className={`focus-invert h-10 rounded-md border text-[14px] font-semibold px-1 ${s.period === p ? 'bg-flood-500 border-flood-500 text-night-950' : 'border-line hover:bg-white/10'}`}>{short(p)}</button>
  )
  return (
    <Section title="Clock">
      <div className="flex items-center gap-2">
        <div className="font-display font-extrabold tabular text-[42px] leading-none -skew-x-6">{c.main}{c.over && <span className="text-flood-400 text-[22px] ml-1.5">{c.over}</span>}</div>
        <button type="button" onClick={() => { sfx.play('whistle'); update(A.toggle) }}
          className={`focus-invert ml-auto h-12 px-4 min-w-[112px] rounded-md border font-semibold text-[17px] inline-flex items-center justify-center gap-2
            ${s.clock.running ? 'bg-white/10 border-line hover:bg-white/20' : 'bg-flood-500 border-flood-500 text-night-950 hover:bg-flood-400'}`}>
          {s.clock.running ? <><IconPause className="h-5 w-5" />Pause</> : <><IconPlay className="h-5 w-5" />Start</>}
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1">{MAIN.map(periodBtn)}</div>
      <div className="flex items-center gap-1">
        <span className="text-mist-300 mr-1">Added time</span>
        <Small onClick={() => { sfx.play('toggle'); update(st => ({ ...st, added: Math.max(0, st.added - 1) })) }} disabled={s.added === 0} label="Less added time">−</Small>
        <span className="w-11 text-center font-mono text-[15px]">{s.added ? `+${s.added}` : 'Off'}</span>
        <Small onClick={() => { sfx.play('toggle'); update(st => ({ ...st, added: Math.min(15, st.added + 1) })) }} label="More added time">+</Small>
        <button type="button" aria-expanded={more} onClick={() => { sfx.play('toggle'); setMore(m => !m) }}
          className={`focus-invert ml-auto h-9 px-2.5 rounded-md border font-semibold ${MORE.includes(s.period) && !more ? 'border-flood-500 text-flood-400' : 'border-line hover:bg-white/10'}`}>
          {MORE.includes(s.period) && !more ? short(s.period) : 'More'} {more ? '▴' : '▾'}
        </button>
      </div>
      {more && (
        <div className="flex flex-col gap-1 pt-1 border-t border-line/40">
          <div className="grid grid-cols-4 gap-1">{MORE.map(periodBtn)}</div>
          <div className="grid grid-cols-4 gap-1">
            {([[-60000, '−1m'], [-10000, '−10s'], [10000, '+10s'], [60000, '+1m']] as const).map(([ms, l]) => (
              <Small key={l} onClick={() => { sfx.play('toggle'); update(st => A.adjust(st, ms)) }} label={`Clock ${l}`}>{l}</Small>
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}

/** One team: short name (on stream), full name, colour, score and the Goal button. */
function TeamCard({ side, hotkey, s, update, onGoal }: { side: Side; hotkey: number; s: State; update: Update; onGoal: () => void }) {
  const [colours, setColours] = useState(false)
  const t = s[side]
  const set = (patch: Partial<State['home']>) => update(st => ({ ...st, [side]: { ...st[side], ...patch } }))
  return (
    <div className="rounded-lg border border-line bg-night-950/60 p-2 flex flex-col gap-2 min-w-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <button type="button" aria-label={`${t.name} colour`} aria-expanded={colours} onClick={() => { sfx.play('toggle'); setColours(o => !o) }}
          className="focus-invert h-7 w-7 shrink-0 rounded-md ring-1 ring-white/40" style={{ background: t.color }} />
        <input aria-label={`${side} short name shown on stream`} title="Short name, shown on stream" value={t.code} maxLength={4} onChange={e => set({ code: e.target.value.toUpperCase() })}
          className="w-[3.6rem] min-w-0 h-8 text-center rounded-md bg-night-950 border border-line focus:border-focus outline-none font-display font-bold tracking-wider text-[16px] uppercase" />
        <span className="ml-auto font-display font-extrabold tabular text-[40px] leading-none">{t.score}</span>
      </div>
      {colours && (
        <div className="grid grid-cols-6 gap-1">
          {SWATCHES.map(col => (
            <button key={col} type="button" aria-label={`${t.name} colour ${col}`} aria-pressed={t.color === col} onClick={() => { sfx.play('toggle'); set({ color: col }); setColours(false) }}
              className={`aspect-square rounded-sm ring-1 ${t.color === col ? 'ring-2 ring-white' : 'ring-white/25'}`} style={{ background: col }} />
          ))}
        </div>
      )}
      <input aria-label={`${side} team name`} placeholder="Team name" value={t.name} maxLength={24} onChange={e => set({ name: e.target.value })}
        className="h-8 min-w-0 rounded-md bg-night-950 border border-line focus:border-focus outline-none px-2 text-[13px]" />
      <button type="button" onClick={onGoal}
        className="focus-invert h-14 rounded-md font-display font-extrabold uppercase text-[22px] tracking-wide flex items-center justify-center gap-2 border-2 border-white/20 hover:brightness-110"
        style={{ background: t.color, color: textOn(t.color) }}>
        Goal <Kbd className="!text-current !border-current/40 opacity-80">{hotkey}</Kbd>
      </button>
      <div className="grid grid-cols-2 gap-1">
        <Small onClick={() => { sfx.play('back'); update(st => A.score(st, side, -1)) }} disabled={t.score === 0} label={`Remove a goal from ${t.name}`}>− 1</Small>
        <Small onClick={() => { sfx.play('toggle'); update(st => A.score(st, side, 1)) }} label={`Add a goal to ${t.name} without a pop-up`}>+ 1</Small>
      </div>
    </div>
  )
}

const POSITIONS: Position[] = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']

/** Where the scoreboard sits, its size and theme, and what it shows. Lives on the Settings tab, away from the live buttons. */
function Look({ s, update }: { s: State; update: Update }) {
  const st = s.style
  const set = (p: Partial<State['style']>) => update(x => ({ ...x, style: { ...x.style, ...p } }))
  return (
    <Section title="Look on stream">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-mist-300 w-16 shrink-0">Position</span>
            <div className="grid grid-cols-3 gap-1 flex-1 max-w-[180px]" role="group" aria-label="Scoreboard position on stream">
              {POSITIONS.map(p => (
                <button key={p} type="button" aria-label={p.replace('-', ' ')} title={p.replace('-', ' ')} aria-pressed={st.position === p} onClick={() => { sfx.play('toggle'); set({ position: p }) }}
                  className={`focus-invert h-8 rounded border ${st.position === p ? 'bg-flood-500 border-flood-500' : 'border-line hover:bg-white/10'}`} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-mist-300 w-16 shrink-0">Size</span>
            <input type="range" min={0.6} max={1.6} step={0.05} value={st.size} onChange={e => set({ size: +e.target.value })} aria-label="Scoreboard size" className="flex-1 min-w-0 accent-[#ffb31a]" />
            <span className="font-mono text-[13px] w-11 text-right">{Math.round(st.size * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-mist-300 w-16 shrink-0">Theme</span>
            <div className="flex-1"><Segmented size="sm" value={st.theme} onChange={v => set({ theme: v })} options={[{ value: 'night', label: 'Night' }, { value: 'light', label: 'Light' }]} /></div>
          </div>
          <div className="-mx-3">
            <Toggle on={st.showPeriod} onChange={v => set({ showPeriod: v })} label="Show period (1H, 2H, FT)" />
            <Toggle on={st.events} onChange={v => set({ events: v })} label="Show pop-ups on stream" />
            <Toggle on={st.sounds} onChange={v => set({ sounds: v })} label="Pop-up sounds on stream" />
          </div>
          {st.sounds && <p className="text-[12px] text-mist-400 -mt-1">In OBS, tick “Control audio via OBS” on the browser source so you can set the volume.</p>}
        </div>
    </Section>
  )
}

function Reset({ onReset }: { onReset: () => void }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 3500); return () => clearTimeout(t) }, [armed])
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-mist-400 leading-snug">{armed ? 'Sets the score to 0–0 and the clock to 00:00. Teams stay.' : 'New match? Teams are kept.'}</span>
      <button type="button" onClick={() => { if (armed) { sfx.play('back'); onReset(); setArmed(false) } else { sfx.play('toggle'); setArmed(true) } }}
        className={`focus-invert ml-auto shrink-0 h-9 px-3 rounded-md border font-semibold ${armed ? 'bg-bad/20 border-bad/50 text-bad' : 'border-line hover:bg-white/10'}`}>
        {armed ? 'Confirm reset' : 'Reset match'}
      </button>
    </div>
  )
}
