import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { sfx, type SfxName } from '../lib/sound'

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'solid' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
  sound?: SfxName | null
  hint?: string
  nav?: boolean
}
/** Standard button. Plays a click sound and shows an optional keyboard hint. */
export const Btn = forwardRef<HTMLButtonElement, BtnProps>(function Btn(
  { variant = 'solid', size = 'md', active, sound = 'select', hint, nav, className = '', children, onClick, ...rest }, ref) {
  const v = {
    primary: 'bg-flood-500 text-night-950 hover:bg-flood-400 border-flood-500',
    solid: 'bg-white/10 text-mist-100 hover:bg-white/20 border-line',
    ghost: 'bg-transparent text-mist-300 hover:text-mist-100 hover:bg-white/10 border-line',
    danger: 'bg-bad/15 text-bad hover:bg-bad/25 border-bad/40',
  }[variant]
  const s = { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-[15px]', lg: 'h-14 px-6 text-lg' }[size]
  return (
    <button ref={ref} type="button" data-nav={nav ? '' : undefined}
      className={`focus-invert inline-flex items-center justify-center gap-2 rounded-md border font-semibold transition-colors disabled:opacity-50 ${v} ${s} ${active ? '!bg-flood-500 !text-night-950 !border-flood-500' : ''} ${className}`}
      aria-pressed={active === undefined ? undefined : active}
      onClick={e => { if (sound) sfx.play(sound); onClick?.(e) }} {...rest}>
      {children}
      {hint && <Kbd className={active || variant === 'primary' ? '!border-night-950/30 !text-night-950/70' : ''}>{hint}</Kbd>}
    </button>
  )
})

export function Kbd({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <kbd className={`font-mono text-[11px] leading-none px-1.5 py-1 rounded border border-night-500 border-b-2 text-mist-300 ${className}`}>{children}</kbd>
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="text-[12px] font-semibold tracking-[0.16em] uppercase text-mist-400 mb-2">{children}</div>
}

/** See-through dark panel with a hairline frame, so the backdrop shows through but text stays readable. */
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-scrim backdrop-blur-sm border border-line rounded-xl ${className}`}>{children}</div>
}

export function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} data-nav=""
      onClick={() => { sfx.play('toggle'); onChange(!on) }}
      className="focus-invert flex items-center justify-between gap-3 w-full rounded-md px-3 py-2 hover:bg-night-700/60 text-left">
      <span className="flex items-center gap-2 text-[15px]">{label}{hint && <Kbd>{hint}</Kbd>}</span>
      <span className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-flood-500' : 'bg-night-600'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </span>
    </button>
  )
}

/** Segmented control: one choice out of a few. */
export function Segmented<T extends string>({ value, options, onChange, size = 'md' }: { value: T; options: { value: T; label: ReactNode; hint?: string }[]; onChange: (v: T) => void; size?: 'sm' | 'md' }) {
  return (
    <div className="grid gap-1 p-1 rounded-lg bg-night-950/60 border border-line" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
      {options.map(o => (
        <button key={o.value} type="button" aria-pressed={o.value === value}
          onClick={() => { sfx.play('toggle'); onChange(o.value) }}
          className={`focus-invert rounded-md font-semibold transition-colors flex flex-col items-center justify-center leading-tight ${size === 'sm' ? 'py-1.5 text-[13px]' : 'py-2 text-[14px]'} ${o.value === value ? 'bg-flood-500 text-night-950' : 'text-mist-300 hover:text-mist-100 hover:bg-night-700'}`}>
          <span>{o.label}</span>
          {o.hint && <span className={`font-mono text-[10px] mt-0.5 ${o.value === value ? 'text-night-950/60' : 'text-mist-400'}`}>{o.hint}</span>}
        </button>
      ))}
    </div>
  )
}
