import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CopyField } from '../components/CopyField'
import { Shell } from '../components/Shell'
import { Kbd, Panel, Segmented } from '../components/ui'
import { IS_PREVIEW } from '../config'
import { appUrl } from '../features/scoreboard/control'

type M = 'dock' | 'interact' | 'chrome'
const OVERLAY = IS_PREVIEW ? '' : appUrl('overlay/scoreboard')
const DOCK = IS_PREVIEW ? '' : appUrl('stream/dock')
const Chip = ({ children }: { children: ReactNode }) => (
  <span className="inline-block rounded border border-flood-500/60 bg-flood-500/15 px-1.5 py-px font-mono text-[14px] text-flood-400 whitespace-nowrap">{children}</span>
)
const addOverlay: ReactNode = <>In OBS: <b>Sources</b> → <b>+</b> → <b>Browser</b>. Paste the overlay link, set <Chip>Width 1920</Chip> <Chip>Height 1080</Chip> and click <b>OK</b>.<div className="mt-3"><CopyField value={OVERLAY} label="overlay link" /></div></>

const STEPS: Record<M, { title: string; why: string; steps: ReactNode[] }> = {
  dock: {
    title: 'Controls inside OBS (recommended)',
    why: 'Best for a single screen. The overlay and the controls both run inside OBS, so they stay in sync.',
    steps: [
      addOverlay,
      <>In OBS: <b>Docks</b> → <b>Custom Browser Docks</b>. Name it <Chip>Scoreboard</Chip>, paste the dock link and click <b>Apply</b>.<div className="mt-3"><CopyField value={DOCK} label="dock link" /></div></>,
      <>Drag the new dock next to your scenes. It works from about 280px wide.</>,
      <>Press <b>Goal</b> in the dock and check the overlay updates within a second. Click inside the dock once so the hotkeys <Kbd>1</Kbd> <Kbd>2</Kbd> <Kbd>Space</Kbd> reach it.</>,
    ],
  },
  interact: {
    title: 'Hotkeys on the overlay',
    why: 'No dock. Good for streamers who only need score and clock.',
    steps: [
      addOverlay,
      <>Right-click the source in OBS → <b>Interact</b>. A small window opens.</>,
      <>With that window focused, press <Kbd>1</Kbd> or <Kbd>2</Kbd> for a goal, <Kbd>Shift</Kbd>+<Kbd>1</Kbd> or <Kbd>Shift</Kbd>+<Kbd>2</Kbd> to remove one, <Kbd>Space</Kbd> to start or pause the clock.</>,
      <>Set team names and colours once from the dock or the Match Scoreboard page inside OBS.</>,
    ],
  },
  chrome: {
    title: 'Overlay in a browser window',
    why: 'Use this if browser sources don’t work on your setup. The overlay and the controls both run in Chrome.',
    steps: [
      <>Open the green-screen overlay in its own Chrome window.<div className="mt-3"><CopyField value={OVERLAY + '?bg=green'} label="green-screen overlay link" /></div></>,
      <>Keep the Match Scoreboard page open in another Chrome tab or window. They sync instantly.</>,
      <>In OBS: <b>Sources</b> → <b>+</b> → <b>Window Capture</b> → pick the overlay window.</>,
      <>Right-click the source → <b>Filters</b> → <b>+</b> → <b>Chroma Key</b> → Key Colour Type: <Chip>Green</Chip>.</>,
    ],
  },
}

export default function ObsGuide() {
  const [m, setM] = useState<M>('dock')
  const d = STEPS[m]
  return (
    <Shell back="/stream" eyebrow="Streamer tools" title="OBS Setup Guide">
      <div className="max-w-3xl mx-auto pt-4 md:pt-8 flex flex-col gap-6">
        <div>
          <h2 className="font-display font-extrabold uppercase text-4xl -skew-x-6">Add the scoreboard to OBS</h2>
          <p className="text-mist-300 mt-2 leading-relaxed">Pick the setup that suits you. All three keep the score saved, so refreshing the overlay or restarting OBS keeps it as it was. Use OBS 31 or newer.</p>
        </div>
        <Segmented value={m} onChange={setM} options={[{ value: 'dock', label: 'Dock in OBS' }, { value: 'interact', label: 'Hotkeys only' }, { value: 'chrome', label: 'Browser window' }]} />
        <Panel className="p-5 md:p-6">
          <h3 className="font-display font-bold uppercase text-2xl">{d.title}</h3>
          <p className="text-mist-300 mt-1">{d.why}</p>
          <ol className="mt-5 flex flex-col gap-4">
            {d.steps.map((s, i) => (
              <li key={i} className="flex gap-4">
                <span className="h-9 w-9 shrink-0 rounded-md bg-flood-500 text-night-950 font-display font-extrabold text-lg grid place-items-center">{i + 1}</span>
                <div className="leading-relaxed pt-1 min-w-0 flex-1 text-[16px]">{s}</div>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel className="p-5">
          <h3 className="font-display font-bold uppercase text-xl">Before you go live</h3>
          <ul className="mt-3 flex flex-col gap-2 text-mist-300 leading-relaxed list-disc pl-5">
            <li>Do a test: add a goal, a yellow card and start the clock, then check the overlay in OBS.</li>
            <li>Press <Kbd>Ctrl</Kbd> <Kbd>Z</Kbd> or <b>Undo</b> in the dock or panel to undo a mistake. Every change can be undone.</li>
            <li>Start the clock when the referee blows the whistle. Use <b>Adjust</b> to line it up with the TV clock.</li>
            <li>Turn on “Pop-up sounds on stream” only if you set “Control audio via OBS” on the browser source.</li>
          </ul>
        </Panel>
        <Link to="/stream/scoreboard" className="self-start rounded-md bg-flood-500 text-night-950 font-semibold px-5 py-2.5">Open Match Scoreboard</Link>
      </div>
    </Shell>
  )
}
