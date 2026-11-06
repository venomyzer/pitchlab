// How leagues and cups work, in general terms. Exact rules (tiebreakers, number of teams, promotion places)
// are set by each competition, so the copy here says "most" or "many" and never names a real league.
export type LTeam = { name: string; color: string }
export const TEAMS: LTeam[] = [
  { name: 'Blue', color: '#3157ff' }, { name: 'Red', color: '#e5484d' },
  { name: 'Gold', color: '#ffb31a' }, { name: 'Green', color: '#1f9d55' },
]
/** Every team plays every other team once: 4 teams, 6 matches. */
export const FIXTURES: [number, number][] = [[0, 1], [2, 3], [0, 2], [1, 3], [3, 0], [1, 2]]
export type Result = [number, number] | null

export type Row = { t: number; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number }
export function table(results: Result[]): Row[] {
  const rows: Row[] = TEAMS.map((_, t) => ({ t, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }))
  FIXTURES.forEach(([h, a], i) => {
    const r = results[i]; if (!r) return
    const [hg, ag] = r, H = rows[h], A = rows[a]
    H.p++; A.p++; H.gf += hg; H.ga += ag; A.gf += ag; A.ga += hg
    if (hg > ag) { H.w++; A.l++; H.pts += 3 } else if (hg < ag) { A.w++; H.l++; A.pts += 3 } else { H.d++; A.d++; H.pts++; A.pts++ }
  })
  // tiebreakers used here: points, goal difference, goals scored, then name
  return rows.sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || TEAMS[x.t].name.localeCompare(TEAMS[y.t].name))
}

export const LESSONS: { title: string; text: string }[] = [
  { title: 'Win 3, draw 1, lose 0', text: 'Almost every league gives 3 points for a win, 1 for a draw and none for a loss. The team with the most points at the end of the season wins the league.' },
  { title: 'Everyone plays everyone', text: 'In a typical league season each team plays every other team twice: once at home, once away. With 20 teams that is 38 matches each.' },
  { title: 'Level on points', text: 'When teams finish on the same points, a tiebreaker decides. Goal difference (goals scored minus goals let in) is common, but some competitions look at the matches between those teams first. Each competition sets its own order.' },
  { title: 'Up and down', text: 'Many countries have several divisions. The top teams of a lower division are promoted and the bottom teams of the higher one are relegated. Some leagues have no relegation at all.' },
  { title: 'Cups are knockouts', text: 'Win and you go through, lose and you are out. A drawn cup match is settled by extra time, penalties or a replay, depending on the cup.' },
  { title: 'Two legs and groups', text: 'Some ties are two matches, one at each ground, and the total score (aggregate) decides. Many tournaments start with small groups that work like mini leagues, then switch to knockouts.' },
]
