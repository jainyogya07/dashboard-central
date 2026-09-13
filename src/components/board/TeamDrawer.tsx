import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X, ExternalLink, Award, CheckCircle2, Clock, Users, ArrowUpRight } from 'lucide-react'
import { Avatar } from '../media/Avatar'
import { TeamLogo } from '../media/TeamLogo'
import { StatusPill } from '../status/StatusPill'
import { NumberTicker } from '../primitives/NumberTicker'
import { useTheme } from '../../context/ThemeContext'

interface TeamMember {
  id: string
  full_name: string
  sprint_track?: string
  net_points: number
}

interface TeamSubmission {
  id: string
  member_name: string
  activity_name: string
  activity_level?: string
  points: number
  status: string
  date: string
}

interface TeamDrawerProps {
  isOpen: boolean
  onClose: () => void
  team: {
    id: string
    name: string
    slug: string
    rank: number
    total_points: number
    track?: string
    streak?: number
  } | null
  members: TeamMember[]
  submissions: TeamSubmission[]
  isLoading?: boolean
}

export function TeamDrawer({
  isOpen,
  onClose,
  team,
  members,
  submissions,
  isLoading = false,
}: TeamDrawerProps) {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !team) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleFullPageClick = () => {
    onClose()
    navigate(`/board?team=${team.id}`)
  }

  return createPortal(
    <div
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-[9999] backdrop-blur-md flex justify-end transition-opacity duration-200 ${
        isDark ? 'bg-black/70' : 'bg-black/35'
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div className={`w-full max-w-lg h-full shadow-2xl flex flex-col justify-between overflow-hidden border-l animate-in slide-in-from-right duration-200 ${
        isDark ? 'bg-[#121218] text-white border-white/10' : 'bg-white text-[#1d1d1f] border-[#e0e0e0]'
      }`}>
        {/* Drawer Header with generous top padding to ensure zero clipping */}
        <div className={`pt-6 pb-5 px-6 border-b ${
          isDark ? 'border-white/10 bg-[#161622]' : 'border-[#e0e0e0] bg-white'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${
              isDark 
                ? 'bg-[#0071e3]/20 border-[#0071e3]/40 text-[#38bdf8]' 
                : 'bg-[#f0f6ff] border-[#cce4ff] text-[#0066cc]'
            }`}>
              <Award className="w-3.5 h-3.5 text-[#0071e3]" />
              Rank #{team.rank} Overall
            </span>

            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors cursor-pointer border ${
                isDark 
                  ? 'text-[#a1a1aa] hover:text-white hover:bg-white/10 border-white/5' 
                  : 'text-[#7a7a7a] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] border-[#e0e0e0]'
              }`}
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <TeamLogo teamName={team.name} size="lg" shadow={true} shape="rounded" animated={true} className={isDark ? 'border border-white/15' : 'border border-[#e0e0e0]'} />
              <div>
                <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                  {team.name}
                </h2>
                <p className={`text-xs mt-1 flex items-center gap-2 ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>
                  <span className={`px-2 py-0.5 rounded-full border ${
                    isDark ? 'bg-white/5 text-white/90 border-white/10' : 'bg-[#f5f5f7] text-[#1d1d1f] border-[#e0e0e0]'
                  }`}>
                    {team.track || 'Core Squad'}
                  </span>
                  <span>•</span>
                  <span>{members.length} members</span>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className={`text-[10px] font-medium uppercase tracking-wider block ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>Total Points</span>
              <div className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                <NumberTicker value={team.total_points} />
                <span className={`text-xs font-normal ml-1 ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Body Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Members List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                <Users className="w-3.5 h-3.5 text-[#0071e3]" />
                Squad Roster ({members.length})
              </h3>
            </div>

            <div className={`rounded-xl border divide-y overflow-hidden ${
              isDark ? 'bg-white/[0.02] border-white/10 divide-white/5' : 'bg-[#fafafc] border-[#e0e0e0] divide-[#f0f0f0]'
            }`}>
              {members.length === 0 ? (
                <div className={`p-4 text-center text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>No members registered yet</div>
              ) : (
                members.map((member) => (
                  <div key={member.id} className={`p-3 flex items-center justify-between transition-colors ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-white'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={member.full_name} size="sm" />
                      <div>
                        <p className={`text-xs font-semibold leading-none ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>{member.full_name}</p>
                        <p className={`text-[10px] mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>{member.sprint_track || 'Engineer'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                        {member.net_points.toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Submissions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0071e3]" />
                Recent Verified Deliverables
              </h3>
            </div>

            <div className="space-y-2">
              {submissions.length === 0 ? (
                <div className={`p-4 text-center text-xs rounded-xl border ${
                  isDark ? 'text-[#a1a1aa] bg-white/[0.02] border-white/10' : 'text-[#7a7a7a] bg-[#fafafc] border-[#e0e0e0]'
                }`}>
                  No deliverables verified yet for this squad
                </div>
              ) : (
                submissions.slice(0, 6).map((sub) => (
                  <div
                    key={sub.id}
                    className={`p-3 rounded-xl border transition-colors ${
                      isDark 
                        ? 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5' 
                        : 'bg-white hover:bg-[#fafafc] border-[#e0e0e0]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-xs font-semibold leading-tight ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                          {sub.activity_name}
                          {sub.activity_level && (
                            <span className={`text-[10px] font-normal ml-1 ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>
                              • {sub.activity_level}
                            </span>
                          )}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>by {sub.member_name}</p>
                      </div>

                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                        isDark ? 'text-[#38bdf8] bg-[#0071e3]/15 border-[#0071e3]/30' : 'text-[#0066cc] bg-[#f0f6ff] border-[#cce4ff]'
                      }`}>
                        +{sub.points} pts
                      </span>
                    </div>

                    <div className={`flex items-center justify-between text-[10px] mt-2 font-mono ${
                      isDark ? 'text-[#71717a]' : 'text-[#8e8e93]'
                    }`}>
                      <span>✓ Verified</span>
                      <span>{sub.date ? new Date(sub.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Recently'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer CTA */}
        <div className={`p-4 sm:p-5 border-t flex items-center justify-between gap-3 ${
          isDark ? 'border-white/10 bg-[#161622]' : 'border-[#e0e0e0] bg-[#fafafc]'
        }`}>
          <button
            onClick={onClose}
            className="apple-btn-secondary text-xs py-2 px-4"
          >
            Close
          </button>

          <button
            onClick={handleFullPageClick}
            className="apple-btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
          >
            <span>Open Squad Board</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
