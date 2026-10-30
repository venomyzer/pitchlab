import { units, type Formation, type OppPhase, type Pt } from '../../data/formations'

/** Connects each line of a formation (defence, midfield, attack). */
export function FormationLines({ f, ph, pts, color }: { f: Formation; ph: OppPhase; pts: Pt[]; color: string }) {
  return (
    <g>
      {units(f, ph).map((ks, i) => {
        const ps = ks.map(k => pts[k]).sort((a, b) => a.y - b.y)
        return ps.length > 1 && <polyline key={i} points={ps.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={color} strokeWidth=".55" opacity=".8" strokeLinejoin="round" />
      })}
    </g>
  )
}
