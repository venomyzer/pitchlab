import { Howl, Howler } from 'howler'

// Bundled by Vite: hashed files in normal builds, inlined in the single-file preview build.
const FILES = import.meta.glob('../assets/sfx/*.wav', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const urlFor = (name: string) => FILES[`../assets/sfx/${name}.wav`]

export type SfxName = 'hover' | 'select' | 'back' | 'toggle' | 'whoosh' | 'whistle' | 'card' | 'goal'
const NAMES: SfxName[] = ['hover', 'select', 'back', 'toggle', 'whoosh', 'whistle', 'card', 'goal']
const VOL: Record<SfxName, number> = { hover: 0.35, select: 0.7, back: 0.6, toggle: 0.5, whoosh: 0.5, whistle: 0.8, card: 0.8, goal: 0.9 }

class Sfx {
  private howls = new Map<SfxName, Howl>()
  private enabled = true
  private lastHover = 0
  private ensure(name: SfxName) {
    let h = this.howls.get(name)
    if (!h) {
      h = new Howl({ src: [urlFor(name)], format: ['wav'], volume: VOL[name], preload: true })
      this.howls.set(name, h)
    }
    return h
  }
  preload() { NAMES.forEach(n => this.ensure(n)) }
  configure(enabled: boolean, volume: number) { this.enabled = enabled; Howler.volume(volume) }
  /** Plays a UI sound. Hover sounds are throttled so fast mouse movement never stacks them. */
  play(name: SfxName, opts: { force?: boolean } = {}) {
    if (!this.enabled && !opts.force) return
    if (name === 'hover') { const now = performance.now(); if (now - this.lastHover < 60) return; this.lastHover = now }
    try { this.ensure(name).play() } catch { /* audio is optional */ }
  }
}
export const sfx = new Sfx()
