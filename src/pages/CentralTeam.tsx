import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { BoardLayout } from '../components/layout/BoardLayout'
import { BoardPanel } from '../components/board/BoardPanel'
import { SignLabel } from '../components/board/SignLabel'
import { NumberCard } from '../components/board/NumberCard'
import { Skeleton } from '../components/primitives/Skeleton'
import { ErrorState } from '../components/feedback/EmptyState'
import { Seam } from '../components/primitives/Seam'
import { TextButton } from '../components/primitives/Controls'
import { StatusPill } from '../components/status/StatusPill'
import { TEAMS } from '../config/teams'
import { Avatar } from '../components/media/Avatar'

type CentralTeamDetail = {
  team: {
    id: string
    name: string
    slug: string
    total_points: number
  }
  members: {
    id: string
    full_name: string
    sprint_track: string | null
    net_points: number
  }[]
  feed: {
    id: string
    member_name: string
    activity_name: string
    activity_level: string | null
    points: number
    status: string
    date: string
  }[]
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatTotal(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

export function CentralTeam({ hardcodedTeamId }: { hardcodedTeamId?: string }) {
  const navigate = useNavigate()
  const params = useParams()
  const teamId = hardcodedTeamId || params.teamId

  const detailQuery = useQuery({
    queryKey: ['central-team-detail', teamId],
    queryFn: async () => {
      const team = TEAMS.find(t => t.id === teamId)
      if (!team) throw new Error('Team not found')

      // Fetch profiles
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('team_id', team.id)
      if (profError) throw profError

      // Fetch submissions
      const { data: submissions, error: subError } = await supabase
        .from('submissions')
        .select(`
          id, net_points, status, member_id, activity_id, decided_at, submitted_at,
          activity_catalog(label, level)
        `)
        .eq('team_id', team.id)
      if (subError) throw subError

      // Compute total points
      const validSubs = submissions?.filter(s => s.status === 'verified' || s.status === 'revoked') || []
      const total_points = validSubs.reduce((sum, s) => sum + (s.net_points || 0), 0)

      // Compute member points
      const members = (profiles || []).map(p => {
        const pSubs = validSubs.filter(s => s.member_id === p.id)
        return {
          id: p.id,
          full_name: p.full_name,
          sprint_track: p.sprint_track,
          net_points: pSubs.reduce((sum, s) => sum + (s.net_points || 0), 0)
        }
      }).sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))

      // Compute feed
      const feed = (submissions || []).map(s => {
        const member = profiles?.find(p => p.id === s.member_id)
        // Ensure activity_catalog is treated as a single object if present
        const activity = Array.isArray(s.activity_catalog) ? s.activity_catalog[0] : s.activity_catalog;
        return {
          id: s.id,
          member_name: member?.full_name || 'Unknown',
          activity_name: activity?.label || 'Unknown',
          activity_level: activity?.level || '',
          points: s.net_points,
          status: s.status,
          date: s.decided_at || s.submitted_at
        }
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      return {
        team: {
          id: team.id,
          name: team.name,
          slug: team.name.toLowerCase().replace(' ', '-'),
          total_points
        },
        members,
        feed
      }
    },
    enabled: !!teamId,
  })

  if (detailQuery.isLoading) {
    return (
      <BoardLayout>
        <BoardPanel>
          <div className="flex flex-col gap-4 p-panel">
            <Skeleton variant="total" />
            <Skeleton variant="row" />
            <Skeleton variant="row" />
          </div>
        </BoardPanel>
      </BoardLayout>
    )
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <BoardLayout topbar={<TextButton onClick={() => navigate('/')}>Back</TextButton>}>
        <BoardPanel>
          <div className="p-panel">
            <ErrorState
              headline="Could not load team details"
              body="The team data failed to load. Check your connection or the team ID."
              retry={() => detailQuery.refetch()}
            />
          </div>
        </BoardPanel>
      </BoardLayout>
    )
  }

  const { team, members, feed } = detailQuery.data

  return (
    <BoardLayout
      topbar={
        <div className="flex items-center justify-between w-full">
          <span className="font-display font-bold text-xl text-chalk tracking-sign uppercase truncate mr-4">
            {team.name}
          </span>
          <TextButton onClick={() => navigate('/')}>Back to Boards</TextButton>
        </div>
      }
    >
      <BoardPanel>
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="font-display font-black text-board text-white tabular-nums total-glow">
            {formatTotal(team.total_points)}
          </div>
          <p className="label text-dim">Total Points</p>
        </div>
      </BoardPanel>

      <BoardPanel padded={false}>
        <div className="px-panel pt-panel pb-2">
          <SignLabel>Members</SignLabel>
        </div>
        <Seam />
        <div className="flex flex-col">
          {members.map((member) => (
            <div key={member.id}>
              <div className="h-row flex items-center gap-0 hover:bg-lit transition-none group">
                <div className="w-40 px-3 flex items-center gap-2.5 shrink-0">
                  <Avatar name={member.full_name} size="sm" />
                  <span className="text-sm text-chalk font-medium truncate">{member.full_name}</span>
                </div>
                <Seam orientation="vertical" />
                <div className="flex-1 px-4 text-sm text-chalk/60 truncate">
                  {member.sprint_track ? `Track: ${member.sprint_track}` : 'No track'}
                </div>
                <Seam orientation="vertical" />
                <div className="w-24 px-4 text-base text-chalk font-display font-bold tabular-nums text-right shrink-0">
                  {formatTotal(member.net_points)}
                </div>
              </div>
              <Seam />
            </div>
          ))}
          {members.length === 0 && (
            <div className="px-panel py-6 text-sm text-chalk/60">No members found.</div>
          )}
        </div>
      </BoardPanel>

      <BoardPanel padded={false}>
        <div className="px-panel pt-panel pb-2">
          <SignLabel>Activity Log</SignLabel>
        </div>
        <Seam />
        <div className="flex flex-col">
          {feed.map((row) => (
            <div key={row.id}>
              <div className="h-row flex items-center gap-0 hover:bg-lit transition-none group">
                <div className="w-40 px-3 flex items-center gap-2.5 shrink-0">
                  <Avatar name={row.member_name} size="sm" />
                  <span className="text-sm text-chalk font-medium truncate">{row.member_name}</span>
                </div>
                <Seam orientation="vertical" />
                <div className="flex-1 px-4 text-sm text-chalk truncate">
                  {row.activity_name}{row.activity_level ? ` — ${row.activity_level}` : ''}
                </div>
                <Seam orientation="vertical" />
                <div className="w-24 px-3 flex items-center justify-center shrink-0">
                  <StatusPill status={row.status as any} size="sm" />
                </div>
                <Seam orientation="vertical" />
                <div className="w-16 px-4 text-sm text-chalk font-display font-bold tabular-nums text-right shrink-0">
                  {row.points}
                </div>
                <Seam orientation="vertical" />
                <div className="w-20 px-4 text-sm text-chalk/60 text-right font-display tabular-nums shrink-0">
                  {formatDate(row.date)}
                </div>
              </div>
              <Seam />
            </div>
          ))}
          {feed.length === 0 && (
            <div className="px-panel py-6 text-sm text-chalk/60">No activity yet.</div>
          )}
        </div>
      </BoardPanel>
    </BoardLayout>
  )
}
