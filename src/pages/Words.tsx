import { useEffect, useMemo, useRef, useState } from 'react'
import { Shell } from '../components/Shell'
import { Kbd, Panel } from '../components/ui'
import { CATS, WORDS, type Cat } from '../data/words'
import { sfx } from '../lib/sound'

export default function Words() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<Cat | 'All'>('All')
  const search = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target as HTMLElement).closest('input, textarea, select')) { e.preventDefault(); search.current?.focus() }
    }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [])
  const list = useMemo(() => {
    const n = q.trim().toLowerCase()
    return WORDS.filter(w => (cat === 'All' || w.cat === cat) && (!n || [w.term, w.def, w.also ?? ''].some(s => s.toLowerCase().includes(n))))
      .sort((a, b) => a.term.localeCompare(b.term))
  }, [q, cat])

  return (
    <Shell back="/learn" eyebrow="Learn football" title="Football Words">
      <div className="max-w-[1200px] mx-auto pt-4 md:pt-8 flex flex-col gap-5">
        <div>
          <h2 className="font-display font-extrabold uppercase text-4xl md:text-5xl -skew-x-6">What commentators mean</h2>
          <p className="text-mist-300 mt-2 leading-relaxed max-w-[62ch]">{WORDS.length} words you hear on match day, in plain English. Search, or pick a group.</p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative flex-1 md:max-w-sm">
            <span className="sr-only">Search words</span>
            <input ref={search} type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search, for example “offside”"
              className="w-full h-11 rounded-md bg-night-900/90 border border-night-600 focus:border-flood-500 outline-none pl-3 pr-10 text-[15px]" />
            <Kbd className="absolute right-3 top-1/2 -translate-y-1/2">/</Kbd>
          </label>
          <div role="group" aria-label="Word groups" className="flex flex-wrap gap-1.5">
            {(['All', ...CATS] as const).map(c => (
              <button key={c} type="button" aria-pressed={cat === c} onClick={() => { sfx.play('toggle'); setCat(c) }}
                className={`focus-invert h-9 px-3 rounded-md border text-[14px] font-semibold ${cat === c ? 'bg-flood-500 border-flood-500 text-night-950' : 'border-line/70 bg-night-950/40 text-mist-300 hover:text-mist-100 hover:border-focus'}`}>{c}</button>
            ))}
          </div>
        </div>
        <p className="text-[13px] text-mist-400" role="status">{list.length === WORDS.length ? `All ${list.length} words` : `${list.length} of ${WORDS.length} words`}</p>
        {list.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map(w => (
              <li key={w.term}>
                <Panel className="p-4 h-full flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display font-extrabold uppercase -skew-x-6 text-[24px] leading-none">{w.term}</h3>
                    <span className="text-[11px] tracking-[0.14em] uppercase text-mist-400 shrink-0">{w.cat}</span>
                  </div>
                  {w.also && <div className="text-[12px] text-flood-400">Also: {w.also}</div>}
                  <p className="text-[15px] text-mist-300 leading-relaxed">{w.def}</p>
                </Panel>
              </li>
            ))}
          </ul>
        ) : (
          <Panel className="p-6 text-center text-mist-300">No word matches “{q}”. Try a shorter search, or pick All.</Panel>
        )}
      </div>
    </Shell>
  )
}
