// Pitch is 105 x 68 m. Blue attacks to the right: x 0 = own goal line, x 105 = opponent goal line.
// y 0 = left touchline from the attacking team's point of view.
// Each slot: [label, without ball, build-up, final third], each phase = [x, y, unit].
// Units group players into lines; the shape string (e.g. 2-3-5) is counted from them.
export type Phase = 'def' | 'build' | 'att'
export type OppPhase = Phase | 'low'
export type SlotPos = [number, number, string]
export type Slot = [string, SlotPos, SlotPos, SlotPos]
export type Formation = { name: string; d: Record<Phase, string>; s: Slot[] }

export const PHASES: Phase[] = ['def', 'build', 'att']
export const PHASE_NAME: Record<Phase, string> = { def: 'Without ball', build: 'Build-up', att: 'Final third' }
/** What the opponent is doing in each of blue's phases. */
export const OPP_PHASE: Record<Phase, OppPhase> = { def: 'att', build: 'def', att: 'low' }

export const FORMATIONS: Formation[] = [
  { name: '4-3-3', d: {
      def: 'Wingers drop level with the midfield to make a compact 4-5-1. The striker blocks passes into the other team’s holding midfielder.',
      build: 'Centre-backs split, the holding midfielder shows for the ball in front of them, and full-backs and wingers stretch the pitch wide.',
      att: 'Full-backs step inside next to the holding midfielder. Five players attack the box across the full width.' },
    s: [['GK', [6, 34, 'g'], [6, 34, 'g'], [14, 34, 'g']],
      ['LB', [30, 16, 'd'], [36, 6, 'd'], [58, 26, 'm']], ['CB', [28, 28.5, 'd'], [22, 21, 'd'], [42, 24, 'd']], ['CB', [28, 39.5, 'd'], [22, 47, 'd'], [42, 44, 'd']], ['RB', [30, 52, 'd'], [36, 62, 'd'], [58, 42, 'm']],
      ['CM', [42, 25, 'm'], [50, 23, 'm'], [82, 22, 'a']], ['CDM', [38, 34, 'm'], [35, 34, 'm'], [55, 34, 'm']], ['CM', [42, 43, 'm'], [50, 45, 'm'], [82, 46, 'a']],
      ['LW', [44, 12, 'm'], [67, 5, 'a'], [86, 6, 'a']], ['ST', [56, 34, 'a'], [71, 34, 'a'], [91, 34, 'a']], ['RW', [44, 56, 'm'], [67, 63, 'a'], [86, 62, 'a']]] },
  { name: '4-2-3-1', d: {
      def: 'The number 10 steps up next to the striker to press, and the wide players drop into midfield.',
      build: 'Two holding midfielders give the centre-backs safe passing options while the front four stay high.',
      att: 'One full-back overlaps, the other stays back with the centre-backs. Three players guard against the counter-attack.' },
    s: [['GK', [6, 34, 'g'], [6, 34, 'g'], [14, 34, 'g']],
      ['LB', [28, 15, 'd'], [36, 7, 'd'], [85, 5, 'a']], ['CB', [27, 28.5, 'd'], [23, 22, 'd'], [42, 22, 'd']], ['CB', [27, 39.5, 'd'], [23, 46, 'd'], [42, 40, 'd']], ['RB', [28, 53, 'd'], [36, 61, 'd'], [47, 56, 'd']],
      ['CDM', [40, 28, 'm'], [38, 28, 'm'], [58, 29, 'm']], ['CDM', [40, 40, 'm'], [38, 40, 'm'], [57, 42, 'm']],
      ['LM', [41, 13, 'm'], [62, 11, 'a'], [82, 22, 'a']], ['CAM', [50, 34, 'b'], [58, 34, 'a'], [84, 44, 'a']], ['RM', [41, 55, 'm'], [62, 57, 'a'], [86, 62, 'a']], ['ST', [58, 34, 's'], [73, 34, 's'], [92, 32, 'a']]] },
  { name: '4-4-2', d: {
      def: 'Two flat lines of four, about ten metres apart. Very hard to play through the middle.',
      build: 'Full-backs push on, wide midfielders go higher, and the two strikers pin the centre-backs.',
      att: 'Both full-backs join the midfield line and the wide players attack the box with the two strikers.' },
    s: [['GK', [6, 34, 'g'], [6, 34, 'g'], [14, 34, 'g']],
      ['LB', [26, 15, 'd'], [34, 6, 'd'], [62, 6, 'm']], ['CB', [25, 28.5, 'd'], [22, 24, 'd'], [40, 24, 'd']], ['CB', [25, 39.5, 'd'], [22, 44, 'd'], [40, 44, 'd']], ['RB', [26, 53, 'd'], [34, 62, 'd'], [62, 62, 'm']],
      ['LM', [38, 13, 'm'], [58, 8, 'm'], [82, 12, 'a']], ['CM', [37, 28, 'm'], [42, 28, 'm'], [58, 30, 'm']], ['CM', [37, 40, 'm'], [42, 40, 'm'], [54, 40, 'm']], ['RM', [38, 55, 'm'], [58, 60, 'm'], [82, 56, 'a']],
      ['ST', [50, 30, 'a'], [72, 28, 'a'], [90, 30, 'a']], ['SS', [52, 39, 'a'], [72, 40, 'a'], [88, 40, 'a']]] },
  { name: '4-1-4-1', d: {
      def: 'One holding midfielder screens the back four. A line of four sits in front of him, with the striker alone up top.',
      build: 'The holding midfielder links play. The two central midfielders move up into the gaps between the opponent’s lines.',
      att: 'With the ball it looks like a 4-3-3: full-backs step inside and five players spread across the front.' },
    s: [['GK', [6, 34, 'g'], [6, 34, 'g'], [14, 34, 'g']],
      ['LB', [26, 15, 'd'], [36, 6, 'd'], [58, 26, 'm']], ['CB', [25, 28.5, 'd'], [22, 22, 'd'], [42, 24, 'd']], ['CB', [25, 39.5, 'd'], [22, 46, 'd'], [42, 44, 'd']], ['RB', [26, 53, 'd'], [36, 62, 'd'], [58, 42, 'm']],
      ['CDM', [34, 34, 'c'], [36, 34, 'c'], [55, 34, 'm']],
      ['LM', [43, 12, 'm'], [66, 6, 'm'], [86, 6, 'a']], ['CM', [44, 27, 'm'], [54, 26, 'm'], [82, 22, 'a']], ['CM', [44, 41, 'm'], [54, 42, 'm'], [82, 46, 'a']], ['RM', [43, 56, 'm'], [66, 62, 'm'], [86, 62, 'a']],
      ['ST', [56, 34, 'a'], [73, 34, 'a'], [91, 34, 'a']]] },
  { name: '3-4-3', d: {
      def: 'The full-backs drop into the defence and the wingers drop into midfield, so it becomes a back five.',
      build: 'Three centre-backs build up while the full-backs push high and wide.',
      att: 'The full-backs join the front three, so five attack the box with three centre-backs behind.' },
    s: [['GK', [6, 34, 'g'], [6, 34, 'g'], [14, 34, 'g']],
      ['CB', [24, 24, 'd'], [22, 18, 'd'], [42, 20, 'd']], ['CB', [23, 34, 'd'], [20, 34, 'd'], [38, 34, 'd']], ['CB', [24, 44, 'd'], [22, 50, 'd'], [42, 48, 'd']],
      ['LB', [27, 10, 'd'], [50, 5, 'm'], [84, 5, 'a']], ['CM', [38, 28, 'm'], [40, 28, 'm'], [56, 28, 'm']], ['CM', [38, 40, 'm'], [40, 40, 'm'], [56, 40, 'm']], ['RB', [27, 58, 'd'], [50, 63, 'm'], [84, 63, 'a']],
      ['LW', [41, 15, 'm'], [66, 20, 'a'], [82, 22, 'a']], ['ST', [54, 34, 'a'], [74, 34, 'a'], [91, 34, 'a']], ['RW', [41, 53, 'm'], [66, 48, 'a'], [82, 46, 'a']]] },
  { name: '3-5-2', d: {
      def: 'The full-backs drop in to make a back five. Two strikers stay up, ready for the counter-attack.',
      build: 'Three centre-backs and three central midfielders control the middle. The full-backs give all the width.',
      att: 'The full-backs go high and two central midfielders join the attack while one holds in front of the defence.' },
    s: [['GK', [6, 34, 'g'], [6, 34, 'g'], [14, 34, 'g']],
      ['CB', [24, 24, 'd'], [22, 18, 'd'], [42, 20, 'd']], ['CB', [23, 34, 'd'], [20, 34, 'd'], [38, 34, 'd']], ['CB', [24, 44, 'd'], [22, 50, 'd'], [42, 48, 'd']],
      ['LB', [27, 10, 'd'], [50, 5, 'm'], [84, 5, 'a']], ['CM', [38, 25, 'm'], [44, 26, 'm'], [72, 24, 'b']], ['CDM', [36, 34, 'm'], [38, 34, 'm'], [54, 34, 'c']], ['CM', [38, 43, 'm'], [44, 42, 'm'], [72, 44, 'b']], ['RB', [27, 58, 'd'], [50, 63, 'm'], [84, 63, 'a']],
      ['ST', [52, 29, 'a'], [72, 30, 'a'], [88, 30, 'a']], ['SS', [52, 39, 'a'], [70, 40, 'a'], [88, 40, 'a']]] },
]
export const byName = (n: string) => FORMATIONS.find(f => f.name === n) ?? FORMATIONS[0]

export type Pt = { x: number; y: number }
export function positions(f: Formation, ph: OppPhase, mirror = false): Pt[] {
  return f.s.map(sl => {
    let p: Pt
    if (ph === 'low') { const q = sl[1]; p = { x: q[2] === 'g' ? 5 : 6 + (q[0] - 6) * 0.72, y: 34 + (q[1] - 34) * 0.85 } } // deep, narrow block
    else { const q = sl[1 + PHASES.indexOf(ph)] as SlotPos; p = { x: q[0], y: q[1] } }
    return mirror ? { x: 105 - p.x, y: 68 - p.y } : p
  })
}
export function units(f: Formation, ph: OppPhase) {
  const i = 1 + PHASES.indexOf(ph === 'low' ? 'def' : ph)
  const u: Record<string, number[]> = {}
  f.s.forEach((sl, k) => { const c = (sl[i] as SlotPos)[2]; if (c !== 'g') (u[c] ??= []).push(k) })
  return Object.values(u)
}
export function shapeOf(f: Formation, ph: OppPhase, pts: Pt[]) {
  return units(f, ph).map(ks => ({ n: ks.length, mx: ks.reduce((a, k) => a + pts[k].x, 0) / ks.length }))
    .sort((a, b) => a.mx - b.mx).map(o => o.n).join('-')
}
