// Cinematic stadium backdrop (public/bg, free-to-use licence, supplied by the owner).
// A dark green scrim keeps text readable; if the image is missing the solid night colour shows instead.
const IMG = `${import.meta.env.BASE_URL}bg/menu-1920.jpg`

/** `dim` is for tool screens, where the panels need a calmer backdrop than the menus. */
export function Background({ dim }: { dim?: boolean }) {
  const scrim = dim
    ? 'linear-gradient(rgba(4,16,11,.88), rgba(4,16,11,.88))'
    : 'linear-gradient(90deg, rgba(4,16,11,.95) 0%, rgba(4,16,11,.82) 34%, rgba(4,16,11,.35) 72%, rgba(4,16,11,.55) 100%),' +
      'linear-gradient(0deg, rgba(4,16,11,.9) 0%, rgba(4,16,11,0) 38%)'
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-night-900">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${IMG})` }} />
      <div className="absolute inset-0" style={{ background: scrim }} />
    </div>
  )
}
