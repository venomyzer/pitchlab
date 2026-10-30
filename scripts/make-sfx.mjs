// Generates PitchLab's original UI sounds as small mono WAV files in public/sfx.
// Run: node scripts/make-sfx.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
const SR = 22050
const out = new URL('../src/assets/sfx/', import.meta.url)
mkdirSync(out, { recursive: true })

function wav(samples) {
  const n = samples.length, buf = Buffer.alloc(44 + n * 2)
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8)
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34)
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32000), 44 + i * 2)
  return buf
}
const len = s => Math.round(s * SR)
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d))
function tone(dur, f0, f1, { a = 0.003, d = 0.05, vol = 0.5, shape = 'sine', vib = 0 } = {}) {
  const s = new Float32Array(len(dur)); let ph = 0
  for (let i = 0; i < s.length; i++) {
    const t = i / SR, f = f0 + (f1 - f0) * (t / dur) + (vib ? Math.sin(t * 2 * Math.PI * 28) * vib : 0)
    ph += (2 * Math.PI * f) / SR
    let v = Math.sin(ph)
    if (shape === 'tri') v = (2 / Math.PI) * Math.asin(Math.sin(ph))
    if (shape === 'soft') v = Math.sin(ph) + 0.25 * Math.sin(2 * ph) + 0.1 * Math.sin(3 * ph)
    s[i] = v * env(t, a, d) * vol
  }
  return s
}
const noise = (dur, { d = 0.1, vol = 0.3, lp = 0.2, sweep = 0 } = {}) => {
  const s = new Float32Array(len(dur)); let y = 0
  for (let i = 0; i < s.length; i++) { const t = i / SR, k = Math.min(0.95, lp + sweep * (t / dur)); y = y + k * ((Math.random() * 2 - 1) - y); s[i] = y * vol * env(t, 0.02, d) }
  return s
}
const mix = (...parts) => { const n = Math.max(...parts.map(([p, o = 0]) => p.length + len(o))), s = new Float32Array(n)
  for (const [p, o = 0] of parts) { const off = len(o); for (let i = 0; i < p.length; i++) s[i + off] += p[i] } return s }

const sounds = {
  hover: tone(0.05, 1500, 1700, { d: 0.012, vol: 0.18, shape: 'tri' }),
  select: mix([tone(0.09, 660, 680, { d: 0.04, vol: 0.32, shape: 'soft' })], [tone(0.14, 990, 1010, { d: 0.06, vol: 0.32, shape: 'soft' }), 0.055]),
  back: mix([tone(0.09, 880, 860, { d: 0.04, vol: 0.28, shape: 'soft' })], [tone(0.13, 587, 570, { d: 0.06, vol: 0.28, shape: 'soft' }), 0.05]),
  toggle: tone(0.07, 1200, 900, { d: 0.02, vol: 0.25, shape: 'tri' }),
  whoosh: noise(0.35, { d: 0.12, vol: 0.35, lp: 0.03, sweep: 0.5 }),
  whistle: mix([tone(0.22, 2950, 2950, { a: 0.01, d: 0.3, vol: 0.32, vib: 70 })], [tone(0.6, 2950, 2930, { a: 0.01, d: 0.5, vol: 0.34, vib: 80 }), 0.3]),
  card: mix([tone(0.18, 140, 60, { d: 0.06, vol: 0.6 })], [noise(0.08, { d: 0.02, vol: 0.25, lp: 0.6 })]),
  goal: mix(
    [noise(1.6, { d: 0.6, vol: 0.18, lp: 0.05, sweep: 0.3 })],
    [tone(0.5, 523, 523, { d: 0.35, vol: 0.22, shape: 'soft' }), 0.0],
    [tone(0.5, 659, 659, { d: 0.35, vol: 0.22, shape: 'soft' }), 0.12],
    [tone(0.9, 784, 784, { d: 0.6, vol: 0.24, shape: 'soft' }), 0.24],
    [tone(1.1, 1047, 1047, { d: 0.8, vol: 0.22, shape: 'soft' }), 0.36]),
}
for (const [name, s] of Object.entries(sounds)) writeFileSync(new URL(name + '.wav', out), wav(s))
console.log('wrote', Object.keys(sounds).join(', '))
