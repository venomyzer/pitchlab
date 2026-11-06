import { Btn, ConfirmBtn, Label, Panel } from '../components/ui'
import { slotLabels } from '../data/lineup'
import { GraphicsPage, inputCls } from '../features/graphics/GraphicsPage'
import { clampRating, G, ratingColor, useGraphicsControl, type GState, type Rated } from '../features/graphics/state'
import { SWATCHES } from '../features/scoreboard/state'
import { sfx } from '../lib/sound'

const MAX = 16

/** Starters (with their formation labels) and subs from the Lineup Builder. */
function fromLineup(s: GState): Rated[] {
  const l = s.lineup, labels = slotLabels(l.formation)
  const starters = l.names.map((n, i) => ({ name: n.trim(), pos: labels[i], score: null }))
  const subs = l.subs.split(/[\n,]/).map(x => x.trim()).filter(Boolean).map(n => ({ name: n, pos: 'SUB', score: null }))
  return [...starters, ...subs].filter(p => p.name).slice(0, MAX)
}

export default function Ratings() {
  const ctl = useGraphicsControl()
  const { s, update } = ctl
  const r = s.ratings
  const setR = (p: Partial<GState['ratings']>, merge = '') => update(st => ({ ...st, ratings: { ...st.ratings, ...p } }), merge)
  const lineup = fromLineup(s)
  const rated = r.players.filter(p => p.score != null)
  const avg = rated.length ? rated.reduce((a, p) => a + (p.score ?? 0), 0) / rated.length : null

  return (
    <GraphicsPage ctl={ctl} graphic="ratings" title="Player Ratings">
      <Panel className="p-4 flex flex-col gap-3">
        <Label>Team</Label>
        <div className="flex items-center gap-2">
          <input aria-label="Team name" value={r.team} maxLength={24} onChange={e => setR({ team: e.target.value }, 'team')} className={inputCls + ' flex-1 text-[16px] font-semibold text-mist-100'} />
        </div>
        <div className="flex flex-wrap gap-1">
          {SWATCHES.map(c => (
            <button key={c} type="button" aria-label={`Colour ${c}`} aria-pressed={r.color === c} onClick={() => { sfx.play('toggle'); setR({ color: c }) }}
              className={`h-6 w-6 rounded-sm ring-1 ${r.color === c ? 'ring-2 ring-flood-400 ring-offset-2 ring-offset-night-850' : 'ring-white/20'}`} style={{ background: c }} />
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Btn size="sm" sound="select" disabled={!lineup.length} onClick={() => setR({ players: lineup, motm: -1, team: s.lineup.team || r.team, color: s.lineup.color })}>
            Load from Lineup Builder{lineup.length ? ` (${lineup.length})` : ''}
          </Btn>
          {!lineup.length && <span className="text-[13px] text-mist-400 self-center">Add names in Tactic boards → Lineup Builder first, or add players below.</span>}
        </div>
      </Panel>

      <Panel className="p-4 flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label>Players and ratings (1 to 10)</Label>
          <span className="text-[12px] text-mist-400">{avg != null ? `Average ${avg.toFixed(1)}` : `${r.players.length}/${MAX}`}</span>
        </div>
        {!r.players.length && <p className="text-[14px] text-mist-400">No players yet. Load your lineup or add players one by one.</p>}
        <ul className="flex flex-col gap-1.5">
          {r.players.map((p, i) => (
            <li key={i} className="grid grid-cols-[3.2rem_minmax(0,1fr)_auto_auto] gap-1.5 items-center">
              <input aria-label={`Position of player ${i + 1}`} value={p.pos} maxLength={4} onChange={e => update(st => G.ratingsSet(st, i, { pos: e.target.value.toUpperCase() }), `pos${i}`)}
                className={inputCls + ' h-9 px-1 text-center font-mono text-[13px] text-mist-300'} />
              <input aria-label={`Name of player ${i + 1}`} value={p.name} maxLength={28} onChange={e => update(st => G.ratingsSet(st, i, { name: e.target.value }), `name${i}`)}
                className={inputCls + ' h-9 text-mist-100'} />
              <Score p={p} onChange={n => update(st => G.ratingsSet(st, i, { score: n }))} />
              <button type="button" aria-label={`Player of the match: ${p.name || `player ${i + 1}`}`} aria-pressed={r.motm === i} title="Player of the match"
                onClick={() => { sfx.play('toggle'); setR({ motm: r.motm === i ? -1 : i }) }}
                className={`focus-invert h-9 px-2 rounded-md border text-[12px] font-bold tracking-wider ${r.motm === i ? 'bg-flood-500 border-flood-500 text-night-950' : 'border-night-600 text-mist-400 hover:border-flood-500'}`}>MOTM</button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 flex-wrap mt-1">
          <Btn size="sm" sound="select" disabled={r.players.length >= MAX} onClick={() => setR({ players: [...r.players, { name: '', pos: '', score: null }] })}>Add player</Btn>
          <Btn size="sm" variant="ghost" sound="back" disabled={!r.players.length}
            onClick={() => setR({ players: r.players.slice(0, -1), motm: r.motm >= r.players.length - 1 ? -1 : r.motm })}>Remove last</Btn>
          <span className="ml-auto"><ConfirmBtn label="Clear ratings" confirm="Confirm: clear ratings" disabled={!rated.length}
            onConfirm={() => setR({ players: r.players.map(p => ({ ...p, score: null })), motm: -1 })} /></span>
        </div>
        <p className="text-[13px] text-mist-400 leading-snug">Players without a name are left off the graphic. Green is 8 and up, amber 6.5 and up.</p>
      </Panel>
    </GraphicsPage>
  )
}

function Score({ p, onChange }: { p: Rated; onChange: (n: number | null) => void }) {
  const v = p.score
  const step = (d: number) => { sfx.play('toggle'); onChange(clampRating((v ?? 6) + (v == null ? 0 : d))) }
  return (
    <span className="flex items-center gap-0.5">
      <button type="button" aria-label="Lower rating" onClick={() => step(-0.5)} disabled={v === 1}
        className="focus-invert h-9 w-8 rounded-md border border-night-600 text-mist-300 hover:border-flood-500 disabled:opacity-30">−</button>
      <button type="button" aria-label={v == null ? 'Set rating to 6' : 'Remove rating'} title={v == null ? 'Set to 6.0' : 'Click to remove'}
        onClick={() => { sfx.play(v == null ? 'select' : 'back'); onChange(v == null ? 6 : null) }}
        className="focus-invert h-9 w-12 rounded-md font-display font-extrabold tabular text-[18px]"
        style={v == null ? { background: 'var(--color-night-800)', color: 'var(--color-mist-400)' } : { background: ratingColor(v), color: '#04100b' }}>
        {v == null ? '–' : v.toFixed(1)}
      </button>
      <button type="button" aria-label="Raise rating" onClick={() => step(0.5)} disabled={v === 10}
        className="focus-invert h-9 w-8 rounded-md border border-night-600 text-mist-300 hover:border-flood-500 disabled:opacity-30">+</button>
    </span>
  )
}
