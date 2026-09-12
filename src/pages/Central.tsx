import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { BoardLayout } from '../components/layout/BoardLayout'
import { BoardPanel } from '../components/board/BoardPanel'
import { SignLabel } from '../components/board/SignLabel'
import { Skeleton } from '../components/primitives/Skeleton'
import { ErrorState } from '../components/feedback/EmptyState'
import { Seam } from '../components/primitives/Seam'
import { TEAMS } from '../config/teams'

type TeamTotal = {
  team_id: string
  team_name: string
  total_points: number
}

function formatTotal(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

export function Central() {
  const navigate = useNavigate()

  const totalsQuery = useQuery({
    queryKey: ['central-totals'],
    queryFn: async () => {
      // Fetch all team details separately using the raw tables instead of RPC
      const promises = TEAMS.map(async (team) => {
        const { data, error } = await supabase
          .from('submissions')
          .select('net_points, status')
          .eq('team_id', team.id)
          .in('status', ['verified', 'revoked'])

        if (error) throw error

        const total_points = (data || []).reduce((sum, row) => sum + (row.net_points || 0), 0)

        return {
          team_id: team.id,
          team_name: team.name,
          total_points
        } as TeamTotal
      })
      
      const results = await Promise.all(promises)
      // Sort descending by points
      return results.sort((a, b) => b.total_points - a.total_points)
    },
  })

  return (
    <BoardLayout
      topbar={
        <div className="flex items-center justify-between w-full">
          <span className="font-display font-bold text-xl text-chalk tracking-sign uppercase">ECHO BOARDS</span>
        </div>
      }
    >
      <BoardPanel padded={false}>
        <div className="px-panel pt-panel pb-2">
          <SignLabel>Leaderboard</SignLabel>
        </div>
        <Seam />

        {totalsQuery.isLoading ? (
          <div>
            {[...Array(5)].map((_, i) => <Skeleton key={i} variant="row" />)}
          </div>
        ) : totalsQuery.isError ? (
          <div className="px-panel py-8">
            <ErrorState
              headline="Could not load leaderboard"
              body="The central totals failed to load. Check your connection."
              retry={() => totalsQuery.refetch()}
            />
          </div>
        ) : (
          <div className="flex flex-col">
            {totalsQuery.data?.map((row, index) => (
              <div key={row.team_id}>
                <button
                  onClick={() => navigate(`/${row.team_name.toLowerCase().replace(' ', '-')}`)}
                  className="w-full h-row flex items-center gap-0 hover:bg-lit transition-colors group cursor-pointer text-left focus:outline-none focus:shadow-ring relative"
                >
                  <div className="w-12 px-4 text-sm text-chalk/60 font-display tabular-nums shrink-0 text-center">
                    {index + 1}
                  </div>
                  <Seam orientation="vertical" />
                  <div className="flex-1 px-4 text-sm text-chalk font-medium truncate">
                    {row.team_name}
                  </div>
                  <Seam orientation="vertical" />
                  <div className="w-24 px-4 text-base text-chalk font-display font-bold tabular-nums text-right shrink-0">
                    {formatTotal(row.total_points)}
                  </div>
                </button>
                <Seam />
              </div>
            ))}
            {totalsQuery.data?.length === 0 && (
              <div className="px-panel py-8 text-center text-chalk/60 text-sm">
                No teams found.
              </div>
            )}
          </div>
        )}
      </BoardPanel>
    </BoardLayout>
  )
}
