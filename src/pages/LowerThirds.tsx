import { Btn, Label, Panel, Segmented } from '../components/ui'
import { GraphicsPage, inputCls } from '../features/graphics/GraphicsPage'
import { G, LOWER_COLORS, useGraphicsControl } from '../features/graphics/state'
import { sfx } from '../lib/sound'

const MAX = 12

export default function LowerThirds() {
  const ctl = useGraphicsControl()
  const { s, update } = ctl
  const L = s.lower, it = L.items[L.cur]
  return (
    <GraphicsPage ctl={ctl} graphic="lower" title="Lower Thirds">
      <Panel className="p-4 flex flex-col gap-3">
        <div className="flex items-baseline justify-between"><Label>Your name bars</Label><span className="text-[12px] text-mist-400">{L.items.length}/{MAX}</span></div>
        <ul className="flex flex-col gap-1.5">
          {L.items.map((x, i) => (
            <li key={x.id}>
              <button type="button" aria-current={i === L.cur} onClick={() => { sfx.play('select'); update(st => G.lowerPick(st, i)) }}
                className={`focus-invert w-full flex items-center gap-3 text-left rounded-md border px-3 py-2 ${i === L.cur ? 'bg-flood-500 border-flood-500 text-night-950' : 'border-night-600 hover:border-flood-500'}`}>
                <span className="h-6 w-1.5 rounded-sm shrink-0" style={{ background: x.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold truncate">{x.name || 'No name yet'}</span>
                  <span className={`block text-[13px] truncate ${i === L.cur ? 'text-night-950/70' : 'text-mist-400'}`}>{x.title || 'No second line'}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Btn size="sm" sound="select" disabled={L.items.length >= MAX} onClick={() => update(G.lowerAdd)}>Add name bar</Btn>
          <Btn size="sm" variant="ghost" sound="back" className="ml-auto" disabled={L.items.length <= 1} onClick={() => update(st => G.lowerRemove(st, st.lower.cur))}>Remove this one</Btn>
        </div>
        <p className="text-[13px] text-mist-400 leading-snug">Pick a different bar while one is on stream and it swaps straight over. Removing one can be undone.</p>
      </Panel>

      {it && (
        <Panel className="p-4 flex flex-col gap-3">
          <Label>Edit</Label>
          <label className="flex flex-col gap-1 text-[13px] text-mist-400">Big line (name)
            <input value={it.name} maxLength={40} onChange={e => update(st => G.lowerPatch(st, st.lower.cur, { name: e.target.value }), `name${it.id}`)} className={inputCls + ' text-[16px] font-semibold text-mist-100'} />
          </label>
          <label className="flex flex-col gap-1 text-[13px] text-mist-400">Small line (role, handle or topic)
            <input value={it.title} maxLength={60} onChange={e => update(st => G.lowerPatch(st, st.lower.cur, { title: e.target.value }), `title${it.id}`)} className={inputCls + ' text-mist-100'} />
          </label>
          <div>
            <div className="text-[13px] text-mist-400 mb-1.5">Colour</div>
            <div className="flex flex-wrap gap-1.5">
              {LOWER_COLORS.map(c => (
                <button key={c} type="button" aria-label={`Colour ${c}`} aria-pressed={it.color === c} onClick={() => { sfx.play('toggle'); update(st => G.lowerPatch(st, st.lower.cur, { color: c })) }}
                  className={`h-7 w-7 rounded-sm ring-1 ${it.color === c ? 'ring-2 ring-flood-400 ring-offset-2 ring-offset-night-850' : 'ring-white/20'}`} style={{ background: c }} />
              ))}
              <label className="h-7 w-7 rounded-sm ring-1 ring-white/20 overflow-hidden cursor-pointer relative" title="Custom colour">
                <input type="color" value={it.color} onChange={e => update(st => G.lowerPatch(st, st.lower.cur, { color: e.target.value }), `color${it.id}`)} className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Custom colour" />
                <span className="absolute inset-0 grid place-items-center text-[11px] text-mist-300 bg-night-700">+</span>
              </label>
            </div>
          </div>
        </Panel>
      )}

      <Panel className="p-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 items-center">
        <span className="text-[14px] text-mist-300">Position</span>
        <Segmented size="sm" value={L.side} onChange={v => update(st => ({ ...st, lower: { ...st.lower, side: v } }))}
          options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Right' }]} />
        <span className="text-[14px] text-mist-300">Hide after</span>
        <Segmented size="sm" value={String(L.autoHide)} onChange={v => update(st => ({ ...st, lower: { ...st.lower, autoHide: +v } }))}
          options={[{ value: '0', label: 'Stay' }, { value: '8', label: '8 s' }, { value: '15', label: '15 s' }, { value: '30', label: '30 s' }]} />
      </Panel>
    </GraphicsPage>
  )
}
