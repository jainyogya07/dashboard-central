import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#0071e3]/50 ${
        isDark 
          ? 'bg-white/10 hover:bg-white/15 text-white border border-white/15' 
          : 'bg-[#e5e5ea] hover:bg-[#d8d8dc] text-[#1d1d1f] border border-[#d2d2d7]'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-[#38bdf8] transition-transform duration-300 group-hover:-rotate-12" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-[#ff9500] transition-transform duration-300 group-hover:rotate-45" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-medium tracking-tight">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  )
}
