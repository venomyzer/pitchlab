import { useRef, useState } from 'react'
import { sfx } from '../lib/sound'
import { IconCopy } from './Icons'

/**
 * A link to paste into OBS, with a big Copy button. If the browser blocks the clipboard
 * (some OBS docks do), the text gets selected and the button tells you to press Ctrl C.
 */
export function CopyField({ value, label, size = 'md' }: { value: string; label: string; size?: 'md' | 'sm' }) {
  const input = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<'' | 'copied' | 'manual'>('')
  const copy = () => {
    const done = (s: 'copied' | 'manual') => { setState(s); window.setTimeout(() => setState(''), 2500) }
    const manual = () => { input.current?.focus(); input.current?.select(); done('manual') }
    if (!navigator.clipboard) return manual()
    navigator.clipboard.writeText(value).then(() => { sfx.play('select'); done('copied') }, manual)
  }
  const h = size === 'sm' ? 'h-10' : 'h-12'
  return (
    <div className="flex gap-2 min-w-0">
      <input ref={input} readOnly value={value} aria-label={label} onFocus={e => e.currentTarget.select()}
        className={`${h} flex-1 min-w-0 rounded-md bg-night-950 border border-line px-3 font-mono text-[14px] text-mist-100 focus:border-focus outline-none`} />
      <button type="button" onClick={copy} aria-label={`Copy ${label}`}
        className={`focus-invert ${h} shrink-0 inline-flex items-center justify-center gap-2 px-4 rounded-md border font-semibold text-[15px] transition-colors min-w-[112px]
          ${state === 'copied' ? 'bg-ok border-ok text-night-950' : 'bg-flood-500 border-flood-500 text-night-950 hover:bg-flood-400'}`}>
        {state === 'copied' ? 'Copied ✓' : state === 'manual' ? 'Press Ctrl C' : <><IconCopy className="h-4 w-4" />Copy</>}
      </button>
    </div>
  )
}
