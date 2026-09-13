import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Users } from 'lucide-react'
import { TEAMS } from '../../config/teams'
import { TeamLogo } from '../media/TeamLogo'
import { useTheme } from '../../context/ThemeContext'

interface TeamSelectorDropdownProps {
  selectedTeamId: string
  onSelectTeam: (teamId: string) => void
  className?: string
}

export function TeamSelectorDropdown({
  selectedTeamId,
  onSelectTeam,
  className = '',
}: TeamSelectorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const currentTeam = TEAMS.find((t) => t.id === selectedTeamId) || TEAMS[0]

  // Close on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Sleek Compact Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/50 cursor-pointer ${
          isDark
            ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white'
            : 'bg-black/5 hover:bg-black/10 border-[#e0e0e0] hover:border-[#c7c7cc] text-[#1d1d1f]'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded border ${
          isDark 
            ? 'bg-white/10 text-[#38bdf8] border-white/5' 
            : 'bg-black/5 text-[#0066cc] border-black/5'
        }`}>
          {currentTeam.number}
        </span>
        <span className="font-bold text-base sm:text-lg tracking-tight transition-colors">
          {currentTeam.name}
        </span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${
            isDark ? 'text-[#a1a1aa] group-hover:text-white' : 'text-[#7a7a7a] group-hover:text-[#1d1d1f]'
          } ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Sleek Adaptive Popover Menu */}
      {isOpen && (
        <div 
          className={`absolute left-0 mt-2 w-72 rounded-2xl backdrop-blur-2xl border p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 ${
            isDark
              ? 'bg-[#121218]/95 border-white/15 text-white'
              : 'bg-white/95 border-[#e0e0e0] text-[#1d1d1f] shadow-[0_20px_50px_rgba(0,0,0,0.15)]'
          }`}
        >
          <div className={`px-2.5 py-1.5 border-b flex items-center justify-between text-[10px] uppercase font-bold tracking-wider ${
            isDark ? 'border-white/5 text-[#a1a1aa]' : 'border-[#f0f0f0] text-[#7a7a7a]'
          }`}>
            <span>Select Squad</span>
            <span>TSJ / 2026</span>
          </div>

          <div className="py-1 space-y-1">
            {TEAMS.map((team) => {
              const isSelected = team.id === selectedTeamId
              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => {
                    onSelectTeam(team.id)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-[#0071e3]/15 border border-[#0071e3]/40 text-white'
                        : 'bg-[#0066cc]/10 border border-[#0066cc]/30 text-[#1d1d1f]'
                      : isDark
                        ? 'hover:bg-white/5 text-white/80 hover:text-white border border-transparent'
                        : 'hover:bg-black/5 text-[#1d1d1f]/80 hover:text-[#1d1d1f] border border-transparent'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <TeamLogo 
                      teamName={team.name} 
                      size="sm" 
                      shape="rounded" 
                      animated={false} 
                      className={`shrink-0 ${isDark ? 'border border-white/10' : 'border border-[#e0e0e0]'}`} 
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono text-[11px] font-bold ${isDark ? 'text-[#38bdf8]' : 'text-[#0066cc]'}`}>
                          {team.number}
                        </span>
                        <span className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                          {team.name}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>
                        Lead: {team.leaders}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ml-2 ${
                      isDark ? 'bg-[#0071e3]/20 text-[#38bdf8]' : 'bg-[#0066cc]/15 text-[#0066cc]'
                    }`}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div className={`px-2.5 py-2 border-t flex items-center justify-between text-[11px] ${
            isDark ? 'border-white/5 text-[#71717a]' : 'border-[#f0f0f0] text-[#8e8e93]'
          }`}>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-[#0071e3]" /> 5 Official Squads
            </span>
            <span>75-Day Sprint</span>
          </div>
        </div>
      )}
    </div>
  )
}
