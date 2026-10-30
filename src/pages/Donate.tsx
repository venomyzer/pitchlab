import qrcode from 'qrcode-generator'
import { CopyField } from '../components/CopyField'
import { Shell } from '../components/Shell'
import { IconExternal } from '../components/Icons'
import { Panel } from '../components/ui'
import { DevLinks, DevName } from '../components/Profile'
import { APP_NAME, DEV_LINKS, DONATE_URL, UPI } from '../config'
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
            {DONATE_URL ? 'The Donate button opens a payment page on another website in a new tab. ' : ''}Nothing changes in {APP_NAME} whether you donate or not.
          </p>
          {UPI.id && <UpiPay />}
          {DONATE_URL ? (
            <a href={DONATE_URL} target="_blank" rel="noopener noreferrer" data-nav="" autoFocus onClick={() => sfx.play('select')}
              className="focus-invert self-start inline-flex items-center gap-2 h-14 px-6 rounded-md border border-flood-500 bg-flood-500 text-night-950 hover:bg-flood-400 font-semibold text-lg">
              <IconExternal className="h-5 w-5" />Donate
            </a>
          ) : !UPI.id && (
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

/** UPI QR code, made in the browser from the UPI ID in config.ts. Scan with any UPI app (GPay, PhonePe, Paytm, BHIM). */
function UpiPay() {
  const link = `upi://pay?pa=${UPI.id}&pn=${encodeURIComponent(UPI.name)}&cu=INR&tn=${encodeURIComponent(`${APP_NAME} support`)}`
  const qr = qrcode(0, 'M'); qr.addData(link); qr.make()
  const n = qr.getModuleCount()
  let d = ''
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`
  return (
    <div className="flex flex-col sm:flex-row gap-5 sm:items-center rounded-lg border border-line bg-night-950/60 p-4">
      <svg viewBox={`-3 -3 ${n + 6} ${n + 6}`} role="img" aria-label={`UPI QR code for ${UPI.id}`} shapeRendering="crispEdges"
        className="w-52 h-52 shrink-0 self-center rounded-md bg-white">
        <path d={d} fill="#000" />
      </svg>
      <div className="flex flex-col gap-3 min-w-0 flex-1">
        <div>
          <div className="font-display font-bold uppercase text-2xl -skew-x-6">Pay with UPI</div>
          <p className="mt-1 text-[14px] text-mist-300 leading-relaxed">Scan the code with any UPI app, choose an amount and pay.<span className="sm:hidden"> On this phone, copy the UPI ID or tap Open UPI app.</span></p>
        </div>
        <CopyField value={UPI.id} label="UPI ID" size="sm" />
        <a href={link} onClick={() => sfx.play('select')}
          className="focus-invert sm:hidden self-start inline-flex items-center h-11 px-5 rounded-md border border-flood-500 text-flood-400 font-semibold">Open UPI app</a>
      </div>
    </div>
  )
}
