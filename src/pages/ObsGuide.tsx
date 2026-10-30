import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shell } from '../components/Shell'
import { Kbd, Panel, Segmented } from '../components/ui'

type M = 'dock' | 'interact' | 'chrome'
const STEPS: Record<M, { title: string; why: string; steps: string[] }> = {
  dock: {
    title: 'Control panel inside OBS',
    why: 'Best for a single screen. Both the overlay and the panel run inside OBS, so they share saved data.',
    steps: [
      'Open Match Scoreboard in PitchLab and press Copy next to the overlay link.',
      'In OBS: Sources → + → Browser. Paste the link. Set width 1920 and height 1080. Click OK.',
      'In OBS: Docks → Custom Browser Docks. Name it “PitchLab”, and paste the address of the Match Scoreboard page (the page you copied the link from). Click Apply.',
      'Drag the new dock where you want it. Change the score in the dock and check that the overlay updates.',
    ],
  },
  interact: {
    title: 'Hotkeys on the overlay',
    why: 'No second window. Good for streamers who only need score and clock.',
    steps: [
      'Add the overlay link as a Browser source (width 1920, height 1080).',
      'Right-click the source in OBS → Interact. A small window opens.',
      'With that window focused, press 1 or 2 for a goal, Shift+1 or Shift+2 to remove one, Space to start or pause the clock.',
      'Set team names and colours once from the Match Scoreboard page inside an OBS dock or in the Interact window.',
    ],
  },
  chrome: {
    title: 'Overlay in a browser window',
    why: 'Use this if browser sources don’t work on your setup. The overlay and panel both run in Chrome.',
    steps: [
      'Press “Copy green-screen link” on the Match Scoreboard page and open it in its own Chrome window.',
      'Keep the Match Scoreboard page open in another Chrome tab or window. They sync instantly.',
      'In OBS: Sources → + → Window Capture → pick the overlay window.',
      'Right-click the source → Filters → + Chroma Key → Key Colour Type: Green.',
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
        <Segmented value={m} onChange={setM} options={[{ value: 'dock', label: 'Panel in OBS' }, { value: 'interact', label: 'Hotkeys only' }, { value: 'chrome', label: 'Browser window' }]} />
        <Panel className="p-5 md:p-6">
          <h3 className="font-display font-bold uppercase text-2xl">{d.title}</h3>
          <p className="text-mist-300 mt-1">{d.why}</p>
          <ol className="mt-5 flex flex-col gap-4">
            {d.steps.map((s, i) => (
              <li key={i} className="flex gap-4">
                <span className="h-8 w-8 shrink-0 rounded-md bg-flood-500 text-night-950 font-display font-extrabold text-lg grid place-items-center">{i + 1}</span>
                <span className="leading-relaxed pt-1">{s}</span>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel className="p-5">
          <h3 className="font-display font-bold uppercase text-xl">Before you go live</h3>
          <ul className="mt-3 flex flex-col gap-2 text-mist-300 leading-relaxed list-disc pl-5">
            <li>Do a test: add a goal, a yellow card and start the clock, then check the overlay in OBS.</li>
            <li>Press <Kbd>Ctrl</Kbd> <Kbd>Z</Kbd> on the panel to undo a mistake. Every change can be undone.</li>
            <li>Start the clock when the referee blows the whistle. Use <b>Adjust</b> to line it up with the TV clock.</li>
            <li>Turn on “Pop-up sounds on stream” only if you set “Control audio via OBS” on the browser source.</li>
          </ul>
        </Panel>
        <Link to="/stream/scoreboard" className="self-start rounded-md bg-flood-500 text-night-950 font-semibold px-5 py-2.5">Open Match Scoreboard</Link>
      </div>
    </Shell>
  )
}
