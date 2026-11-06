import { FormationPreview, FoulsPreview, GraphicPreview, GuidePreview, LeaguesPreview, LineupPreview, OffsidePreview, QuizPreview, RebuildPreview, SandboxPreview, ScoreboardPreview, SetPiecePreview, WordsPreview } from '../components/MenuPreviews'
import { Hub } from './Hub'

const STREAM = '#ff6b5a', TACTICS = '#5ad1ff', LEARN = '#ffb31a'

export function StreamHub() {
  return (
    <Hub eyebrow="Streamer tools" title="Streamer tools" intro="Overlays for watch-along streams. No account and no server: everything runs in your browser and saves itself, so a refresh never loses the score." items={[
      { to: '/stream/scoreboard', label: 'Match Scoreboard', accent: STREAM, badge: 'LIVE', preview: <ScoreboardPreview />,
        desc: 'Score, clock, goal and card pop-ups. Control it from a panel or with hotkeys.' },
      { to: '/stream/guide', label: 'OBS Setup Guide', accent: STREAM, preview: <GuidePreview />, desc: 'Add the overlay to OBS in about two minutes.' },
      { to: '/stream/lower-thirds', label: 'Lower Thirds', accent: STREAM, badge: 'NEW', preview: <GraphicPreview g="lower" />,
        desc: 'Name bars for the bottom of your stream. Save a few, swap between them live, hide them after a few seconds.' },
      { to: '/stream/prediction', label: 'Prediction Card', accent: STREAM, preview: <GraphicPreview g="prediction" />,
        desc: 'Show your score prediction before kick-off, with a note underneath.' },
      { to: '/stream/ratings', label: 'Player Ratings', accent: STREAM, preview: <GraphicPreview g="ratings" />,
        desc: 'Rate each player from 1 to 10 after the match and pick your player of the match.' },
      { to: '/tactics/lineup', label: 'Lineup Card', accent: TACTICS, preview: <LineupPreview />,
        desc: 'Put your starting eleven on stream with shirt numbers, subs and coach.' },
      { to: '/tactics/formations', label: 'Halftime Boards', accent: TACTICS, preview: <FormationPreview />,
        desc: 'Every board has a clean view for screen sharing. Press H.' },
    ]} />
  )
}

export function TacticsHub() {
  return (
    <Hub eyebrow="Tactic boards" title="Tactic boards" intro="Show how a team sets up in each phase of play, then draw your own moves and replay them frame by frame." items={[
      { to: '/tactics/formations', label: 'Formation Lab', accent: TACTICS, preview: <FormationPreview />,
        desc: 'Six formations across three phases of play. Add an opponent and see how the shapes fit together.' },
      { to: '/tactics/sandbox', label: 'Tactics Sandbox', accent: TACTICS, badge: 'NEW', preview: <SandboxPreview />,
        desc: 'Drag both teams and the ball, draw passes, runs and zones, then replay a move frame by frame.' },
      { to: '/tactics/lineup', label: 'Lineup Builder', accent: TACTICS, preview: <LineupPreview />,
        desc: 'Pick a starting eleven with shirt numbers and names, then show it on stream as a lineup card.' },
      { to: '/tactics/set-pieces', label: 'Set Pieces', accent: TACTICS, preview: <SetPiecePreview />,
        desc: 'Corners, free kicks, penalties and throw-ins. Start from a typical setup and draw the routine.' },
      { to: '/tactics/rebuild', label: 'Match Rebuild', accent: TACTICS, preview: <RebuildPreview />,
        desc: 'Rebuild a goal step by step with a caption on each frame, and keep match notes.' },
    ]} />
  )
}

export function LearnHub() {
  return (
    <Hub eyebrow="Learn football" title="Learn the game" intro="Short lessons with moving players. Step through each one at your own pace, or use them on stream to explain a decision." items={[
      { to: '/learn/offside', label: 'The Offside Rule', accent: LEARN, badge: '7 LESSONS', preview: <OffsidePreview />,
        desc: 'From the basic line to the tricky cases, with a sandbox to test yourself.' },
      { to: '/tactics/formations', label: 'Formations', accent: TACTICS, preview: <FormationPreview />,
        desc: 'What 4-3-3 actually means, and how the shape changes with and without the ball.' },
      { to: '/learn/fouls', label: 'Fouls & Cards', accent: LEARN, badge: '10 CALLS', preview: <FoulsPreview />,
        desc: 'Free kick or penalty, yellow or red, advantage and handball. Watch the challenge, then make the call.' },
      { to: '/learn/leagues', label: 'How Leagues Work', accent: LEARN, preview: <LeaguesPreview />,
        desc: 'Points, tables and cups. Enter results and watch a mini league table sort itself.' },
      { to: '/learn/words', label: 'Football Words', accent: LEARN, preview: <WordsPreview />,
        desc: 'The words commentators use, explained in plain English.' },
      { to: '/learn/quiz', label: 'Quiz Mode', accent: LEARN, preview: <QuizPreview />,
        desc: 'Ten questions at a time on offside, fouls, rules, leagues and words.' },
    ]} />
  )
}

