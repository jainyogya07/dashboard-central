import React, { ReactNode } from 'react'
import { AuroraBackground } from './AuroraBackground'
import { useTheme } from '../../context/ThemeContext'
import { ThemeToggle } from './ThemeToggle'

export function BoardLayout({ 
  children, 
  topbar,
  maxWidth = 'max-w-[1080px]'
}: { 
  children: ReactNode
  topbar?: ReactNode
  maxWidth?: string 
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div 
      className={`min-h-screen flex flex-col items-center w-full relative antialiased transition-colors duration-300 selection:bg-[#0071e3] selection:text-white ${
        isDark ? 'bg-[#08080c] text-white' : 'bg-[#f5f5f7] text-[#1d1d1f]'
      }`}
    >
      {/* Living animated background (with exact Apple & BMW color gradients) */}
      <AuroraBackground />

      {/* Topbar if provided */}
      {topbar && (
        <div 
          className={`w-full backdrop-blur-xl border-b sticky top-11 z-40 relative transition-colors duration-300 ${
            isDark 
              ? 'bg-[#0e0f14]/80 border-white/10 text-white' 
              : 'bg-[#ffffff]/80 border-[#e0e0e0] text-[#1d1d1f]'
          }`}
        >
          <div className="w-full max-w-[1080px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
            {topbar}
            <div className="sm:hidden">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      {/* Main Page Workspace */}
      <main className={`w-full ${maxWidth} px-4 sm:px-6 py-7 flex flex-col gap-7 relative z-10`}>
        {children}
      </main>

      {/* Footer */}
      <footer 
        className={`w-full border-t mt-auto backdrop-blur-md py-7 text-center text-xs relative z-10 transition-colors duration-300 ${
          isDark 
            ? 'border-white/10 text-[#71717a] bg-[#08080c]/60' 
            : 'border-[#e0e0e0] text-[#7a7a7a] bg-white/60'
        }`}
      >
        <div className="max-w-[1080px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className={isDark ? 'text-white/80' : 'text-[#1d1d1f]'}>Tech Sprint 2026-27 (TSJ/2026)</span>
            <span>•</span>
            <span>Aarvak Engineering</span>
          </div>
          <div className={`flex items-center gap-4 ${isDark ? 'text-[#a1a1aa]' : 'text-[#7a7a7a]'}`}>
            <span className="hover:text-primary transition-colors cursor-pointer">75-Day Journey</span>
            <span className="hover:text-primary transition-colors cursor-pointer">5 Squads</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Core Booth</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
