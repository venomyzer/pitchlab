import { useState } from 'react'
import { Btn, Label } from '../components/ui'
import { byName, FORMATIONS, positions, type Pt } from '../data/formations'
import { FormSelect, TacticsBoard, type Board } from '../features/board/TacticsBoard'

function startBoard(home: string, away: string): Board {
  return { b: positions(byName(home), 'build'), r: positions(byName(away), 'def', true), ball: { x: 24, y: 23 }, d: [] }
}
function kickoff(home: string, away: string): Board {
  const sq = (p: Pt) => ({ x: Math.min(p.x * 0.9, 50.5), y: p.y })
  const b = positions(byName(home), 'def').map(sq), r = positions(byName(away), 'def').map(sq).map(p => ({ x: 105 - p.x, y: 68 - p.y }))
  const st = b.reduce((m, p, i) => (p.x > b[m].x ? i : m), 0); b[st] = { x: 51.4, y: 34.6 }
  return { b, r, ball: { x: 52.5, y: 34 }, d: [] }
}
const NAMES = FORMATIONS.map(f => f.name)

export default function Sandbox() {
  const [home, setHome] = useState('4-3-3')
  const [away, setAway] = useState('4-4-2')
  return (
    <TacticsBoard title="Tactics Sandbox" back="/tactics" eyebrow="Tactic boards" slotPrefix="pitchlab:sandbox:" idleTag="Sandbox"
      initial={startBoard('4-3-3', '4-4-2')}
      labels={{ b: byName(home).s.map(s => s[0]), r: byName(away).s.map(s => s[0]) }}
      meta={() => ({ home, away })}
      onLoadMeta={d => { if (typeof d.home === 'string') setHome(d.home); if (typeof d.away === 'string') setAway(d.away) }}
      framesHelp={<>Set up the start of a move, press <b className="text-mist-300">Add frame</b>, move players, add another. Then play it back.</>}
      setup={({ goTo, board }) => (
        <div>
          <Label>Teams</Label>
          <div className="grid grid-cols-2 gap-2">
            <FormSelect id="home" label="Blue" color="bg-home" value={home} options={NAMES} onChange={v => { setHome(v); goTo({ ...startBoard(v, away), d: board.d }, null) }} />
            <FormSelect id="away" label="Red" color="bg-away" value={away} options={NAMES} onChange={v => { setAway(v); goTo({ ...startBoard(home, v), d: board.d }, null) }} />
          </div>
          <div className="flex gap-2 mt-2">
            <Btn size="sm" className="flex-1" sound={null} onClick={() => goTo(startBoard(home, away))}>Reset to shapes</Btn>
            <Btn size="sm" className="flex-1" sound={null} onClick={() => goTo(kickoff(home, away), 'whistle')}>Kick-off</Btn>
          </div>
        </div>
      )} />
  )
}
