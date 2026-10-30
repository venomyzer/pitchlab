import { units, type Formation, type OppPhase, type Pt } from '../../data/formations'

/** Connects each line of a formation (defence, midfield, attack) and optionally counts players per line above the pitch. */
export function FormationLines({ f, ph, pts, color, badges }: { f: Formation; ph: OppPhase; pts: Pt[]; color: string; badges?: boolean }) {
  return (
    <g>
      {units(f, ph).map((ks, i) => {
        const ps = ks.map(k => pts[k]).sort((a, b) => a.y - b.y)
        const mx = ps.reduce((a, p) => a + p.x, 0) / ps.length
        return (
          <g key={i}>
            {ps.length > 1 && <polyline points={ps.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={color} strokeWidth=".55" opacity=".8" strokeLinejoin="round" />}
            {badges && <g>
              <line x1={mx} y1="-2.2" x2={mx} y2="0" stroke="#fff" strokeWidth=".25" opacity=".6" />
              <circle cx={mx} cy="-3.9" r="1.9" fill="var(--color-home)" stroke="#fff" strokeWidth=".3" />
              <text x={mx} y="-3.05" fontSize="2.4" textAnchor="middle" fill="#fff" fontFamily="Saira Condensed, sans-serif" fontWeight={800}>{ps.length}</text>
            </g>}
          </g>
        )
      })}
    </g>
  )
}
