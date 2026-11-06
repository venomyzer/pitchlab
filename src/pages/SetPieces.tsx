import { useState } from 'react'
import { Label, Segmented } from '../components/ui'
import { flipSide, SET_PIECES, SHIRTS, type SetPiece } from '../data/setpieces'
import { TacticsBoard, type Board } from '../features/board/TacticsBoard'
import { sfx } from '../lib/sound'

type SideKey = 'left' | 'right'
function boardFor(sp: SetPiece, side: SideKey): Board {
  const g = side === 'right' && sp.sided ? flipSide(sp) : sp
  return { b: g.b.map(p => ({ ...p })), r: g.r.map(p => ({ ...p })), ball: { ...g.ball }, d: g.d.map(a => ({ ...a })) }
}

export default function SetPieces() {
  const [key, setKey] = useState(SET_PIECES[0].key)
  const [side, setSide] = useState<SideKey>('left')
  const sp = SET_PIECES.find(x => x.key === key) ?? SET_PIECES[0]
  return (
    <TacticsBoard title="Set Pieces" back="/tactics" eyebrow="Tactic boards" slotPrefix="pitchlab:setpiece:" idleTag={sp.name} namesOn={false}
      initial={boardFor(SET_PIECES[0], 'left')}
      labels={{ b: SHIRTS, r: SHIRTS }}
      meta={() => ({ key, side })}
      onLoadMeta={d => { if (typeof d.key === 'string') setKey(d.key); if (d.side === 'left' || d.side === 'right') setSide(d.side) }}
      framesHelp={<>Pick a setup, press <b className="text-mist-300">Add frame</b>, then move players to show the routine step by step.</>}
      setup={({ goTo }) => (
        <div>
          <Label>Setup (typical, simplified)</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {SET_PIECES.map((x, i) => (
              <button key={x.key} type="button" aria-current={x.key === key} onClick={() => { sfx.play('select'); setKey(x.key); goTo(boardFor(x, side), null) }}
                className={`focus-invert text-left rounded-md border px-2.5 py-2 text-[14px] font-medium ${i === SET_PIECES.length - 1 && SET_PIECES.length % 2 ? 'col-span-2' : ''}
                  ${x.key === key ? 'bg-flood-500 border-flood-500 text-night-950' : 'border-night-600 hover:border-flood-500 text-mist-100'}`}>{x.name}</button>
            ))}
          </div>
          {sp.sided && (
            <div className="mt-2">
              <Segmented size="sm" value={side} onChange={v => { setSide(v); goTo(boardFor(sp, v), 'whoosh') }}
                options={[{ value: 'left', label: 'Left side' }, { value: 'right', label: 'Right side' }]} />
            </div>
          )}
          <ul className="mt-3 flex flex-col gap-1.5 text-[13px] text-mist-300 leading-snug list-disc pl-4">
            {sp.rules.map(r => <li key={r}>{r}</li>)}
          </ul>
          <p className="mt-2 text-[12px] text-mist-400">From the IFAB Laws of the Game. Player spots are one common way to line up, not the only one.</p>
        </div>
      )} />
  )
}
