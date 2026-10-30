import { useEffect, useRef, useState, type ReactNode } from 'react'
import { sfx } from '../lib/sound'
import { Btn } from './ui'

type Props = { pitch: ReactNode; panel: ReactNode; tagLeft?: ReactNode; tagRight?: ReactNode; hotkeys?: ReactNode }
/** Board layout: pitch on the left, controls on the right. H hides the panel (clean view for streams), F goes fullscreen. */
export function ToolLayout({ pitch, panel, tagLeft, tagRight, hotkeys }: Props) {
  const [clean, setClean] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const toggleFs = () => {
    const el = box.current; if (!el) return
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else el.requestFullscreen?.().catch(() => {})
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'h' || e.key === 'H') { sfx.play('toggle'); setClean(c => !c) }
      if (e.key === 'f' && e.shiftKey) toggleFs()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div className={`max-w-[1600px] mx-auto grid gap-4 items-start ${clean ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px]'}`}>
      <div className="min-w-0 flex flex-col gap-2">
        <div ref={box} className="relative rounded-xl overflow-hidden ring-1 ring-line shadow-[0_30px_80px_-30px_rgba(0,0,0,.8)] bg-turf-1 [&:fullscreen]:rounded-none [&:fullscreen]:grid [&:fullscreen]:place-items-center [&:fullscreen]:bg-night-950">
          {pitch}
          {(tagLeft || tagRight) && (
            <div className="absolute left-3 right-3 bottom-3 flex justify-between items-end gap-2 pointer-events-none flex-wrap">
              <span>{tagLeft}</span><span>{tagRight}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap text-[13px] text-mist-400">
          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">{hotkeys}</div>
          <div className="flex gap-2">
            <Btn size="sm" variant="ghost" hint="H" sound="toggle" onClick={() => setClean(c => !c)}>{clean ? 'Show panel' : 'Clean view'}</Btn>
            <Btn size="sm" variant="ghost" hint="⇧F" sound="toggle" onClick={toggleFs}>Fullscreen</Btn>
          </div>
        </div>
      </div>
      {!clean && <aside className="min-w-0 flex flex-col gap-4 bg-scrim backdrop-blur-sm border border-line rounded-xl p-4 lg:sticky lg:top-4">{panel}</aside>}
    </div>
  )
}

export function PitchTag({ children, big }: { children: ReactNode; big?: boolean }) {
  return <span className={`inline-block font-display uppercase -skew-x-6 text-white bg-night-950/70 backdrop-blur-sm rounded px-2.5 py-1 tracking-wide ${big ? 'font-extrabold text-[clamp(18px,2.4vw,30px)]' : 'font-bold text-[clamp(13px,1.5vw,18px)]'}`}>{children}</span>
}
