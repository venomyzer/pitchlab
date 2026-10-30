import { Shell } from '../components/Shell'
import { IconExternal } from '../components/Icons'
import { Panel } from '../components/ui'
import { DevLinks, DevName } from '../components/Profile'
import { APP_NAME, DEV_LINKS, DONATE_URL } from '../config'
import { sfx } from '../lib/sound'

export default function Donate() {
  return (
    <Shell back="/" title="Donate" menu>
      <div className="max-w-2xl mx-auto pt-4 md:pt-12 flex flex-col gap-5">
        <h2 className="font-display font-extrabold uppercase text-5xl md:text-6xl -skew-x-6">Support the developer</h2>
        <Panel className="p-5 md:p-6 flex flex-col gap-4">
          <p className="text-[16px] text-mist-100 leading-relaxed">
            {APP_NAME} is free, with no ads and no accounts. It's made by one person, <DevName className="font-semibold" />.
            If it helps your stream, a donation keeps new tools coming.
          </p>
          <p className="text-[14px] text-mist-300 leading-relaxed">
            Donating opens a payment page on another website in a new tab. Nothing changes in {APP_NAME} whether you donate or not.
          </p>
          {DONATE_URL ? (
            <a href={DONATE_URL} target="_blank" rel="noopener noreferrer" data-nav="" autoFocus onClick={() => sfx.play('select')}
              className="focus-invert self-start inline-flex items-center gap-2 h-14 px-6 rounded-md border border-flood-500 bg-flood-500 text-night-950 hover:bg-flood-400 font-semibold text-lg">
              <IconExternal className="h-5 w-5" />Donate
            </a>
          ) : (
            <p role="status" className="text-[14px] text-mist-400">The donation link isn't set up yet.</p>
          )}
        </Panel>
        {DEV_LINKS.length > 0 && (
          <Panel className="p-5 md:p-6">
            <h3 className="font-display font-bold uppercase text-2xl -skew-x-6 mb-3">Follow the developer</h3>
            <DevLinks />
          </Panel>
        )}
      </div>
    </Shell>
  )
}
