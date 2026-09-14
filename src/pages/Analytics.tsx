import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { DEMO_MODE, supabase } from '../supabase'
import { BoardLayout } from '../components/layout/BoardLayout'
import { BoardPanel } from '../components/board/BoardPanel'
import { SignLabel } from '../components/board/SignLabel'
import { TextButton } from '../components/primitives/Controls'
import { Skeleton } from '../components/primitives/Skeleton'
import { EmptyState, ErrorState } from '../components/feedback/EmptyState'
import { Seam } from '../components/primitives/Seam'
import { CentralNav } from '../components/dashboard/CentralNav'
import { ReadinessPanel } from '../components/dashboard/ReadinessPanel'
import { TEAMS } from '../config/teams'
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs'

type Day = { activity_date: string; activity_count: number; member_count: number; team_count: number }
type Week = { label: string; activity_count: number }
type RosterRow = { team_id: string; team_name: string; member_id: string | null; member_name: string | null }

const iso = (date: Date) => date.toISOString().slice(0, 10)
const today = new Date()
const defaultStart = new Date(today)
defaultStart.setDate(today.getDate() - 89)

const demoRoster: RosterRow[] = TEAMS.flatMap(team => team.members.map(m => ({
  team_id: team.id,
  team_name: team.name,
  member_id: `m-${team.slug}-${m.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
  member_name: m.name,
})))

function demoDays(start: string, end: string): Day[] {
  const days: Day[] = []
  const cursor = new Date(`${start}T00:00:00`)
  const last = new Date(`${end}T00:00:00`)
  let index = 0
  while (cursor <= last) {
    if (index % 4 === 0 || index % 9 === 0) {
      days.push({ activity_date: iso(cursor), activity_count: (index % 5) + 1, member_count: (index % 3) + 1, team_count: (index % 4) + 1 })
    }
    cursor.setDate(cursor.getDate() + 1)
    index += 1
  }
  return days
}

function Heatmap({ days, start, end }: { days: Day[]; start: string; end: string }) {
  const values = new Map(days.map(day => [day.activity_date, day.activity_count]))
  const dates: string[] = []
  const cursor = new Date(`${start}T00:00:00`)
  const last = new Date(`${end}T00:00:00`)
  while (cursor <= last) {
    dates.push(iso(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  const max = Math.max(...days.map(day => day.activity_count), 1)
  return (
    <div className="overflow-x-auto pb-2" aria-label="Daily approved activity heatmap">
      <div className="grid min-w-[620px] grid-flow-col grid-rows-7 auto-cols-[14px] gap-1">
        {dates.map(date => {
          const count = values.get(date) ?? 0
          const level = count === 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4))
          return <div key={date} title={`${date}: ${count} approved activities`} aria-label={`${date}: ${count} approved activities`} className={`aspect-square rounded-sm ${['bg-chalk/[0.08]', 'bg-lamp/20', 'bg-lamp/40', 'bg-lamp/65', 'bg-lamp'][level]}`} />
        })}
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-dim">
        Less <span className="h-3 w-3 rounded-sm bg-chalk/[0.08]" /> <span className="h-3 w-3 rounded-sm bg-lamp/40" /> <span className="h-3 w-3 rounded-sm bg-lamp" /> More
      </div>
    </div>
  )
}

function LineChart({ weeks }: { weeks: Week[] }) {
  const width = 720
  const height = 220
  const max = Math.max(...weeks.map(week => week.activity_count), 1)
  const points = weeks.map((week, index) => `${(index / Math.max(weeks.length - 1, 1)) * width},${height - 20 - (week.activity_count / max) * (height - 45)}`).join(' ')
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 min-w-[620px] w-full" role="img" aria-label="Approved activities per day">
        <line x1="0" y1={height - 20} x2={width} y2={height - 20} stroke="currentColor" className="text-seam" />
        {points && <polyline fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" className="text-lamp" points={points} />}
        {weeks.map((week, index) => <circle key={week.label} cx={(index / Math.max(weeks.length - 1, 1)) * width} cy={height - 20 - (week.activity_count / max) * (height - 45)} r="3" className="fill-lamp" />)}
      </svg>
    </div>
  )
}

export function Analytics() {
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const [teamId, setTeamId] = useState(params.get('team') || '')
  const [memberId, setMemberId] = useState(params.get('member') || '')
  const [start, setStart] = useState(params.get('from') || iso(defaultStart))
  const [end, setEnd] = useState(params.get('to') || iso(today))
  const persist = (key: string, value: string) => { const next = new URLSearchParams(window.location.search); value ? next.set(key, value) : next.delete(key); window.history.replaceState(null, '', `${window.location.pathname}?${next.toString()}`) }
  const rosterQuery = useQuery({
    queryKey: ['analytics-roster'],
    queryFn: async () => {
      if (DEMO_MODE) return demoRoster
      const { data, error } = await supabase.rpc('get_activity_analytics_roster')
      if (error) throw error
      return (data ?? []) as RosterRow[]
    },
  })
  const analyticsQuery = useQuery({
    queryKey: ['analytics', teamId, memberId, start, end],
    queryFn: async () => {
      if (DEMO_MODE) return demoDays(start, end)
      const { data, error } = await supabase.rpc('get_activity_analytics', {
        p_team_id: teamId || null,
        p_member_id: memberId || null,
        p_start_date: start,
        p_end_date: end,
      })
      if (error) throw error
      return (data ?? []) as Day[]
    },
  })
  const days = analyticsQuery.data ?? []
  const total = days.reduce((sum, day) => sum + day.activity_count, 0)
  const activeDays = days.filter(day => day.activity_count > 0).length
  const weeks = useMemo(() => {
    const grouped = new Map<string, number>()
    days.forEach(day => {
      const date = new Date(`${day.activity_date}T00:00:00`)
      const mondayOffset = (date.getDay() + 6) % 7
      date.setDate(date.getDate() - mondayOffset)
      const label = iso(date)
      grouped.set(label, (grouped.get(label) ?? 0) + day.activity_count)
    })
    return Array.from(grouped, ([label, activity_count]) => ({ label, activity_count }))
  }, [days])
  const teams = useMemo(() => Array.from(new Map((rosterQuery.data ?? []).map(row => [row.team_id, row.team_name])).entries()), [rosterQuery.data])
  const members = (rosterQuery.data ?? []).filter(row => !teamId || row.team_id === teamId).filter(row => row.member_id)

  return (
    <BoardLayout topbar={<div className="flex w-full items-center justify-between gap-4"><span className="font-display text-sm font-bold tracking-sign text-chalk">AARVAK TSJ 2026 DASHBOARD</span><TextButton onClick={() => navigate('/central' + (DEMO_MODE ? '?demo=1' : ''))}>Standings</TextButton></div>}>
      <div className="flex flex-col gap-stack">
        <CentralNav />
        <Breadcrumbs current="Activity analytics" locked />
        <ReadinessPanel demo={DEMO_MODE} unavailable={analyticsQuery.isError} />
        <header className="readability-strip"><SignLabel>Activity signal</SignLabel><h1 className="mt-2 font-display text-3xl font-bold text-chalk dark:text-white">Approved activity, over time.</h1><p className="mt-2 max-w-2xl text-sm text-muted">Counts include verified submissions only. Private points and unrevealed scores are never returned.</p></header>
        <BoardPanel className="analytics-filters">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="label">Team<select value={teamId} onChange={event => { setTeamId(event.target.value); setMemberId(''); persist('team', event.target.value); persist('member', '') }} className="mt-2 w-full rounded-slot border border-seam bg-recess px-3 py-2 text-sm normal-case dark:bg-[#181824] dark:text-white dark:border-white/10 dark:[color-scheme:dark]"><option value="">All teams</option>{teams.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
            <label className="label">Member<select value={memberId} onChange={event => { setMemberId(event.target.value); persist('member', event.target.value) }} className="mt-2 w-full rounded-slot border border-seam bg-recess px-3 py-2 text-sm normal-case dark:bg-[#181824] dark:text-white dark:border-white/10 dark:[color-scheme:dark]"><option value="">All members</option>{members.map(row => <option key={row.member_id} value={row.member_id!}>{row.member_name}</option>)}</select></label>
            <label className="label">From<input type="date" value={start} max={end} onChange={event => { setStart(event.target.value); persist('from', event.target.value) }} className="mt-2 w-full rounded-slot border border-seam bg-recess px-3 py-2 text-sm dark:bg-[#181824] dark:text-white dark:border-white/10 dark:[color-scheme:dark]" /></label>
            <label className="label">To<input type="date" value={end} min={start} onChange={event => { setEnd(event.target.value); persist('to', event.target.value) }} className="mt-2 w-full rounded-slot border border-seam bg-recess px-3 py-2 text-sm dark:bg-[#181824] dark:text-white dark:border-white/10 dark:[color-scheme:dark]" /></label>
          </div>
        </BoardPanel>
        {analyticsQuery.isLoading ? <BoardPanel><Skeleton variant="total" /></BoardPanel> : analyticsQuery.isError ? <BoardPanel><ErrorState headline="Could not load analytics" body="The activity signal failed to load. Check your connection." retry={() => analyticsQuery.refetch()} /></BoardPanel> : days.length === 0 ? <BoardPanel><EmptyState headline="No approved activity yet" body="Try a wider date range or another team. Verified activity will appear here." /></BoardPanel> : <>
          <div className="grid gap-4 sm:grid-cols-3"><BoardPanel className="analytics-stat"><p className="label text-dim">Approved activities</p><p className="mt-2 font-display text-4xl font-bold text-chalk">{total}</p></BoardPanel><BoardPanel className="analytics-stat"><p className="label text-dim">Active days</p><p className="mt-2 font-display text-4xl font-bold text-chalk">{activeDays}</p></BoardPanel><BoardPanel className="analytics-stat"><p className="label text-dim">Peak day</p><p className="mt-2 font-display text-2xl font-bold text-chalk">{Math.max(...days.map(day => day.activity_count))} <span className="text-sm font-normal text-muted">activities</span></p></BoardPanel></div>
          <BoardPanel padded={false}><div className="px-panel pt-panel pb-3"><SignLabel>Daily pulse</SignLabel></div><Seam /><div className="p-panel"><Heatmap days={days} start={start} end={end} /></div></BoardPanel>
          <BoardPanel padded={false}><div className="px-panel pt-panel pb-3"><SignLabel>Weekly progress</SignLabel></div><Seam /><div className="p-panel"><LineChart weeks={weeks} /></div></BoardPanel>
        </>}
      </div>
    </BoardLayout>
  )
}
