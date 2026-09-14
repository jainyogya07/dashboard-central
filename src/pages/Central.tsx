import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { 
  Trophy, 
  Search, 
  Users, 
  Calendar, 
  ChevronRight, 
  Sparkles, 
  Layers,
  Clock,
  Target,
  FileCheck,
  Award
} from 'lucide-react'
import confetti from 'canvas-confetti'

import { supabase } from '../supabase'
import { useTheme } from '../context/ThemeContext'
import { BoardLayout } from '../components/layout/BoardLayout'
import { Skeleton } from '../components/primitives/Skeleton'
import { ErrorState } from '../components/feedback/EmptyState'
import { TEAMS, SPRINT_INFO, DEPARTMENT_KEY } from '../config/teams'
import { NumberTicker } from '../components/primitives/NumberTicker'
import { TeamDrawer } from '../components/board/TeamDrawer'
import { TeamLogo } from '../components/media/TeamLogo'
import { ScoringExplainer } from '../components/dashboard/ScoringExplainer'

type TeamTotal = {
  team_id: string
  team_name: string
  team_number: string
  total_points: number
  rank: number
  leaders: string
  memberCount: number
  verifiedSubmissionsCount: number
  members: { name: string; deptCode: string; department: string }[]
}

const DEPT_BADGE_COLORS: Record<string, string> = {
  T: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  E: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  R: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  S: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  D: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  P: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
}

export function Central() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const queryClient = useQueryClient()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDept, setSelectedDept] = useState('all')
  const [activeDrawerTeamId, setActiveDrawerTeamId] = useState<string | null>(null)

  // ── REAL-TIME CHANNEL & SSE STREAM SUBSCRIBER ──
  useEffect(() => {
    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: ['central-totals'] })
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] })
      if (activeDrawerTeamId) {
        queryClient.invalidateQueries({ queryKey: ['drawer-team-detail', activeDrawerTeamId] })
      }
    }

    // 1. Supabase real-time channel subscription
    const channel = supabase
      .channel('central-live-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => {
        invalidateAll()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        invalidateAll()
      })
      .subscribe()

    // 2. Custom DOM event listener (intra-tab and cross-component)
    const handleCustomRealtime = () => {
      invalidateAll()
    }
    window.addEventListener('aarvak-realtime-update', handleCustomRealtime)

    // 3. Server-Sent Events (SSE) from Vite dev server middleware
    let eventSource: EventSource | null = null
    try {
      eventSource = new EventSource('/api/v1/events')
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data)
          if (parsed.type === 'DELIVERABLE_VERIFIED' && parsed.deliverable) {
            supabase.syncExternalDeliverable(parsed.deliverable)
            invalidateAll()
          }
        } catch (e) {}
      }
    } catch (e) {}

    return () => {
      channel.unsubscribe()
      window.removeEventListener('aarvak-realtime-update', handleCustomRealtime)
      if (eventSource) eventSource.close()
    }
  }, [queryClient, activeDrawerTeamId])

  // Query: Team Totals computed strictly from real verified submissions
  const totalsQuery = useQuery({
    queryKey: ['central-totals'],
    queryFn: async () => {
      const promises = TEAMS.map(async (team) => {
        const { data: subData, error: subErr } = await supabase
          .from('submissions')
          .select('net_points, status')
          .eq('team_id', team.id)
          .in('status', ['verified', 'revoked'])

        if (subErr) throw subErr

        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, sprint_track, dept_code')
          .eq('team_id', team.id)

        // Points strictly from verified submissions (0 if none)
        const total_points = (subData || []).reduce((sum: number, row: any) => sum + (row.net_points || 0), 0)
        const verifiedSubmissionsCount = (subData || []).filter((s: any) => s.status === 'verified').length

        const membersList = (profileData && profileData.length > 0)
          ? profileData.map((p: any) => ({
              name: p.full_name,
              deptCode: p.dept_code || 'T',
              department: p.sprint_track || 'Technical'
            }))
          : team.members

        return {
          team_id: team.id,
          team_name: team.name,
          team_number: team.number,
          total_points,
          rank: 0,
          leaders: team.leaders,
          memberCount: team.memberCount,
          verifiedSubmissionsCount,
          members: membersList
        } as TeamTotal
      })

      const results = await Promise.all(promises)
      
      // Sort by points descending; if tied, sort by official team number (01 to 05)
      results.sort((a, b) => {
        if (b.total_points !== a.total_points) {
          return b.total_points - a.total_points
        }
        return a.team_number.localeCompare(b.team_number)
      })

      results.forEach((item, idx) => { item.rank = idx + 1 })
      return results
    },
  })

  // Query: Recent Activity Feed
  const recentQuery = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data || []
    }
  })

  // Query: Drawer Team Detail
  const drawerTeamQuery = useQuery({
    queryKey: ['drawer-team-detail', activeDrawerTeamId],
    queryFn: async () => {
      if (!activeDrawerTeamId) return null
      const team = TEAMS.find(t => t.id === activeDrawerTeamId)
      if (!team) return null

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('team_id', team.id)

      const { data: submissions } = await supabase
        .from('submissions')
        .select('*')
        .eq('team_id', team.id)
        .order('created_at', { ascending: false })

      const validSubs = submissions?.filter((s: any) => s.status === 'verified') || []
      
      const members = (profiles && profiles.length > 0 ? profiles : team.members.map(m => ({
        id: `m-${team.slug}-${m.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        full_name: m.name,
        sprint_track: m.department,
        dept_code: m.deptCode
      }))).map((p: any) => {
        const pSubs = validSubs.filter((s: any) => s.member_id === p.id)
        return {
          id: p.id,
          full_name: p.full_name,
          sprint_track: p.sprint_track || 'Technical',
          dept_code: p.dept_code,
          net_points: pSubs.reduce((sum: number, s: any) => sum + (s.net_points || 0), 0)
        }
      }).sort((a: any, b: any) => b.net_points - a.net_points)

      const formattedSubs = (submissions || []).map((s: any) => {
        const mem = members.find((p: any) => p.id === s.member_id)
        const actLabel = typeof s.activity_catalog === 'object' ? s.activity_catalog?.label : s.activity_catalog
        const actLevel = typeof s.activity_catalog === 'object' ? s.activity_catalog?.level : ''
        return {
          id: s.id,
          member_name: mem?.full_name || 'Team Member',
          activity_name: actLabel || s.description || 'Verified Milestone',
          activity_level: actLevel || '',
          points: s.net_points || 0,
          status: s.status,
          date: s.decided_at || s.submitted_at || s.created_at
        }
      })

      return { members, submissions: formattedSubs }
    },
    enabled: !!activeDrawerTeamId,
  })

  const teams = totalsQuery.data || []
  const totalVerifiedPool = teams.reduce((acc, t) => acc + t.total_points, 0)

  // Top 3 Podium
  const topThree = teams.slice(0, 3)

  // Filtered teams for the table
  const filteredTeams = useMemo(() => {
    return teams.filter(t => {
      const matchesSearch = t.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.leaders.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.members.some(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesDept = selectedDept === 'all' || 
        t.members.some(m => m.deptCode.includes(selectedDept) || m.department.toLowerCase().includes(selectedDept.toLowerCase()))

      return matchesSearch && matchesDept
    })
  }, [teams, searchQuery, selectedDept])

  const activeTeamObj = activeDrawerTeamId ? teams.find(t => t.team_id === activeDrawerTeamId) : null

  const triggerCelebrate = (e: React.MouseEvent) => {
    e.stopPropagation()
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#0071e3', '#38bdf8', '#818cf8', '#ffffff', '#e22718', '#34c759']
    })
  }

  const deptFilters = [
    { key: 'all', label: 'All Departments' },
    { key: 'T', label: 'Technical (T)' },
    { key: 'E', label: 'Event Mgt (E)' },
    { key: 'R', label: 'R&D (R)' },
    { key: 'S', label: 'Social (S)' },
    { key: 'D', label: 'Design (D)' },
    { key: 'P', label: 'PR (P)' },
  ]

  return (
    <BoardLayout maxWidth="max-w-[1120px]">
      <div className="flex flex-col gap-6 w-full">
        
        {/* ── 1. Page Header & Authentic TSJ 2026 Branding ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pt-1">
          <div>
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-[#e0e0e0] text-[#1d1d1f]'
              }`}>
                <span className="w-2 h-2 rounded-full bg-[#0071e3] shadow-[0_0_8px_#0071e3]" />
                {SPRINT_INFO.organization} • {SPRINT_INFO.motto.toUpperCase()}
              </span>
              <span className={`text-xs flex items-center gap-1.5 font-medium ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>
                <Clock className="w-3.5 h-3.5 text-[#0071e3]" />
                {SPRINT_INFO.durationText}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE SYNC
              </span>
            </div>
            
            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight ${
              isDark ? 'text-white' : 'text-[#1d1d1f]'
            }`}>
              {SPRINT_INFO.title} <span className="text-[#0071e3]">({SPRINT_INFO.code})</span>
            </h1>
            <p className={`text-xs sm:text-sm mt-1 leading-relaxed max-w-2xl ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>
              {SPRINT_INFO.introHeading}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="adaptive-card px-4 py-2.5 rounded-xl flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[#0071e3] border ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-[#e0e0e0]'
              }`}>
                <Target className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-[10px] font-medium uppercase tracking-wider block ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>
                  Verified Pool
                </span>
                <span className={`text-base font-bold font-mono ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                  <NumberTicker value={totalVerifiedPool} /> pts
                </span>
              </div>
            </div>

            <div className="adaptive-card px-4 py-2.5 rounded-xl flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-[#e0e0e0] text-[#1d1d1f]'
              }`}>
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-[10px] font-medium uppercase tracking-wider block ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>
                  Total Members
                </span>
                <span className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                  43 Engineers
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Official Philosophy Banner from PDF Page 1 ── */}
        <div className="adaptive-card p-4 sm:p-5 rounded-2xl flex items-start gap-3.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[#0071e3] shrink-0 mt-0.5 border ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-[#e0e0e0]'
          }`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0071e3] block mb-0.5">
              Sprint Philosophy • {SPRINT_INFO.organization}
            </span>
            <p className={`text-xs sm:text-sm leading-relaxed italic ${isDark ? 'text-white/90' : 'text-[#1d1d1f]'}`}>
              "{SPRINT_INFO.introQuote}"
            </p>
          </div>
        </div>

        {/* ── Official Scoring Rubric Explainer (from Tech Sprint PDF) ── */}
        <ScoringExplainer />

        {/* ── 3. Top 3 Showcase (Authentic Teams from PDF) ── */}
        {!totalsQuery.isLoading && topThree.length >= 3 && (
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              
              {/* 2nd Place */}
              <div 
                onClick={() => setActiveDrawerTeamId(topThree[1].team_id)}
                className="group cursor-pointer adaptive-card p-5 transition-all duration-200 flex flex-col justify-between items-center text-center relative"
              >
                <div className="w-full flex flex-col items-center">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border mb-3 ${
                    isDark 
                      ? 'bg-slate-500/20 text-slate-200 border-slate-400/30' 
                      : 'bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
                  }`}>
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>Rank #2 • Team {topThree[1].team_number}</span>
                  </div>

                  <div className="relative mb-3 flex items-center justify-center">
                    <TeamLogo teamName={topThree[1].team_name} size="lg" shadow={true} shape="rounded" animated={true} className={isDark ? 'border border-white/15' : 'border border-[#e0e0e0]'} />
                    <div className={`absolute -bottom-1.5 -right-1.5 px-2.5 py-0.5 rounded-full border font-mono font-extrabold text-[11px] shadow-md ${
                      isDark 
                        ? 'bg-[#181824] border-white/20 text-white' 
                        : 'bg-white border-[#d2d2d7] text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.18)] ring-1 ring-black/5'
                    }`}>
                      #{topThree[1].team_number}
                    </div>
                  </div>
                  
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>
                    Verified Score
                  </span>
                  <div className={`text-2xl font-bold font-mono my-1 ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                    <NumberTicker value={topThree[1].total_points} /> <span className={`text-xs font-normal ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>pts</span>
                  </div>
                  
                  <h3 className={`text-base font-bold group-hover:text-[#0071e3] transition-colors ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                    {topThree[1].team_name}
                  </h3>
                  <span className={`text-xs font-normal mb-1 truncate max-w-[200px] ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>
                    Lead: {topThree[1].leaders}
                  </span>
                  <span className="text-[10px] text-[#0071e3] font-semibold bg-[#0071e3]/10 px-2.5 py-0.5 rounded-full border border-[#0071e3]/20 mb-3">
                    {topThree[1].memberCount} Members
                  </span>
                </div>

                <div className={`w-full pt-3 border-t flex items-center justify-between ${isDark ? 'border-white/5' : 'border-[#f0f0f0]'}`}>
                  <span className={`text-xs font-mono ${isDark ? 'text-[#71717a]' : 'text-[#8e8e93]'}`}>
                    {topThree[1].verifiedSubmissionsCount} verified
                  </span>
                  <span className="apple-btn-secondary text-[11px] py-1 px-3">
                    View Roster
                  </span>
                </div>
              </div>

              {/* 1st Place (Champion - DESIGN.md Tile 1 surface) */}
              <div 
                onClick={() => setActiveDrawerTeamId(topThree[0].team_id)}
                className={`group cursor-pointer rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between items-center text-center relative shadow-2xl overflow-hidden ${
                  isDark 
                    ? 'bg-[#151522]/95 border border-[#0071e3]/30 text-white' 
                    : 'bg-[#272729] border border-[#38383a] text-white'
                }`}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#0071e3]/25 rounded-full blur-2xl pointer-events-none" />

                <div className="w-full flex flex-col items-center relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#0071e3]/20 text-[#2997ff] border border-[#0071e3]/30 mb-3">
                    <Trophy className="w-3.5 h-3.5 text-[#2997ff]" />
                    <span>Rank #1 • Team {topThree[0].team_number}</span>
                  </div>

                  <div className="relative mb-3 flex items-center justify-center">
                    <TeamLogo teamName={topThree[0].team_name} size="xl" floating={true} shadow={true} shape="rounded" className="border border-white/20" />
                    <div className="absolute -bottom-1.5 -right-1.5 px-2.5 py-0.5 rounded-full bg-[#0071e3] text-white flex items-center gap-1 text-[11px] shadow-md border border-white/30 font-mono font-extrabold">
                      <span>👑</span>
                      <span>#{topThree[0].team_number}</span>
                    </div>
                  </div>
                  
                  <span className="text-[10px] font-medium text-[#cccccc] uppercase tracking-wider">Verified Score</span>
                  <div className="text-3xl font-extrabold font-mono text-white my-1 tracking-tight">
                    <NumberTicker value={topThree[0].total_points} />
                    <span className="text-sm font-normal text-[#cccccc] ml-1">pts</span>
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    {topThree[0].team_name}
                  </h3>
                  <span className="text-xs text-[#cccccc] font-normal mb-1 truncate max-w-[220px]">
                    Lead: {topThree[0].leaders}
                  </span>
                  <span className="text-[10px] text-white font-medium bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15 mb-3">
                    {topThree[0].memberCount} Members
                  </span>
                </div>

                <div className="w-full pt-3 border-t border-white/10 flex items-center justify-between relative z-10">
                  <span className="text-xs text-[#cccccc] font-mono">
                    {topThree[0].verifiedSubmissionsCount} verified
                  </span>

                  <button
                    type="button"
                    onClick={triggerCelebrate}
                    className="apple-btn-primary text-[11px] py-1 px-3"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Celebrate
                  </button>
                </div>
              </div>

              {/* 3rd Place */}
              <div 
                onClick={() => setActiveDrawerTeamId(topThree[2].team_id)}
                className="group cursor-pointer adaptive-card p-5 transition-all duration-200 flex flex-col justify-between items-center text-center relative"
              >
                <div className="w-full flex flex-col items-center">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border mb-3 ${
                    isDark 
                      ? 'bg-amber-600/20 text-amber-200 border-amber-500/30' 
                      : 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                  }`}>
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>Rank #3 • Team {topThree[2].team_number}</span>
                  </div>

                  <div className="relative mb-3 flex items-center justify-center">
                    <TeamLogo teamName={topThree[2].team_name} size="lg" shadow={true} shape="rounded" animated={true} className={isDark ? 'border border-white/15' : 'border border-[#e0e0e0]'} />
                    <div className={`absolute -bottom-1.5 -right-1.5 px-2.5 py-0.5 rounded-full border font-mono font-extrabold text-[11px] shadow-md ${
                      isDark 
                        ? 'bg-[#181824] border-white/20 text-white' 
                        : 'bg-white border-[#d2d2d7] text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.18)] ring-1 ring-black/5'
                    }`}>
                      #{topThree[2].team_number}
                    </div>
                  </div>
                  
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>
                    Verified Score
                  </span>
                  <div className={`text-2xl font-bold font-mono my-1 ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                    <NumberTicker value={topThree[2].total_points} /> <span className={`text-xs font-normal ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>pts</span>
                  </div>
                  
                  <h3 className={`text-base font-bold group-hover:text-[#0071e3] transition-colors ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                    {topThree[2].team_name}
                  </h3>
                  <span className={`text-xs font-normal mb-1 truncate max-w-[200px] ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>
                    Lead: {topThree[2].leaders}
                  </span>
                  <span className="text-[10px] text-[#0071e3] font-semibold bg-[#0071e3]/10 px-2.5 py-0.5 rounded-full border border-[#0071e3]/20 mb-3">
                    {topThree[2].memberCount} Members
                  </span>
                </div>

                <div className={`w-full pt-3 border-t flex items-center justify-between ${isDark ? 'border-white/5' : 'border-[#f0f0f0]'}`}>
                  <span className={`text-xs font-mono ${isDark ? 'text-[#71717a]' : 'text-[#8e8e93]'}`}>
                    {topThree[2].verifiedSubmissionsCount} verified
                  </span>
                  <span className="apple-btn-secondary text-[11px] py-1 px-3">
                    View Roster
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── 4. Controls & Department Filter Bar ── */}
        <div className="adaptive-card p-3 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`} />
            <input
              type="text"
              placeholder="Search squad, leader or member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-8 py-1.5 text-xs rounded-full focus:outline-none focus:border-[#0071e3] transition-colors ${
                isDark 
                  ? 'bg-black/40 border border-white/10 text-white placeholder-white/40' 
                  : 'bg-[#f5f5f7] border border-[#e0e0e0] text-[#1d1d1f] placeholder-[#7a7a7a]'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${isDark ? 'text-[#a1a1aa] hover:text-white' : 'text-[#7a7a7a] hover:text-[#1d1d1f]'}`}
              >
                ✕
              </button>
            )}
          </div>

          {/* Department Filter Chips from PDF */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {deptFilters.map((df) => {
              const isSelected = selectedDept === df.key
              return (
                <button
                  key={df.key}
                  onClick={() => setSelectedDept(df.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0071e3] text-white shadow-sm'
                      : isDark
                        ? 'text-[#a1a1aa] hover:text-white hover:bg-white/5'
                        : 'text-[#7a7a7a] hover:text-[#1d1d1f] hover:bg-black/5'
                  }`}
                >
                  {df.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── 5. Main 2-Column Grid (Rankings Table + Live Activity) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Left 2 Columns: All 5 Teams as per PDF */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="adaptive-card overflow-hidden h-full flex flex-col justify-between">
              <div>
                <div className={`px-5 py-3.5 border-b flex items-center justify-between ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-[#fafafc] border-[#e0e0e0]'
                }`}>
                  <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                    <Layers className="w-3.5 h-3.5 text-[#0071e3]" />
                    Official Squads ({filteredTeams.length})
                  </span>
                  <span className={`text-xs font-mono ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>
                    TSJ / 2026 • 75 Days
                  </span>
                </div>

                {totalsQuery.isLoading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} variant="row" />)}
                  </div>
                ) : totalsQuery.isError ? (
                  <div className="p-8">
                    <ErrorState
                      headline="Could not load squad leaderboard"
                      body="Failed to query verified scores. Check your connection."
                      retry={() => totalsQuery.refetch()}
                    />
                  </div>
                ) : filteredTeams.length === 0 ? (
                  <div className={`py-14 px-6 text-center text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>
                    No squads found matching "{searchQuery}".
                  </div>
                ) : (
                  <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-[#f0f0f0]'}`}>
                    {filteredTeams.map((team) => {
                      return (
                        <div
                          key={team.team_id}
                          onClick={() => setActiveDrawerTeamId(team.team_id)}
                          className={`group cursor-pointer px-5 py-3.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isDark ? 'hover:bg-white/5' : 'hover:bg-[#fafafc]'
                          }`}
                        >
                          {/* Left: Rank Badge + Team Number + Logo + Names + Leaders */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full border text-center shrink-0 ${
                              team.rank === 1
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                                : team.rank === 2
                                  ? 'bg-slate-400/15 text-slate-700 dark:text-slate-300 border-slate-400/30'
                                  : team.rank === 3
                                    ? 'bg-amber-700/15 text-amber-800 dark:text-amber-400 border-amber-700/30'
                                    : isDark ? 'bg-white/5 text-[#a1a1aa] border-white/10' : 'bg-[#f0f0f2] text-[#515154] border-[#e0e0e0]'
                            }`}>
                              #{team.rank}
                            </span>

                            <TeamLogo teamName={team.team_name} size="md" shape="rounded" animated={true} className={isDark ? 'border border-white/10' : 'border border-[#e0e0e0]'} />

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`font-mono text-xs font-semibold ${isDark ? 'text-[#38bdf8]' : 'text-[#0066cc]'}`}>
                                  {team.team_number}
                                </span>
                                <h4 className={`text-sm font-bold group-hover:text-[#0071e3] transition-colors truncate ${
                                  isDark ? 'text-white' : 'text-[#1d1d1f]'
                                }`}>
                                  {team.team_name}
                                </h4>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0 ${
                                  isDark ? 'bg-white/5 text-[#a1a1aa] border-white/10' : 'bg-[#f5f5f7] text-[#515154] border-[#e0e0e0]'
                                }`}>
                                  {team.memberCount} Members
                                </span>
                              </div>

                              <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>
                                Lead: <span className={`font-medium ${isDark ? 'text-white/90' : 'text-[#1d1d1f]'}`}>{team.leaders}</span>
                              </p>

                              {/* Members snippet preview */}
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                {team.members.slice(0, 4).map((m, idx) => (
                                  <span 
                                    key={idx} 
                                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
                                      isDark ? 'text-white/80 bg-white/5 border-white/10' : 'text-[#515154] bg-[#f5f5f7] border-[#e0e0e0]'
                                    }`}
                                  >
                                    <span className={`font-mono text-[9px] font-bold ${DEPT_BADGE_COLORS[m.deptCode]?.split(' ')[1] || 'text-[#0071e3]'}`}>{m.deptCode}</span>
                                    <span>{m.name}</span>
                                  </span>
                                ))}
                                {team.members.length > 4 && (
                                  <span className={`text-[10px] font-medium ${isDark ? 'text-[#71717a]' : 'text-[#8e8e93]'}`}>
                                    +{team.members.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Verified Points & Action Chevron */}
                          <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                            <div className="text-right min-w-[75px]">
                              <span className={`text-base font-bold font-mono block leading-tight ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                                <NumberTicker value={team.total_points} /> pts
                              </span>
                              <span className={`text-[10px] uppercase font-mono ${isDark ? 'text-[#71717a]' : 'text-[#8e8e93]'}`}>
                                {team.verifiedSubmissionsCount} Verified
                              </span>
                            </div>

                            <span className="apple-btn-secondary text-[11px] py-1 px-3">
                              Inspect
                            </span>

                            <ChevronRight className={`w-4 h-4 group-hover:translate-x-0.5 transition-all ${
                              isDark ? 'text-[#71717a] group-hover:text-white' : 'text-[#c7c7cc] group-hover:text-[#1d1d1f]'
                            }`} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Table Footer Summary */}
              <div className={`px-5 py-3 border-t text-xs flex items-center justify-between ${
                isDark ? 'bg-white/5 border-white/10 text-[#a1a1aa]' : 'bg-[#fafafc] border-[#e0e0e0] text-[#7a7a7a]'
              }`}>
                <span>5 Official Squads • 43 Participating Members</span>
                <span className={`font-mono text-[11px] ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>AARVAK • TSJ 2026</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Submissions Feed */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="adaptive-card p-5 flex flex-col justify-between h-full">
              <div>
                <div className={`flex items-center justify-between pb-3 border-b ${
                  isDark ? 'border-white/10' : 'border-[#e0e0e0]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0071e3] shadow-[0_0_8px_#0071e3]" />
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                      Verified Deliverables Feed
                    </h3>
                  </div>
                  <span className={`text-[10px] font-mono ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>Real-time</span>
                </div>

                {/* Submissions list */}
                <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {recentQuery.isLoading ? (
                    <div className="space-y-2">
                      <Skeleton variant="row" />
                      <Skeleton variant="row" />
                    </div>
                  ) : recentQuery.data?.length === 0 ? (
                    <div className={`py-12 text-center text-xs flex flex-col items-center justify-center gap-2 ${
                      isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'
                    }`}>
                      <FileCheck className="w-8 h-8 text-[#a1a1aa]" />
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>No submissions verified yet</p>
                      <p className="text-[11px] max-w-xs">
                        Team members can submit achievements via <span className="text-[#0071e3] font-semibold">/submit</span> to earn points.
                      </p>
                    </div>
                  ) : (
                    recentQuery.data?.map((item: any, idx: number) => {
                      const team = TEAMS.find(t => t.id === item.team_id)

                      return (
                        <div
                          key={item.id || idx}
                          className={`p-2.5 rounded-xl border transition-all flex items-start gap-2.5 group ${
                            isDark 
                              ? 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5' 
                              : 'bg-[#fafafc] hover:bg-white border-[#e0e0e0] hover:border-[#d2d2d7]'
                          }`}
                        >
                          <TeamLogo teamName={team?.name || ''} size="xs" shape="rounded" />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-xs font-semibold group-hover:text-[#0071e3] transition-colors truncate ${
                                isDark ? 'text-white' : 'text-[#1d1d1f]'
                              }`}>
                                {team?.name || 'Engineering Squad'}
                              </span>
                              <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-full shrink-0 border ${
                                isDark 
                                  ? 'text-[#38bdf8] bg-[#0071e3]/15 border-[#0071e3]/30' 
                                  : 'text-[#0066cc] bg-[#f0f6ff] border-[#cce4ff]'
                              }`}>
                                +{item.net_points || 0} pts
                              </span>
                            </div>

                            <p className={`text-xs line-clamp-1 mt-0.5 leading-snug ${
                              isDark ? 'text-[#a1a1aa]' : 'text-[#515154]'
                            }`}>
                              {item.description || 'Verified deliverable'}
                            </p>

                            <div className={`flex items-center justify-between text-[10px] mt-1.5 font-mono ${
                              isDark ? 'text-[#71717a]' : 'text-[#8e8e93]'
                            }`}>
                              <span className={isDark ? 'text-white/80' : 'text-[#1d1d1f]'}>✓ Verified</span>
                              <span>{item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Bottom Info CTA */}
              <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
                isDark ? 'border-white/10' : 'border-[#e0e0e0]'
              }`}>
                <span className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>Got deliverables?</span>
                <button
                  type="button"
                  onClick={() => navigate('/submit')}
                  className="apple-link text-xs font-medium cursor-pointer"
                >
                  Log Submission →
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* ── 6. Department Key & Structure from PDF Page 3 ── */}
        <div className="w-full space-y-4">
          <div className="adaptive-card p-5 rounded-2xl">
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${
              isDark ? 'border-white/10' : 'border-[#e0e0e0]'
            }`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                Department Key & Structure
              </span>
              <span className={`text-xs font-mono ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>
                AARVAK / TSJ 2026
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {Object.values(DEPARTMENT_KEY).map((dept) => (
                <div key={dept.code} className={`p-3 rounded-xl border text-center ${
                  isDark ? 'bg-white/[0.03] border-white/5' : 'bg-[#fafafc] border-[#e0e0e0]'
                }`}>
                  <span className={`font-mono text-lg font-bold block ${DEPT_BADGE_COLORS[dept.code]?.split(' ')[1] || 'text-[#0071e3]'}`}>
                    {dept.code}
                  </span>
                  <span className={`text-xs font-medium mt-0.5 block ${isDark ? 'text-white/90' : 'text-[#1d1d1f]'}`}>
                    {dept.label}
                  </span>
                </div>
              ))}
            </div>

            <div className={`mt-5 pt-3 border-t text-center text-xs italic ${
              isDark ? 'border-white/5 text-[#a1a1aa]' : 'border-[#f0f0f0] text-[#7a7a7a]'
            }`}>
              "{SPRINT_INFO.closingQuote}"
            </div>
          </div>
        </div>

      </div>

      {/* ── 7. Slide-over Team Drawer ── */}
      <TeamDrawer
        isOpen={!!activeDrawerTeamId}
        onClose={() => setActiveDrawerTeamId(null)}
        team={activeTeamObj ? {
          id: activeTeamObj.team_id,
          name: activeTeamObj.team_name,
          slug: activeTeamObj.team_name.toLowerCase().replace(' ', '-'),
          rank: activeTeamObj.rank,
          total_points: activeTeamObj.total_points,
          track: `Leaders: ${activeTeamObj.leaders}`,
          streak: 0
        } : null}
        members={drawerTeamQuery.data?.members || []}
        submissions={drawerTeamQuery.data?.submissions || []}
        isLoading={drawerTeamQuery.isLoading}
      />
    </BoardLayout>
  )
}

