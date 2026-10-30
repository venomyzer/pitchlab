import { FormationPreview, GuidePreview, OffsidePreview, SandboxPreview, ScoreboardPreview } from '../components/MenuPreviews'
import { Hub } from './Hub'

const STREAM = '#ff6b5a', TACTICS = '#5ad1ff', LEARN = '#ffb31a'

export function StreamHub() {
  return (
    <Hub eyebrow="Streamer tools" title="Streamer tools" intro="Overlays for watch-along streams. No account and no server: everything runs in your browser and saves itself, so a refresh never loses the score." items={[
      { to: '/stream/scoreboard', label: 'Match Scoreboard', accent: STREAM, badge: 'LIVE', preview: <ScoreboardPreview />,
        desc: 'Score, clock, goal and card pop-ups. Control it from a panel or with hotkeys.' },
      { to: '/stream/guide', label: 'OBS Setup Guide', accent: STREAM, preview: <GuidePreview />, desc: 'Add the overlay to OBS in about two minutes.' },
      { to: '/tactics/formations', label: 'Halftime Boards', accent: TACTICS, preview: <FormationPreview />,
        desc: 'Every board has a clean view for screen sharing. Press H.' },
      { label: 'Lower Thirds', desc: 'Name bars for the bottom of your stream. Coming in a later update.' },
      { label: 'Prediction Card', desc: 'Show your score prediction before kick-off. Coming in a later update.' },
      { label: 'Player Ratings', desc: 'Rate each player after the match. Coming in a later update.' },
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
      { label: 'Lineup Builder', desc: 'Pick a starting eleven with names. Coming in a later update.' },
      { label: 'Set Pieces', desc: 'Draw corners and free kicks. Coming in a later update.' },
      { label: 'Match Rebuild', desc: 'Rebuild a goal from the match step by step. Coming in a later update.' },
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
      { label: 'Fouls & Cards', desc: 'Free kick or penalty, yellow or red, advantage and handball. Coming in a later update.' },
      { label: 'How Leagues Work', desc: 'Points, tables and cups. Coming in a later update.' },
      { label: 'Football Words', desc: 'The words commentators use, explained. Coming in a later update.' },
      { label: 'Quiz Mode', desc: 'Test what you have learned. Coming in a later update.' },
    ]} />
  )
}
