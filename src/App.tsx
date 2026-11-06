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
const LowerThirds = lazy(() => import('./pages/LowerThirds'))
const Prediction = lazy(() => import('./pages/Prediction'))
const Ratings = lazy(() => import('./pages/Ratings'))
const GraphicsOverlay = lazy(() => import('./pages/GraphicsOverlay'))
const Lineup = lazy(() => import('./pages/Lineup'))
const SetPieces = lazy(() => import('./pages/SetPieces'))
const MatchRebuild = lazy(() => import('./pages/MatchRebuild'))
const Fouls = lazy(() => import('./pages/Fouls'))
const Leagues = lazy(() => import('./pages/Leagues'))
const Words = lazy(() => import('./pages/Words'))
const Quiz = lazy(() => import('./pages/Quiz'))
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
        <Route path="/learn/fouls" element={<Fouls />} />
        <Route path="/learn/leagues" element={<Leagues />} />
        <Route path="/learn/words" element={<Words />} />
        <Route path="/learn/quiz" element={<Quiz />} />
        <Route path="/tactics" element={<TacticsHub />} />
        <Route path="/tactics/formations" element={<FormationLab />} />
        <Route path="/tactics/sandbox" element={<Sandbox />} />
        <Route path="/tactics/lineup" element={<Lineup />} />
        <Route path="/tactics/set-pieces" element={<SetPieces />} />
        <Route path="/tactics/rebuild" element={<MatchRebuild />} />
        <Route path="/stream" element={<StreamHub />} />
        <Route path="/stream/scoreboard" element={<ScoreboardControl />} />
        <Route path="/stream/guide" element={<ObsGuide />} />
        <Route path="/stream/dock" element={<ScoreboardDock />} />
        <Route path="/stream/lower-thirds" element={<LowerThirds />} />
        <Route path="/stream/prediction" element={<Prediction />} />
        <Route path="/stream/ratings" element={<Ratings />} />
        <Route path="/overlay/scoreboard" element={<ScoreboardOverlay />} />
        <Route path="/overlay/graphics" element={<GraphicsOverlay />} />
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
