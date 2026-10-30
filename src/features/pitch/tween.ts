export type P = { x: number; y: number }
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
/** Animate any set of point arrays from -> to. Returns a cancel function. */
export function tween(from: P[][], to: P[][], ms: number, onFrame: (v: P[][]) => void, done?: () => void, easing = ease) {
  let raf = 0, t0 = 0
  const step = (ts: number) => {
    if (!t0) t0 = ts
    const t = ms <= 1 ? 1 : Math.min(1, (ts - t0) / ms), e = easing(t)
    onFrame(from.map((arr, a) => arr.map((p, i) => { const q = to[a][i] ?? p; return { x: p.x + (q.x - p.x) * e, y: p.y + (q.y - p.y) * e } })))
    if (t < 1) raf = requestAnimationFrame(step); else done?.()
  }
  raf = requestAnimationFrame(step)
  return () => cancelAnimationFrame(raf)
}
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
