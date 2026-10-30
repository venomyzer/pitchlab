import { useEffect, useState } from 'react'
import { Shell } from '../components/Shell'
import { Btn, Label, Panel, Segmented, Toggle } from '../components/ui'
import { APP_BY, APP_NAME } from '../config'
import { useSettings } from '../lib/settings'
import { sfx } from '../lib/sound'

export default function Settings() {
  const { settings, set } = useSettings()
  const [armed, setArmed] = useState(false)
  const [done, setDone] = useState(false)
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 4000); return () => clearTimeout(t) }, [armed])
  const wipe = () => {
    try { Object.keys(localStorage).filter(k => k.startsWith('pitchlab:') && k !== 'pitchlab:settings').forEach(k => localStorage.removeItem(k)) } catch { /* ignore */ }
    setArmed(false); setDone(true); sfx.play('back')
  }
  return (
    <Shell back="/" title="Settings" menu>
      <div className="max-w-2xl mx-auto pt-4 md:pt-8 flex flex-col gap-5">
        <h2 className="font-display font-extrabold uppercase text-4xl -skew-x-6">Settings</h2>
        <Panel className="p-4 flex flex-col gap-3">
          <Label>Sound</Label>
          <div className="-mx-3"><Toggle on={settings.sound} onChange={v => set({ sound: v })} label="Menu and board sounds" /></div>
          <div className="flex items-center gap-3">
            <span className="text-[15px] w-20">Volume</span>
            <input type="range" min={0} max={1} step={0.05} value={settings.volume} onChange={e => set({ volume: +e.target.value })} onPointerUp={() => sfx.play('select')}
              aria-label="Volume" className="flex-1 accent-[#ffb31a]" disabled={!settings.sound} />
            <span className="font-mono text-[13px] w-10 text-right">{Math.round(settings.volume * 100)}</span>
          </div>
          <p className="text-[13px] text-mist-400">Stream overlays have their own sound switch on the scoreboard panel.</p>
        </Panel>
        <Panel className="p-4 flex flex-col gap-3">
          <Label>Display</Label>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[15px]">Animations</span>
            <div className="w-56"><Segmented size="sm" value={settings.motion} onChange={v => set({ motion: v })} options={[{ value: 'full', label: 'Full' }, { value: 'reduced', label: 'Reduced' }]} /></div>
          </div>
          <div className="-mx-3"><Toggle on={settings.hints} onChange={v => set({ hints: v })} label="Show keyboard hints on menus" /></div>
        </Panel>
        <Panel className="p-4 flex flex-col gap-3">
          <Label>Saved data</Label>
          <p className="text-[14px] text-mist-300 leading-relaxed">{APP_NAME} saves player names, sandbox slots and the scoreboard in this browser only. Nothing is sent anywhere.</p>
          <div className="flex items-center gap-3">
            <Btn size="sm" variant={armed ? 'danger' : 'ghost'} sound={armed ? null : 'toggle'} onClick={() => (armed ? wipe() : (setArmed(true), setDone(false)))}>{armed ? 'Confirm: delete saved data' : 'Delete saved data'}</Btn>
            <span className="text-[13px] text-mist-400" role="status">{done ? 'Saved data deleted.' : armed ? 'This can’t be undone.' : ''}</span>
          </div>
        </Panel>
        <p className="text-[13px] text-mist-400">{APP_NAME} {APP_BY}. Original graphics and sounds. Not affiliated with any club, league or game publisher.</p>
      </div>
    </Shell>
  )
}
