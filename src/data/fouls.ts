// Fouls & cards scenarios. Blue attacks to the right; red defends the goal at x = 105.
// Source: IFAB Laws of the Game, Law 12 (fouls and misconduct) and Law 5 (advantage). Scenes are simplified.
export type Restart = 'play' | 'dfk' | 'ifk' | 'pen'
export type Card = 'none' | 'yellow' | 'red'
export type FP = { id: string; team: 'blue' | 'red'; x: number; y: number; tag: string; booked?: boolean }
export type Scenario = {
  key: string; title: string; text: string
  players: FP[]; ball: { x: number; y: number }
  /** Where players and the ball end up after "Watch". */
  moves: Record<string, { x: number; y: number }>; ballTo: { x: number; y: number }
  spot: { x: number; y: number; label: string }
  answer: { restart: Restart; card: Card }
  why: string
}

export const RESTART_NAME: Record<Restart, string> = { play: 'Play on', dfk: 'Free kick', ifk: 'Indirect free kick', pen: 'Penalty' }
export const CARD_NAME: Record<Card, string> = { none: 'No card', yellow: 'Yellow card', red: 'Red card' }

const P = (id: string, team: 'blue' | 'red', x: number, y: number, tag = '', booked = false): FP => ({ id, team, x, y, tag, booked })
const gk = P('gk', 'red', 103, 34, 'GK')

export const SCENARIOS: Scenario[] = [
  { key: 'Careless', title: 'A clumsy trip', text: 'The defender tries to win the ball but clips the attacker’s foot. Not dangerous, just careless.',
    players: [gk, P('a', 'blue', 54, 30, '10'), P('d', 'red', 60, 38, '6'), P('r2', 'red', 75, 24, '4'), P('r3', 'red', 75, 46, '5'), P('b2', 'blue', 44, 46, '8')],
    ball: { x: 55.6, y: 31 }, moves: { a: { x: 62, y: 32 }, d: { x: 62.4, y: 34.6 } }, ballTo: { x: 64.5, y: 33 },
    spot: { x: 62.2, y: 33.3, label: 'TRIP' }, answer: { restart: 'dfk', card: 'none' },
    why: 'Tripping an opponent is a direct free kick offence. Careless means the player wasn’t paying enough attention, so there’s no card.' },
  { key: 'In the box', title: 'Same trip, in the box', text: 'The same clumsy trip, but this time it happens inside the defender’s own penalty area.',
    players: [gk, P('a', 'blue', 87, 28, '9'), P('d', 'red', 93, 37, '4'), P('r2', 'red', 96, 22, '5'), P('b2', 'blue', 80, 44, '7')],
    ball: { x: 88.6, y: 29 }, moves: { a: { x: 95, y: 31 }, d: { x: 95.4, y: 33.6 } }, ballTo: { x: 97.5, y: 32 },
    spot: { x: 95.2, y: 32.3, label: 'TRIP' }, answer: { restart: 'pen', card: 'none' },
    why: 'A direct free kick offence by a defender inside their own penalty area is a penalty kick. Still careless, so still no card.' },
  { key: 'Reckless', title: 'Too late, too hard', text: 'The attacker has already passed the ball. The defender slides in late anyway and takes the man.',
    players: [gk, P('a', 'blue', 50, 20, '8'), P('d', 'red', 55, 28, '6'), P('b2', 'blue', 66, 30, '10'), P('r2', 'red', 72, 36, '4')],
    ball: { x: 51.6, y: 21 }, moves: { a: { x: 56, y: 20 }, d: { x: 56.4, y: 22.6 }, b2: { x: 67, y: 28 } }, ballTo: { x: 66, y: 27 },
    spot: { x: 56.2, y: 21.3, label: 'LATE' }, answer: { restart: 'dfk', card: 'yellow' },
    why: 'Reckless means the player ignored the danger or the result for the opponent. A reckless foul is a caution: yellow card.' },
  { key: 'Excessive force', title: 'Studs up, both feet', text: 'A high, two-footed tackle with studs showing, at full speed. The attacker could be badly hurt.',
    players: [gk, P('a', 'blue', 43, 40, '7'), P('d', 'red', 52, 45, '3'), P('r2', 'red', 60, 32, '6'), P('b2', 'blue', 36, 30, '6')],
    ball: { x: 44.6, y: 41 }, moves: { a: { x: 49, y: 40 }, d: { x: 49.4, y: 42.6 } }, ballTo: { x: 51, y: 40.5 },
    spot: { x: 49.2, y: 41.3, label: 'STUDS' }, answer: { restart: 'dfk', card: 'red' },
    why: 'Using excessive force or endangering an opponent’s safety is serious foul play. That’s a sending-off: red card.' },
  { key: 'Last man', title: 'Through on goal', text: 'The attacker is clean through with only the keeper to beat. The last defender grabs his shirt and pulls him down, just outside the box.',
    players: [gk, P('a', 'blue', 70, 34, '9'), P('d', 'red', 72, 29, '5'), P('r2', 'red', 58, 20, '4'), P('r3', 'red', 60, 48, '3')],
    ball: { x: 71.6, y: 35 }, moves: { a: { x: 85.5, y: 34 }, d: { x: 85, y: 31.4 } }, ballTo: { x: 87.5, y: 35 },
    spot: { x: 85.2, y: 32.6, label: 'PULL' }, answer: { restart: 'dfk', card: 'red' },
    why: 'Stopping an obvious goal-scoring opportunity with an offence is a sending-off. Outside the box that’s always a red card.' },
  { key: 'Tried for the ball', title: 'Through on goal, in the box', text: 'Clean through again, but inside the box. The defender slides to win the ball, misses it, and brings the attacker down.',
    players: [gk, P('a', 'blue', 80, 34, '9'), P('d', 'red', 83, 41, '5'), P('r2', 'red', 66, 22, '4')],
    ball: { x: 81.6, y: 35 }, moves: { a: { x: 95, y: 33 }, d: { x: 95.2, y: 35.6 } }, ballTo: { x: 97, y: 33.5 },
    spot: { x: 95.1, y: 34.3, label: 'SLIDE' }, answer: { restart: 'pen', card: 'yellow' },
    why: 'When a goal-scoring chance is stopped inside the box by a genuine attempt to play the ball, the penalty restores the chance, so the card drops to yellow. Holding, pulling or pushing would still be red.' },
  { key: 'Advantage', title: 'Fouled, but still going', text: 'The defender clips the attacker’s heel, but he stays on his feet with the ball and is running clear.',
    players: [gk, P('a', 'blue', 60, 34, '11'), P('d', 'red', 62, 40, '8'), P('r2', 'red', 86, 20, '4'), P('r3', 'red', 86, 50, '5')],
    ball: { x: 61.6, y: 35 }, moves: { a: { x: 78, y: 34 }, d: { x: 66, y: 37 } }, ballTo: { x: 79.6, y: 35 },
    spot: { x: 64, y: 36, label: 'CLIP' }, answer: { restart: 'play', card: 'none' },
    why: 'The referee plays advantage when stopping the game would help the team that fouled. If the advantage doesn’t come within a few seconds, the referee can still go back and give the free kick.' },
  { key: 'Back-pass', title: 'Kicked back to the keeper', text: 'A red defender kicks the ball back to his own keeper on purpose. The keeper picks it up inside the box.',
    players: [P('gk', 'red', 103, 34, 'GK'), P('d', 'red', 90, 42, '4'), P('a', 'blue', 86, 30, '9'), P('b2', 'blue', 80, 48, '7')],
    ball: { x: 88.6, y: 42 }, moves: { gk: { x: 100.5, y: 35 }, a: { x: 92, y: 33 } }, ballTo: { x: 99.2, y: 35.6 },
    spot: { x: 100.5, y: 35, label: 'HANDS' }, answer: { restart: 'ifk', card: 'none' },
    why: 'A keeper can’t handle the ball in their own box after a team-mate deliberately kicks it to them. The other team gets an indirect free kick.' },
  { key: 'Handball', title: 'Arm out wide', text: 'A pass across the box hits a defender’s arm, which is stretched out away from his body. It doesn’t stop a promising attack.',
    players: [gk, P('w', 'blue', 95, 7, '7'), P('d', 'red', 94, 23, '3'), P('a', 'blue', 90, 36, '9'), P('r2', 'red', 97, 36, '4')],
    ball: { x: 96.4, y: 8 }, moves: { w: { x: 97, y: 9.5 } }, ballTo: { x: 94.6, y: 21.2 },
    spot: { x: 94.4, y: 21, label: 'HAND' }, answer: { restart: 'pen', card: 'none' },
    why: 'Making the body unnaturally bigger with a hand or arm is handball. It happened in the defender’s own box, so it’s a penalty. No card, because it didn’t stop a promising attack or a goal.' },
  { key: 'Second yellow', title: 'Already booked', text: 'Number 6 was booked earlier (the small yellow card). Now he makes another late, reckless tackle.',
    players: [gk, P('a', 'blue', 50, 20, '8'), P('d', 'red', 55, 28, '6', true), P('b2', 'blue', 66, 30, '10'), P('r2', 'red', 72, 36, '4')],
    ball: { x: 51.6, y: 21 }, moves: { a: { x: 56, y: 20 }, d: { x: 56.4, y: 22.6 } }, ballTo: { x: 66, y: 27 },
    spot: { x: 56.2, y: 21.3, label: 'LATE' }, answer: { restart: 'dfk', card: 'red' },
    why: 'A second yellow card in the same match means a sending-off. The referee shows the yellow, then the red.' },
]

/** Quick reference shown under the scenarios. */
export const FOUL_LEVELS: [string, string][] = [
  ['Careless', 'No card. Free kick (or penalty in the box).'],
  ['Reckless', 'Yellow card.'],
  ['Excessive force', 'Red card.'],
]
