import { MenuList, type MenuItem } from '../components/MenuList'
import { Shell } from '../components/Shell'

/** Section menu: the shared list + preview layout under a title and a one-line intro. */
export function Hub({ eyebrow, title, intro, items }: { eyebrow: string; title: string; intro: string; items: MenuItem[] }) {
  return (
    <Shell menu back="/" title={title} eyebrow={eyebrow}>
      <MenuList items={items} heading={
        <div className="mb-6">
          <h2 className="font-display font-extrabold uppercase text-5xl md:text-6xl -skew-x-6">{title}</h2>
          <p className="text-mist-300 mt-3 leading-relaxed max-w-[44ch]">{intro}</p>
        </div>
      } />
    </Shell>
  )
}
