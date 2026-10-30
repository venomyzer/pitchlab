import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { IS_PREVIEW } from './config'
import { SettingsProvider } from './lib/settings'
import Home from './pages/Home'
import { LearnHub, StreamHub, TacticsHub } from './pages/Hubs'
import NotFound from './pages/NotFound'

const Offside = lazy(() => import('./pages/Offside'))
const FormationLab = lazy(() => import('./pages/FormationLab'))
const Sandbox = lazy(() => import('./pages/Sandbox'))
const ScoreboardControl = lazy(() => import('./pages/ScoreboardControl'))
const ScoreboardOverlay = lazy(() => import('./pages/ScoreboardOverlay'))
const ObsGuide = lazy(() => import('./pages/ObsGuide'))
const ScoreboardDock = lazy(() => import('./pages/ScoreboardDock'))
const Settings = lazy(() => import('./pages/Settings'))
const Donate = lazy(() => import('./pages/Donate'))

function Router({ children }: { children: ReactNode }) {
  return IS_PREVIEW ? <MemoryRouter>{children}</MemoryRouter> : <BrowserRouter>{children}</BrowserRouter>
}

function AppRoutes() {
  const loc = useLocation()
  return (
    <Suspense fallback={<Loading overlay={loc.pathname.startsWith('/overlay')} />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/learn" element={<LearnHub />} />
        <Route path="/learn/offside" element={<Offside />} />
        <Route path="/tactics" element={<TacticsHub />} />
        <Route path="/tactics/formations" element={<FormationLab />} />
        <Route path="/tactics/sandbox" element={<Sandbox />} />
        <Route path="/stream" element={<StreamHub />} />
        <Route path="/stream/scoreboard" element={<ScoreboardControl />} />
        <Route path="/stream/guide" element={<ObsGuide />} />
        <Route path="/stream/dock" element={<ScoreboardDock />} />
        <Route path="/overlay/scoreboard" element={<ScoreboardOverlay />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

function Loading({ overlay }: { overlay: boolean }) {
  if (overlay) return null // never flash anything on a stream overlay
  return <div className="min-h-full grid place-items-center text-mist-400 font-display uppercase tracking-[0.3em]">Loading</div>
}

export default function App() {
  return (
    <SettingsProvider>
      <Router><AppRoutes /></Router>
    </SettingsProvider>
  )
}
