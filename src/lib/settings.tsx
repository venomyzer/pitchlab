import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { load, save } from './storage'
import { sfx } from './sound'

export type Settings = { sound: boolean; volume: number; motion: 'full' | 'reduced'; hints: boolean }
const DEFAULTS: Settings = { sound: true, volume: 0.6, motion: 'full', hints: true }
const KEY = 'pitchlab:settings'

type Ctx = { settings: Settings; set: (patch: Partial<Settings>) => void }
const SettingsCtx = createContext<Ctx>({ settings: DEFAULTS, set: () => {} })

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => load(KEY, DEFAULTS))
  useEffect(() => {
    save(KEY, settings)
    sfx.configure(settings.sound, settings.volume)
    document.documentElement.dataset.motion = settings.motion
  }, [settings])
  const value = useMemo(() => ({ settings, set: (p: Partial<Settings>) => setSettings(s => ({ ...s, ...p })) }), [settings])
  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>
}
export const useSettings = () => useContext(SettingsCtx)

/** True when the user or OS asked for less motion. */
export function useReducedMotion() {
  const { settings } = useSettings()
  const [os, setOs] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const fn = () => setOs(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return os || settings.motion === 'reduced'
}
