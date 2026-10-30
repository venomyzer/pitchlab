import { useEffect, useRef, useState } from 'react'
import { ScoreboardView } from '../features/scoreboard/ScoreboardView'
import { useScoreHotkeys } from '../features/scoreboard/hotkeys'
import { useNow, useScoreboard } from '../features/scoreboard/state'
import { sfx } from '../lib/sound'

const W = 1920, H = 1080
/**
 * The page streamers add to OBS as a browser source (1920 x 1080).
 * Transparent by default; ?bg=green or ?bg=magenta for chroma key when capturing a browser window instead.
 */
export default function ScoreboardOverlay() {
  const { state, update } = useScoreboard()
  const now = useNow(200)
  const [scale, setScale] = useState(1)
  const params = new URLSearchParams(window.location.search)
  const bg = params.get('bg')
  const reduce = params.get('motion') === 'reduced'

  useEffect(() => {
    const color = bg === 'green' ? '#00ff00' : bg === 'magenta' ? '#ff00ff' : 'transparent'
    const els = [document.documentElement, document.body]
    const prev = els.map(e => e.style.background)
    els.forEach(e => (e.style.background = color))
    document.title = 'PitchLab overlay'
    return () => els.forEach((e, i) => (e.style.background = prev[i]))
  }, [bg])
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / W, window.innerHeight / H))
    fit(); window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  // play event sounds only for new events, never for one that was already showing when the page loaded
  const seen = useRef(state.event?.id ?? 0)
  useEffect(() => {
    const e = state.event
    if (!e || e.id === seen.current) return
    seen.current = e.id
    if (state.style.sounds && Date.now() - e.at < 3000) sfx.play(e.kind === 'goal' ? 'goal' : e.kind === 'var' ? 'whistle' : 'card', { force: true })
  }, [state.event, state.style.sounds])

  useScoreHotkeys(update, { sounds: false })

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: 'transparent' }}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: W, height: H, transform: `scale(${scale})` }}>
        <ScoreboardView s={state} now={now} reduce={reduce} />
      </div>
    </div>
  )
}
