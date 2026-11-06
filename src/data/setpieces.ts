// Set-piece start positions (typical, simplified). Blue attacks to the right, index 0 is each team's goalkeeper.
// Restart rules: IFAB Laws of the Game, Law 13 (free kicks), 14 (penalty kick), 15 (throw-in), 17 (corner kick); Law 11 for offside.
import type { Pt } from './formations'

type Arrow = { t: 'pass' | 'run' | 'zone'; x1: number; y1: number; x2: number; y2: number }
export type SetPiece = { key: string; name: string; sided: boolean; rules: string[]; b: Pt[]; r: Pt[]; ball: Pt; d: Arrow[] }
const P = (a: [number, number][]): Pt[] => a.map(([x, y]) => ({ x, y }))

export const SET_PIECES: SetPiece[] = [
  { key: 'corner', name: 'Corner', sided: true,
    rules: [
      'Opponents stay at least 9.15 m from the corner arc until the ball is kicked and moves.',
      'A goal can be scored straight from a corner.',
      'You can’t be offside straight from a corner.',
    ],
    ball: { x: 104.4, y: 0.7 },
    b: P([[12, 34], [40, 26], [40, 42], [102.6, -0.6], [96, 7], [86, 29], [86, 44], [97.5, 27], [93.5, 35], [97.5, 43], [102.5, 33]]),
    r: P([[103.8, 35], [104.2, 30], [99.5, 29.5], [99.5, 34.5], [99.5, 39.5], [95.5, 36.5], [95, 43.5], [88.5, 31], [96, 9.5], [89.5, 46], [60, 34]]),
    d: [{ t: 'pass', x1: 104.4, y1: 0.7, x2: 98.5, y2: 31 }, { t: 'run', x1: 93.5, y1: 35, x2: 98.5, y2: 31.5 }] },
  { key: 'wide-fk', name: 'Wide free kick', sided: true,
    rules: [
      'Opponents stay at least 9.15 m from the ball until it is in play.',
      'If 3 or more defenders form a wall, attackers must stay at least 1 m away from it.',
      'Attackers line up level with the last defender, then run as the ball is struck, so they stay onside.',
    ],
    ball: { x: 86, y: 12 },
    b: P([[12, 34], [45, 26], [45, 42], [84.2, 10.4], [80, 5], [89, 25], [89, 31], [89, 37], [89, 43], [78, 30], [70, 46]]),
    r: P([[102, 36], [90.8, 20], [93.2, 17.9], [93, 26], [93, 31.5], [93, 37], [93, 42.5], [93, 48], [82, 32], [86, 52], [60, 30]]),
    d: [{ t: 'pass', x1: 86, y1: 12, x2: 99, y2: 33 }, { t: 'run', x1: 89, y1: 31, x2: 98, y2: 31 }, { t: 'run', x1: 89, y1: 37, x2: 99, y2: 39 }] },
  { key: 'central-fk', name: 'Central free kick', sided: false,
    rules: [
      'The wall must be at least 9.15 m from the ball. It usually covers one side of the goal and the keeper covers the other.',
      'If 3 or more defenders form a wall, attackers must stay at least 1 m away from it.',
      'A direct free kick can go straight in. An indirect one must touch another player first.',
    ],
    ball: { x: 82, y: 34 },
    b: P([[12, 34], [45, 26], [45, 42], [80.2, 32.4], [80.2, 36.4], [91.2, 41.2], [95, 24], [95, 44], [86, 21], [86, 47], [70, 34]]),
    r: P([[103.5, 37], [91.15, 26.8], [91.15, 30], [91.15, 33.2], [91.15, 36.4], [96, 22], [96, 46], [94, 44], [88, 17], [88, 51], [60, 34]]),
    d: [{ t: 'pass', x1: 82, y1: 34, x2: 103, y2: 30.5 }] },
  { key: 'penalty', name: 'Penalty', sided: false,
    rules: [
      'The ball sits on the penalty mark, 11 m from goal. The keeper stays on the goal line, between the posts, until it is kicked.',
      'Everyone else waits outside the penalty area, behind the penalty mark and at least 9.15 m from it. The arc on the edge of the box marks that distance.',
      'The kicker must kick the ball forward. It can’t be played again by the kicker until another player touches it.',
    ],
    ball: { x: 94, y: 34 },
    b: P([[12, 34], [55, 28], [55, 40], [90.8, 36.2], [87.5, 25], [87.5, 43], [86, 19], [86, 49], [80, 34], [78, 22], [78, 46]]),
    r: P([[104.6, 34], [87.5, 27], [87.5, 41], [86.5, 22], [86.5, 46], [84, 34], [82, 28], [82, 40], [75, 34], [65, 20], [65, 48]]),
    d: [] },
  { key: 'throw', name: 'Throw-in', sided: true,
    rules: [
      'Both hands, from behind and over the head. Part of each foot stays on the touchline or the ground outside it.',
      'Opponents stay at least 2 m from where the throw is taken.',
      'A goal can’t be scored straight from a throw-in, and you can’t be offside from one.',
    ],
    ball: { x: 70, y: -0.4 },
    b: P([[12, 34], [40, 24], [40, 44], [70, -1], [66, 8], [75, 6], [78, 14], [88, 20], [62, 20], [55, 40], [80, 34]]),
    r: P([[102, 34], [72.5, 5], [64, 9.5], [78.5, 9], [82, 16.5], [90, 22], [90, 34], [90, 44], [76, 28], [70, 40], [60, 30]]),
    d: [{ t: 'pass', x1: 70, y1: -0.4, x2: 75, y2: 5 }, { t: 'run', x1: 78, y1: 14, x2: 88, y2: 8 }] },
]

/** Flip a setup to the other side of the pitch (left corner → right corner). */
export function flipSide(sp: SetPiece) {
  const f = (p: Pt) => ({ x: p.x, y: 68 - p.y })
  return { b: sp.b.map(f), r: sp.r.map(f), ball: f(sp.ball), d: sp.d.map(a => ({ ...a, y1: 68 - a.y1, y2: 68 - a.y2 })) }
}
export const SHIRTS = ['GK', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']
