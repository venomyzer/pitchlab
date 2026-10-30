import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { APP_NAME, DEV_HOME, DEV_LINKS, DEVELOPER, type DevLink } from '../config'
import { useReducedMotion } from '../lib/settings'
import { sfx } from '../lib/sound'
import { IconExternal } from './Icons'

const BG = `${import.meta.env.BASE_URL}bg/menu-1920.jpg`
const M = DEVELOPER.media
const fileUrl = (f: string) => `${import.meta.env.BASE_URL}profile/${f}`
const isVideo = (f: string) => /\.(mp4|webm|mov|m4v)$/i.test(f)
// Formats with no transparency: blend them with "screen" so a black background disappears (fire on black, etc.).
const noAlpha = (f: string) => /\.(mp4|m4v|jpe?g)$/i.test(f)

/**
 * One file from public/profile/. Videos play muted on loop (paused on the first frame when `still`;
 * with `holdMs` they rest on the last frame that long before repeating). Images and GIFs show as they are.
 * Shows `fallback` when no file is set or it fails to load.
 */
function Media({ file, className = '', fallback = null, after = null, still = false, holdMs = 0 }:
  { file: string; className?: string; fallback?: ReactNode; after?: ReactNode; still?: boolean; holdMs?: number }) {
  const [failed, setFailed] = useState(false)
  if (!file || failed) return <>{fallback}</>
  const el = isVideo(file)
    ? <video src={fileUrl(file)} className={className} autoPlay={!still} loop={!holdMs} muted playsInline preload="auto" disablePictureInPicture aria-hidden
        ref={v => { if (v) v.muted = true }} onError={() => setFailed(true)}
        onEnded={e => { const v = e.currentTarget; window.setTimeout(() => { if (v.isConnected) { v.currentTime = 0; v.play().catch(() => {}) } }, holdMs) }} />
    : <img src={fileUrl(file)} alt="" draggable={false} className={className} onError={() => setFailed(true)} />
  return <>{el}{after}</>
}

/** The developer's name, linked to their portfolio/YouTube when one is set. */
export function DevName({ className = '', onClick }: { className?: string; onClick?: (e: MouseEvent) => void }) {
  if (!DEV_HOME) return <span className={className}>{DEVELOPER.name}</span>
  return (
    <a href={DEV_HOME} target="_blank" rel="noopener noreferrer" className={`underline-offset-4 hover:underline hover:text-mist-100 ${className}`}
      onClick={e => { sfx.play('select'); onClick?.(e) }}>{DEVELOPER.name}</a>
  )
}

/** Developer's social links as buttons. Renders nothing until a link is set in config.ts. */
export function DevLinks({ className = '' }: { className?: string }) {
  if (!DEV_LINKS.length) return null
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {DEV_LINKS.map(l => (
        <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" onClick={() => sfx.play('select')}
          className="focus-invert inline-flex items-center gap-2 h-10 px-3 rounded-md border border-line bg-white/5 hover:bg-white/15 text-[14px] font-semibold">
          <LinkIcon kind={l.kind} className="h-4.5 w-4.5" />{l.label}
        </a>
      ))}
    </div>
  )
}

/** Profile picture (media.avatar), or a drawn initial if there isn't one. */
function Avatar({ className = '', still, small = false }: { className?: string; still: boolean; small?: boolean }) {
  const initial = (
    <span className={`grid place-items-center rounded-full bg-[linear-gradient(135deg,#ffb31a,#1f7a4c_70%)] text-night-950 font-display font-extrabold ${className}`}>
      <span className="-skew-x-6 leading-none" style={{ fontSize: '0.5em' }}>{DEVELOPER.name.slice(0, 1)}</span>
    </span>
  )
  return <Media file={(small && M.avatarStill) || M.avatar} still={still} fallback={initial} className={`block rounded-full object-cover ${className}`} />
}

/**
 * Header avatar that opens the developer's profile card. Hover shows it, click pins it open (taps on phones),
 * Esc or a click outside closes it. While open, Esc closes the card instead of leaving the page.
 */
export function ProfileButton() {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const timer = useRef(0)
  const close = () => { setOpen(false); setPinned(false) }
  const show = () => { window.clearTimeout(timer.current); if (!open) sfx.play('hover'); setOpen(true) }
  const hide = () => { if (!pinned) timer.current = window.setTimeout(() => setOpen(false), 180) }

  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) close() }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); close(); btn.current?.focus() } }
    document.addEventListener('pointerdown', down)
    window.addEventListener('keydown', key, true) // capture: runs before the page's Esc-to-go-back
    return () => { document.removeEventListener('pointerdown', down); window.removeEventListener('keydown', key, true) }
  }, [open])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <div ref={wrap} className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button ref={btn} type="button" aria-label={`About ${DEVELOPER.name}`} aria-expanded={open} aria-controls="dev-card"
        onClick={() => { if (pinned) { close(); sfx.play('back') } else { setPinned(true); setOpen(true); sfx.play('select') } }}
        className={`relative h-10 w-10 rounded-full p-[2px] focus-visible:outline-focus transition-colors ${open ? 'bg-flood-500' : 'bg-white/25 hover:bg-white/60'}`}>
        <Avatar small still={reduce} className="h-full w-full text-[34px]" />
        <span aria-hidden className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full bg-ok border-[3px] border-night-900" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div id="dev-card" role="dialog" aria-label={`About ${DEVELOPER.name}`} data-modal-open=""
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: reduce ? 0.1 : 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute right-0 top-full mt-3 z-50 origin-top-right w-[min(340px,calc(100vw-32px))]">
            <ProfileCard reduce={reduce} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Floodlight dust drifting up through the banner: [left %, size px, delay s, duration s].
const DUST = [[8, 3, 0, 5], [19, 2, 1.6, 6], [31, 4, 0.8, 4.5], [46, 2, 2.4, 5.5], [58, 3, 0.3, 6.5], [70, 2, 1.2, 5], [83, 4, 2, 4.8], [93, 2, 0.6, 6]]

function ProfileCard({ reduce }: { reduce: boolean }) {
  const a = (cls: string) => (reduce ? '' : cls) // all loops are off when reduced motion is on
  return (
    // Gradient frame, like a themed profile.
    <div className={`relative rounded-[18px] p-[1.5px] bg-[linear-gradient(140deg,#5c5c5c,#e6e6e6_35%,#1f1f1f_70%,#5c5c5c)] bg-[length:220%_220%] shadow-[0_30px_70px_-20px_rgba(0,0,0,.95)] ${a('animate-[pl-shift_8s_ease-in-out_infinite_alternate]')}`}>
      {/* Glow that spills outside the card while the built-in fire flares */}
      {!reduce && !M.effect && <span aria-hidden className="absolute inset-x-2 -bottom-6 h-24 -z-10 rounded-full bg-[radial-gradient(ellipse_at_50%_40%,rgba(255,110,20,.8),transparent_70%)] blur-2xl opacity-0 animate-[pl-flare_11s_ease-in-out_-5.5s_infinite]" />}
      <div className="relative rounded-[16.5px] overflow-hidden bg-[linear-gradient(180deg,#1c1c1c,#0a0a0a_60%)]">
        <CardEffect reduce={reduce} />
        {/* Banner */}
        <div className="relative z-[1] h-[116px] overflow-hidden">
          <Media file={M.banner} still={reduce} className="absolute inset-0 h-full w-full object-cover" fallback={<DrawnBanner reduce={reduce} />}
            after={<span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(10,10,10,.6))]" />} />
          <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-mist-100">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />{APP_NAME} creator
          </span>
        </div>

        {/* Avatar overlapping the banner, with a decoration (or the built-in turning ring) and an online dot */}
        <div className="absolute z-[2] left-4 top-[66px] h-[96px] w-[96px]">
          <span className="absolute inset-[3px] rounded-full bg-[#121212] p-[3px]">
            <Avatar still={reduce} className="h-full w-full text-[80px]" />
          </span>
          <Media file={M.decoration} still={reduce}
            className={`absolute -inset-[10px] h-[116px] w-[116px] max-w-none object-contain pointer-events-none ${noAlpha(M.decoration) ? 'mix-blend-screen' : ''}`}
            fallback={<span aria-hidden className={`absolute inset-0 -z-10 rounded-full bg-[conic-gradient(from_0deg,#3a3a3a,#f2f2f2,#6b6b6b,#3a3a3a)] ${a('animate-[pl-spin_6s_linear_infinite]')}`} />} />
          <span aria-hidden className="absolute z-[1] right-[4px] bottom-[4px] h-5 w-5 rounded-full bg-ok border-4 border-[#121212]" />
        </div>

        <div className="relative z-[1] px-4 pb-4 pt-[44px]">
          {/* Name + nameplate */}
          <div className="relative -mx-2 px-2 py-2 rounded-lg overflow-hidden">
            <Media file={M.nameplate} still={reduce} className={`absolute inset-0 h-full w-full object-cover ${noAlpha(M.nameplate) ? 'mix-blend-screen' : ''}`}
              after={<span aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,.55),rgba(10,10,10,0)_75%)]" />} />
            <div className="relative font-display font-extrabold uppercase -skew-x-6 text-[30px] leading-none tracking-wide">{DEVELOPER.name}</div>
            <div className="relative mt-1.5 flex items-center gap-2 text-[14px] text-mist-300">
              <span>{DEVELOPER.handle}</span>
              <span className="rounded-md bg-red-500/15 text-red-400 border border-red-500/40 px-1.5 py-px text-[12px] font-semibold">{DEVELOPER.role}</span>
            </div>
          </div>

          <div className="mt-2 rounded-xl bg-black/60 border border-white/5 p-3">
            {DEVELOPER.about && <>
              <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-mist-300">About me</div>
              <p className="mt-1 text-[14px] leading-snug text-mist-100">{DEVELOPER.about}</p>
              <div className="my-3 h-px bg-white/10" />
            </>}
            <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-mist-300">Find me on</div>
            {DEV_LINKS.length ? (
              <ul className="mt-2 flex flex-col gap-1.5">
                {DEV_LINKS.map(l => (
                  <li key={l.label}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" onClick={() => sfx.play('select')}
                      className="focus-invert group flex items-center gap-3 h-12 px-3 rounded-lg bg-white/[0.04] border border-white/5 hover:bg-white/10 transition-colors">
                      <LinkIcon kind={l.kind} className="h-5 w-5 shrink-0 text-mist-100" />
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block text-[14px] font-semibold">{l.label}</span>
                        {l.handle && <span className="block truncate text-[12px] text-mist-400">{l.handle}</span>}
                      </span>
                      <IconExternal className="h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-1 text-[13px] text-mist-400">Links not added yet.</p>}
          </div>
        </div>
        <CardEffect front reduce={reduce} />
      </div>
    </div>
  )
}

/** The built-in banner: the stadium photo panning, a light sweep, rising dust and centre-circle lines. */
function DrawnBanner({ reduce }: { reduce: boolean }) {
  const a = (cls: string) => (reduce ? '' : cls)
  return (
    <>
        <div className={`absolute inset-0 bg-[length:170%] bg-[position:50%_45%] ${a('animate-[pl-pan_20s_ease-in-out_infinite_alternate]')}`} style={{ backgroundImage: `url(${BG})` }} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,24,18,.05),rgba(7,24,18,.55)),radial-gradient(120%_90%_at_85%_0%,rgba(255,179,26,.35),transparent_60%)]" />
        <svg aria-hidden viewBox="0 0 340 116" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full text-white/25">
          <g fill="none" stroke="currentColor" strokeWidth="1.2">
            <line x1="170" y1="0" x2="170" y2="116" />
            <circle cx="170" cy="70" r="34" className={a('origin-[170px_70px] animate-[pl-spin_40s_linear_infinite]')} strokeDasharray="5 6" />
            <circle cx="170" cy="70" r="2.5" fill="currentColor" />
          </g>
        </svg>
        {!reduce && <span aria-hidden className="absolute -inset-y-4 w-16 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)] animate-[pl-sweep_5s_ease-in-out_infinite]" />}
        {!reduce && DUST.map(([l, s, d, t], i) => (
          <span key={i} aria-hidden className="absolute bottom-0 rounded-full bg-flood-400 animate-[pl-dust_linear_infinite]"
            style={{ left: `${l}%`, width: s, height: s, animationDelay: `${d}s`, animationDuration: `${t}s` }} />
        ))}
    </>
  )
}

const EFFECT_HOLD_MS = 5000

/**
 * The card effect. An effect file always plays over the whole card at full strength (it never takes clicks) and rests
 * on its last frame for 5 s before repeating: videos do that here, an animated PNG/GIF carries the pause in the file.
 * With no file, the built-in fire burns faintly behind the content and flares over it every 11 s.
 */
function CardEffect({ front = false, reduce }: { front?: boolean; reduce: boolean }) {
  if (front && reduce && !(M.effect && isVideo(M.effect))) return null // animated images and the fire flare can't be held still
  if (M.effect && !front) return null
  return (
    <Media file={M.effect} still={reduce} holdMs={EFFECT_HOLD_MS} fallback={<Fire front={front} reduce={reduce} />}
      className={`absolute inset-0 z-[3] h-full w-full object-cover object-top pointer-events-none ${noAlpha(M.effect) ? 'mix-blend-screen' : ''}`} />
  )
}

// Flame tongues along the bottom edge: [left %, width px, height px, delay s, duration s].
const FLAMES = [[-4, 70, 70, 0, 1.3], [8, 56, 95, 0.4, 1.1], [20, 66, 80, 0.15, 1.5], [33, 54, 105, 0.6, 1.2], [45, 70, 88, 0.25, 1.4],
  [57, 56, 100, 0.5, 1.15], [69, 66, 82, 0.1, 1.35], [81, 54, 98, 0.35, 1.25], [92, 70, 75, 0.55, 1.45]]
const EMBERS = [[12, 0, 2.6], [27, 0.9, 3.1], [41, 1.7, 2.4], [55, 0.4, 2.9], [68, 1.3, 2.7], [83, 2.1, 3.2]]

/** Built-in fire along the bottom of the card, used when no effect file is set. */
function Fire({ front = false, reduce }: { front?: boolean; reduce: boolean }) {
  const tall = front ? 1.6 : 1
  return (
    <div aria-hidden className={`absolute inset-x-0 bottom-0 h-48 pointer-events-none mix-blend-screen ${front
      ? 'z-[3] opacity-0 animate-[pl-flare_11s_ease-in-out_-5.5s_infinite] [filter:drop-shadow(0_0_10px_#ff7a1a)_brightness(1.25)]'
      : 'z-0 opacity-40'}`}>
      {FLAMES.map(([l, w, h, d, t], i) => (
        <span key={i} className="absolute bottom-[-18px] origin-bottom rounded-[50%_50%_45%_45%/70%_70%_30%_30%] blur-[5px]"
          style={{ left: `${l}%`, width: w, height: h * tall,
            background: 'radial-gradient(ellipse at 50% 85%, #fff3c4 0%, #ffb31a 22%, #ff5a1f 50%, rgba(255,40,0,0) 75%)',
            animation: reduce ? undefined : `pl-flame ${t}s ease-in-out ${d}s infinite alternate` }} />
      ))}
      {!reduce && EMBERS.map(([l, d, t], i) => (
        <span key={i} className="absolute bottom-6 h-[3px] w-[3px] rounded-full bg-[#ffd27a] shadow-[0_0_6px_#ff8a1a]"
          style={{ left: `${l}%`, animation: `pl-ember ${t}s ease-out ${d}s infinite` }} />
      ))}
    </div>
  )
}

// Plain drawn glyphs (no brand logos): play button, camera, X mark, globe.
const ib = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24' }
function LinkIcon({ kind, className }: { kind: DevLink['kind']; className?: string }) {
  if (kind === 'youtube') return <svg {...ib} className={className}><rect x="2.5" y="5" width="19" height="14" rx="4" /><path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor" /></svg>
  if (kind === 'instagram') return <svg {...ib} className={className}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r=".6" fill="currentColor" /></svg>
  if (kind === 'x') return <svg {...ib} className={className}><path d="M5 4l14 16M19 4L5 20" /></svg>
  return <svg {...ib} className={className}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></svg>
}
