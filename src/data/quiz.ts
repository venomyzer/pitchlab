// Quiz questions. Rules from the IFAB Laws of the Game; the rest from the lessons in this app.
import { CARD_NAME, RESTART_NAME, SCENARIOS } from './fouls'
import { WORDS } from './words'

export type Topic = 'Offside' | 'Fouls' | 'Rules' | 'Leagues' | 'Words'
export const TOPICS: Topic[] = ['Offside', 'Fouls', 'Rules', 'Leagues', 'Words']
/** `a` is the index of the right answer in `o`. */
export type Q = { topic: Topic; q: string; o: string[]; a: number; why: string }

const FIXED: Q[] = [
  { topic: 'Offside', q: 'Can a player be offside in their own half?', o: ['No, never', 'Yes, always', 'Only in the second half', 'Only from a free kick'], a: 0, why: 'An offside position needs the player to be in the other team’s half.' },
  { topic: 'Offside', q: 'An attacker is exactly level with the second-last defender when the pass is played. What is the call?', o: ['Onside, play on', 'Offside', 'Indirect free kick', 'Drop ball'], a: 0, why: 'Level is not beyond the line, so it’s onside.' },
  { topic: 'Offside', q: 'When is offside judged?', o: ['When a team-mate plays the ball', 'When the attacker receives it', 'When the attacker shoots', 'When the defender touches it'], a: 0, why: 'It’s the moment the ball is played by a team-mate that counts.' },
  { topic: 'Offside', q: 'Which restart can you NOT be offside from?', o: ['Throw-in', 'Direct free kick', 'Indirect free kick', 'A pass in open play'], a: 0, why: 'There’s no offside straight from a throw-in, goal kick or corner.' },
  { topic: 'Offside', q: 'A player in an offside position only commits an offence if they…', o: ['Get involved in play', 'Stand still', 'Are behind the ball', 'Are in their own half'], a: 0, why: 'Being in an offside position isn’t an offence on its own. Playing the ball or interfering with an opponent is.' },
  { topic: 'Offside', q: 'A cut-back is played to an attacker who is past the defenders but behind the ball. Offside?', o: ['No', 'Yes', 'Only if they score', 'Only inside the box'], a: 0, why: 'A player behind the ball can’t be in an offside position.' },
  { topic: 'Fouls', q: 'A defender makes a reckless tackle. What card?', o: ['Yellow card', 'No card', 'Red card', 'Two yellow cards'], a: 0, why: 'Reckless means ignoring the danger to the opponent. That’s a caution.' },
  { topic: 'Fouls', q: 'A tackle uses excessive force and endangers the opponent. What card?', o: ['Red card', 'Yellow card', 'No card', 'It depends on the score'], a: 0, why: 'That’s serious foul play: a sending-off.' },
  { topic: 'Fouls', q: 'A defender trips an attacker inside their own penalty area. Restart?', o: ['Penalty kick', 'Indirect free kick', 'Corner', 'Drop ball'], a: 0, why: 'A direct free kick offence by a defender in their own penalty area is a penalty.' },
  { topic: 'Fouls', q: 'The keeper picks up a ball a team-mate deliberately kicked back to them. Restart?', o: ['Indirect free kick', 'Penalty', 'Direct free kick', 'Goal kick'], a: 0, why: 'Handling a deliberate kick from a team-mate gives the other team an indirect free kick.' },
  { topic: 'Fouls', q: 'A player gets a second yellow card in the same match. What happens?', o: ['Red card, they’re sent off', 'Nothing more', 'A penalty to the other team', 'They miss 10 minutes'], a: 0, why: 'Two cautions in one match means a sending-off.' },
  { topic: 'Fouls', q: 'The referee lets play continue after a foul because the fouled team is attacking. What is this called?', o: ['Advantage', 'Offside', 'A dropped ball', 'Stoppage time'], a: 0, why: 'Advantage keeps the game going when stopping it would help the team that fouled.' },
  { topic: 'Fouls', q: 'A careless trip in midfield. What card?', o: ['No card', 'Yellow card', 'Red card', 'Penalty'], a: 0, why: 'Careless fouls give a free kick but no card.' },
  { topic: 'Rules', q: 'How far is the penalty mark from the goal line?', o: ['11 m', '9.15 m', '16.5 m', '5.5 m'], a: 0, why: 'The penalty mark is 11 m (12 yards) from the goal line.' },
  { topic: 'Rules', q: 'At a free kick, how far must opponents stand from the ball?', o: ['9.15 m', '2 m', '5 m', '11 m'], a: 0, why: '9.15 m (10 yards), the same as the radius of the centre circle.' },
  { topic: 'Rules', q: 'At a throw-in, how close can opponents stand?', o: ['No closer than 2 m', 'No closer than 9.15 m', 'Anywhere', 'Behind the thrower only'], a: 0, why: 'Opponents must be at least 2 m from where the throw is taken.' },
  { topic: 'Rules', q: 'How many players does each team start with, keeper included?', o: ['11', '10', '12', '9'], a: 0, why: 'Eleven, one of them the goalkeeper.' },
  { topic: 'Rules', q: 'How long is each half of an adult match?', o: ['45 minutes', '40 minutes', '30 minutes', '50 minutes'], a: 0, why: 'Two halves of 45 minutes, plus any time added on.' },
  { topic: 'Rules', q: 'When does a goal count?', o: ['The whole ball crosses the goal line, between the posts and under the bar', 'Half the ball is over the line', 'The ball touches the line', 'The keeper touches it in the goal'], a: 0, why: 'All of the ball must be over the line.' },
  { topic: 'Rules', q: 'Can a goal be scored straight from a throw-in?', o: ['No', 'Yes', 'Only in the second half', 'Only if the keeper touches it'], a: 0, why: 'A throw-in thrown straight into the other team’s goal is a goal kick.' },
  { topic: 'Rules', q: 'Can a goal be scored straight from a corner?', o: ['Yes', 'No', 'Only with a header', 'Only in extra time'], a: 0, why: 'A corner can go straight into the other team’s goal.' },
  { topic: 'Rules', q: 'How does the referee show an indirect free kick?', o: ['Raises an arm above the head', 'Points to the spot', 'Blows the whistle twice', 'Shows a card'], a: 0, why: 'The arm stays up until the ball touches another player or goes out of play.' },
  { topic: 'Leagues', q: 'In most leagues, how many points is a win worth?', o: ['3', '2', '1', '5'], a: 0, why: 'Win 3, draw 1, loss 0.' },
  { topic: 'Leagues', q: 'In most leagues, how many points is a draw worth?', o: ['1', '0', '2', '3'], a: 0, why: 'Each team gets 1 point for a draw.' },
  { topic: 'Leagues', q: 'What is goal difference?', o: ['Goals scored minus goals let in', 'Goals in the last match', 'Home goals minus away goals', 'Goals scored by the top scorer'], a: 0, why: 'It’s often used to split teams level on points.' },
  { topic: 'Leagues', q: 'What is an aggregate score?', o: ['The total over two matches between the same teams', 'The score at half-time', 'The score after extra time only', 'The number of shots on target'], a: 0, why: 'Two-legged ties add both scores together.' },
  { topic: 'Leagues', q: 'What does relegation mean?', o: ['Dropping to a lower division', 'Winning the league', 'Moving to a new stadium', 'Changing the coach'], a: 0, why: 'Teams near the bottom of the table go down.' },
  { topic: 'Leagues', q: 'In a knockout cup, what happens to the team that loses?', o: ['They’re out', 'They lose 3 points', 'They play again next week', 'They go into a group'], a: 0, why: 'Win and you go through, lose and you are out.' },
]

// Built from the foul scenarios, so the quiz and the lessons always agree.
const FROM_FOULS: Q[] = SCENARIOS.map(s => {
  const right = `${RESTART_NAME[s.answer.restart]}, ${CARD_NAME[s.answer.card].toLowerCase()}`
  const pool = [...new Set(SCENARIOS.map(x => `${RESTART_NAME[x.answer.restart]}, ${CARD_NAME[x.answer.card].toLowerCase()}`))].filter(x => x !== right)
  return { topic: 'Fouls' as const, q: `${s.text.replace(' (the small yellow card)', '')} What’s the call?`, o: [right, ...shuffle(pool).slice(0, 3)], a: 0, why: s.why }
})

/** "What does X mean?" with three other definitions from the same group as wrong answers. */
function fromWords(): Q[] {
  return WORDS.map(w => {
    const others = shuffle(WORDS.filter(x => x.cat === w.cat && x.term !== w.term)).slice(0, 3).map(x => x.def)
    return { topic: 'Words' as const, q: `What does “${w.term}” mean?`, o: [w.def, ...others], a: 0, why: w.also ? `Also called: ${w.also}.` : '' }
  })
}

export function shuffle<T>(a: T[]): T[] {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] }
  return r
}

/** A round of `n` questions with the options shuffled. */
export function makeRound(topic: Topic | 'All', n = 10): Q[] {
  const all = [...FIXED, ...FROM_FOULS, ...fromWords()].filter(q => topic === 'All' || q.topic === topic)
  return shuffle(all).slice(0, n).map(q => {
    const order = shuffle(q.o.map((_, i) => i))
    return { ...q, o: order.map(i => q.o[i]), a: order.indexOf(q.a) }
  })
}
/** How many questions a topic has. */
export const countFor = (topic: Topic | 'All') =>
  [...FIXED, ...FROM_FOULS].filter(q => topic === 'All' || q.topic === topic).length + (topic === 'All' || topic === 'Words' ? WORDS.length : 0)
