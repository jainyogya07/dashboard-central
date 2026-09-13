import React from 'react'
import { useTheme } from '../../context/ThemeContext'

export function AuroraBackground() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div 
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 select-none transition-colors duration-500 ${
        isDark ? 'bg-[#08080c]' : 'bg-[#f5f5f7]'
      }`}
    >
      {/* ── 1. Living Cyber Matrix Grid ── */}
      <div 
        className={`absolute inset-0 transition-opacity duration-500 bg-[size:40px_40px] ${
          isDark 
            ? 'bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] opacity-100' 
            : 'bg-[linear-gradient(to_right,rgba(0,0,0,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.035)_1px,transparent_1px)] opacity-70'
        }`}
      />

      {/* ── 2. Vignette Radial Overlay ── */}
      <div 
        className={`absolute inset-0 transition-all duration-500 ${
          isDark
            ? 'bg-[radial-gradient(circle_at_center,transparent_0%,rgba(8,8,12,0.6)_65%,#08080c_100%)]'
            : 'bg-[radial-gradient(circle_at_center,transparent_0%,rgba(245,245,247,0.5)_65%,#f5f5f7_100%)]'
        }`}
      />

      {/* ── 3. Exact Brand Color Gradients from DESIGN.md (Apple) & DESIGN (1).md (BMW) ── */}

      {/* Orb 1: Action Azure & BMW M-Blue (Top-Left) */}
      <div 
        className={`absolute -top-24 -left-20 w-[680px] h-[680px] rounded-full blur-[100px] pointer-events-none animate-aurora-1 transition-opacity duration-700 ${
          isDark ? 'opacity-55' : 'opacity-40'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(0,113,227,0.55) 0%, rgba(28,105,212,0.35) 45%, rgba(0,102,177,0.15) 65%, transparent 75%)'
            : 'radial-gradient(circle, rgba(0,113,227,0.35) 0%, rgba(41,151,255,0.22) 45%, transparent 70%)'
        }}
      />

      {/* Orb 2: BMW M-Red & Tech Violet Wave (Top-Right) */}
      <div 
        className={`absolute -top-20 -right-24 w-[700px] h-[700px] rounded-full blur-[110px] pointer-events-none animate-aurora-2 transition-opacity duration-700 ${
          isDark ? 'opacity-50' : 'opacity-35'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(226,39,24,0.40) 0%, rgba(139,92,246,0.35) 45%, rgba(99,102,241,0.15) 65%, transparent 75%)'
            : 'radial-gradient(circle, rgba(167,139,250,0.32) 0%, rgba(139,92,246,0.18) 50%, transparent 70%)'
        }}
      />

      {/* Orb 3: Sky Link Blue & Pure Cyan Pulse (Center-Right) */}
      <div 
        className={`absolute top-[32%] left-[22%] w-[620px] h-[620px] rounded-full blur-[120px] pointer-events-none animate-aurora-pulse transition-opacity duration-700 ${
          isDark ? 'opacity-45' : 'opacity-30'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(41,151,255,0.45) 0%, rgba(6,182,212,0.25) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(255,112,67,0.25) 0%, rgba(255,149,0,0.15) 50%, transparent 70%)'
        }}
      />

      {/* Orb 4: Emerald / Tech Mint (Bottom-Left) */}
      <div 
        className={`absolute bottom-10 left-10 w-[580px] h-[580px] rounded-full blur-[100px] pointer-events-none animate-aurora-2 transition-opacity duration-700 ${
          isDark ? 'opacity-40' : 'opacity-30'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(34,197,94,0.35) 0%, rgba(16,185,129,0.18) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(52,211,153,0.30) 0%, rgba(16,185,129,0.15) 50%, transparent 70%)'
        }}
      />

      {/* Orb 5: Apple Amber / BMW Warning Gold (Bottom-Right) */}
      <div 
        className={`absolute -bottom-24 -right-16 w-[600px] h-[600px] rounded-full blur-[110px] pointer-events-none animate-aurora-1 transition-opacity duration-700 ${
          isDark ? 'opacity-40' : 'opacity-30'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(245,158,11,0.40) 0%, rgba(255,149,0,0.20) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(28,105,212,0.30) 0%, rgba(0,102,177,0.15) 50%, transparent 70%)'
        }}
      />

      {/* ── 4. Shimmering Ambient Star Dust / Micro Sparks ── */}
      {isDark && (
        <>
          <div className="absolute top-[15%] left-[18%] w-1.5 h-1.5 rounded-full bg-white/70 blur-[0.5px] animate-twinkle" style={{ animationDelay: '0s' }} />
          <div className="absolute top-[28%] right-[22%] w-1 h-1 rounded-full bg-cyan-300/80 blur-[0.5px] animate-twinkle" style={{ animationDelay: '1.2s' }} />
          <div className="absolute top-[55%] left-[32%] w-1.5 h-1.5 rounded-full bg-purple-300/70 blur-[0.5px] animate-twinkle" style={{ animationDelay: '2.5s' }} />
          <div className="absolute top-[70%] right-[15%] w-1 h-1 rounded-full bg-white/80 blur-[0.5px] animate-twinkle" style={{ animationDelay: '0.8s' }} />
          <div className="absolute top-[85%] left-[12%] w-1.5 h-1.5 rounded-full bg-rose-300/70 blur-[0.5px] animate-twinkle" style={{ animationDelay: '1.8s' }} />
          <div className="absolute top-[42%] right-[40%] w-1 h-1 rounded-full bg-emerald-300/80 blur-[0.5px] animate-twinkle" style={{ animationDelay: '3.1s' }} />
        </>
      )}
    </div>
  )
}
