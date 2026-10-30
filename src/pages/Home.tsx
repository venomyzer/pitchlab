import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Background } from '../components/Background'
import { Shell } from '../components/Shell'
import { MenuList } from '../components/MenuList'
import { OffsidePreview, SandboxPreview, ScoreboardPreview } from '../components/MenuPreviews'
import { APP_TAGLINE } from '../config'
import { DevName } from '../components/Profile'
import { sfx } from '../lib/sound'
import { useReducedMotion } from '../lib/settings'

let seenTitle = false // title screen shows once per visit
export default function Home() {
  const [title, setTitle] = useState(!seenTitle)
  return (
    <AnimatePresence mode="wait">
      {title ? <TitleScreen key="t" onStart={() => { seenTitle = true; setTitle(false) }} /> : <MainMenu key="m" />}
    </AnimatePresence>
  )
}

function TitleScreen({ onStart }: { onStart: () => void }) {
  const reduce = useReducedMotion()
  useEffect(() => {
    sfx.preload()
    const go = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.metaKey || e.ctrlKey) return
      if (e.key === 'Enter' && (e.target as HTMLElement).closest('a')) return // let the credit link open
      e.preventDefault(); sfx.play('whoosh'); onStart()
    }
    window.addEventListener('keydown', go)
    return () => window.removeEventListener('keydown', go)
  }, [onStart])
  return (
    <motion.div className="ball-cursor min-h-full grid place-items-center gutter py-16 cursor-pointer" exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.35 }}
      onClick={() => { sfx.play('whoosh'); onStart() }}>
      <Background />
      <div className="text-center">
        <motion.div initial={reduce ? false : { opacity: 0, y: 24, skewX: -6 }} animate={{ opacity: 1, y: 0, skewX: -6 }} transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="font-display font-extrabold uppercase leading-[0.85] text-[clamp(64px,14vw,180px)] tracking-wide">
          Pitch<span className="text-flood-500">Lab</span>
        </motion.div>
        <motion.p initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-4 text-mist-300 text-lg">{APP_TAGLINE}</motion.p>
        <motion.button type="button" autoFocus onClick={e => { e.stopPropagation(); sfx.play('whoosh'); onStart() }}
          initial={reduce ? false : { opacity: 0 }} animate={reduce ? { opacity: 1 } : { opacity: [0.35, 1, 0.35] }}
          transition={reduce ? undefined : { duration: 2.2, repeat: Infinity, delay: 0.8 }}
          className="mt-14 font-display font-bold text-2xl uppercase tracking-[0.3em] text-mist-100 outline-none focus-visible:outline-none">
          Press any key
        </motion.button>
        <p className="mt-16 text-[12px] tracking-[0.25em] uppercase text-mist-400">By <DevName className="text-mist-300" onClick={e => e.stopPropagation()} /> · free · no sign-up</p>
      </div>
    </motion.div>
  )
}

function MainMenu() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Shell menu>
        <MenuList heading={<h1 className="font-display font-extrabold uppercase text-5xl md:text-6xl -skew-x-6 mb-6">Kick off</h1>} items={[
          { to: '/stream', label: 'Streamer Tools', accent: '#ff6b5a', badge: 'LIVE', preview: <ScoreboardPreview />,
            desc: 'Scoreboard overlay for OBS with goal and card pop-ups. Control it from a panel or with hotkeys.' },
          { to: '/tactics', label: 'Tactic Boards', accent: '#5ad1ff', preview: <SandboxPreview />,
            desc: 'Formations in every phase of play, plus a sandbox to rebuild goals. Press H for a clean view on stream.' },
          { to: '/learn', label: 'Learn Football', accent: '#ffb31a', preview: <OffsidePreview />,
            desc: 'Offside and formations explained with moving players. Use them on stream to explain a decision.' },
          { label: 'Football Quiz', desc: 'Test what you know about the rules. Coming in a later update.' },
          { label: 'Lineup Cards', desc: 'Starting elevens as stream graphics. Coming in a later update.' },
          { label: 'Match Notes', desc: 'Notes you keep during a match. Coming in a later update.' },
        ]} />
      </Shell>
    </motion.div>
  )
}
