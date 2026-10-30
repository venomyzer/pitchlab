import { forwardRef, type ReactNode, type SVGProps } from 'react'

type Props = Omit<SVGProps<SVGSVGElement>, 'ref'> & { children?: ReactNode; thirds?: boolean; viewBox?: string; stripes?: number }
/** A full-size pitch (105 x 68 m) in SVG units of metres. Extra space around it holds labels. */
export const Pitch = forwardRef<SVGSVGElement, Props>(function Pitch({ children, thirds, viewBox = '-3 -7 111 83', stripes = 12, ...rest }, ref) {
  const [vx, vy, vw, vh] = viewBox.split(' ').map(Number)
  return (
    <svg ref={ref} viewBox={viewBox} className="block w-full h-auto select-none touch-none" {...rest}>
      <defs>
        <marker id="arrW" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#fff" /></marker>
        <marker id="arrY" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#ffb31a" /></marker>
        <radialGradient id="turfLight" cx="50%" cy="40%" r="75%"><stop offset="0" stopColor="#fff" stopOpacity=".08" /><stop offset="1" stopColor="#000" stopOpacity=".25" /></radialGradient>
      </defs>
      {Array.from({ length: stripes }, (_, i) => (
        <rect key={i} x={vx + (i * vw) / stripes} y={vy} width={vw / stripes + 0.05} height={vh} fill={i % 2 ? 'var(--color-turf-2)' : 'var(--color-turf-1)'} />
      ))}
      <rect x={vx} y={vy} width={vw} height={vh} fill="url(#turfLight)" />
      <g fill="none" stroke="#fff" strokeWidth=".35" opacity=".92">
        <rect x="0" y="0" width="105" height="68" /><line x1="52.5" y1="0" x2="52.5" y2="68" /><circle cx="52.5" cy="34" r="9.15" />
        <rect x="0" y="13.84" width="16.5" height="40.32" /><rect x="88.5" y="13.84" width="16.5" height="40.32" />
        <rect x="0" y="24.84" width="5.5" height="18.32" /><rect x="99.5" y="24.84" width="5.5" height="18.32" />
        <rect x="-2" y="30.34" width="2" height="7.32" /><rect x="105" y="30.34" width="2" height="7.32" />
        <path d="M16.5 26.7A9.15 9.15 0 0 1 16.5 41.3M88.5 26.7A9.15 9.15 0 0 0 88.5 41.3" />
        <path d="M0 1A1 1 0 0 0 1 0M104 0A1 1 0 0 0 105 1M0 67A1 1 0 0 1 1 68M104 68A1 1 0 0 1 105 67" />
      </g>
      {[[11, 34], [94, 34], [52.5, 34]].map(([x, y]) => <circle key={x} cx={x} cy={y} r=".35" fill="#fff" />)}
      {thirds && (
        <g>
          <g stroke="#fff" strokeWidth=".2" strokeDasharray=".8 1.2" opacity=".35"><line x1="35" y1="0" x2="35" y2="68" /><line x1="70" y1="0" x2="70" y2="68" /></g>
          <g fill="#fff" opacity=".5" fontSize="1.7" fontFamily="Barlow, sans-serif" fontWeight={600} textAnchor="middle" letterSpacing=".15">
            <text x="17.5" y="66.6">DEFENSIVE THIRD</text><text x="52.5" y="66.6">MIDDLE THIRD</text><text x="87.5" y="66.6">FINAL THIRD</text>
          </g>
        </g>
      )}
      {children}
    </svg>
  )
})

type TokenProps = { x: number; y: number; team: 'home' | 'away'; label?: string; name?: string; ring?: boolean; halo?: boolean; dim?: boolean; dataId?: string }
export function Token({ x, y, team, label, name, ring, halo, dim, dataId }: TokenProps) {
  return (
    <g transform={`translate(${x} ${y})`} data-token={dataId} className="cursor-grab" opacity={dim ? 0.45 : 1}>
      {halo && <circle r="3.1" fill="none" stroke="#ffb31a" strokeWidth=".6" />}
      {ring && <circle r="3.1" fill="none" stroke="#ffe066" strokeWidth=".65" strokeDasharray="1 .5" />}
      <circle r="2.15" cy=".25" fill="#000" opacity=".25" />
      <circle r="2.15" fill={team === 'home' ? 'var(--color-home)' : 'var(--color-away)'} stroke="#fff" strokeWidth=".35" />
      {label && <text y=".72" fontSize={label.length > 3 ? 1.5 : 1.85} fill="#fff" textAnchor="middle" fontFamily="Saira Condensed, sans-serif" fontWeight={800}>{label}</text>}
      {name && <text y="4.7" fontSize="2" fill="#fff" textAnchor="middle" fontFamily="Barlow, sans-serif" fontWeight={600} stroke="rgba(0,30,10,.65)" strokeWidth=".55" paintOrder="stroke">{name}</text>}
    </g>
  )
}
export function Ball({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} data-token="ball" className="cursor-grab">
      <circle r="1.15" fill="#fff" stroke="#111" strokeWidth=".25" /><circle r=".42" fill="#111" />
    </g>
  )
}

/** Convert a pointer event into pitch coordinates (metres). */
export function toPitch(svg: SVGSVGElement, e: { clientX: number; clientY: number }) {
  const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY
  const m = svg.getScreenCTM(); if (!m) return { x: 0, y: 0 }
  const q = p.matrixTransform(m.inverse()); return { x: q.x, y: q.y }
}
