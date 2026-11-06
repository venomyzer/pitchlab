import { useEffect, useRef } from 'react'
import { CopyField } from '../components/CopyField'
import { IconUndo } from '../components/Icons'
import { Shell } from '../components/Shell'
import { PitchTag, ToolLayout } from '../components/ToolLayout'
import { Btn, Kbd, Label, Segmented } from '../components/ui'
import { IS_PREVIEW } from '../config'
import { FORMATIONS } from '../data/formations'
import { lineupSpots, slotLabels } from '../data/lineup'
import { roleOf } from '../data/roles'
import { inputCls } from '../features/graphics/GraphicsPage'
import { G, isLive, useGraphicsControl, type GState } from '../features/graphics/state'
import { Pitch, Token } from '../features/pitch/Pitch'
import { appUrl } from '../features/scoreboard/control'
import { SWATCHES, useNow } from '../features/scoreboard/state'
import { sfx } from '../lib/sound'
import { useNames } from '../lib/useNames'

const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i])

/**
 * Pick a starting eleven with shirt numbers, subs and coach. Names are shared with every board.
 * The same lineup shows on stream as the lineup card (graphics overlay).
 */
export default function Lineup() {
  const { s, update, undo, canUndo } = useGraphicsControl()
  const { names, setNames } = useNames()
  const now = useNow(500)
  const l = s.lineup, labels = slotLabels(l.formation), spots = lineupSpots(l.formation)
  const live = isLive(s, 'lineup', now)
  const set = (p: Partial<GState['lineup']>, merge = '') => update(st => ({ ...st, lineup: { ...st.lineup, ...p } }), merge)

  // Board names win when the page opens; after that the lineup (with undo) drives them.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; if (names.some(Boolean) && !same(names, l.names)) set({ names: [...names] }); return }
    if (!same(names, l.names)) setNames([...l.names])
  })
  const toggleRef = useRef(() => {}); toggleRef.current = () => update(st => G.toggle(st, 'lineup'))
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      if (e.key === 't' || e.key === 'T') { e.preventDefault(); toggleRef.current() }
    }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [])

  const pitch = (
    <Pitch aria-label={`Lineup: ${l.team || 'team'} in a ${l.formation}`}>
      <text x="-1.5" y="-4.4" fill="#fff" fontSize="2" fontFamily="Saira Condensed, sans-serif" fontWeight={800} opacity=".85">ATTACKS →</text>
      {spots.map((p, i) => <Token key={i} x={p.x} y={p.y} team="home" label={l.numbers[i]?.trim() || labels[i]} name={l.names[i]} />)}
    </Pitch>
  )
  const subs = l.subs.split(/[\n,]/).map(x => x.trim()).filter(Boolean)

  const panel = (
    <>
      <div className="flex items-center gap-2">
        <Btn variant={live ? 'danger' : 'primary'} sound={live ? 'back' : 'select'} hint="T" className="flex-1" onClick={() => toggleRef.current()}>{live ? 'Hide lineup card' : 'Show lineup card on stream'}</Btn>
        <Btn size="sm" variant="ghost" sound={null} onClick={undo} disabled={!canUndo} aria-label="Undo"><IconUndo className="h-4 w-4" /></Btn>
      </div>
      <div>
        <Label>Team</Label>
        <input aria-label="Team name" value={l.team} maxLength={24} onChange={e => set({ team: e.target.value }, 'team')} className={inputCls + ' w-full text-[16px] font-semibold text-mist-100'} />
        <div className="flex flex-wrap gap-1 mt-2">
          {SWATCHES.map(c => (
            <button key={c} type="button" aria-label={`Colour ${c}`} aria-pressed={l.color === c} onClick={() => { sfx.play('toggle'); set({ color: c }) }}
              className={`h-6 w-6 rounded-sm ring-1 ${l.color === c ? 'ring-2 ring-flood-400 ring-offset-2 ring-offset-night-850' : 'ring-white/20'}`} style={{ background: c }} />
          ))}
        </div>
      </div>
      <div>
        <Label>Formation</Label>
        <Segmented size="sm" value={l.formation} onChange={v => set({ formation: v })} options={FORMATIONS.map(f => ({ value: f.name, label: f.name }))} />
      </div>
      <div>
        <div className="flex items-baseline justify-between"><Label>Starting eleven</Label><span className="text-[12px] text-mist-400">No. · Name</span></div>
        <ul className="flex flex-col gap-1">
          {labels.map((lab, i) => (
            <li key={i} className="grid grid-cols-[2.8rem_3.2rem_minmax(0,1fr)] gap-1.5 items-center">
              <span className="font-mono text-[12px] text-mist-400" title={roleOf(lab)[1]}>{lab}</span>
              <input aria-label={`Shirt number, ${roleOf(lab)[1]}`} value={l.numbers[i] ?? ''} maxLength={2} inputMode="numeric"
                onChange={e => set({ numbers: l.numbers.map((x, k) => (k === i ? e.target.value.replace(/\D/g, '') : x)) }, `num${i}`)}
                className={inputCls + ' h-9 px-1 text-center font-mono text-mist-100'} />
              <input aria-label={`Name, ${roleOf(lab)[1]}`} value={l.names[i] ?? ''} maxLength={20}
                onChange={e => set({ names: l.names.map((x, k) => (k === i ? e.target.value : x)) }, `name${i}`)}
                className={inputCls + ' h-9 text-mist-100'} />
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-[12px] text-mist-400">Names are shared with Formation Lab and the Tactics Sandbox.</p>
      </div>
      <label className="flex flex-col gap-1 text-[13px] text-mist-400">Subs (comma or one per line)
        <textarea value={l.subs} rows={3} maxLength={300} onChange={e => set({ subs: e.target.value }, 'subs')}
          className="rounded-md bg-night-900 border border-night-600 focus:border-flood-500 outline-none p-2.5 text-[14px] text-mist-100 resize-y" />
      </label>
      <label className="flex flex-col gap-1 text-[13px] text-mist-400">Coach (optional)
        <input value={l.coach} maxLength={30} onChange={e => set({ coach: e.target.value }, 'coach')} className={inputCls + ' text-mist-100'} />
      </label>
      {!IS_PREVIEW && (
        <div className="border-t border-night-700 pt-3">
          <div className="text-[13px] text-mist-400 mb-1.5">Graphics overlay for OBS (1920 × 1080 browser source)</div>
          <CopyField size="sm" value={appUrl('overlay/graphics')} label="graphics overlay link" />
        </div>
      )}
    </>
  )

  return (
    <Shell back="/tactics" eyebrow="Tactic boards" title="Lineup Builder" wide>
      <ToolLayout pitch={pitch} panel={panel}
        tagLeft={<PitchTag big>{(l.team || 'Lineup') + ' · ' + l.formation}</PitchTag>}
        tagRight={subs.length ? <PitchTag>Subs: {subs.slice(0, 6).join(', ')}{subs.length > 6 ? '…' : ''}</PitchTag> : undefined}
        hotkeys={<><span className="inline-flex gap-1.5 items-center"><Kbd>T</Kbd> show on stream</span><span className="inline-flex gap-1.5 items-center"><Kbd>Ctrl Z</Kbd> undo</span><span className="inline-flex gap-1.5 items-center"><Kbd>Esc</Kbd> back</span></>} />
    </Shell>
  )
}
