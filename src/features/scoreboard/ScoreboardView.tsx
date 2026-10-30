import { AnimatePresence, motion } from 'framer-motion'
import { clockText, PERIODS, type SBEvent, type Side, type State } from './state'

const POS: Record<State['style']['position'], React.CSSProperties> = {
  'top-left': { top: 48, left: 64 }, 'top-center': { top: 48, left: '50%' }, 'top-right': { top: 48, right: 64 },
  'bottom-left': { bottom: 56, left: 64 }, 'bottom-center': { bottom: 56, left: '50%' }, 'bottom-right': { bottom: 56, right: 64 },
}
function placement(p: State['style']['position'], size: number): React.CSSProperties {
  const [v, h] = p.split('-')
  return { ...POS[p], transform: `${h === 'center' ? 'translateX(-50%) ' : ''}scale(${size})`, transformOrigin: `${h === 'center' ? 'center' : h} ${v}` }
}
const EVENT_MS: Record<SBEvent['kind'], number> = { goal: 7000, yellow: 5000, red: 6000, var: 8000, sub: 5000 }
const PERIOD_SHORT: Record<string, string> = { PRE: 'KO', '1H': '1H', HT: 'HT', '2H': '2H', ET1: 'ET', ET2: 'ET', PEN: 'PENS', FT: 'FT' }

/** Text colour that stays readable on any team colour. */
export function onColor(hex: string) {
  const h = hex.replace('#', ''), n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return l > 0.6 ? '#0b0f1c' : '#ffffff'
}

/**
 * The on-stream scoreboard, drawn on a 1920 x 1080 stage. Pure view: give it a state and a clock.
 * `reduce` turns off motion for viewers who asked for less.
 */
export function ScoreboardView({ s, now, reduce }: { s: State; now: number; reduce?: boolean }) {
  const st = s.style, light = st.theme === 'light'
  const c = clockText(s, now)
  const stopped = !s.clock.running && ['1H', '2H', 'ET1', 'ET2'].includes(s.period)
  const showClock = !['HT', 'FT', 'PEN', 'PRE'].includes(s.period) || s.clock.baseMs > 0
  const evOn = st.events && s.event && now - s.event.at < EVENT_MS[s.event.kind]
  const bottom = st.position.startsWith('bottom')
  const dark = light ? '#ffffff' : '#0b0f1c', dark2 = light ? '#eef1f6' : '#141a2c', ink = light ? '#0b0f1c' : '#ffffff', mute = light ? '#5a6480' : '#9aa5c2'

  return (
    <div className="absolute" style={placement(st.position, st.size)}>
      <div className={`flex ${bottom ? 'flex-col-reverse' : 'flex-col'} ${st.position.endsWith('right') ? 'items-end' : st.position.endsWith('center') ? 'items-center' : 'items-start'} gap-2`}>
        {/* main bug */}
        <div className="flex items-stretch h-[64px] font-broadcast font-extrabold tracking-wide shadow-[0_14px_40px_-12px_rgba(0,0,0,.6)]" style={{ transform: 'skewX(-8deg)' }}>
          {showClock && (
            <div className="flex items-center gap-2 px-5 rounded-l-[6px]" style={{ background: dark, color: ink }}>
              <span className="tabular text-[38px] leading-none" style={{ transform: 'skewX(8deg)', opacity: stopped ? 0.75 : 1 }}>{s.period === 'PRE' && !s.clock.baseMs ? '00:00' : c.main}</span>
              {c.over && <span className="tabular text-[22px] leading-none px-2 py-1 rounded-[3px] bg-[#ffb31a] text-[#0b0f1c]" style={{ transform: 'skewX(8deg)' }}>{c.over}</span>}
            </div>
          )}
          <TeamBlock side="home" s={s} first={!showClock} dark2={dark2} ink={ink} />
          <div className="flex items-center px-5 bg-white text-[#0b0f1c]">
            <span className="tabular text-[44px] leading-none flex items-center gap-3" style={{ transform: 'skewX(8deg)' }}>
              <Num n={s.home.score} reduce={reduce} /><span className="text-[30px] opacity-40">–</span><Num n={s.away.score} reduce={reduce} />
            </span>
          </div>
          <TeamBlock side="away" s={s} last={!st.showPeriod} dark2={dark2} ink={ink} />
          {st.showPeriod && (
            <div className="flex items-center px-4 rounded-r-[6px] text-[22px]" style={{ background: dark, color: mute }}>
              <span style={{ transform: 'skewX(8deg)' }}>{PERIOD_SHORT[s.period]}</span>
            </div>
          )}
          <AnimatePresence>
            {s.added > 0 && ['1H', '2H', 'ET1', 'ET2'].includes(s.period) && (
              <motion.div initial={reduce ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                className="ml-2 flex items-center px-3.5 rounded-[6px] bg-[#ffb31a] text-[#0b0f1c] text-[32px]">
                <span className="tabular" style={{ transform: 'skewX(8deg)' }}>+{s.added}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* event banner */}
        <AnimatePresence>
          {evOn && s.event && <EventBanner key={s.event.id} e={s.event} s={s} reduce={reduce} bottom={bottom} dark={dark} ink={ink} mute={mute} />}
        </AnimatePresence>
      </div>
    </div>
  )
}

function TeamBlock({ side, s, first, last, dark2, ink }: { side: Side; s: State; first?: boolean; last?: boolean; dark2: string; ink: string }) {
  const t = s[side]
  return (
    <div className={`flex items-stretch ${side === 'away' ? 'flex-row-reverse' : ''} ${first ? 'rounded-l-[6px] overflow-hidden' : ''} ${last ? 'rounded-r-[6px] overflow-hidden' : ''}`} style={{ background: dark2, color: ink }}>
      <span className="w-[10px]" style={{ background: t.color }} />
      <span className="flex items-center px-5 text-[36px] leading-none min-w-[112px] justify-center" style={{ transform: 'skewX(8deg)' }}>{t.code || '—'}</span>
    </div>
  )
}

function Num({ n, reduce }: { n: number; reduce?: boolean }) {
  return (
    <span className="relative inline-grid overflow-hidden h-[48px] min-w-[0.62em] place-items-center">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span key={n} initial={reduce ? false : { y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}>{n}</motion.span>
      </AnimatePresence>
    </span>
  )
}

function EventBanner({ e, s, reduce, bottom, dark, ink, mute }: { e: SBEvent; s: State; reduce?: boolean; bottom: boolean; dark: string; ink: string; mute: string }) {
  const team = e.team ? s[e.team] : null
  const color = e.kind === 'yellow' ? '#ffd400' : e.kind === 'red' ? '#e5484d' : e.kind === 'var' ? '#5ad1ff' : team?.color ?? '#ffb31a'
  const title = { goal: 'GOAL', yellow: 'YELLOW CARD', red: 'RED CARD', var: 'VAR CHECK', sub: 'SUBSTITUTION' }[e.kind]
  const sub = [team?.name, e.text].filter(Boolean).join(' · ')
  return (
    <motion.div initial={reduce ? { opacity: 0 } : { opacity: 0, y: bottom ? 20 : -20, clipPath: 'inset(0 100% 0 0)' }}
      animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0% 0 0)' }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: bottom ? 12 : -12 }}
      transition={{ duration: reduce ? 0.2 : 0.45, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex items-stretch h-[76px] font-broadcast shadow-[0_14px_40px_-12px_rgba(0,0,0,.6)] ml-[6px]" style={{ transform: 'skewX(-8deg)' }}>
      <div className="w-[76px] grid place-items-center rounded-l-[6px] relative overflow-hidden" style={{ background: color }}>
        <span style={{ transform: 'skewX(8deg)' }}><EventIcon kind={e.kind} fg={onColor(color)} /></span>
        {!reduce && e.kind === 'goal' && <motion.span className="absolute inset-0 bg-white" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.6 }} />}
      </div>
      <div className="flex flex-col justify-center px-6 rounded-r-[6px] min-w-[360px]" style={{ background: dark, color: ink }}>
        <div className="flex items-baseline gap-4" style={{ transform: 'skewX(8deg)' }}>
          <motion.span initial={reduce ? false : { letterSpacing: '0.4em', opacity: 0 }} animate={{ letterSpacing: '0.06em', opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="font-extrabold text-[40px] leading-none">{title}</motion.span>
          <span className="tabular text-[24px] font-bold" style={{ color: mute }}>{e.minute}</span>
        </div>
        {sub && <div className="text-[22px] font-semibold leading-tight mt-1 truncate max-w-[640px]" style={{ transform: 'skewX(8deg)', color: mute }}>{sub}</div>}
      </div>
    </motion.div>
  )
}

function EventIcon({ kind, fg }: { kind: SBEvent['kind']; fg: string }) {
  if (kind === 'yellow' || kind === 'red') return <svg width="30" height="40" viewBox="0 0 30 40"><rect x="5" y="3" width="20" height="30" rx="3" fill={fg} opacity=".9" transform="rotate(8 15 18)" /></svg>
  if (kind === 'var') return <svg width="40" height="32" viewBox="0 0 40 32" fill="none" stroke={fg} strokeWidth="3.5"><rect x="3" y="3" width="34" height="22" rx="3" /><path d="M14 30h12" /></svg>
  if (kind === 'sub') return <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke={fg} strokeWidth="3.5" strokeLinecap="round"><path d="M10 6v22M4 22l6 6 6-6M26 30V8M20 14l6-6 6 6" /></svg>
  return <svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill={fg} /><path d="M20 11l6 4.5-2.3 7h-7.4L14 15.5z" fill={fg === '#ffffff' ? '#0b0f1c' : '#ffffff'} /></svg>
}

export const periodLabel = (p: State['period']) => PERIODS.find(x => x.v === p)?.label ?? p
