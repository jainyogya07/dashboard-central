import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Trophy, 
  Calendar, 
  Clock, 
  Search, 
  Sparkles, 
  Layers, 
  Target,
  FileCheck,
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Zap,
  History,
  Filter,
  X,
  ExternalLink,
  FileText,
  ChevronDown,
  ArrowUpDown,
  Download,
  Share2,
  Eye,
  SlidersHorizontal,
  FolderArchive
} from 'lucide-react'
import confetti from 'canvas-confetti'

import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { BoardLayout } from '../components/layout/BoardLayout'
import { Skeleton } from '../components/primitives/Skeleton'
import { StatusPill } from '../components/status/StatusPill'
import { Avatar } from '../components/media/Avatar'
import { TeamLogo } from '../components/media/TeamLogo'
import { NumberTicker } from '../components/primitives/NumberTicker'
import { TeamSelectorDropdown } from '../components/board/TeamSelectorDropdown'
import { TEAMS, SPRINT_INFO, DEPARTMENT_KEY } from '../config/teams'

function computeSprintDay(sprintStart: string, totalDays: number): { day: number; total: number } {
  const start = new Date(sprintStart)
  const today = new Date()
  start.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diffMs = today.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1
  const day = Math.min(Math.max(diffDays, 1), totalDays)
  return { day, total: totalDays }
}

const DEPT_BADGE_COLORS: Record<string, string> = {
  T: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  E: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  R: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  S: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  D: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  P: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
}

const DEPT_NAMES: Record<string, string> = {
  T: 'Technical',
  E: 'Event Mgt',
  R: 'R&D',
  S: 'Social',
  D: 'Design',
  P: 'PR',
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function Board({ hardcodedTeamId }: { hardcodedTeamId?: string }) {
  const { session, profile, role } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  // Selected team state (defaults to URL param, user's team, or first team from PDF)
  const teamParam = searchParams.get('team')
  const defaultTeamId = hardcodedTeamId || teamParam || profile?.team_id || TEAMS[0].id
  const [selectedTeamId, setSelectedTeamId] = useState<string>(defaultTeamId)

  // Primary navigation tab ('overview' | 'history' | 'roster')
  const tabParam = searchParams.get('tab') as 'overview' | 'history' | 'roster' | null
  const [boardTab, setBoardTab] = useState<'overview' | 'history' | 'roster'>(
    tabParam && ['overview', 'history', 'roster'].includes(tabParam) ? tabParam : 'overview'
  )

  // Quick search in Overview tab
  const [deliverablesSearch, setDeliverablesSearch] = useState('')
  const [rightPanelTab, setRightPanelTab] = useState<'roster' | 'my_calls'>('roster')

  // Deliverables History tab search, filtering, & sorting
  const [historySearch, setHistorySearch] = useState('')
  const [historyTrack, setHistoryTrack] = useState<string>('ALL')
  const [historyStatus, setHistoryStatus] = useState<'ALL' | 'verified' | 'submitted' | 'revoked'>('ALL')
  const [historySort, setHistorySort] = useState<'newest' | 'highest' | 'lowest' | 'oldest'>('newest')

  // Inspection modal & copy link state
  const [selectedDeliverableForProof, setSelectedDeliverableForProof] = useState<any | null>(null)
  const [copiedDeliverableId, setCopiedDeliverableId] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const currentTeam = TEAMS.find(t => t.id === selectedTeamId) || TEAMS[0]

  // Synchronize tab changes with URL
  const handleTabChange = (tab: 'overview' | 'history' | 'roster') => {
    setBoardTab(tab)
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (tab === 'overview') {
        next.delete('tab')
      } else {
        next.set('tab', tab)
      }
      return next
    }, { replace: true })
  }

  // Synchronize team selection changes
  const handleTeamSelect = (teamId: string) => {
    setSelectedTeamId(teamId)
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('team', teamId)
      return next
    }, { replace: true })
  }

  // Keyboard shortcut: Cmd+K / Ctrl+K jumps to History tab and focuses search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        handleTabChange('history')
        setTimeout(() => {
          searchInputRef.current?.focus()
          searchInputRef.current?.select()
        }, 50)
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setHistorySearch('')
        searchInputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ── REAL-TIME CHANNEL & SSE STREAM SUBSCRIBER ──
  useEffect(() => {
    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: ['team-total', selectedTeamId] })
      queryClient.invalidateQueries({ queryKey: ['board-feed', selectedTeamId] })
      queryClient.invalidateQueries({ queryKey: ['team-roster', selectedTeamId] })
      queryClient.invalidateQueries({ queryKey: ['sprint-config'] })
      queryClient.invalidateQueries({ queryKey: ['submission-proofs', selectedTeamId] })
    }

    const channel = supabase
      .channel(`board-live-sync-${selectedTeamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => {
        invalidateAll()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        invalidateAll()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submission_proofs' }, () => {
        invalidateAll()
      })
      .subscribe()

    const handleCustomRealtime = () => {
      invalidateAll()
    }
    window.addEventListener('aarvak-realtime-update', handleCustomRealtime)

    // Connect to SSE for real-time external pushes
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
  }, [queryClient, selectedTeamId])

  // 1. Query: Team Total Score (strictly from verified submissions)
  const totalQuery = useQuery({
    queryKey: ['team-total', selectedTeamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('net_points, status')
        .eq('team_id', selectedTeamId)
        .in('status', ['verified', 'revoked'])

      if (error) throw error
      const sum = (data || []).reduce((acc: number, row: any) => acc + (row.net_points || 0), 0)
      return sum || 0
    },
  })

  // 2. Query: Sprint Config (75 Days from PDF)
  const configQuery = useQuery({
    queryKey: ['sprint-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sprint_config')
        .select('sprint_start, total_days')
        .single()
      if (error) throw error
      return data
    },
  })

  // 3. Query: Verified & Logged Deliverables for this Team with Proof Attachments
  const feedQuery = useQuery({
    queryKey: ['board-feed', selectedTeamId],
    queryFn: async () => {
      const { data: subs, error: subErr } = await supabase
        .from('submissions')
        .select('*')
        .eq('team_id', selectedTeamId)
        .order('created_at', { ascending: false })

      if (subErr) throw subErr

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('team_id', selectedTeamId)

      const { data: proofs } = await supabase
        .from('submission_proofs')
        .select('*')
        .eq('team_id', selectedTeamId)

      return (subs || []).map((s: any) => {
        const mem = profiles?.find((p: any) => p.id === s.member_id)
        const label = typeof s.activity_catalog === 'object' ? s.activity_catalog?.label : (s.title || s.description)
        const level = typeof s.activity_catalog === 'object' ? s.activity_catalog?.level : 'Verified Milestone'
        const category = typeof s.activity_catalog === 'object' ? s.activity_catalog?.category : 'sprint_track'
        const subProofs = proofs?.filter((pr: any) => pr.submission_id === s.id) || []

        return {
          id: s.id,
          member_id: s.member_id,
          member_name: mem?.full_name || 'Team Engineer',
          member_track: mem?.sprint_track || 'Technical',
          member_dept_code: mem?.dept_code || 'T',
          title: s.title || label || 'Verified Deliverable',
          activity_label: label || 'Verified Deliverable',
          activity_level: level,
          category: category,
          net_points: s.net_points || 0,
          status: s.status,
          posted_at: s.decided_at || s.submitted_at || s.created_at,
          submitted_at: s.submitted_at || s.created_at,
          description: s.description || s.details || '',
          external_url: s.external_url || '',
          proofs: subProofs
        }
      })
    },
  })

  // 4. Query: Team Roster with authentic members from PDF
  const rosterQuery = useQuery({
    queryKey: ['team-roster', selectedTeamId],
    queryFn: async () => {
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('team_id', selectedTeamId)

      if (profErr) throw profErr

      const { data: subs } = await supabase
        .from('submissions')
        .select('*')
        .eq('team_id', selectedTeamId)
        .eq('status', 'verified')

      const validSubs = subs || []

      // Use database profiles or fallback to official PDF members
      if (profiles && profiles.length > 0) {
        return profiles.map((p: any) => {
          const userSubs = validSubs.filter((s: any) => s.member_id === p.id)
          const userPoints = userSubs.reduce((sum: number, s: any) => sum + (s.net_points || 0), 0)
          return {
            id: p.id,
            full_name: p.full_name,
            sprint_track: p.sprint_track || 'Technical',
            dept_code: p.dept_code || 'T',
            points: userPoints,
            deliverablesCount: userSubs.length
          }
        })
      }

      // Authentic PDF Roster
      return currentTeam.members.map((m, idx) => ({
        id: `pdf-member-${idx}`,
        full_name: m.name,
        sprint_track: m.department,
        dept_code: m.deptCode,
        points: 0,
        deliverablesCount: 0
      }))
    },
  })

  // 5. Query: My submissions
  const myQuery = useQuery({
    queryKey: ['my-submissions', profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('member_id', profile!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  const sprintInfo = configQuery.data
    ? computeSprintDay(configQuery.data.sprint_start, configQuery.data.total_days)
    : { day: 1, total: SPRINT_INFO.totalDays }

  const isCore = role === 'core' || role === 'lead'

  const feed = feedQuery.data ?? []
  const mine = myQuery.data ?? []
  const roster = rosterQuery.data ?? []
  const teamScore = totalQuery.data ?? 0

  const sprintPct = Math.min(100, Math.round((sprintInfo.day / sprintInfo.total) * 100))

  // Quick filtered feed for Overview tab
  const filteredFeed = useMemo(() => {
    return feed.filter((item: any) => {
      const matchesSearch = item.activity_label.toLowerCase().includes(deliverablesSearch.toLowerCase()) ||
        item.member_name.toLowerCase().includes(deliverablesSearch.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(deliverablesSearch.toLowerCase()))

      return matchesSearch
    })
  }, [feed, deliverablesSearch])

  // Comprehensive filtered feed for Deliverables History Tab
  const filteredHistory = useMemo(() => {
    let list = [...feed]

    // 1. Department track filter
    if (historyTrack !== 'ALL') {
      list = list.filter((item: any) => item.member_dept_code === historyTrack)
    }

    // 2. Status filter
    if (historyStatus !== 'ALL') {
      list = list.filter((item: any) => item.status === historyStatus)
    }

    // 3. Search query across title, member name, description, activity label, track
    if (historySearch.trim()) {
      const query = historySearch.toLowerCase().trim()
      list = list.filter((item: any) => {
        const titleMatch = item.title?.toLowerCase().includes(query)
        const nameMatch = item.member_name?.toLowerCase().includes(query)
        const descMatch = item.description?.toLowerCase().includes(query)
        const labelMatch = item.activity_label?.toLowerCase().includes(query)
        const trackMatch = item.member_track?.toLowerCase().includes(query)
        const deptMatch = item.member_dept_code?.toLowerCase().includes(query)
        return Boolean(titleMatch || nameMatch || descMatch || labelMatch || trackMatch || deptMatch)
      })
    }

    // 4. Sorting options
    list.sort((a: any, b: any) => {
      if (historySort === 'newest') {
        return new Date(b.posted_at || 0).getTime() - new Date(a.posted_at || 0).getTime()
      }
      if (historySort === 'oldest') {
        return new Date(a.posted_at || 0).getTime() - new Date(b.posted_at || 0).getTime()
      }
      if (historySort === 'highest') {
        return (b.net_points || 0) - (a.net_points || 0)
      }
      if (historySort === 'lowest') {
        return (a.net_points || 0) - (b.net_points || 0)
      }
      return 0
    })

    return list
  }, [feed, historyTrack, historyStatus, historySearch, historySort])

  const triggerCelebrate = (e: React.MouseEvent) => {
    e.stopPropagation()
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#0071e3', '#38bdf8', '#818cf8', '#ffffff', '#e22718', '#34c759']
    })
  }

  const handleCopyLink = (deliverableId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const url = `${window.location.origin}/board?team=${selectedTeamId}&tab=history&item=${deliverableId}`
    navigator.clipboard.writeText(url)
    setCopiedDeliverableId(deliverableId)
    setTimeout(() => setCopiedDeliverableId(null), 2200)
  }

  const isFilterActive = historySearch.trim() !== '' || historyTrack !== 'ALL' || historyStatus !== 'ALL' || historySort !== 'newest'

  const resetHistoryFilters = () => {
    setHistorySearch('')
    setHistoryTrack('ALL')
    setHistoryStatus('ALL')
    setHistorySort('newest')
  }

  return (
    <BoardLayout maxWidth="max-w-[1140px]">
      <div className="flex flex-col gap-6 w-full">

        {/* ── 1. Squad Identity Header & Sleek Adaptive Team Switcher ── */}
        <div className="adaptive-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 flex-wrap">
            {/* Official Squad Logo */}
            <TeamLogo 
              teamName={currentTeam.name} 
              size="md" 
              shadow={true} 
              shape="rounded" 
              animated={true} 
              className={isDark ? 'border border-white/15' : 'border border-[#e0e0e0]'}
            />

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Sleek Custom Adaptive Dropdown */}
              <TeamSelectorDropdown 
                selectedTeamId={selectedTeamId}
                onSelectTeam={handleTeamSelect}
              />

              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                isDark 
                  ? 'bg-white/5 text-[#d4d4d8] border-white/10' 
                  : 'bg-black/5 text-[#1d1d1f] border-[#e0e0e0]'
              }`}>
                Leaders: <span className={`font-semibold ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>{currentTeam.leaders}</span>
              </span>

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isDark 
                  ? 'bg-white/5 text-[#d4d4d8] border-white/10' 
                  : 'bg-black/5 text-[#1d1d1f] border-[#e0e0e0]'
              }`}>
                <Users className="w-3.5 h-3.5 text-[#0071e3]" />
                {currentTeam.memberCount} Members
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE SYNC
              </span>
            </div>
          </div>

          {/* Header Right: Sprint Progress Meter & Action Button */}
          <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
            <div className={`border rounded-full px-3.5 py-1.5 hidden sm:block ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-[#e0e0e0]'
            }`}>
              <div className="flex items-center justify-between gap-3 text-xs font-medium mb-1">
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>
                  <Calendar className="w-3.5 h-3.5 text-[#0071e3]" />
                  75-Day Journey
                </span>
                <span className={`font-mono text-[11px] font-semibold ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                  Day {sprintInfo.day} ({sprintPct}%)
                </span>
              </div>
              <div className={`w-36 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-[#e0e0e0]'}`}>
                <div
                  className="h-full rounded-full transition-all duration-700 bg-[#0071e3]"
                  style={{ width: `${sprintPct}%` }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* ── 2. Hero Scorecard: High-Density Executive Metrics (DESIGN.md Surface Tile 1) ── */}
        <div className={`relative overflow-hidden rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl transition-all duration-300 ${
          isDark 
            ? 'bg-[#13131c]/90 backdrop-blur-2xl border border-white/12 text-white' 
            : 'bg-[#272729] text-white border border-[#38383a]'
        }`}>
          {/* Ambient Glows */}
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#0071e3]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-[#e22718]/12 rounded-full blur-3xl pointer-events-none" />

          {/* Left: Squad Hero Logo & Real Points Counter */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left relative z-10">
            <TeamLogo 
              teamName={currentTeam.name} 
              size="xl" 
              floating={true} 
              shadow={true} 
              shape="rounded" 
              className="border border-white/20 shrink-0" 
            />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2997ff] block">
                {currentTeam.number} / {currentTeam.name} • Verified Team Scorecard
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight my-1 flex items-baseline justify-center sm:justify-start gap-1">
                <NumberTicker value={teamScore} />
                <span className="text-base font-normal text-[#a1a1aa]">pts</span>
              </div>
              <p className="text-xs text-[#a1a1aa] font-normal">
                Lead: <span className="text-white font-medium">{currentTeam.leaders}</span> • {currentTeam.memberCount} Engineers
              </p>
            </div>
          </div>

          {/* Center: Journey Status Bar */}
          <div className="w-full md:w-64 bg-white/5 border border-white/10 rounded-xl p-3.5 relative z-10">
            <div className="flex items-center justify-between text-xs font-medium text-white mb-1.5">
              <span className="flex items-center gap-1.5 text-[#a1a1aa]">
                <Clock className="w-3.5 h-3.5 text-[#2997ff]" />
                Sprint Progress
              </span>
              <span className="text-white font-mono font-semibold">{sprintPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#0071e3] to-[#2997ff]"
                style={{ width: `${sprintPct}%` }}
              />
            </div>
            <span className="text-[11px] text-[#a1a1aa] mt-1.5 block font-mono">
              Day {sprintInfo.day} of 75 • {sprintInfo.total - sprintInfo.day} days left
            </span>
          </div>

          {/* Right: Deliverables Summary & Celebrate */}
          <div className="flex items-center gap-2.5 relative z-10">
            {/* Clickable Deliverables Metric -> Switches directly to History Tab */}
            <button
              type="button"
              onClick={() => handleTabChange('history')}
              className={`bg-white/5 hover:bg-white/15 rounded-xl border px-3.5 py-2 text-center min-w-[95px] transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                boardTab === 'history' ? 'border-[#2997ff] shadow-[0_0_12px_rgba(41,151,255,0.3)]' : 'border-white/10'
              }`}
              title="Click to view full Deliverables History"
            >
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#a1a1aa] block">Deliverables</span>
              <span className="text-sm font-bold text-white flex items-center justify-center gap-1 mt-0.5">
                <FileCheck className="w-3.5 h-3.5 text-[#2997ff]" />
                {feed.length} Verified
              </span>
            </button>

            {/* Clickable Squad Size Metric -> Switches directly to Roster Tab */}
            <button
              type="button"
              onClick={() => handleTabChange('roster')}
              className={`bg-white/5 hover:bg-white/15 rounded-xl border px-3.5 py-2 text-center min-w-[95px] transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                boardTab === 'roster' ? 'border-[#2997ff] shadow-[0_0_12px_rgba(41,151,255,0.3)]' : 'border-white/10'
              }`}
              title="Click to view official Squad Roster"
            >
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#a1a1aa] block">Squad Size</span>
              <span className="text-sm font-bold text-white flex items-center justify-center gap-1 mt-0.5">
                <Users className="w-3.5 h-3.5 text-[#2997ff]" />
                {currentTeam.memberCount} Members
              </span>
            </button>

            <button
              type="button"
              onClick={triggerCelebrate}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer hover:scale-105 active:scale-95 border border-white/10"
              title="Celebrate Squad"
            >
              <Sparkles className="w-4 h-4 text-[#2997ff]" />
            </button>
          </div>
        </div>

        {/* ── 3. Prominent Board Navigation Tabs ── */}
        <div className={`p-1.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isDark ? 'bg-black/30 border-white/10' : 'bg-white/60 border-[#e0e0e0] shadow-sm'
        }`}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleTabChange('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                boardTab === 'overview'
                  ? isDark 
                    ? 'bg-[#0071e3] text-white shadow-lg shadow-[#0071e3]/25' 
                    : 'bg-[#0071e3] text-white shadow-md'
                  : isDark 
                    ? 'text-white/70 hover:text-white hover:bg-white/5' 
                    : 'text-[#515154] hover:text-[#1d1d1f] hover:bg-black/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Sprint Overview</span>
            </button>

            <button
              onClick={() => handleTabChange('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                boardTab === 'history'
                  ? isDark 
                    ? 'bg-[#0071e3] text-white shadow-lg shadow-[#0071e3]/25' 
                    : 'bg-[#0071e3] text-white shadow-md'
                  : isDark 
                    ? 'text-white/70 hover:text-white hover:bg-white/5' 
                    : 'text-[#515154] hover:text-[#1d1d1f] hover:bg-black/5'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Deliverables History</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                boardTab === 'history'
                  ? 'bg-white/20 text-white'
                  : isDark ? 'bg-white/10 text-white/80' : 'bg-black/10 text-black/80'
              }`}>
                {feed.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('roster')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                boardTab === 'roster'
                  ? isDark 
                    ? 'bg-[#0071e3] text-white shadow-lg shadow-[#0071e3]/25' 
                    : 'bg-[#0071e3] text-white shadow-md'
                  : isDark 
                    ? 'text-white/70 hover:text-white hover:bg-white/5' 
                    : 'text-[#515154] hover:text-[#1d1d1f] hover:bg-black/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Squad Roster</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                boardTab === 'roster'
                  ? 'bg-white/20 text-white'
                  : isDark ? 'bg-white/10 text-white/80' : 'bg-black/10 text-black/80'
              }`}>
                {currentTeam.memberCount}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto px-2">
            <span className={`text-[11px] font-mono ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              Team: <strong className={isDark ? 'text-white' : 'text-black'}>{currentTeam.name}</strong>
            </span>
          </div>
        </div>

        {/* ── 4. TAB 1: SPRINT OVERVIEW (Dual-Pane Workspace) ── */}
        {boardTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left 7 Columns: Verified Deliverables */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="adaptive-card overflow-hidden h-full flex flex-col justify-between">
                <div>
                  {/* Header & Filter Bar */}
                  <div className={`p-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-[#fafafc] border-[#e0e0e0]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0071e3] shadow-[0_0_8px_#0071e3]" />
                      <h2 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                        Recent Verified Deliverables ({filteredFeed.length})
                      </h2>
                    </div>

                    {/* Search input */}
                    <div className="relative">
                      <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`} />
                      <input
                        type="text"
                        placeholder="Quick search..."
                        value={deliverablesSearch}
                        onChange={(e) => setDeliverablesSearch(e.target.value)}
                        className={`pl-7 pr-3 py-1 text-xs rounded-full focus:outline-none focus:border-[#0071e3] w-44 transition-colors ${
                          isDark 
                            ? 'bg-black/40 border border-white/10 text-white placeholder-white/40' 
                            : 'bg-white border border-[#e0e0e0] text-[#1d1d1f] placeholder-black/40'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Deliverables List */}
                  <div className={`divide-y max-h-[460px] overflow-y-auto pr-1 ${isDark ? 'divide-white/5' : 'divide-[#f0f0f0]'}`}>
                    {feedQuery.isLoading ? (
                      <div className="p-5 space-y-3">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} variant="row" />)}
                      </div>
                    ) : filteredFeed.length === 0 ? (
                      <div className={`py-14 px-6 text-center text-xs flex flex-col items-center justify-center gap-2 ${
                        isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'
                      }`}>
                        <FileCheck className="w-8 h-8 text-[#a1a1aa]" />
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                          No deliverables verified yet for {currentTeam.name}
                        </p>
                        <p className="text-[11px] max-w-sm">
                          Log a deliverable using the button above to begin scoring.
                        </p>
                      </div>
                    ) : (
                      filteredFeed.map((item: any) => {
                        const deptBadge = DEPT_BADGE_COLORS[item.member_dept_code] || 'bg-white/10 text-white border-white/10'
                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedDeliverableForProof(item)}
                            className={`p-3.5 transition-colors flex items-start gap-3 group cursor-pointer ${
                              isDark ? 'hover:bg-white/5' : 'hover:bg-[#fafafc]'
                            }`}
                          >
                            <Avatar name={item.member_name} size="sm" />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <h4 className={`text-sm font-semibold group-hover:text-[#0071e3] transition-colors truncate ${
                                    isDark ? 'text-white' : 'text-[#1d1d1f]'
                                  }`}>
                                    {item.title || item.activity_label}
                                  </h4>
                                  <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>
                                    by <span className={`font-medium ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>{item.member_name}</span>
                                    {item.description && ` — ${item.description}`}
                                  </p>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className={`inline-flex items-center text-xs font-bold font-mono px-2.5 py-0.5 rounded-full border ${
                                    isDark 
                                      ? 'text-[#38bdf8] bg-[#0071e3]/15 border-[#0071e3]/30' 
                                      : 'text-[#0066cc] bg-[#f0f6ff] border-[#cce4ff]'
                                  }`}>
                                    +{item.net_points} pts
                                  </span>
                                </div>
                              </div>

                              <div className={`flex items-center justify-between text-[11px] mt-2 pt-1.5 border-t ${
                                isDark ? 'border-white/5 text-[#a1a1aa]' : 'border-[#f0f0f0] text-[#7a7a7a]'
                              }`}>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                    isDark ? 'bg-white/5 text-[#d4d4d8] border-white/10' : 'bg-[#f5f5f7] text-[#515154] border-[#e0e0e0]'
                                  }`}>
                                    {item.activity_level}
                                  </span>
                                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border ${deptBadge}`}>
                                    {item.member_dept_code}
                                  </span>
                                  {item.proofs && item.proofs.length > 0 && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-[#0071e3] font-medium">
                                      <FileText className="w-3 h-3" />
                                      {item.proofs.length} Proof{item.proofs.length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                                <span className="flex items-center gap-1 font-mono text-[10px]">
                                  <Clock className="w-3 h-3 text-[#7a7a7a]" />
                                  {item.posted_at ? new Date(item.posted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Recently'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Deliverables Footer with link to Deliverables History Tab */}
                <div className={`p-3 border-t text-xs flex items-center justify-between ${
                  isDark ? 'bg-white/5 border-white/10 text-[#a1a1aa]' : 'bg-[#fafafc] border-[#e0e0e0] text-[#7a7a7a]'
                }`}>
                  <button
                    onClick={() => handleTabChange('history')}
                    className="text-[#0071e3] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Full Deliverables History ({feed.length})</span>
                    <span>→</span>
                  </button>
                  <span className={`font-mono text-[11px] ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                    {feed.length} milestones verified
                  </span>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Authentic Squad Roster (from PDF) */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="adaptive-card overflow-hidden h-full flex flex-col justify-between">
                <div>
                  {/* Tab Switcher */}
                  <div className={`p-3 border-b flex items-center justify-between ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-[#fafafc] border-[#e0e0e0]'
                  }`}>
                    <div className={`flex items-center gap-1 p-1 rounded-full text-xs font-medium ${
                      isDark ? 'bg-white/5' : 'bg-[#f0f0f2]'
                    }`}>
                      <button
                        onClick={() => setRightPanelTab('roster')}
                        className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                          rightPanelTab === 'roster'
                            ? isDark 
                              ? 'bg-white/15 text-white font-semibold shadow-xs'
                              : 'bg-white text-[#1d1d1f] font-semibold shadow-2xs'
                            : isDark ? 'text-[#a1a1aa] hover:text-white' : 'text-[#7a7a7a] hover:text-[#1d1d1f]'
                        }`}
                      >
                        Official Roster ({currentTeam.memberCount})
                      </button>
                      <button
                        onClick={() => setRightPanelTab('my_calls')}
                        className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                          rightPanelTab === 'my_calls'
                            ? isDark 
                              ? 'bg-white/15 text-white font-semibold shadow-xs'
                              : 'bg-white text-[#1d1d1f] font-semibold shadow-2xs'
                            : isDark ? 'text-[#a1a1aa] hover:text-white' : 'text-[#7a7a7a] hover:text-[#1d1d1f]'
                        }`}
                      >
                        Your Calls ({mine.length})
                      </button>
                    </div>

                    {isCore && (
                      <button
                        onClick={() => navigate('/review')}
                        className="text-xs text-[#0071e3] hover:underline font-medium cursor-pointer"
                      >
                        The Booth →
                      </button>
                    )}
                  </div>

                  {/* Tab 1: Authentic PDF Squad Members */}
                  {rightPanelTab === 'roster' && (
                    <div className="p-3 space-y-2 max-h-[460px] overflow-y-auto">
                      {roster.map((eng: any, idx: number) => {
                        const badgeClass = DEPT_BADGE_COLORS[eng.dept_code] || 'bg-white/10 text-white border-white/10'
                        return (
                          <div
                            key={eng.id || idx}
                            className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 group ${
                              isDark 
                                ? 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5 hover:border-white/15' 
                                : 'bg-[#fafafc] hover:bg-white border-[#e0e0e0] hover:border-[#d2d2d7]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar name={eng.full_name} size="sm" />
                              <div className="min-w-0">
                                <h4 className={`text-xs font-semibold group-hover:text-[#0071e3] transition-colors truncate ${
                                  isDark ? 'text-white' : 'text-[#1d1d1f]'
                                }`}>
                                  {eng.full_name}
                                </h4>
                                <p className={`text-[10px] truncate ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>
                                  Dept: <span className={`font-medium ${isDark ? 'text-white/90' : 'text-[#1d1d1f]'}`}>{eng.sprint_track}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                                {eng.dept_code}
                              </span>
                              <span className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                                {eng.points} pts
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Tab 2: Your Calls (My Submissions) */}
                  {rightPanelTab === 'my_calls' && (
                    <div className="p-3 space-y-2.5 max-h-[460px] overflow-y-auto">
                      {mine.length === 0 ? (
                        <div className={`p-8 text-center text-xs flex flex-col items-center justify-center gap-1.5 ${
                          isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'
                        }`}>
                          <FileCheck className="w-6 h-6 text-[#71717a]" />
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>No deliverables submitted</p>
                          <p className="text-[11px]">You haven't logged any calls for this sprint yet.</p>
                        </div>
                      ) : (
                        mine.map((call: any) => (
                          <div
                            key={call.id}
                            className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${
                              isDark ? 'bg-white/[0.03] border-white/5' : 'bg-[#fafafc] border-[#e0e0e0]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                                {call.description || 'Sprint Deliverable'}
                              </span>
                              <StatusPill status={call.status} />
                            </div>
                            <div className={`flex items-center justify-between text-[10px] ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>
                              <span className="font-mono text-[#0071e3] font-semibold">
                                {call.net_points > 0 ? `+${call.net_points} pts` : 'Pending review'}
                              </span>
                              <span>{new Date(call.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Roster Footer */}
                <div className={`p-3 border-t text-xs flex items-center justify-between ${
                  isDark ? 'bg-white/5 border-white/10 text-[#a1a1aa]' : 'bg-[#fafafc] border-[#e0e0e0] text-[#7a7a7a]'
                }`}>
                  <span>{currentTeam.name} Engineering Cohort</span>
                  <span className={`font-mono text-[11px] ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                    {currentTeam.memberCount} engineers
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ── 5. TAB 2: DELIVERABLES HISTORY (With Pro Search Bar & Proofs) ── */}
        {boardTab === 'history' && (
          <div className="flex flex-col gap-5 w-full">

            {/* History Header Banner */}
            <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isDark 
                ? 'bg-gradient-to-r from-[#13131c] via-[#161626] to-[#13131c] border-white/10' 
                : 'bg-gradient-to-r from-white via-[#f7f9fc] to-white border-[#e0e0e0] shadow-sm'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#0071e3]/15 border border-[#0071e3]/30 flex items-center justify-center shrink-0">
                  <History className="w-6 h-6 text-[#0071e3]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className={`text-base sm:text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                      {currentTeam.name} Deliverables History & Audit Trail
                    </h2>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#0071e3]/15 text-[#0071e3] border border-[#0071e3]/30">
                      {filteredHistory.length} of {feed.length} Deliverables
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    Verified milestone submissions, engineering proof attachments, and points breakdown.
                  </p>
                </div>
              </div>

            </div>

            {/* ── THE "BADHIYA SEARCH BAR" & ADVANCED FILTERS ── */}
            <div className={`rounded-2xl p-4 sm:p-5 border transition-all duration-300 shadow-xl ${
              isDark 
                ? 'bg-[#13131c]/90 border-white/10 backdrop-blur-xl shadow-black/40' 
                : 'bg-white border-[#e0e0e0] shadow-black/5'
            }`}>
              {/* Pro Search Input Container */}
              <div className="relative flex items-center group">
                <Search className={`w-5 h-5 absolute left-4 transition-colors duration-200 pointer-events-none ${
                  historySearch 
                    ? 'text-[#0071e3]' 
                    : isDark ? 'text-white/40 group-focus-within:text-[#0071e3]' : 'text-black/40 group-focus-within:text-[#0071e3]'
                }`} />

                <input
                  ref={searchInputRef}
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search deliverables by title, engineer name, description, or track (e.g. 'Firmware', 'Yogay', 'Telemetry')..."
                  className={`w-full pl-12 pr-32 py-3.5 sm:py-4 text-sm sm:text-base rounded-xl transition-all outline-none font-medium ${
                    isDark 
                      ? 'bg-black/50 border border-white/12 text-white placeholder-white/40 focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/20 shadow-inner' 
                      : 'bg-[#fafafc] border border-[#e0e0e0] text-[#1d1d1f] placeholder-black/40 focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15 focus:bg-white shadow-inner'
                  }`}
                />

                <div className="absolute right-3.5 flex items-center gap-2">
                  {historySearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setHistorySearch('')
                        searchInputRef.current?.focus()
                      }}
                      className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        isDark ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-black/5 text-black/60 hover:text-black'
                      }`}
                      title="Clear search (Esc)"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <kbd className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg border select-none ${
                    isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-black/5 border-[#e0e0e0] text-black/50'
                  }`}>
                    <span>⌘</span>K
                  </kbd>
                </div>
              </div>

              {/* Department Track Filters, Status, & Sorting */}
              <div className={`mt-4 pt-3.5 border-t flex flex-col md:flex-row md:items-center justify-between gap-3.5 ${
                isDark ? 'border-white/10' : 'border-[#f0f0f0]'
              }`}>
                {/* Track Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-xs font-semibold mr-1 flex items-center gap-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    <Filter className="w-3 h-3 text-[#0071e3]" /> Track:
                  </span>

                  <button
                    onClick={() => setHistoryTrack('ALL')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                      historyTrack === 'ALL'
                        ? 'bg-[#0071e3] text-white border-[#0071e3] shadow-sm'
                        : isDark 
                          ? 'bg-white/5 text-white/70 border-white/10 hover:border-white/20 hover:text-white' 
                          : 'bg-[#fafafc] text-[#515154] border-[#e0e0e0] hover:bg-white hover:text-black'
                    }`}
                  >
                    All ({feed.length})
                  </button>

                  {['T', 'E', 'R', 'S', 'D', 'P'].map((dept) => {
                    const active = historyTrack === dept
                    const badgeClass = DEPT_BADGE_COLORS[dept] || ''
                    const count = feed.filter((f: any) => f.member_dept_code === dept).length
                    return (
                      <button
                        key={dept}
                        onClick={() => setHistoryTrack(dept)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                          active
                            ? `${badgeClass} ring-2 ring-offset-1 ring-offset-black font-bold`
                            : isDark 
                              ? 'bg-white/5 text-white/70 border-white/10 hover:border-white/20' 
                              : 'bg-[#fafafc] text-[#515154] border-[#e0e0e0] hover:bg-white'
                        }`}
                        title={DEPT_NAMES[dept] || dept}
                      >
                        <span>[{dept}] {DEPT_NAMES[dept]}</span>
                        <span className="text-[10px] opacity-75">({count})</span>
                      </button>
                    )
                  })}
                </div>

                {/* Status & Sort Controls */}
                <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto">
                  {/* Status Filter */}
                  <div className="flex items-center gap-1">
                    <select
                      value={historyStatus}
                      onChange={(e) => setHistoryStatus(e.target.value as any)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl border outline-none font-medium transition-colors cursor-pointer ${
                        isDark 
                          ? 'bg-black/50 border-white/10 text-white focus:border-[#0071e3]' 
                          : 'bg-white border-[#e0e0e0] text-[#1d1d1f] focus:border-[#0071e3]'
                      }`}
                    >
                      <option value="ALL">Status: All</option>
                      <option value="verified">Status: Verified Only</option>
                      <option value="submitted">Status: In Review</option>
                      <option value="revoked">Status: Revoked</option>
                    </select>
                  </div>

                  {/* Sort Order */}
                  <div className="flex items-center gap-1">
                    <select
                      value={historySort}
                      onChange={(e) => setHistorySort(e.target.value as any)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl border outline-none font-medium transition-colors cursor-pointer ${
                        isDark 
                          ? 'bg-black/50 border-white/10 text-white focus:border-[#0071e3]' 
                          : 'bg-white border-[#e0e0e0] text-[#1d1d1f] focus:border-[#0071e3]'
                      }`}
                    >
                      <option value="newest">Sort: Newest First</option>
                      <option value="highest">Sort: Highest Points</option>
                      <option value="lowest">Sort: Lowest Points</option>
                      <option value="oldest">Sort: Oldest First</option>
                    </select>
                  </div>

                  {/* Reset Filters button */}
                  {isFilterActive && (
                    <button
                      type="button"
                      onClick={resetHistoryFilters}
                      className="text-xs text-[#0071e3] hover:underline font-semibold flex items-center gap-1 px-2 py-1 cursor-pointer"
                      title="Clear all filters and search"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── DELIVERABLES CARDS LIST ── */}
            <div className="space-y-3.5">
              {feedQuery.isLoading ? (
                <div className="p-6 space-y-4 adaptive-card">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} variant="card" />)}
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className={`py-16 px-6 text-center rounded-2xl border flex flex-col items-center justify-center gap-3 ${
                  isDark ? 'bg-[#13131c]/60 border-white/10 text-[#a1a1aa]' : 'bg-white border-[#e0e0e0] text-[#7a7a7a]'
                }`}>
                  <div className="w-14 h-14 rounded-2xl bg-[#0071e3]/10 border border-[#0071e3]/20 flex items-center justify-center">
                    <Search className="w-7 h-7 text-[#0071e3]" />
                  </div>
                  <div>
                    <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                      {feed.length === 0 ? `No deliverables logged yet for ${currentTeam.name}` : 'No deliverables match your search'}
                    </h3>
                    <p className="text-xs max-w-md mt-1">
                      {feed.length === 0
                        ? 'The sprint has started with a clean zero baseline. Submit achievements via /submit to log milestone deliverables.'
                        : historySearch 
                          ? `No results found for "${historySearch}". Check the spelling or try searching by engineer name or department.`
                          : 'No submissions found under the selected filters.'}
                    </p>
                  </div>
                  {isFilterActive && (
                    <button
                      onClick={resetHistoryFilters}
                      className="apple-btn-primary py-2 px-4 text-xs font-semibold mt-2 cursor-pointer"
                    >
                      Clear Search & Filters
                    </button>
                  )}
                </div>
              ) : (
                filteredHistory.map((item: any) => {
                  const deptBadge = DEPT_BADGE_COLORS[item.member_dept_code] || 'bg-white/10 text-white border-white/10'
                  const isCopied = copiedDeliverableId === item.id
                  return (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl border transition-all duration-200 group ${
                        isDark 
                          ? 'bg-[#13131c]/80 hover:bg-[#13131c] border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl' 
                          : 'bg-white hover:bg-[#fcfcff] border-[#e0e0e0] hover:border-[#d0d0d8] shadow-sm hover:shadow-md'
                      }`}
                    >
                      {/* Top Row: Engineer Info, Track Badge, Points, & Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <Avatar name={item.member_name} size="md" />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                                {item.member_name}
                              </h4>
                              <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${deptBadge}`}>
                                [{item.member_dept_code}] {item.member_track}
                              </span>
                            </div>
                            <span className={`text-[11px] flex items-center gap-1 mt-0.5 font-mono ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                              <Clock className="w-3 h-3 text-[#0071e3]" />
                              {item.posted_at ? new Date(item.posted_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                          <StatusPill status={item.status} />

                          <span className={`inline-flex items-center text-xs font-bold font-mono px-3 py-1 rounded-full border shadow-sm ${
                            isDark 
                              ? 'text-[#38bdf8] bg-[#0071e3]/20 border-[#0071e3]/40' 
                              : 'text-[#0066cc] bg-[#f0f6ff] border-[#cce4ff]'
                          }`}>
                            +{item.net_points} pts
                          </span>
                        </div>
                      </div>

                      {/* Middle Row: Deliverable Title, Level Tag, & Detailed Description */}
                      <div className="py-3.5">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <h3 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                            {item.title || item.activity_label}
                          </h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isDark ? 'bg-white/5 text-[#d4d4d8] border-white/10' : 'bg-[#f5f5f7] text-[#515154] border-[#e0e0e0]'
                          }`}>
                            {item.activity_level}
                          </span>
                        </div>

                        {item.description && (
                          <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Proof Documents & Attachments List */}
                      {item.proofs && item.proofs.length > 0 && (
                        <div className={`mt-1 p-3 rounded-xl border flex flex-col gap-2 ${
                          isDark ? 'bg-white/[0.02] border-white/5' : 'bg-[#fafafc] border-[#e8e8ed]'
                        }`}>
                          <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                            isDark ? 'text-white/60' : 'text-black/60'
                          }`}>
                            <FolderArchive className="w-3.5 h-3.5 text-[#0071e3]" />
                            Verified Proof Attachments ({item.proofs.length})
                          </span>

                          <div className="flex items-center gap-2 flex-wrap">
                            {item.proofs.map((proof: any) => (
                              <button
                                key={proof.id}
                                type="button"
                                onClick={() => setSelectedDeliverableForProof(item)}
                                className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 cursor-pointer font-medium ${
                                  isDark 
                                    ? 'bg-black/40 hover:bg-black/60 border-white/10 text-[#38bdf8] hover:border-[#38bdf8]/40' 
                                    : 'bg-white hover:bg-[#f0f6ff] border-[#e0e0e0] text-[#0066cc] hover:border-[#cce4ff]'
                                }`}
                                title={`Inspect ${proof.file_name}`}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span className="font-mono text-[11px] font-semibold truncate max-w-[200px]">{proof.file_name}</span>
                                <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                  ({formatBytes(proof.size_bytes)})
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* External URL Link if provided */}
                      {item.external_url && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <a
                            href={item.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-[#0071e3] hover:underline font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View External Repository / Live Artifact ↗</span>
                          </a>
                        </div>
                      )}

                      {/* Bottom Footer: Verification Audit Badge & Actions */}
                      <div className={`mt-3.5 pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                        isDark ? 'border-white/5 text-[#a1a1aa]' : 'border-[#f0f0f0] text-[#7a7a7a]'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Verified by Core Review Council
                          </span>
                          <span>•</span>
                          <span className="font-mono text-[11px]">Sprint Day {sprintInfo.day} of 75</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(item.id, e)}
                            className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : isDark ? 'hover:bg-white/10 border-white/10 text-white/70' : 'hover:bg-black/5 border-[#e0e0e0] text-black/70'
                            }`}
                            title="Copy link to this deliverable"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                            <span className="text-[11px]">{isCopied ? 'Copied!' : 'Share'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedDeliverableForProof(item)}
                            className="apple-btn-secondary py-1 px-3 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect Proof</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

          </div>
        )}

        {/* ── 6. TAB 3: SQUAD ROSTER (All 8-9 Authentic Engineers from PDF) ── */}
        {boardTab === 'roster' && (
          <div className="flex flex-col gap-5 w-full">
            <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isDark ? 'bg-[#13131c]/80 border-white/10' : 'bg-white border-[#e0e0e0] shadow-sm'
            }`}>
              <div>
                <h2 className={`text-base sm:text-lg font-extrabold ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                  {currentTeam.name} Official Engineering Cohort ({currentTeam.memberCount} Members)
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  Squad Leadership: <span className="font-semibold text-[#0071e3]">{currentTeam.leaders}</span> • Authentic sprint roster from Tech-Sprint'26-27.pdf
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {roster.reduce((sum: number, r: any) => sum + (r.points || 0), 0)} pts Team Total
                </span>
              </div>
            </div>

            {/* Members Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {roster.map((eng: any, idx: number) => {
                const badgeClass = DEPT_BADGE_COLORS[eng.dept_code] || 'bg-white/10 text-white border-white/10'
                return (
                  <div
                    key={eng.id || idx}
                    className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 group ${
                      isDark 
                        ? 'bg-[#13131c]/80 hover:bg-[#13131c] border-white/10 hover:border-white/20' 
                        : 'bg-white hover:bg-[#fafafc] border-[#e0e0e0] hover:border-[#d0d0d8] shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={eng.full_name} size="md" />
                        <div className="min-w-0">
                          <h4 className={`text-sm font-bold group-hover:text-[#0071e3] transition-colors truncate ${
                            isDark ? 'text-white' : 'text-[#1d1d1f]'
                          }`}>
                            {eng.full_name}
                          </h4>
                          <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block mt-1 ${badgeClass}`}>
                            [{eng.dept_code}] {eng.sprint_track}
                          </span>
                        </div>
                      </div>

                      <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-full border ${
                        isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-[#e0e0e0] text-[#1d1d1f]'
                      }`}>
                        {eng.points} pts
                      </span>
                    </div>

                    <div className={`pt-2.5 border-t text-[11px] flex items-center justify-between ${
                      isDark ? 'border-white/5 text-[#a1a1aa]' : 'border-[#f0f0f0] text-[#7a7a7a]'
                    }`}>
                      <span>Deliverables logged: <strong className={isDark ? 'text-white' : 'text-black'}>{eng.deliverablesCount || 0}</strong></span>
                      <button
                        onClick={() => {
                          setHistorySearch(eng.full_name)
                          handleTabChange('history')
                        }}
                        className="text-[#0071e3] hover:underline font-semibold cursor-pointer"
                      >
                        View Deliverables →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {/* ── 7. DELIVERABLE INSPECTION & PROOF MODAL ── */}
      {selectedDeliverableForProof && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedDeliverableForProof(null)}
        >
          <div 
            className={`w-full max-w-2xl rounded-3xl border p-6 sm:p-7 shadow-2xl transition-all max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-[#13131c] border-white/15 text-white' : 'bg-white border-[#e0e0e0] text-[#1d1d1f]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Avatar name={selectedDeliverableForProof.member_name} size="md" />
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                    {selectedDeliverableForProof.title || selectedDeliverableForProof.activity_label}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs">
                    <span>by <strong className="text-[#0071e3]">{selectedDeliverableForProof.member_name}</strong></span>
                    <span>•</span>
                    <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border ${DEPT_BADGE_COLORS[selectedDeliverableForProof.member_dept_code] || ''}`}>
                      [{selectedDeliverableForProof.member_dept_code}] {selectedDeliverableForProof.member_track}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDeliverableForProof(null)}
                className={`p-2 rounded-full border transition-colors cursor-pointer ${
                  isDark ? 'bg-white/5 border-white/10 hover:bg-white/15 text-white' : 'bg-black/5 border-[#e0e0e0] hover:bg-black/10 text-black'
                }`}
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-4">
              {/* Score & Status Bar */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-[#fafafc] border-[#e0e0e0]'
              }`}>
                <div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                    Verification Status
                  </span>
                  <div className="mt-1">
                    <StatusPill status={selectedDeliverableForProof.status} />
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                    Awarded Net Points
                  </span>
                  <span className="text-lg font-mono font-extrabold text-[#0071e3]">
                    +{selectedDeliverableForProof.net_points} pts
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  Submission Details & Technical Notes
                </h4>
                <div className={`p-4 rounded-xl border text-xs sm:text-sm leading-relaxed ${
                  isDark ? 'bg-black/40 border-white/10 text-white/90' : 'bg-[#fafafc] border-[#e0e0e0] text-[#1d1d1f]'
                }`}>
                  {selectedDeliverableForProof.description || 'No detailed notes provided for this deliverable.'}
                </div>
              </div>

              {/* Proof Files */}
              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${
                  isDark ? 'text-white/60' : 'text-black/60'
                }`}>
                  <FolderArchive className="w-3.5 h-3.5 text-[#0071e3]" />
                  Uploaded Proof Documents ({selectedDeliverableForProof.proofs?.length || 0})
                </h4>

                {selectedDeliverableForProof.proofs && selectedDeliverableForProof.proofs.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDeliverableForProof.proofs.map((proof: any) => (
                      <div
                        key={proof.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          isDark ? 'bg-white/5 border-white/10' : 'bg-[#fafafc] border-[#e0e0e0]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-5 h-5 text-[#0071e3] shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-mono font-semibold block truncate">
                              {proof.file_name}
                            </span>
                            <span className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                              {formatBytes(proof.size_bytes)} • {proof.mime_type}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => alert(`Viewing proof: ${proof.file_name}`)}
                          className="apple-btn-secondary py-1.5 px-3 text-xs font-semibold shrink-0 cursor-pointer"
                        >
                          View Document
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`p-4 rounded-xl border text-center text-xs ${
                    isDark ? 'bg-white/[0.02] border-white/5 text-white/50' : 'bg-[#fafafc] border-[#e0e0e0] text-black/50'
                  }`}>
                    No direct file attachments stored for this submission.
                  </div>
                )}
              </div>

              {/* External URL */}
              {selectedDeliverableForProof.external_url && (
                <div className="pt-2">
                  <a
                    href={selectedDeliverableForProof.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#0071e3] hover:underline font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open External URL: {selectedDeliverableForProof.external_url} ↗</span>
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 text-xs">
              <span className={`font-mono text-[11px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                Deliverable ID: {selectedDeliverableForProof.id}
              </span>

              <button
                type="button"
                onClick={() => setSelectedDeliverableForProof(null)}
                className="apple-btn-primary py-2 px-4 text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </BoardLayout>
  )
}
