import React from 'react'
import confetti from 'canvas-confetti'
import { Trophy, Flame, TrendingUp, Sparkles, ChevronRight, Users } from 'lucide-react'
import { NumberTicker } from '../primitives/NumberTicker'

export interface PodiumTeamData {
  team_id: string
  team_name: string
  total_points: number
  rank: number
  track?: string
  streak?: number
  velocity?: string
  memberCount?: number
  topContributor?: string
}

interface PodiumCardProps {
  team: PodiumTeamData
  maxPoints: number
  onInspect: (teamId: string) => void
}

export function PodiumCard({ team, maxPoints, onInspect }: PodiumCardProps) {
  const isFirst = team.rank === 1
  const isSecond = team.rank === 2
  const isThird = team.rank === 3

  const triggerConfetti = (e: React.MouseEvent) => {
    e.stopPropagation()
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#2DD4BF', '#8B5CF6', '#A78BFA', '#F59E0B', '#3B82F6'],
    })
  }

  const track = team.track || (
    team.team_name === 'NEXUS' ? 'AI Systems' :
    team.team_name === 'CIPHER' ? 'Security & Web3' :
    team.team_name === 'ASCEND' ? 'Distributed Cloud' :
    team.team_name === 'ECHO' ? 'Realtime Engine' : 'Fullstack Core'
  )

  const hasPoints = team.total_points > 0
  const streak = team.streak ?? (hasPoints ? (isFirst ? 5 : isSecond ? 3 : 2) : 0)
  const velocity = team.velocity ?? (hasPoints ? (isFirst ? '+34%' : isSecond ? '+22%' : '+18%') : '0%')
  const memberCount = team.memberCount ?? 4

  if (isFirst) {
    return (
      <div 
        onClick={() => onInspect(team.team_id)}
        className="relative group cursor-pointer rounded-2xl p-[2px] transition-all duration-300 hover:scale-[1.015] hover:shadow-brand-glow"
        style={{
          background: 'linear-gradient(135deg, #2DD4BF 0%, #818CF8 50%, #8B5CF6 100%)',
        }}
      >
        <div className="bg-gradient-to-b from-white via-white to-purple-50/30 rounded-[14px] p-6 h-full flex flex-col justify-between relative overflow-hidden shadow-sm">
          {/* Top ambient highlight */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-teal-200/30 via-purple-200/20 to-transparent rounded-full blur-2xl pointer-events-none" />

          {/* Header Row: Rank badge, Track pill, Confetti action */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300/60 shadow-xs">
                  <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  RANK #1 • CHAMPION
                </span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  {track}
                </span>
              </div>

              <button
                type="button"
                onClick={triggerConfetti}
                title="Celebrate Rank #1"
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100/70 hover:bg-purple-200 text-purple-800 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Celebrate</span>
              </button>
            </div>

            {/* Team Name */}
            <h3 className="text-2xl sm:text-3xl font-display font-black text-gray-900 tracking-tight flex items-center gap-2">
              {team.team_name}
              <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                {velocity}
              </span>
            </h3>

            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-400" />
                {streak}-day sprint streak
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                {memberCount} active engineers
              </span>
            </p>
          </div>

          {/* Center Metric: Big Animated Points */}
          <div className="my-5 py-3 px-4 bg-white/80 backdrop-blur-xs rounded-xl border border-purple-100 shadow-xs flex items-baseline justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Total Verified Score</span>
              <div className="text-3xl sm:text-4xl font-display font-black text-gray-900 flex items-baseline gap-1.5">
                <NumberTicker value={team.total_points} className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-indigo-600 to-purple-600" />
                <span className="text-sm font-semibold text-gray-500">pts</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-md border border-purple-200/50">
                {hasPoints ? 'Sprint Leader' : 'Starting Line'}
              </span>
            </div>
          </div>

          {/* Progress Bar & Footer */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
              <span>Goal Progress</span>
              <span>{hasPoints ? Math.round(Math.min(100, (team.total_points / Math.max(100, maxPoints)) * 100)) : 0}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200/50">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${hasPoints ? Math.max(8, (team.total_points / Math.max(100, maxPoints)) * 100) : 0}%`,
                  background: 'linear-gradient(90deg, #2DD4BF 0%, #818CF8 50%, #8B5CF6 100%)',
                }}
              />
            </div>

            <div className="flex justify-between items-center pt-2 text-xs font-medium text-purple-700 group-hover:text-purple-900 transition-colors">
              <span>Inspect team roster & submissions</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Rank #2 and #3 Cards
  const badgeColor = isSecond 
    ? 'bg-slate-100 text-slate-800 border-slate-300' 
    : 'bg-amber-50 text-amber-900 border-amber-200'

  const rankLabel = isSecond ? '#2' : '#3'
  const rankSub = isSecond ? 'Runner Up' : '3rd Place'

  return (
    <div
      onClick={() => onInspect(team.team_id)}
      className="group cursor-pointer bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:shadow-card-elevated hover:border-purple-300 transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
            RANK {rankLabel} • {rankSub}
          </span>
          <span className="text-[11px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
            {track}
          </span>
        </div>

        <h4 className="text-xl font-display font-bold text-gray-900 group-hover:text-purple-700 transition-colors flex items-center justify-between">
          <span>{team.team_name}</span>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
            {velocity}
          </span>
        </h4>

        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
          <Flame className="w-3 h-3 text-orange-400" />
          <span>{streak}d streak</span>
          <span>•</span>
          <Users className="w-3 h-3 text-gray-400" />
          <span>{memberCount} members</span>
        </p>
      </div>

      <div className="my-4 py-2.5 px-3.5 bg-gray-50/70 rounded-xl border border-gray-100">
        <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400 block">Verified Score</span>
        <div className="text-2xl font-display font-bold text-gray-900 flex items-baseline gap-1">
          <NumberTicker value={team.total_points} />
          <span className="text-xs font-normal text-gray-500">pts</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
            style={{ width: `${hasPoints ? Math.max(5, (team.total_points / Math.max(100, maxPoints)) * 100) : 0}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-gray-500 font-medium group-hover:text-purple-600">
          <span>View breakdown</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  )
}
