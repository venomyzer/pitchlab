import { useEffect, useState } from 'react'
import { loadRaw, save } from './storage'

/** Player names, saved in this browser. The default key (blue team) is shared by every board. */
export function useNames(key = 'pitchlab:names') {
  const [names, setNames] = useState<string[]>(() => {
    const n = loadRaw<string[]>(key)
    return Array.isArray(n) && n.length === 11 ? n : Array(11).fill('')
  })
  useEffect(() => { save(key, names) }, [key, names])
  const setName = (i: number, v: string) => setNames(n => n.map((x, k) => (k === i ? v : x)))
  return { names, setName, setNames }
}
