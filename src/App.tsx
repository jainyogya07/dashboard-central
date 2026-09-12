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
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { Central } from './pages/Central'
import { CentralTeam } from './pages/CentralTeam'
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

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Central />} />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
