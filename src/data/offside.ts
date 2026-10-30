// Offside lessons. Blue attacks to the right (x 0 = blue goal line, 105 = red goal line).
// Sources for the rule: IFAB Laws of the Game, Law 11 (current wording; Canada's league is trialling a "daylight" version in 2026).
export type OP = { id: string; team: 'blue' | 'red'; x: number; y: number; tag: string }
export type Lesson = {
  key: string; title: string; text: string; players: OP[]; passer?: string; rec?: string
  run?: { x: number; y: number }; half?: boolean; sandbox?: boolean; ball?: { x: number; y: number }
  verdict?: ['ok' | 'bad', string, string]
}
const P = (id: string, team: 'blue' | 'red', x: number, y: number, tag = ''): OP => ({ id, team, x, y, tag })
const reds = (a: [string, number, number][]) => a.map(([id, x, y]) => P('r' + id, 'red', x, y, id === 'gk' ? 'GK' : ''))
const back = reds([['gk', 101, 34], ['d1', 80, 13], ['d2', 81, 27], ['d3', 79, 41], ['d4', 78, 55], ['m1', 66, 22], ['m2', 67, 47]])
const blueGk = P('bgk', 'blue', 4, 34, 'GK')

export const LESSONS: Lesson[] = [
  { key: 'Onside', title: 'Behind the line', text: 'When the pass is played, the receiver is closer to halfway than the second-last defender. That’s onside.',
    players: [...back, blueGk, P('pas', 'blue', 60, 36, '9'), P('rec', 'blue', 74, 17, '11'), P('b3', 'blue', 70, 54, '7')], passer: 'pas', rec: 'rec',
    verdict: ['ok', 'Play on', 'The receiver was behind the yellow line when the ball left the passer’s foot.'] },
  { key: 'Offside', title: 'Beyond the line', text: 'Same pass. This time the receiver is already past the second-last defender when the ball is kicked. Flag goes up.',
    players: [...back, blueGk, P('pas', 'blue', 60, 36, '9'), P('rec', 'blue', 88, 17, '11'), P('b3', 'blue', 70, 54, '7')], passer: 'pas', rec: 'rec',
    verdict: ['bad', 'Offside', 'He was nearer the goal line than both the ball and the second-last defender, in the opponent’s half.'] },
  { key: 'Level', title: 'Level is onside', text: 'Exactly level with the second-last defender counts as onside. The attacker gets the benefit.',
    players: [...back, blueGk, P('pas', 'blue', 60, 36, '9'), P('rec', 'blue', 81, 17, '11'), P('b3', 'blue', 70, 54, '7')], passer: 'pas', rec: 'rec',
    verdict: ['ok', 'Play on', 'Level with the line is not beyond it.'] },
  { key: 'Own half', title: 'Own half is safe', text: 'The defence has pushed past halfway. The receiver is ahead of them, but still in his own half when the ball is played. You can’t be offside in your own half.',
    players: [...reds([['gk', 99, 34], ['d1', 44, 14], ['d2', 45, 28], ['d3', 43, 42], ['d4', 44, 56], ['m1', 34, 25], ['m2', 36, 48]]), blueGk, P('pas', 'blue', 27, 40, '9'), P('rec', 'blue', 50, 21, '11'), P('b3', 'blue', 22, 56, '7')],
    passer: 'pas', rec: 'rec', run: { x: 78, y: 22 }, half: true,
    verdict: ['ok', 'Play on', 'At the moment of the pass he was in his own half. Running into the space afterwards is legal.'] },
  { key: 'Behind ball', title: 'Behind the ball', text: 'A cut-back. The receiver is past the defenders, but the ball is even nearer the goal line. Anyone behind the ball can’t be offside.',
    players: [...back, blueGk, P('pas', 'blue', 93, 49, '9'), P('rec', 'blue', 86, 31, '11'), P('b3', 'blue', 70, 54, '7')], passer: 'pas', rec: 'rec',
    verdict: ['ok', 'Play on', 'He was beyond the defenders but behind the ball when it was played.'] },
  { key: 'Timing', title: 'The moment of the pass', text: 'Offside is judged at the instant the ball is played. The receiver is onside then, and sprints past the defence after. That’s fine.',
    players: [...back, blueGk, P('pas', 'blue', 60, 36, '9'), P('rec', 'blue', 78, 17, '11'), P('b3', 'blue', 70, 54, '7')], passer: 'pas', rec: 'rec', run: { x: 93, y: 23 },
    verdict: ['ok', 'Play on', 'The dashed circle shows where he was when the ball was kicked: behind the line.'] },
  { key: 'Not involved', title: 'Standing offside isn’t a foul', text: 'Number 7 is in an offside position, but the ball goes to number 11, who is onside. Being offside only matters if you get involved.',
    players: [...back, blueGk, P('pas', 'blue', 60, 36, '9'), P('rec', 'blue', 74, 46, '11'), P('b3', 'blue', 90, 20, '7')], passer: 'pas', rec: 'rec',
    verdict: ['ok', 'Play on', 'Number 7 stayed out of it, so no offence. If he had played the ball or blocked the keeper’s view, it would be offside.'] },
  { key: 'Sandbox', title: 'Try it yourself', text: 'Drag any player or the ball. Blue players in an offside position get a yellow ring. Ask your friends to call it before you move them.',
    players: [...back, blueGk, P('pas', 'blue', 60, 36, '9'), P('rec', 'blue', 74, 17, '11'), P('b3', 'blue', 88, 46, '7'), P('b4', 'blue', 50, 26, '10')], sandbox: true, ball: { x: 61.5, y: 37.5 } },
]

export const HALF = 52.5
const EPS = 0.3
export const secondLast = (ps: OP[]) => ps.filter(p => p.team === 'red').map(p => p.x).sort((a, b) => b - a)[1]
export function isOffsidePosition(p: OP, ps: OP[], ballX: number) {
  if (p.team !== 'blue') return false
  const sl = secondLast(ps)
  return p.x > HALF + EPS && p.x > sl + EPS && p.x > ballX + EPS
}
