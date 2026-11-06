import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CopyField } from '../../components/CopyField'
import { IconUndo } from '../../components/Icons'
import { Shell } from '../../components/Shell'
import { Btn, Kbd, Label, Panel, Segmented } from '../../components/ui'
import { IS_PREVIEW } from '../../config'
import { useReducedMotion } from '../../lib/settings'
import { load, save } from '../../lib/storage'
import { appUrl } from '../scoreboard/control'
import { useNow } from '../scoreboard/state'
import { GraphicsView } from './GraphicsView'
import { G, GRAPHIC_NAME, isLive, useGraphicsControl, type Graphic, type GState } from './state'

export type GCtl = ReturnType<typeof useGraphicsControl>
const SETUP_KEY = 'pitchlab:graphics-setup-open'

/**
 * Frame for a stream-graphic control page: live preview, the on-air button (T), look settings and the OBS link
 * on the left; the page's own editor on the right. Every change goes through `ctl.update`, so Ctrl Z undoes it.
 */
export function GraphicsPage({ ctl, graphic, title, eyebrow = 'Streamer tools', back = '/stream', children }:
  { ctl: GCtl; graphic: Graphic; title: string; eyebrow?: string; back?: string; children: ReactNode }) {
  const { s, update, undo, canUndo } = ctl
  const now = useNow(250)
  const live = isLive(s, graphic, now)
  const toggle = () => update(st => G.toggle(st, graphic))
  const toggleRef = useRef(toggle); toggleRef.current = toggle

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      if (e.key === 't' || e.key === 'T') { e.preventDefault(); toggleRef.current() }
    }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [])

  const other = s.onAir && s.onAir !== graphic && isLive(s, s.onAir, now) ? s.onAir : null
  return (
    <Shell back={back} eyebrow={eyebrow} title={title} wide
      actions={<Btn size="sm" variant="ghost" sound={null} onClick={undo} disabled={!canUndo} hint="Ctrl Z"><IconUndo className="h-4 w-4" />Undo</Btn>}>
      <div className="max-w-[1600px] mx-auto grid gap-4 grid-cols-1 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <Panel className="p-3">
            <div className="flex items-center justify-between mb-2 px-1 gap-3">
              <Label>Preview</Label>
              <span className="flex items-center gap-2 text-[12px] text-mist-400"><span className="h-2 w-2 rounded-full bg-ok" />Saves automatically</span>
            </div>
            <Preview s={{ ...s, onAir: graphic, shownAt: 0, lower: { ...s.lower, autoHide: 0 } }} />
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <Btn size="lg" variant={live ? 'danger' : 'primary'} sound={live ? 'back' : 'select'} hint="T" className="min-w-[220px]" onClick={toggle}>
                {live ? 'Hide from stream' : 'Show on stream'}
              </Btn>
              <span role="status" className="text-[14px] leading-snug">
                {live ? <span className="inline-flex items-center gap-2 font-semibold text-bad"><span className="h-2.5 w-2.5 rounded-full bg-bad animate-pulse" />On stream now</span>
                  : other ? <span className="text-mist-300">{GRAPHIC_NAME[other]} is on stream. Showing this replaces it.</span>
                  : <span className="text-mist-400">Not on stream</span>}
              </span>
            </div>
          </Panel>
          <LookPanel s={s} update={update} />
          <ObsLink graphic={graphic} />
        </div>
        <div className="flex flex-col gap-4 min-w-0">{children}</div>
      </div>
    </Shell>
  )
}

function Preview({ s }: { s: GState }) {
  const reduce = useReducedMotion()
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.4)
  useEffect(() => {
    const el = box.current; if (!el) return
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 1920))
    ro.observe(el); return () => ro.disconnect()
  }, [])
  return (
    <div ref={box} className="relative w-full aspect-video rounded-lg overflow-hidden ring-1 ring-night-600"
      style={{ background: 'repeating-conic-gradient(#173328 0% 25%, #112a20 0% 50%) 50% / 28px 28px' }}>
      <div className="absolute inset-0 grid place-items-center text-[13px] text-mist-400/70 pointer-events-none">Your stream is here</div>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: 1920, height: 1080, transform: `scale(${scale})` }}>
        <GraphicsView s={s} now={0} reduce={reduce} />
      </div>
    </div>
  )
}

function LookPanel({ s, update }: { s: GState; update: GCtl['update'] }) {
  const set = (p: Partial<GState['style']>) => update(x => ({ ...x, style: { ...x.style, ...p } }), 'style')
  return (
    <Panel className="p-4">
      <Label>Look (all graphics)</Label>
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 items-center">
        <span className="text-[14px] text-mist-300">Size</span>
        <div className="flex items-center gap-3">
          <input type="range" min={0.6} max={1.4} step={0.05} value={s.style.size} onChange={e => set({ size: +e.target.value })} aria-label="Graphic size" className="flex-1 accent-[#ffb31a]" />
          <span className="font-mono text-[13px] w-12 text-right">{Math.round(s.style.size * 100)}%</span>
        </div>
        <span className="text-[14px] text-mist-300">Theme</span>
        <Segmented size="sm" value={s.style.theme} onChange={v => set({ theme: v })} options={[{ value: 'night', label: 'Night' }, { value: 'light', label: 'Light' }]} />
      </div>
    </Panel>
  )
}

/** The graphics overlay link. One OBS source covers every graphic; it stays empty until something is shown. */
function ObsLink({ graphic }: { graphic: Graphic }) {
  const [open, setOpen] = useState(() => load(SETUP_KEY, true))
  const flip = () => setOpen(o => { save(SETUP_KEY, !o); return !o })
  const url = IS_PREVIEW ? '' : appUrl('overlay/graphics')
  return (
    <Panel className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Label>Add graphics to OBS</Label>
        <Btn size="sm" variant="ghost" sound="toggle" onClick={flip}>{open ? 'Hide steps' : 'Show steps'}</Btn>
      </div>
      {open && (IS_PREVIEW
        ? <p className="text-[14px] text-mist-300">The OBS link appears here once the app is running on its own website.</p>
        : <>
          <p className="text-[14px] text-mist-300 leading-relaxed">
            Do this once. In OBS: <b>Sources</b> → <b>+</b> → <b>Browser</b>, paste this link, set width 1920 and height 1080. It covers lower thirds, the prediction card, ratings and the lineup card, and stays see-through until you press <b>Show on stream</b>. Put it above your scoreboard source.
          </p>
          <CopyField value={url} label="graphics overlay link" />
          <p className="text-[13px] text-mist-400 leading-relaxed">
            Want this graphic in its own source? Add <span className="font-mono text-mist-300">?show={graphic}</span> to the end of the link. Keep this page open in the same browser as OBS (for example as a Custom Browser Dock) so they stay in sync. Press <Kbd>T</Kbd> to show or hide.
          </p>
        </>)}
    </Panel>
  )
}

export const inputCls = 'h-10 rounded-md bg-night-900 border border-night-600 focus:border-flood-500 outline-none px-2.5 text-[14px] min-w-0'
