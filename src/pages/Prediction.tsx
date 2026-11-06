import { Btn, Label, Panel } from '../components/ui'
import { GraphicsPage, inputCls, type GCtl } from '../features/graphics/GraphicsPage'
import { useGraphicsControl, type PTeam } from '../features/graphics/state'
import { SWATCHES, type State as Score } from '../features/scoreboard/state'
import { sfx } from '../lib/sound'
import { loadRaw } from '../lib/storage'

type Side = 'home' | 'away'

export default function Prediction() {
  const ctl = useGraphicsControl()
  const { s, update } = ctl
  const fromScoreboard = () => {
    const sb = loadRaw<Score>('pitchlab:scoreboard')
    if (!sb?.home) return
    const pick = (t: Score['home']) => ({ name: t.name, code: t.code, color: t.color })
    update(st => ({ ...st, prediction: { ...st.prediction, home: { ...st.prediction.home, ...pick(sb.home) }, away: { ...st.prediction.away, ...pick(sb.away) } } }))
  }
  const p = s.prediction
  return (
    <GraphicsPage ctl={ctl} graphic="prediction" title="Prediction Card">
      <Panel className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3"><Label>Your prediction</Label>
          <Btn size="sm" variant="ghost" sound="select" onClick={fromScoreboard}>Use scoreboard teams</Btn></div>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
          <TeamEdit side="home" t={p.home} update={update} />
          <div className="pt-[88px] font-display font-extrabold text-3xl text-mist-400">–</div>
          <TeamEdit side="away" t={p.away} update={update} />
        </div>
      </Panel>
      <Panel className="p-4 flex flex-col gap-3">
        <Label>Extra lines (optional)</Label>
        <label className="flex flex-col gap-1 text-[13px] text-mist-400">Whose prediction (shows as “Name’s prediction”)
          <input value={p.by} maxLength={24} placeholder="My prediction" onChange={e => update(st => ({ ...st, prediction: { ...st.prediction, by: e.target.value } }), 'by')} className={inputCls + ' text-mist-100'} />
        </label>
        <label className="flex flex-col gap-1 text-[13px] text-mist-400">Note under the score
          <input value={p.note} maxLength={70} placeholder="For example: first scorer, or why" onChange={e => update(st => ({ ...st, prediction: { ...st.prediction, note: e.target.value } }), 'note')} className={inputCls + ' text-mist-100'} />
        </label>
      </Panel>
    </GraphicsPage>
  )
}

function TeamEdit({ side, t, update }: { side: Side; t: PTeam; update: GCtl['update'] }) {
  const set = (patch: Partial<PTeam>, merge = '') => update(st => ({ ...st, prediction: { ...st.prediction, [side]: { ...st.prediction[side], ...patch } } }), merge)
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="flex items-center gap-2">
        <input aria-label={`${side} team name`} value={t.name} maxLength={24} onChange={e => set({ name: e.target.value }, side + 'name')}
          className="min-w-0 flex-1 h-9 bg-transparent border-b border-night-600 focus:border-flood-500 outline-none font-semibold text-[16px]" />
        <input aria-label={`${side} short name shown on stream`} value={t.code} maxLength={4} onChange={e => set({ code: e.target.value.toUpperCase() }, side + 'code')}
          className="w-[64px] h-9 text-center rounded-md bg-night-900 border border-night-600 focus:border-flood-500 outline-none font-display font-bold text-[18px] tracking-wider" />
      </div>
      <div className="flex items-center justify-center gap-3 py-1">
        <button type="button" aria-label={`One less for ${t.name}`} disabled={t.score === 0} onClick={() => { sfx.play('back'); set({ score: Math.max(0, t.score - 1) }) }}
          className="focus-invert h-12 w-12 rounded-lg border border-night-600 text-2xl text-mist-300 hover:border-flood-500 disabled:opacity-30">−</button>
        <span className="font-display font-extrabold tabular text-[64px] leading-none w-[1.4em] text-center">{t.score}</span>
        <button type="button" aria-label={`One more for ${t.name}`} disabled={t.score >= 20} onClick={() => { sfx.play('toggle'); set({ score: Math.min(20, t.score + 1) }) }}
          className="focus-invert h-12 w-12 rounded-lg border border-night-600 text-2xl text-mist-300 hover:border-flood-500 disabled:opacity-30">+</button>
      </div>
      <div className="flex flex-wrap gap-1">
        {SWATCHES.map(c => (
          <button key={c} type="button" aria-label={`Colour ${c}`} aria-pressed={t.color === c} onClick={() => { sfx.play('toggle'); set({ color: c }) }}
            className={`h-6 w-6 rounded-sm ring-1 ${t.color === c ? 'ring-2 ring-flood-400 ring-offset-2 ring-offset-night-850' : 'ring-white/20'}`} style={{ background: c }} />
        ))}
      </div>
    </div>
  )
}
