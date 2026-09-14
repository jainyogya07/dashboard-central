/**
 * App router — all routes, all guards.
 *
 * Guard logic:
 *   - /login     public; redirect to / if already signed in
 *   - /onboarding requires session but no profile
 *   - /          requires session + profile
 *   - /submit    requires session + profile
 *   - /profile   requires session + profile
 *   - /review    requires core or lead role
 *   - /admin     requires lead role
 */
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AuthProvider } from './context/AuthContext'
import { RequireAuth, RequireProfile, RequireRole } from './guards/RouteGuards'
import { Login } from './pages/Login'
import { Onboarding } from './pages/Onboarding'
import { Central } from './pages/Central'
import { CentralTeam } from './pages/CentralTeam'
import { Submit } from './pages/Submit'
import { Profile } from './pages/Profile'
import { Review } from './pages/Review'
import { Admin } from './pages/Admin'
import { Board } from './pages/Board'
import { Export } from './pages/Export'
import { RollCall } from './pages/RollCall'
import { Analytics } from './pages/Analytics'
import { Chat } from './pages/Chat'
import { Notifications } from './pages/Notifications'
import { NotFound } from './pages/Placeholders'
import { TEAMS } from './config/teams'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

import { BrandLogo } from './components/media/BrandLogo'
import { ThemeProvider } from './context/ThemeContext'
import { ThemeToggle } from './components/layout/ThemeToggle'

function GlobalNav() {
  const location = useLocation()
  if (location.pathname === '/login') return null

  const getStyle = (path: string) => {
    const isActive = location.pathname === path
    return `text-[12px] transition-colors px-2.5 py-1 rounded-sm ${
      isActive 
        ? 'text-white font-medium' 
        : 'text-[#d2d2d7] hover:text-white'
    }`
  }

  return (
    <nav className="w-full h-11 bg-[#000000] text-white flex items-center px-4 sm:px-8 sticky top-0 z-50 border-b border-[#333333]/40">
      <div className="w-full max-w-[1040px] mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 mr-4 text-white hover:opacity-80 transition-opacity">
          <BrandLogo size={20} className="filter brightness-200" />
          <span className="font-display font-semibold text-[13px] tracking-tight text-white uppercase">
            AARVAK
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
          <Link to="/" className={getStyle('/')}>Leaderboard</Link>
          <Link to="/board" className={getStyle('/board')}>Team Board</Link>
          <Link to="/analytics" className={getStyle('/analytics')}>Analytics</Link>
          <Link to="/chat" className={getStyle('/chat')}>Chat</Link>
          <Link to="/notifications" className={getStyle('/notifications')}>Inbox</Link>
          <Link to="/submit" className={getStyle('/submit')}>Submit</Link>
          <Link to="/review" className={getStyle('/review')}>Review</Link>
          <Link to="/rollcall" className={getStyle('/rollcall')}>Roll Call</Link>
          <Link to="/admin" className={getStyle('/admin')}>Admin</Link>
        </div>

        <div className="flex items-center gap-3 ml-4 shrink-0">
          <ThemeToggle />
          <Link 
            to="/profile" 
            className="text-[12px] text-[#d2d2d7] hover:text-white transition-colors"
          >
            Account
          </Link>
        </div>
      </div>
    </nav>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <GlobalNav />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
              
              {/* Public Sprint Scoreboards & Telemetry Surfaces */}
              <Route path="/" element={<Central />} />
              <Route path="/central" element={<Central />} />
              <Route path="/board" element={<Board />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/notifications" element={<Notifications />} />
              
              {TEAMS.map((team) => {
                const slug = team.name.toLowerCase().replace(' ', '-')
                return (
                  <Route 
                    key={team.id} 
                    path={`/${slug}`} 
                    element={<CentralTeam hardcodedTeamId={team.id} />} 
                  />
                )
              })}

              {/* Protected Engineering Actions — Require Authentication */}
              <Route path="/submit" element={<RequireProfile><Submit /></RequireProfile>} />
              <Route path="/profile" element={<RequireProfile><Profile /></RequireProfile>} />
              <Route path="/rollcall" element={<RequireProfile><RollCall /></RequireProfile>} />

              {/* Lead & Core Role Routes */}
              <Route path="/review" element={<RequireRole minRole="core"><Review /></RequireRole>} />
              <Route path="/admin" element={<RequireRole minRole="lead"><Admin /></RequireRole>} />
              <Route path="/export" element={<RequireRole minRole="lead"><Export /></RequireRole>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
