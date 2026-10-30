import { useEffect, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { APP_NAME } from '../config'
import { useSettings } from '../lib/settings'
import { sfx } from '../lib/sound'
import { canSave } from '../lib/storage'
import { useSpatialNav } from '../lib/spatialNav'
import { Background } from './Background'
import { IconBack, IconSound } from './Icons'
import { DevName, ProfileButton } from './Profile'
import { Kbd } from './ui'

type Props = {
  title?: string
  eyebrow?: string
  back?: string
  children: ReactNode
  /** Menu screens get section tabs, console-style arrow-key navigation and the bottom status bar. */
  menu?: boolean
  /** Tools fill the screen and skip the page padding. */
  wide?: boolean
  actions?: ReactNode
}

// Top tabs on menu screens. Kickoff owns the main menu and every section menu under it.
const TABS = [
  { to: '/', label: 'Kickoff', match: (p: string) => p === '/' || /^\/(stream|tactics|learn)$/.test(p) },
  { to: '/settings', label: 'Settings', match: (p: string) => p === '/settings' },
  { to: '/donate', label: 'Donate', match: (p: string) => p === '/donate' },
]

export function Shell({ title, eyebrow, back, children, menu, wide, actions }: Props) {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const { settings, set } = useSettings()
  const tab = TABS.findIndex(t => t.match(pathname))
  useSpatialNav(!!menu)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key === 'Escape') {
        if (t.closest('input, textarea, select')) { t.blur(); return }
        if (document.querySelector('[data-modal-open]')) return
        if (back) { sfx.play('back'); nav(back) }
        return
      }
      // Q / E switch tabs, on menu screens only (Formation Lab uses Q–Y for formations).
      if (!menu || e.repeat || e.metaKey || e.ctrlKey || e.altKey || t.closest('input, textarea, select')) return
      const k = e.key.toLowerCase()
      if (k !== 'q' && k !== 'e') return
      const next = tab < 0 ? (k === 'q' ? TABS.length - 1 : 0) : (tab + (k === 'q' ? -1 : 1) + TABS.length) % TABS.length
      sfx.play('whoosh'); nav(TABS[next].to)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [back, nav, menu, tab])

  return (
    <div className={`min-h-full flex flex-col ${menu ? 'ball-cursor' : ''}`}>
      <Background dim={!menu} />
      <header className="gutter pt-4 pb-3 flex flex-wrap items-center gap-x-4 gap-y-3" style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 0px))' }}>
        {back ? (
          <Link to={back} onClick={() => sfx.play('back')} aria-label="Back"
            className="focus-invert h-10 w-10 grid place-items-center rounded-md border border-line text-mist-300 hover:text-mist-100 hover:border-focus shrink-0">
            <IconBack className="h-5 w-5" />
          </Link>
        ) : null}
        <Link to="/" onClick={() => sfx.play('back')} className="flex items-baseline shrink-0">
          <span className="font-display font-extrabold text-2xl tracking-wide uppercase -skew-x-6 leading-none">
            Pitch<span className="text-flood-500">Lab</span>
          </span>
          <span className="sr-only">{APP_NAME} home</span>
        </Link>
        {menu ? (
          <nav aria-label="Main" className="order-last w-full md:order-none md:w-auto flex items-center gap-2 md:pl-4 md:border-l md:border-line/50">
            <Kbd className="hidden md:inline-block">Q</Kbd>
            {TABS.map((t, i) => (
              <Link key={t.to} to={t.to} data-nav="" data-nav-tab="" aria-current={i === tab ? 'page' : undefined} onClick={() => sfx.play('select')}
                className={`focus-invert flex-1 md:flex-none md:min-w-[120px] h-9 px-4 grid place-items-center border font-display font-bold uppercase tracking-[0.14em] text-[16px]
                  ${i === tab ? 'border-focus border-2 text-mist-100 bg-night-950/40' : 'border-line/70 text-mist-300 hover:text-mist-100 hover:border-focus'}`}>
                {t.label}
              </Link>
            ))}
            <Kbd className="hidden md:inline-block">E</Kbd>
          </nav>
        ) : title && (
          <div className="min-w-0 flex items-baseline gap-3 pl-4 border-l border-line/50">
            {eyebrow && <span className="hidden md:inline text-[11px] tracking-[0.2em] uppercase text-mist-400 shrink-0">{eyebrow}</span>}
            <h1 className="font-display font-bold text-xl uppercase tracking-wide truncate">{title}</h1>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          {actions}
          <button type="button" aria-label={settings.sound ? 'Mute sounds' : 'Turn sounds on'} title={settings.sound ? 'Mute' : 'Unmute'}
            onClick={() => { set({ sound: !settings.sound }); if (!settings.sound) sfx.play('toggle', { force: true }) }}
            className="focus-invert h-10 w-10 grid place-items-center rounded-md border border-line text-mist-300 hover:text-mist-100 hover:border-focus">
            <IconSound on={settings.sound} className="h-5 w-5" />
          </button>
          <ProfileButton />
        </div>
      </header>
      <main className={`flex-1 ${wide ? 'gutter pb-4' : 'gutter pb-24'}`}>{children}</main>
      {/* Status bar on menus only: tool screens stay clean for screen sharing. */}
      {menu && (
        <footer className="fixed bottom-0 inset-x-0 z-20 h-11 gutter hidden md:flex items-center gap-5 bg-night-950/90 backdrop-blur-sm border-t border-line/40 text-[13px] text-mist-300"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {canSave
            ? <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-ok" />Saves in this browser</span>
            : <span role="status" className="flex items-center gap-2 px-2 py-0.5 rounded-sm bg-bad/20 text-bad font-semibold">This browser is blocking saving. Allow site data, or your scoreboard resets on reload.</span>}
          <span className="text-mist-400">Made by <DevName className="text-mist-300 font-semibold" /></span>
          {settings.hints && (
            <span className="ml-auto flex items-center gap-5 text-mist-400">
              <span className="flex items-center gap-1.5"><Kbd>W</Kbd><Kbd>S</Kbd> Navigate</span>
              <span className="flex items-center gap-1.5"><Kbd>Enter</Kbd> Select</span>
              <span className="flex items-center gap-1.5"><Kbd>Q</Kbd><Kbd>E</Kbd> Tabs</span>
              {back && <span className="flex items-center gap-1.5"><Kbd>Esc</Kbd> Back</span>}
            </span>
          )}
        </footer>
      )}
    </div>
  )
}
