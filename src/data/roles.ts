export const ROLES: [RegExp, string, string][] = [
  [/^GK$/, 'Goalkeeper', 'Stops shots, claims crosses and starts attacks with passes from the back. The only player who can use hands, and only inside their own box.'],
  [/CB$/, 'Centre-back', 'Guards the middle in front of goal. Wins headers, blocks shots and plays the first pass out.'],
  [/^(LB|RB)$/, 'Full-back', 'Defends the wide areas. In attack they either run up the touchline or step inside to help the midfield.'],
  [/WB$/, 'Wing-back', 'Half defender, half winger. Covers the whole touchline, so they do the most running in the team.'],
  [/DM$/, 'Holding midfielder', 'Sits in front of the defence, breaks up attacks and keeps the ball moving with simple passes.'],
  [/CM$/, 'Central midfielder', 'Links defence and attack. Passes, presses and arrives in the box late.'],
  [/^(LM|RM)$/, 'Wide midfielder', 'Covers one side of the pitch. Tracks back to defend, then gets forward to cross.'],
  [/AM$/, 'Attacking midfielder', 'Plays in the gap between the other team’s midfield and defence. Creates chances with the final pass or a shot.'],
  [/^(LW|RW)$/, 'Winger', 'Attacks the wide spaces, takes on defenders one-on-one, then crosses or cuts inside to shoot.'],
  [/^(LF|RF)$/, 'Wide forward', 'Starts wide in the front three and attacks the space between full-back and centre-back.'],
  [/^(ST|LS|RS)$/, 'Striker', 'Main goal scorer. Stays high, runs behind the defence and holds the ball up for teammates.'],
]
export const roleOf = (label: string) => ROLES.find(r => r[0].test(label)) ?? ROLES[0]
