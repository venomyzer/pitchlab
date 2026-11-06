import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { Shell } from '../components/Shell'
import { Btn, Kbd, Label, Panel } from '../components/ui'
import { countFor, makeRound, TOPICS, type Q, type Topic } from '../data/quiz'
import { useReducedMotion } from '../lib/settings'
import { sfx } from '../lib/sound'
import { load, save } from '../lib/storage'

const BEST_KEY = 'pitchlab:quiz-best'
const ROUND = 10
type Pick = Topic | 'All'

export default function Quiz() {
  const reduce = useReducedMotion()
  const [topic, setTopic] = useState<Pick>('All')
  const [qs, setQs] = useState<Q[]>([])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<(number | null)[]>([])
  const [best, setBest] = useState<Record<string, number>>(() => load(BEST_KEY, {} as Record<string, number>))
  const playing = qs.length > 0 && i < qs.length
  const done = qs.length > 0 && i >= qs.length
  const q = qs[i], ans = picked[i] ?? null
  const right = picked.filter((p, k) => p === qs[k]?.a).length
  const answered = playing && ans != null

  const start = useCallback((t: Pick = topic) => {
    sfx.play('whistle'); setQs(makeRound(t, ROUND)); setI(0); setPicked([])
  }, [topic])
  const choose = useCallback((k: number) => {
    if (!q || ans != null) return
    setPicked(p => { const n = [...p]; n[i] = k; return n })
    sfx.play(k === q.a ? 'goal' : 'back')
  }, [q, ans, i])
  const next = useCallback(() => {
    if (ans == null) return
    sfx.play('select')
    if (i + 1 >= qs.length) {
      const score = picked.filter((p, k) => p === qs[k].a).length
      setBest(b => { const nb = { ...b, [topic]: Math.max(b[topic] ?? 0, score) }; save(BEST_KEY, nb); return nb })
    }
    setI(n => n + 1)
  }, [ans, i, qs, picked, topic])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return
      // Space never fires a focused button (stream safety); Enter on an answered question's option moves on
      if (e.code === 'Space' && t.closest('button, a, [role="switch"]')) return
      if (e.key === 'Enter' && t.closest('button, a') && !(answered && t.closest('[data-answer]'))) return
      if (playing && /^[1-4]$/.test(e.key)) { e.preventDefault(); choose(+e.key - 1) }
      else if (playing && (e.key === 'Enter' || e.code === 'Space')) { e.preventDefault(); next() }
      else if (!playing && (e.key === 'Enter' || e.code === 'Space')) { e.preventDefault(); start() }
    }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [playing, answered, choose, next, start])

  return (
    <Shell back="/learn" eyebrow="Learn football" title="Quiz Mode">
      <div className="max-w-3xl mx-auto pt-4 md:pt-8 flex flex-col gap-5">
        {!playing && !done && (
          <>
            <div>
              <h2 className="font-display font-extrabold uppercase text-4xl md:text-5xl -skew-x-6">Test yourself</h2>
              <p className="text-mist-300 mt-2 leading-relaxed">{ROUND} questions, four answers each. Questions come from the lessons in this app, so every answer is explained.</p>
            </div>
            <Panel className="p-4 flex flex-col gap-3">
              <Label>Pick a topic</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['All', ...TOPICS] as Pick[]).map(t => (
                  <button key={t} type="button" aria-pressed={topic === t} onClick={() => { sfx.play('toggle'); setTopic(t) }}
                    className={`focus-invert rounded-md border px-3 py-2.5 text-left ${topic === t ? 'bg-flood-500 border-flood-500 text-night-950' : 'border-night-600 hover:border-flood-500'}`}>
                    <span className="block font-display font-bold uppercase tracking-wide text-[19px] leading-tight">{t === 'All' ? 'Everything' : t}</span>
                    <span className={`block text-[12px] ${topic === t ? 'text-night-950/70' : 'text-mist-400'}`}>{countFor(t)} questions{best[t] != null ? ` · best ${best[t]}/${ROUND}` : ''}</span>
                  </button>
                ))}
              </div>
              <Btn variant="primary" size="lg" hint="Enter" sound={null} onClick={() => start()}>Start round</Btn>
            </Panel>
          </>
        )}

        {playing && q && (
          <>
            <div className="flex items-center gap-3">
              <span className="font-display font-bold uppercase tracking-[0.14em] text-[15px] text-mist-300">Question {i + 1} of {qs.length}</span>
              <span className="text-[12px] tracking-[0.14em] uppercase px-1.5 py-0.5 rounded-sm bg-night-950/60 border border-line/60 text-mist-300">{q.topic}</span>
              <span className="ml-auto font-mono text-[14px] text-mist-300">{right} right</span>
            </div>
            <div className="h-1.5 rounded-full bg-night-950/70 overflow-hidden"><div className="h-full bg-flood-500 transition-[width]" style={{ width: `${(i / qs.length) * 100}%` }} /></div>
            <AnimatePresence mode="wait">
              <motion.div key={i} initial={reduce ? false : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
                <Panel className="p-5 md:p-6 flex flex-col gap-4">
                  <h2 className="font-display font-extrabold uppercase -skew-x-6 text-[28px] md:text-[34px] leading-[1.05]">{q.q}</h2>
                  <ol className="grid gap-2">
                    {q.o.map((o, k) => {
                      const isA = k === q.a, isP = k === ans
                      const cls = ans == null ? 'border-night-600 hover:border-flood-500'
                        : isA ? 'border-ok bg-ok/15' : isP ? 'border-bad bg-bad/15' : 'border-night-700 opacity-60'
                      return (
                        <li key={k}>
                          <button type="button" data-answer="" onClick={() => choose(k)} aria-disabled={ans != null || undefined} autoFocus={k === 0}
                            className={`focus-invert w-full flex items-start gap-3 text-left rounded-md border px-3 py-3 text-[15px] leading-snug ${cls}`}>
                            <Kbd className="mt-0.5 shrink-0">{k + 1}</Kbd>
                            <span className="flex-1">{o}</span>
                            {ans != null && isA && <span className="text-ok font-bold shrink-0">✓</span>}
                            {ans != null && isP && !isA && <span className="text-bad font-bold shrink-0">✗</span>}
                          </button>
                        </li>
                      )
                    })}
                  </ol>
                  <div className="min-h-[56px] flex items-center gap-4 flex-wrap">
                    {ans != null ? (
                      <>
                        <div className="flex-1 min-w-[200px]">
                          <div className={`font-display font-extrabold uppercase -skew-x-6 text-[24px] leading-none ${ans === q.a ? 'text-ok' : 'text-bad'}`}>{ans === q.a ? 'Correct' : 'Not quite'}</div>
                          {q.why && <p className="text-[14px] text-mist-300 mt-1 leading-snug">{q.why}</p>}
                        </div>
                        <Btn variant="primary" hint="Enter" sound={null} onClick={next}>{i + 1 >= qs.length ? 'See score' : 'Next question'}</Btn>
                      </>
                    ) : <p className="text-[14px] text-mist-400">Click an answer or press <Kbd>1</Kbd>–<Kbd>4</Kbd>.</p>}
                  </div>
                </Panel>
              </motion.div>
            </AnimatePresence>
          </>
        )}

        {done && (
          <Panel className="p-6 flex flex-col gap-4">
            <Label>{topic === 'All' ? 'Everything' : topic} · round over</Label>
            <div className="font-display font-extrabold uppercase -skew-x-6 text-[64px] leading-none">{right}<span className="text-mist-400 text-[36px]"> / {qs.length}</span></div>
            <p className="text-mist-300">{right === qs.length ? 'Perfect round.' : right >= qs.length * 0.7 ? 'Good round. Check the ones you missed below.' : 'Have another look at the lessons, then try again.'} Best for this topic: {best[topic] ?? right}/{ROUND}.</p>
            {right < qs.length && (
              <ul className="flex flex-col gap-2 border-t border-night-700 pt-3">
                {qs.map((x, k) => picked[k] === x.a ? null : (
                  <li key={k} className="text-[14px] leading-snug">
                    <div className="font-semibold">{x.q}</div>
                    <div className="text-ok">{x.o[x.a]}</div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2 flex-wrap">
              <Btn variant="primary" hint="Enter" sound={null} onClick={() => start()}>Play again</Btn>
              <Btn variant="ghost" sound="back" onClick={() => { setQs([]); setI(0) }}>Change topic</Btn>
            </div>
          </Panel>
        )}
      </div>
    </Shell>
  )
}
