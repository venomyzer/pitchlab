// Safe localStorage helpers: storage can be blocked (private windows, some embeds), so nothing here throws.
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallbackShape(fallback), ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}
function fallbackShape<T>(f: T): T { return (typeof f === 'object' && f && !Array.isArray(f) ? f : ({} as T)) }
export function loadRaw<T>(key: string): T | null {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : null } catch { return null }
}
/** True when this browser lets the app save (checked once per page load). */
export const canSave: boolean = (() => {
  try { localStorage.setItem('pitchlab:probe', '1'); localStorage.removeItem('pitchlab:probe'); return true } catch { return false }
})()
export function save(key: string, value: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}
