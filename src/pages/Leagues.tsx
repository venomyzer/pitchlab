import { useEffect, useState } from 'react'
import { Shell } from '../components/Shell'
import { Btn, ConfirmBtn, Label, Panel, Toggle } from '../components/ui'
import { FIXTURES, LESSONS, table, TEAMS, type Result } from '../data/leagues'
import { sfx } from '../lib/sound'
import { load, save } from '../lib/storage'

const KEY = 'pitchlab:league'
type Saved = { results: Result[]; cup: number[]; drop: boolean }
const EMPTY: Saved = { results: FIXTURES.map(() => null), cup: [-1, -1, -1], drop: true }
const SEMIS: [number, number][] = [[0, 2], [1, 3]]

export default function Leagues() {
  const [data, setData] = useState<Saved>(() => { const d = load(KEY, EMPTY); return Array.isArray(d.results) && d.results.length === FIXTURES.length ? d : EMPTY })
  useEffect(() => { save(KEY, data) }, [data])
  const setResult = (i: number, r: Result) => setData(d => ({ ...d, results: d.results.map((x, k) => (k === i ? r : x)) }))
  const random = () => { sfx.play('whistle'); setData(d => ({ ...d, results: FIXTURES.map(() => [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)] as Result) })) }
  const rows = table(data.results)
  const played = data.results.filter(Boolean).length

  return (
    <Shell back="/learn" eyebrow="Learn football" title="How Leagues Work">
      <div className="max-w-[1300px] mx-auto pt-4 md:pt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <div>
            <h2 className="font-display font-extrabold uppercase text-4xl md:text-5xl -skew-x-6">Points, tables and cups</h2>
            <p className="text-mist-300 mt-2 leading-relaxed max-w-[60ch]">Six short ideas. Then try them out: enter results on the right and watch the table sort itself.</p>
          </div>
          <ol className="flex flex-col gap-2.5">
            {LESSONS.map((l, i) => (
              <li key={l.title}>
                <Panel className="p-4 flex gap-4">
                  <span className="h-9 w-9 shrink-0 rounded-md bg-flood-500 text-night-950 font-display font-extrabold text-xl grid place-items-center">{i + 1}</span>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold uppercase tracking-wide text-[20px] leading-tight">{l.title}</h3>
                    <p className="mt-1 text-[15px] text-mist-300 leading-relaxed">{l.text}</p>
                  </div>
                </Panel>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-4 min-w-0 lg:sticky lg:top-4">
          <Panel className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Label>Try it: a 4-team league</Label>
              <span className="flex gap-2">
                <Btn size="sm" variant="ghost" sound={null} onClick={random}>Random results</Btn>
                <ConfirmBtn label="Clear" confirm="Confirm: clear all" disabled={!played && data.cup.every(c => c < 0)} onConfirm={() => setData(EMPTY)} />
              </span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {FIXTURES.map(([h, a], i) => <Fixture key={i} h={h} a={a} r={data.results[i]} onChange={r => setResult(i, r)} />)}
            </ul>
            <p className="text-[12px] text-mist-400">Each team plays each other once here. A real season usually plays every pairing twice.</p>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-baseline justify-between gap-2"><Label>Table</Label><span className="text-[12px] text-mist-400">{played} of {FIXTURES.length} played</span></div>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-[14px] tabular min-w-[360px]">
                <thead className="text-mist-400 text-[12px] uppercase tracking-wider">
                  <tr className="border-b border-night-700">
                    <th className="text-left font-semibold py-1.5 pl-1 w-8">#</th><th className="text-left font-semibold">Team</th>
                    {['P', 'W', 'D', 'L', 'GD'].map(h => <th key={h} className="font-semibold w-9">{h}</th>)}<th className="font-semibold w-11 pr-1">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const gd = r.gf - r.ga, champ = i === 0 && played === FIXTURES.length, down = data.drop && i === rows.length - 1 && played > 0
                    return (
                      <tr key={r.t} className={`border-b border-night-800 ${champ ? 'bg-flood-500/15' : down ? 'bg-bad/10' : ''}`}>
                        <td className="py-2 pl-1 font-mono text-mist-400">{i + 1}</td>
                        <td><span className="inline-flex items-center gap-2 font-semibold"><i className="h-3 w-3 rounded-full inline-block" style={{ background: TEAMS[r.t].color }} />{TEAMS[r.t].name}
                          {champ && <span className="text-[11px] tracking-[0.12em] uppercase px-1.5 py-0.5 rounded-sm bg-flood-500 text-night-950">Champions</span>}
                          {down && <span className="text-[11px] tracking-[0.12em] uppercase px-1.5 py-0.5 rounded-sm bg-bad/25 text-bad">Down</span>}</span></td>
                        {[r.p, r.w, r.d, r.l].map((n, k) => <td key={k} className="text-center">{n}</td>)}
                        <td className="text-center">{gd > 0 ? `+${gd}` : gd}</td>
                        <td className="text-center font-bold pr-1">{r.pts}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="-mx-3 mt-2"><Toggle on={data.drop} onChange={v => setData(d => ({ ...d, drop: v }))} label="Bottom team is relegated" /></div>
            <p className="text-[12px] text-mist-400 leading-relaxed">Sorted by points, then goal difference, then goals scored. Real competitions choose their own tiebreakers.</p>
          </Panel>

          <Cup cup={data.cup} onChange={cup => setData(d => ({ ...d, cup }))} />
        </div>
      </div>
    </Shell>
  )
}

function Fixture({ h, a, r, onChange }: { h: number; a: number; r: Result; onChange: (r: Result) => void }) {
  const bump = (side: 0 | 1, d: number) => { sfx.play('toggle'); const cur = r ?? [0, 0]; const n: [number, number] = [cur[0], cur[1]]; n[side] = Math.max(0, Math.min(15, n[side] + d)); onChange(n) }
  const team = (t: number, right?: boolean) => (
    <span className={`flex items-center gap-2 min-w-0 font-semibold ${right ? 'justify-end text-right' : ''}`}>
      {!right && <i className="h-3 w-3 rounded-full shrink-0" style={{ background: TEAMS[t].color }} />}<span className="truncate">{TEAMS[t].name}</span>
      {right && <i className="h-3 w-3 rounded-full shrink-0" style={{ background: TEAMS[t].color }} />}
    </span>
  )
  const stepper = (side: 0 | 1) => (
    <span className="flex items-center">
      <button type="button" aria-label={`${TEAMS[side ? a : h].name} one goal less`} disabled={!r || r[side] === 0} onClick={() => bump(side, -1)}
        className="focus-invert h-8 w-7 rounded-md text-mist-300 hover:bg-white/10 disabled:opacity-25">−</button>
      <span className="w-6 text-center font-display font-extrabold text-[22px] tabular">{r ? r[side] : '–'}</span>
      <button type="button" aria-label={`${TEAMS[side ? a : h].name} one goal more`} onClick={() => bump(side, 1)}
        className="focus-invert h-8 w-7 rounded-md text-mist-300 hover:bg-white/10">+</button>
    </span>
  )
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto_minmax(0,1fr)_2.2rem] items-center gap-1 rounded-md bg-night-950/50 border border-night-700 px-2 py-1">
      {team(h)}{stepper(0)}<span className="text-mist-400">–</span>{stepper(1)}{team(a, true)}
      {r ? <button type="button" aria-label="Clear this result" onClick={() => { sfx.play('back'); onChange(null) }} className="focus-invert h-8 rounded-md text-[12px] text-mist-400 hover:bg-white/10">✕</button>
        : <span className="text-[11px] text-mist-400 text-center">Not<br />played</span>}
    </li>
  )
}

/** Four-team knockout: two semi-finals, then a final. Click the winner of each match. */
function Cup({ cup, onChange }: { cup: number[]; onChange: (c: number[]) => void }) {
  const [s1, s2, champ] = cup
  const pick = (round: number, t: number) => {
    sfx.play(round === 2 ? 'goal' : 'select')
    const n = [...cup]; n[round] = n[round] === t ? -1 : t
    if (round < 2 && n[2] >= 0 && n[2] !== n[0] && n[2] !== n[1]) n[2] = -1 // the champion has to have won their semi
    onChange(n)
  }
  const btn = (round: number, t: number, disabled = false) => {
    const won = cup[round] === t, lost = cup[round] >= 0 && !won
    return (
      <button key={t} type="button" disabled={disabled || t < 0} aria-pressed={won} onClick={() => pick(round, t)}
        className={`focus-invert w-full h-10 px-3 rounded-md border flex items-center gap-2 font-semibold text-left disabled:opacity-40
          ${won ? 'bg-flood-500 border-flood-500 text-night-950' : lost ? 'border-night-700 text-mist-400 line-through' : 'border-night-600 hover:border-flood-500'}`}>
        {t >= 0 ? <><i className="h-3 w-3 rounded-full shrink-0" style={{ background: TEAMS[t].color }} />{TEAMS[t].name}</> : <span className="text-mist-400 font-normal">Winner of semi</span>}
      </button>
    )
  }
  return (
    <Panel className="p-4 flex flex-col gap-3">
      <Label>Try it: a 4-team cup</Label>
      <div className="grid grid-cols-[1fr_1fr] gap-4 items-center">
        <div className="flex flex-col gap-3">
          {SEMIS.map(([x, y], i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-[0.14em] text-mist-400">Semi-final {i + 1}</span>
              {btn(i, x)}{btn(i, y)}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.14em] text-mist-400">Final</span>
          {btn(2, s1, s1 < 0)}{btn(2, s2, s2 < 0)}
          <div className="mt-2 min-h-[44px] grid place-items-center rounded-md border border-dashed border-night-600 text-center px-2">
            {champ >= 0 ? <span className="font-display font-extrabold uppercase -skew-x-6 text-[22px] text-flood-400">{TEAMS[champ].name} win the cup</span>
              : <span className="text-[13px] text-mist-400">Click the winner of each match</span>}
          </div>
        </div>
      </div>
      <p className="text-[12px] text-mist-400 leading-relaxed">One loss and you’re out. Two wins take the cup, while a league title takes the whole season.</p>
    </Panel>
  )
}
