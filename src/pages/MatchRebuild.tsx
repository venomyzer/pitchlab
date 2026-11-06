import { useEffect, useRef, useState } from 'react'
import { Btn, Label } from '../components/ui'
import { byName, FORMATIONS, positions } from '../data/formations'
import { FormSelect, TacticsBoard, type Board } from '../features/board/TacticsBoard'
import { DEFAULT, minuteText, type State as Score } from '../features/scoreboard/state'
import { load, loadRaw, save } from '../lib/storage'

const NOTES_KEY = 'pitchlab:match-notes'
const NAMES = FORMATIONS.map(f => f.name)
const start = (home: string, away: string): Board => ({ b: positions(byName(home), 'build'), r: positions(byName(away), 'def', true), ball: { x: 24, y: 23 }, d: [], c: '' })

/** Rebuild a goal (or any move) frame by frame with a caption on each step, plus match notes. */
export default function MatchRebuild() {
  const [home, setHome] = useState('4-3-3')
  const [away, setAway] = useState('4-4-2')
  const [title, setTitle] = useState('')
  return (
    <TacticsBoard title="Match Rebuild" back="/tactics" eyebrow="Tactic boards" slotPrefix="pitchlab:rebuild:" idleTag="Rebuild" captions
      corner={title.trim() ? title.trim().toUpperCase() : 'BLUE ATTACKS →'}
      initial={start('4-3-3', '4-4-2')}
      labels={{ b: byName(home).s.map(s => s[0]), r: byName(away).s.map(s => s[0]) }}
      meta={() => ({ home, away, title })}
      onLoadMeta={d => { if (typeof d.home === 'string') setHome(d.home); if (typeof d.away === 'string') setAway(d.away); setTitle(typeof d.title === 'string' ? d.title : '') }}
      framesHelp={<>Place the players where the move started, write a caption, press <b className="text-mist-300">Add frame</b>. Move them on, change the caption, add the next one.</>}
      setup={({ goTo, board }) => (
        <div>
          <Label>The move</Label>
          <input value={title} onChange={e => setTitle(e.target.value)} maxLength={40} placeholder="Title, for example: Opening goal, 23'" aria-label="Title"
            className="w-full h-10 rounded-md bg-night-900 border border-night-600 focus:border-flood-500 outline-none px-2.5 text-[14px] mb-2" />
          <div className="grid grid-cols-2 gap-2">
            <FormSelect id="home" label="Blue" color="bg-home" value={home} options={NAMES} onChange={v => { setHome(v); goTo({ ...start(v, away), d: board.d }, null) }} />
            <FormSelect id="away" label="Red" color="bg-away" value={away} options={NAMES} onChange={v => { setAway(v); goTo({ ...start(home, v), d: board.d }, null) }} />
          </div>
          <p className="mt-2 text-[12px] text-mist-400 leading-snug">Rebuild what you saw. Captions and positions are yours, so say “roughly” when you’re not sure.</p>
        </div>
      )}
      extra={<Notes />} />
  )
}

/** Free-text match notes, saved as you type. "Add minute" starts a line with the scoreboard's current minute. */
function Notes() {
  const [text, setText] = useState(() => load(NOTES_KEY, { text: '' }).text)
  const box = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { save(NOTES_KEY, { text }) }, [text])
  const stamp = () => {
    const sb = loadRaw<Score>('pitchlab:scoreboard')
    const m = sb?.clock ? minuteText({ ...DEFAULT, ...sb, clock: { ...DEFAULT.clock, ...sb.clock } }) : ''
    const line = (m ? m + ' ' : '- ')
    setText(t => (t && !t.endsWith('\n') ? t + '\n' : t) + line)
    window.setTimeout(() => { const el = box.current; if (el) { el.focus(); el.selectionStart = el.selectionEnd = el.value.length } }, 0)
  }
  return (
    <div className="border-t border-night-700 pt-3">
      <div className="flex items-center justify-between gap-2"><Label>Match notes</Label>
        <Btn size="sm" variant="ghost" sound="toggle" onClick={stamp}>Add minute</Btn></div>
      <textarea ref={box} value={text} onChange={e => setText(e.target.value)} rows={6} maxLength={5000} aria-label="Match notes"
        placeholder={'Chances, changes, things to talk about at half-time.\n“Add minute” uses the scoreboard clock.'}
        className="w-full rounded-md bg-night-900 border border-night-600 focus:border-flood-500 outline-none p-2.5 text-[14px] text-mist-100 resize-y leading-relaxed" />
      <p className="text-[12px] text-mist-400 mt-1">Saved in this browser as you type.</p>
    </div>
  )
}
