import { byName, type Pt } from './formations'

/**
 * Lineup-card spots for a formation, in pitch metres (blue attacks right).
 * Rows come from the name (4-2-3-1 → 4, 2, 3, 1) with the keeper at the back, in the same order as the
 * formation's slots, so names[i] and byName(f).s[i] always match.
 */
export function lineupSpots(name: string): Pt[] {
  const rows = byName(name).name.split('-').map(Number)
  const pts: Pt[] = [{ x: 7, y: 34 }]
  rows.forEach((count, r) => {
    const x = 24 + (r * 64) / Math.max(1, rows.length - 1)
    const span = Math.min(52, (count - 1) * 15)
    for (let i = 0; i < count; i++) pts.push({ x, y: count === 1 ? 34 : 34 - span / 2 + (i * span) / (count - 1) })
  })
  return pts
}

/** Short role labels for a formation's eleven (GK, LB, CB…). */
export const slotLabels = (name: string) => byName(name).s.map(s => s[0])
