// Change the product name here; everything in the app reads from this file.
export const APP_NAME = 'PitchLab'

// The developer's profile card, credit links and Donate page all read from here.
// Leave a url empty to hide that link.
export type DevLink = { kind: 'youtube' | 'instagram' | 'x' | 'web'; label: string; handle: string; url: string }
export const DEVELOPER = {
  name: 'VENOMYZER',
  handle: 'venomyzer',
  role: 'Developer',
  // Profile card media: put the files in public/profile/ and write their file names here (e.g. 'banner.mp4').
  // .mp4/.webm loop muted, .gif/.png/.webp/.jpg show as images. Empty or missing = the built-in drawn version.
  // See public/profile/README.md for sizes.
  media: {
    banner: 'banner.mp4', // top of the card, about 3:1
    avatar: 'avatar.gif', // square, shown as a circle
    avatarStill: 'avatar-still.png', // small still for the header button, so the big animated file only loads with the card
    decoration: 'decoration.png', // square frame around the avatar with a see-through middle
    nameplate: '',  // wide strip behind your name, about 5:1
    effect: 'effect.png', // full-card effect, always on top. Plays, holds the last frame 5 s, repeats. Empty = built-in fire
  },
  about: `Building ${APP_NAME}: free football tools for streamers and fans.`,
  links: [
    { kind: 'youtube', label: 'YouTube', handle: '@venomyzer2814', url: 'https://www.youtube.com/@venomyzer2814' },
    { kind: 'instagram', label: 'Instagram', handle: '@venomyzer', url: 'https://www.instagram.com/venomyzer/' },
    { kind: 'x', label: 'X', handle: '', url: '' },
    { kind: 'web', label: 'Portfolio', handle: 'venomyzer.zerolink.co.in', url: 'https://venomyzer.zerolink.co.in' },
  ] as DevLink[],
}
export const DEV_LINKS = DEVELOPER.links.filter(l => l.url)
/** Where the developer's name links to: portfolio first, then YouTube, then any other link. */
export const DEV_HOME = (DEV_LINKS.find(l => l.label === 'Portfolio') ?? DEV_LINKS.find(l => l.label === 'YouTube') ?? DEV_LINKS[0])?.url ?? ''
export const APP_BY = `by ${DEVELOPER.name}`

// Where the Donate tab's button goes (Ko-fi, PayPal.me, etc.). Empty = button shows as not set up yet.
export const DONATE_URL = ''
export const APP_TAGLINE = 'Run the stream. Draw the plan. Explain the game.'
// Preview builds (VITE_PREVIEW=1) use in-memory routing so they work inside a sandboxed frame.
export const IS_PREVIEW = import.meta.env.VITE_PREVIEW === '1'
