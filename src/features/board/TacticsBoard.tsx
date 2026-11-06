import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Shell } from '../../components/Shell'
import { IconPause, IconPlay, IconUndo } from '../../components/Icons'
import { PitchTag, ToolLayout } from '../../components/ToolLayout'
import { Btn, Kbd, Label, Segmented, Toggle } from '../../components/ui'
import type { Pt } from '../../data/formations'
import { useReducedMotion } from '../../lib/settings'
import { sfx, type SfxName } from '../../lib/sound'
import { loadRaw, save } from '../../lib/storage'
import { useNames } from '../../lib/useNames'
import { Ball, Pitch, toPitch, Token } from '../pitch/Pitch'
import { tween } from '../pitch/tween'

type Tool = 'move' | 'pass' | 'run' | 'zone' | 'erase'
export type Draw = { t: 'pass' | 'run' | 'zone'; x1: number; y1: number; x2: number; y2: number }
/** One picture of the board. `c` is an optional caption (Match Rebuild shows it on the pitch). */
export type Board = { b: Pt[]; r: Pt[]; ball: Pt; d: Draw[]; c?: string }
export type Saved = { board: Board; frames: Board[]; savedAt: number } & Record<string, unknown>
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
export const clone = (x: Board): Board => ({ b: x.b.map(p => ({ ...p })), r: x.r.map(p => ({ ...p })), ball: { ...x.ball }, d: x.d.map(d => ({ ...d })), c: x.c ?? '' })
const MAX_FRAMES = 20

/** What the page's setup section can do: move the board to a new start position (undoable, animated). */
export type SetupApi = { goTo: (b: Board, sound?: SfxName | null) => void; board: Board }

type Props = {
  title: string; back: string; eyebrow: string
  /** localStorage prefix for the three save slots, e.g. 'pitchlab:sandbox:'. */
  slotPrefix: string
  initial: Board
  /** Shirt labels for each team's tokens. */
  labels: { b: string[]; r: string[] }
  /** The page's start-position section (formations, set-piece setups…). */
  setup: (api: SetupApi) => ReactNode
  /** Extra panel sections after the save slots. */
  extra?: ReactNode
  /** Per-frame captions, shown on the pitch. */
  captions?: boolean
  /** Extra fields saved with a slot, and how to restore them. */
  meta?: () => Record<string, unknown>
  onLoadMeta?: (d: Saved) => void
  idleTag: string
  framesHelp: ReactNode
  /** Pitch text in the top-left corner. */
  corner?: string
  /** Show the shared board names under blue players at first (off when shirts don't match formation slots). */
  namesOn?: boolean
}

/**
 * Drag-and-draw board shared by the Tactics Sandbox, Set Pieces and Match Rebuild.
 * Undo / redo, passes, runs and zones, frames that play back as an animation, and three save slots.
 */
export function TacticsBoard({ title, back, eyebrow, slotPrefix, initial, labels, setup, extra, captions, meta, onLoadMeta, idleTag, framesHelp, corner = 'BLUE ATTACKS →', namesOn = true }: Props) {
  const reduce = useReducedMotion()
  const [board, setBoard] = useState<Board>(() => clone(initial))
  const [past, setPast] = useState<Board[]>([])
  const [future, setFuture] = useState<Board[]>([])
  const [tool, setTool] = useState<Tool>('move')
  const [frames, setFrames] = useState<Board[]>([])
  const [cur, setCur] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal')
  const [showAway, setShowAway] = useState(true)
  const [showNames, setShowNames] = useState(namesOn)
  const [slot, setSlot] = useState('1')
  const [status, setStatus] = useState('')
  const [temp, setTemp] = useState<Draw | null>(null)
  const { names } = useNames()
  const svg = useRef<SVGSVGElement>(null)
  const cancel = useRef<() => void>(() => {})
  const boardRef = useRef(board); boardRef.current = board
  const playRef = useRef(false)

  const flashT = useRef(0)
  const flash = (m: string) => { setStatus(m); window.clearTimeout(flashT.current); flashT.current = window.setTimeout(() => setStatus(''), 2600) }
  const commit = useCallback((next: Board) => { setPast(p => [...p.slice(-60), clone(boardRef.current)]); setFuture([]); setBoard(next) }, [])
  const animateTo = useCallback((target: Board, ms = 800, done?: () => void) => {
    cancel.current()
    const from = boardRef.current
    setBoard(b => ({ ...b, d: target.d, c: target.c ?? '' }))
    cancel.current = tween([from.b, from.r, [from.ball]], [target.b, target.r, [target.ball]], reduce ? 1 : ms,
      ([b, r, [ball]]) => setBoard(x => ({ ...x, b, r, ball })), done)
  }, [reduce])

  const undo = useCallback(() => {
    setPast(p => { if (!p.length) return p; const prev = p[p.length - 1]; setFuture(f => [clone(boardRef.current), ...f]); setBoard(prev); sfx.play('back'); return p.slice(0, -1) })
  }, [])
  const redo = useCallback(() => {
    setFuture(f => { if (!f.length) return f; const nx = f[0]; setPast(p => [...p, clone(boardRef.current)]); setBoard(nx); sfx.play('select'); return f.slice(1) })
  }, [])

  const stop = useCallback(() => { playRef.current = false; setPlaying(false); cancel.current() }, [])
  const jump = useCallback((i: number, done?: () => void) => {
    const f = frames[i]; if (!f) return
    setCur(i); animateTo(f, { slow: 1400, normal: 900, fast: 500 }[speed], done)
  }, [frames, animateTo, speed])
  const play = useCallback(() => {
    if (frames.length < 2) return
    playRef.current = true; setPlaying(true); sfx.play('whistle')
    let i = 0
    // captions need reading time, so frames with one hold a little longer
    const hold = (f?: Board) => ({ slow: 700, normal: 420, fast: 220 }[speed] + (captions && f?.c ? 1200 : 0))
    const step = () => {
      if (!playRef.current) return
      if (i >= frames.length) { playRef.current = false; setPlaying(false); return }
      jump(i, () => { const f = frames[i]; i++; window.setTimeout(step, hold(f)) })
    }
    // snap to the first frame, then animate through the rest
    cancel.current(); setBoard(clone(frames[0])); setCur(0); i = 1; window.setTimeout(step, 350 + (captions && frames[0].c ? 1200 : 0))
  }, [frames, jump, speed, captions])

  const addFrame = useCallback(() => {
    if (frames.length >= MAX_FRAMES) { flash(`You can have up to ${MAX_FRAMES} frames.`); return }
    sfx.play('select')
    setFrames(fs => { const n = [...fs]; n.splice(cur + 1, 0, clone(boardRef.current)); return n })
    setCur(c => c + 1)
  }, [frames.length, cur])
  const updateFrame = () => { if (cur < 0) return; sfx.play('select'); setFrames(fs => fs.map((f, i) => (i === cur ? clone(board) : f))); flash(`Frame ${cur + 1} updated.`) }
  const deleteFrame = () => { if (cur < 0) return; sfx.play('back'); setFrames(fs => fs.filter((_, i) => i !== cur)); setCur(c => Math.min(c, frames.length - 2)) }

  const goTo = (target: Board, sound: SfxName | null = 'whoosh') => { stop(); if (sound) sfx.play(sound); commit(clone(boardRef.current)); animateTo(clone(target)) }
  const clearDrawings = () => { if (!board.d.length) return; sfx.play('back'); commit({ ...clone(board), d: [] }) }
  const setCaption = (c: string) => setBoard(b => ({ ...b, c }))

  const doSave = () => {
    const data: Saved = { ...meta?.(), board: clone(board), frames: frames.map(clone), savedAt: Date.now() }
    flash(save(slotPrefix + slot, data) ? `Saved to slot ${slot}.` : 'Couldn’t save. This browser is blocking storage.')
    sfx.play('select')
  }
  const doLoad = () => {
    const d = loadRaw<Saved>(slotPrefix + slot)
    if (!d?.board) { flash(`Slot ${slot} is empty.`); sfx.play('back'); return }
    stop(); onLoadMeta?.(d); setFrames(d.frames ?? []); setCur(d.frames?.length ? 0 : -1)
    commit(clone(boardRef.current)); animateTo(clone(d.board)); flash(`Loaded slot ${slot}.`); sfx.play('select')
  }
  const slotInfo = (s: string) => { const d = loadRaw<Saved>(slotPrefix + s); return d ? new Date(d.savedAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'empty' }

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.code === 'Space' && (e.target as HTMLElement).closest('button, a, [role="switch"]')) || (e.target as HTMLElement).closest('input, textarea, select')) return
      const k = e.key.toLowerCase()
      if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return }
      if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redo(); return }
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.code === 'Space') { e.preventDefault(); if (playing) stop(); else play() }
      else if (k === 'v') { sfx.play('toggle'); setTool('move') } else if (k === 'p') { sfx.play('toggle'); setTool('pass') }
      else if (k === 'u') { sfx.play('toggle'); setTool('run') } else if (k === 'z') { sfx.play('toggle'); setTool('zone') }
      else if (k === 'x') { sfx.play('toggle'); setTool('erase') }
      else if (k === 'a') addFrame()
      else if (e.key === 'ArrowRight' && frames.length) { stop(); jump(Math.min(frames.length - 1, cur + 1)) }
      else if (e.key === 'ArrowLeft' && frames.length) { stop(); jump(Math.max(0, cur - 1)) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, play, stop, playing, addFrame, jump, frames.length, cur])

  // pointer: drag tokens, draw, erase
  const drag = useRef<{ k: 'b' | 'r' | 'ball'; i: number; start: Board } | null>(null)
  const onDown = (e: React.PointerEvent) => {
    if (!svg.current) return
    const target = e.target as Element
    const tok = target.closest('[data-token]')?.getAttribute('data-token')
    if (tool === 'erase') {
      const di = target.closest('[data-draw]')?.getAttribute('data-draw')
      if (di != null) { sfx.play('back'); commit({ ...clone(board), d: board.d.filter((_, i) => i !== +di) }) }
      return
    }
    stop()
    if (tool === 'move') {
      if (!tok) return
      const [k, i] = tok === 'ball' ? ['ball', '0'] : tok.split(':')
      drag.current = { k: k as 'b' | 'r' | 'ball', i: +i, start: clone(board) }
    } else {
      let q = toPitch(svg.current, e)
      if (tok && tool !== 'zone') { // arrows start from the centre of the player or ball
        const [k, i] = tok === 'ball' ? ['ball', '0'] : tok.split(':')
        q = k === 'ball' ? board.ball : k === 'b' ? board.b[+i] : board.r[+i]
      }
      setTemp({ t: tool, x1: q.x, y1: q.y, x2: q.x, y2: q.y })
    }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId); e.preventDefault()
  }
  const onMove = (e: React.PointerEvent) => {
    if (!svg.current) return
    const q = toPitch(svg.current, e)
    if (temp) { setTemp(t => t && { ...t, x2: clamp(q.x, -2, 107), y2: clamp(q.y, -6, 70) }); return }
    const d = drag.current; if (!d) return
    const p = { x: clamp(q.x, -1, 106), y: clamp(q.y, -1, 69) }
    setBoard(b => d.k === 'ball' ? { ...b, ball: p } : d.k === 'b' ? { ...b, b: b.b.map((x, i) => (i === d.i ? p : x)) } : { ...b, r: b.r.map((x, i) => (i === d.i ? p : x)) })
  }
  const onUp = () => {
    if (temp) {
      if (Math.hypot(temp.x2 - temp.x1, temp.y2 - temp.y1) > 1.5) { sfx.play('toggle'); commit({ ...clone(board), d: [...board.d, temp] }) }
      setTemp(null); return
    }
    const d = drag.current; drag.current = null
    if (d) { setPast(p => [...p.slice(-60), d.start]); setFuture([]) }
  }

  const pitch = (
    <Pitch ref={svg} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      className={`block w-full h-auto select-none touch-none ${tool === 'move' ? '' : tool === 'erase' ? '[&_[data-draw]]:cursor-pointer' : 'cursor-crosshair [&_[data-token]]:cursor-crosshair'}`} aria-label={title}>
      <text x="-1.5" y="-4.4" fill="#fff" fontSize="2" fontFamily="Saira Condensed, sans-serif" fontWeight={800} opacity=".85">{corner}</text>
      <g>{board.d.filter(d => d.t === 'zone').map((d, i) => <DrawShape key={'z' + i} d={d} idx={board.d.indexOf(d)} erase={tool === 'erase'} />)}</g>
      <g>{board.d.filter(d => d.t !== 'zone').map((d, i) => <DrawShape key={'a' + i} d={d} idx={board.d.indexOf(d)} erase={tool === 'erase'} />)}</g>
      {temp && <DrawShape d={temp} idx={-1} erase={false} />}
      {showAway && board.r.map((p, i) => <Token key={'r' + i} dataId={`r:${i}`} x={p.x} y={p.y} team="away" label={labels.r[i]} />)}
      {board.b.map((p, i) => <Token key={'b' + i} dataId={`b:${i}`} x={p.x} y={p.y} team="home" label={labels.b[i]} name={showNames ? names[i] : ''} />)}
      <Ball x={board.ball.x} y={board.ball.y} />
    </Pitch>
  )

  const tools: { v: Tool; label: string; key: string }[] = [
    { v: 'move', label: 'Move', key: 'V' }, { v: 'pass', label: 'Pass', key: 'P' }, { v: 'run', label: 'Run', key: 'U' },
    { v: 'zone', label: 'Zone', key: 'Z' }, { v: 'erase', label: 'Erase', key: 'X' }]
  const panel = (
    <>
      <div>
        <Label>Tool</Label>
        <Segmented size="sm" value={tool} onChange={setTool} options={tools.map(t => ({ value: t.v, label: t.label, hint: t.key }))} />
        <p className="mt-2 text-[13px] text-mist-400 leading-snug">
          {{ move: 'Drag players or the ball.', pass: 'Drag to draw a pass. Start on a player to snap to them.', run: 'Drag to draw a run. Start on a player to snap to them.', zone: 'Drag to shade an area of the pitch.', erase: 'Click an arrow or zone to remove it.' }[tool]}
        </p>
        <div className="flex gap-2 mt-2">
          <Btn size="sm" variant="ghost" sound={null} onClick={undo} disabled={!past.length} hint="Ctrl Z"><IconUndo className="h-4 w-4" />Undo</Btn>
          <Btn size="sm" variant="ghost" sound={null} onClick={redo} disabled={!future.length}>Redo</Btn>
          <Btn size="sm" variant="ghost" sound={null} onClick={clearDrawings} disabled={!board.d.length} className="ml-auto">Clear drawings</Btn>
        </div>
      </div>

      {setup({ goTo, board })}

      <div>
        <div className="flex items-baseline justify-between"><Label>Frames</Label><span className="text-[12px] text-mist-400">{frames.length}/{MAX_FRAMES}</span></div>
        <div className="flex flex-wrap gap-1.5 min-h-9 items-center">
          {!frames.length && <span className="text-[13px] text-mist-400 leading-snug">{framesHelp}</span>}
          {frames.map((f, i) => (
            <button key={i} type="button" onClick={() => { stop(); sfx.play('hover'); jump(i) }} aria-current={i === cur} title={f.c || undefined}
              className={`focus-invert h-9 w-9 rounded-md border font-mono text-[13px] ${i === cur ? 'bg-flood-500 border-flood-500 text-night-950' : 'border-night-600 hover:border-flood-500'}`}>{i + 1}</button>
          ))}
        </div>
        {captions && (
          <input value={board.c ?? ''} onChange={e => setCaption(e.target.value)} maxLength={80} placeholder="Caption for this moment (optional)" aria-label="Caption"
            className="mt-2 w-full h-10 rounded-md bg-night-900 border border-night-600 focus:border-flood-500 outline-none px-2.5 text-[14px]" />
        )}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Btn variant="primary" sound={null} onClick={addFrame} hint="A">Add frame</Btn>
          <Btn sound={null} onClick={() => (playing ? stop() : play())} disabled={frames.length < 2} hint="Space">
            {playing ? <><IconPause className="h-4 w-4" />Stop</> : <><IconPlay className="h-4 w-4" />Play</>}
          </Btn>
          <Btn size="sm" variant="ghost" sound={null} onClick={updateFrame} disabled={cur < 0}>Update frame {cur >= 0 ? cur + 1 : ''}</Btn>
          <Btn size="sm" variant="ghost" sound={null} onClick={deleteFrame} disabled={cur < 0}>Delete frame</Btn>
        </div>
        <div className="mt-2"><Segmented size="sm" value={speed} onChange={setSpeed} options={[{ value: 'slow', label: 'Slow' }, { value: 'normal', label: 'Normal' }, { value: 'fast', label: 'Fast' }]} /></div>
      </div>

      <div className="-mx-3">
        <Toggle on={showAway} onChange={setShowAway} label="Show red team" />
        <Toggle on={showNames} onChange={setShowNames} label="Show names" />
      </div>

      <div>
        <Label>Save in this browser</Label>
        <div className="flex gap-2">
          <select id="slot" value={slot} onChange={e => setSlot(e.target.value)} aria-label="Save slot" className="flex-1 min-w-0 h-10 rounded-md bg-night-900 border border-night-600 px-2 text-[14px]">
            {['1', '2', '3'].map(s => <option key={s} value={s}>Slot {s} · {slotInfo(s)}</option>)}
          </select>
          <Btn sound={null} onClick={doSave}>Save</Btn>
          <Btn sound={null} onClick={doLoad}>Load</Btn>
        </div>
        <div className="text-[13px] text-flood-400 min-h-5 mt-1.5" role="status">{status}</div>
      </div>
      {extra}
    </>
  )

  return (
    <Shell back={back} eyebrow={eyebrow} title={title} wide>
      <ToolLayout pitch={pitch} panel={panel}
        tagLeft={<span className="flex flex-col items-start gap-1.5">
          {captions && board.c && <PitchTag big>{board.c}</PitchTag>}
          <PitchTag big={!(captions && board.c)}>{frames.length ? `Frame ${cur + 1} / ${frames.length}` : idleTag}</PitchTag>
        </span>}
        tagRight={<PitchTag>{{ move: 'Move', pass: 'Drawing passes', run: 'Drawing runs', zone: 'Drawing zones', erase: 'Erasing' }[tool]}</PitchTag>}
        hotkeys={<><span className="inline-flex gap-1.5 items-center"><Kbd>V</Kbd><Kbd>P</Kbd><Kbd>U</Kbd><Kbd>Z</Kbd><Kbd>X</Kbd> tools</span><span className="inline-flex gap-1.5 items-center"><Kbd>A</Kbd> add frame</span><span className="inline-flex gap-1.5 items-center"><Kbd>Space</Kbd> play</span><span className="inline-flex gap-1.5 items-center"><Kbd>←</Kbd><Kbd>→</Kbd> frames</span></>} />
    </Shell>
  )
}

function DrawShape({ d, idx, erase }: { d: Draw; idx: number; erase: boolean }) {
  if (d.t === 'zone') {
    const x = Math.min(d.x1, d.x2), y = Math.min(d.y1, d.y2)
    return <rect data-draw={idx >= 0 ? idx : undefined} x={x} y={y} width={Math.abs(d.x2 - d.x1)} height={Math.abs(d.y2 - d.y1)} rx="1"
      fill="#ffb31a" fillOpacity={erase ? 0.32 : 0.2} stroke="#ffb31a" strokeWidth=".35" strokeDasharray="1 .6" />
  }
  const ang = Math.atan2(d.y2 - d.y1, d.x2 - d.x1), x2 = d.x2 - Math.cos(ang) * 1.4, y2 = d.y2 - Math.sin(ang) * 1.4
  const pass = d.t === 'pass'
  return (
    <g data-draw={idx >= 0 ? idx : undefined}>
      <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke="transparent" strokeWidth="2.6" />
      <line x1={d.x1} y1={d.y1} x2={x2} y2={y2} stroke={pass ? '#fff' : '#ffb31a'} strokeWidth={pass ? 0.55 : 0.5} strokeLinecap="round"
        strokeDasharray={pass ? undefined : '1.2 .8'} markerEnd={pass ? 'url(#arrW)' : 'url(#arrY)'} opacity={erase ? 0.75 : 1} />
    </g>
  )
}

export function FormSelect({ id, label, color, value, options, onChange }: { id: string; label: string; color: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 h-10 rounded-md bg-night-900 border border-night-600 pl-2.5 pr-1 focus-within:border-flood-500">
      <i className={`h-3 w-3 rounded-full ${color} shrink-0`} /><span className="text-[13px] text-mist-400">{label}</span>
      <select id={id} value={value} onChange={e => { sfx.play('toggle'); onChange(e.target.value) }} className="flex-1 min-w-0 bg-transparent text-[15px] font-semibold outline-none">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}
