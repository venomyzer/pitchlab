import { useEffect, useState } from 'react'
import { loadRaw, save } from './storage'

const KEY = 'pitchlab:names'
/** Player names for the blue team, saved in this browser and shared by every board. */
export function useNames() {
  const [names, setNames] = useState<string[]>(() => {
    const n = loadRaw<string[]>(KEY)
    return Array.isArray(n) && n.length === 11 ? n : Array(11).fill('')
  })
  useEffect(() => { save(KEY, names) }, [names])
  const setName = (i: number, v: string) => setNames(n => n.map((x, k) => (k === i ? v : x)))
  return { names, setName, setNames }
}
