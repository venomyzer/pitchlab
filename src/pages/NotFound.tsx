import { Link } from 'react-router-dom'
import { Shell } from '../components/Shell'

export default function NotFound() {
  return (
    <Shell back="/">
      <div className="max-w-xl mx-auto pt-20 text-center">
        <div className="font-display font-extrabold text-7xl -skew-x-6 text-flood-500">OFF TARGET</div>
        <p className="mt-4 text-mist-300">This page doesn't exist. It may have moved, or the link has a typo.</p>
        <Link to="/" className="inline-block mt-8 rounded-md bg-flood-500 text-night-950 font-semibold px-5 py-2.5">Back to main menu</Link>
      </div>
    </Shell>
  )
}
