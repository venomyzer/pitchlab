import { useEffect, useState } from 'react'
import { APP_NAME } from '../config'
import { GraphicsView } from '../features/graphics/GraphicsView'
import { useGraphics, type Graphic } from '../features/graphics/state'
import { useNow } from '../features/scoreboard/state'

const W = 1920, H = 1080
const ONLY: Graphic[] = ['lower', 'prediction', 'ratings', 'lineup']

/**
 * Second OBS browser source (1920 x 1080) for lower thirds, prediction card, ratings and lineup card.
 * Transparent by default; ?bg=green or ?bg=magenta for chroma key, ?show=lower (or prediction, ratings, lineup) for one graphic only.
 */
export default function GraphicsOverlay() {
  const { state } = useGraphics()
  const now = useNow(250)
  const [scale, setScale] = useState(1)
  const params = new URLSearchParams(window.location.search)
  const bg = params.get('bg')
  const reduce = params.get('motion') === 'reduced'
  const show = params.get('show') as Graphic | null
  const only = show && ONLY.includes(show) ? show : null

  useEffect(() => {
    const color = bg === 'green' ? '#00ff00' : bg === 'magenta' ? '#ff00ff' : 'transparent'
    const els = [document.documentElement, document.body]
    const prev = els.map(e => e.style.background)
    els.forEach(e => (e.style.background = color))
    document.title = `${APP_NAME} graphics`
    return () => els.forEach((e, i) => (e.style.background = prev[i]))
  }, [bg])
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / W, window.innerHeight / H))
    fit(); window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: 'transparent' }}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: W, height: H, transform: `scale(${scale})` }}>
        <GraphicsView s={state} now={now} reduce={reduce} only={only} />
      </div>
    </div>
  )
}
