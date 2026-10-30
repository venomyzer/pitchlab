import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Pitch } from './Pitch'
import type { Pt } from '../../data/formations'

// The ground is the normal flat <Pitch> SVG, tilted with a CSS matrix3d so it reads like a TV camera view
// from the stand. Discs are drawn flat on top at their projected spots, so they stay round and readable.
// Pitch area in metres, the same as the flat pitch's default viewBox.
const VX = -3, VY = -7, VW = 111, VH = 83

type M3 = number[] // 3x3 row-major
/** Homography that maps the 4 src points onto the 4 dst points (Gaussian elimination on the 8x8 system). */
function homography(src: [number, number][], dst: [number, number][]): M3 {
  const a: number[][] = []
  src.forEach(([x, y], i) => {
    const [u, v] = dst[i]
    a.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u])
    a.push([0, 0, 0, x, y, 1, -v * x, -v * y, v])
  })
  for (let c = 0; c < 8; c++) {
    let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r
    ;[a[c], a[p]] = [a[p], a[c]]
    for (let r = 0; r < 8; r++) if (r !== c) { const f = a[r][c] / a[c][c]; for (let k = c; k < 9; k++) a[r][k] -= f * a[c][k] }
  }
  const h = a.map((row, i) => row[8] / row[i])
  return [...h, 1]
}
const apply = (h: M3, x: number, y: number): [number, number] => {
  const w = h[6] * x + h[7] * y + h[8]
  return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w]
}
const invert = (m: M3): M3 => {
  const [a, b, c, d, e, f, g, h, i] = m
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g
  const det = a * A + b * B + c * C
  return [A, -(b * i - c * h), b * f - c * e, B, a * i - c * g, -(a * f - c * d), C, -(a * h - b * g), a * e - b * d].map(v => v / det)
}

/** Where the corners of the pitch area land, as fractions of the frame. `t` 0..1 runs the opening camera move. */
function quad(w: number, h: number, t: number): [number, number][] {
  const top = 0.24 - 0.13 * t, inset = 0.2 - 0.07 * t
  return [[w * inset, h * top], [w * (1 - inset), h * top], [0, h * 0.975], [w, h * 0.975]]
}

export type Pitch3DHandle = { toPitch: (e: { clientX: number; clientY: number }) => Pt }
type Props = {
  /** Painted on the grass, in metres (formation lines, arrows). */
  ground?: ReactNode
  /** Discs etc. Called with a projector from metres to frame pixels and the pixels-per-metre scale at that spot. */
  children: (project: (x: number, y: number) => { x: number; y: number; s: number }) => ReactNode
  caption?: ReactNode
  thirds?: boolean
  reduce?: boolean
  label?: string
  onPointerDown?: React.PointerEventHandler; onPointerMove?: React.PointerEventHandler; onPointerUp?: React.PointerEventHandler
}

/** Soft cinematic 3D view of the pitch. Same coordinates as the flat pitch, so boards can switch between the two. */
export const Pitch3D = forwardRef<Pitch3DHandle, Props>(function Pitch3D({ ground, children, caption, thirds, reduce, label, onPointerDown, onPointerMove, onPointerUp }, ref) {
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [anim, setT] = useState(0)
  const t = reduce ? 1 : anim
  useLayoutEffect(() => {
    const el = box.current; if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el); return () => ro.disconnect()
  }, [])
  // one slow camera move when the view opens
  useEffect(() => {
    if (reduce) return
    let raf = 0; const t0 = performance.now()
    const step = (now: number) => { const k = Math.min(1, (now - t0) / 1400); setT(1 - (1 - k) ** 3); if (k < 1) raf = requestAnimationFrame(step) }
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf)
  }, [reduce])

  const { w, h } = size
  const H = w && h ? homography([[0, 0], [w, 0], [0, h], [w, h]], quad(w, h, t)) : null
  // metres -> ground element pixels -> frame pixels
  const toEl = (x: number, y: number): [number, number] => [((x - VX) / VW) * w, ((y - VY) / VH) * h]
  const project = (x: number, y: number) => {
    if (!H) return { x: 0, y: 0, s: 1 }
    const [px, py] = apply(H, ...toEl(x, y)), [qx, qy] = apply(H, ...toEl(x + 1, y))
    // discs get a little bigger on small screens so labels stay readable
    return { x: px, y: py, s: Math.hypot(qx - px, qy - py) * Math.min(1.6, Math.max(1, 760 / w)) }
  }
  useImperativeHandle(ref, () => ({
    toPitch: e => {
      const el = box.current, m = H; if (!el || !m) return { x: 0, y: 0 }
      const r = el.getBoundingClientRect()
      const [ex, ey] = apply(invert(m), e.clientX - r.left, e.clientY - r.top)
      return { x: VX + (ex / el.clientWidth) * VW, y: VY + (ey / el.clientHeight) * VH }
    },
  }))
  const css = H ? `matrix3d(${H[0]},${H[3]},0,${H[6]},${H[1]},${H[4]},0,${H[7]},0,0,1,0,${H[2]},${H[5]},0,${H[8]})` : 'none'

  return (
    <div ref={box} className="relative w-full aspect-[4/3] sm:aspect-video overflow-hidden select-none touch-none bg-night-950 [:fullscreen_&]:max-h-screen"
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
      {/* stands and floodlights behind the far touchline */}
      <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(60% 40% at 18% -8%, rgba(255,236,190,.22), transparent 70%), radial-gradient(60% 40% at 82% -8%, rgba(255,236,190,.22), transparent 70%), linear-gradient(#0b1512 0%, #10201a 18%, #0a130f 30%)' }} />
      <div aria-hidden className="absolute inset-x-0 top-0 h-[22%] opacity-40" style={{ background: 'repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 2px, transparent 2px 7px), repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0 3px, transparent 3px 9px)', maskImage: 'linear-gradient(transparent, #000 40%, transparent)' }} />
      {w > 0 && (
        <Pitch thirds={thirds} preserveAspectRatio="none" aria-hidden
          style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, transformOrigin: '0 0', transform: css, pointerEvents: 'none' }}>
          {ground}
        </Pitch>
      )}
      {/* light: floodlight pools, haze towards the far side, darker corners */}
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(70% 55% at 50% 58%, rgba(255,250,225,.10), transparent 70%), linear-gradient(rgba(8,16,13,.55) 0%, rgba(8,16,13,0) 34%), radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(0,0,0,.5) 100%)' }} />
      {w > 0 && (
        <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${w} ${h}`} aria-label={label} role="img">
          <defs>
            <filter id="p3dShadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".45" /></filter>
            <radialGradient id="p3dShine" cx="38%" cy="28%" r="75%"><stop offset="0" stopColor="#fff" stopOpacity=".45" /><stop offset=".45" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".3" /></radialGradient>
          </defs>
          {children(project)}
        </svg>
      )}
      {caption && <div className="absolute left-3 top-2.5 pointer-events-none">{caption}</div>}
    </div>
  )
})

type DiscProps = { x: number; y: number; s: number; team: 'home' | 'away'; label?: string; name?: string; halo?: boolean; dataId?: string }
/** A player disc standing on the grass: ground shadow, a little thickness and a soft highlight. Sizes are in metres times `s`. */
export function Disc3D({ x, y, s, team, label, name, halo, dataId }: DiscProps) {
  const fill = team === 'home' ? 'var(--color-home)' : 'var(--color-away)'
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} data-token={dataId} className="cursor-grab">
      <ellipse rx="2.3" ry=".75" fill="#000" opacity=".5" filter="url(#p3dShadow)" />
      {halo && <ellipse rx="3.2" ry="1.15" fill="none" stroke="#ffb31a" strokeWidth=".45" />}
      <g transform="translate(0 -2.6)">
        <circle r="2.15" cy=".42" fill={fill} />
        <circle r="2.15" cy=".42" fill="#000" opacity=".4" />
        <circle r="2.15" fill={fill} stroke="#fff" strokeWidth=".3" />
        <circle r="2.15" fill="url(#p3dShine)" />
        {halo && <circle r="2.75" fill="none" stroke="#ffb31a" strokeWidth=".45" />}
        {label && <text y=".7" fontSize={label.length > 3 ? 1.5 : 1.85} fill="#fff" textAnchor="middle" fontFamily="Saira Condensed, sans-serif" fontWeight={800} style={{ textShadow: '0 .1px .4px rgba(0,0,0,.5)' }}>{label}</text>}
      </g>
      {name && <text y="2.6" fontSize="1.9" fill="#fff" textAnchor="middle" fontFamily="Barlow, sans-serif" fontWeight={600} stroke="rgba(0,20,8,.75)" strokeWidth=".55" paintOrder="stroke">{name}</text>}
    </g>
  )
}
