import React from 'react'

interface BrandLogoProps {
  className?: string
  size?: number
  glow?: boolean
}

export function BrandLogo({ className = 'w-8 h-8', size = 32, glow = false }: BrandLogoProps) {
  const idPrefix = React.useId().replace(/:/g, '')

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {glow && (
        <div 
          className="absolute inset-0 rounded-full blur-md opacity-60 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(45,212,191,0.5) 0%, rgba(139,92,246,0.5) 100%)'
          }}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-sm"
      >
        <defs>
          {/* Main front ribbon gradient: Teal to Lilac */}
          <linearGradient id={`${idPrefix}-teal-lilac`} x1="15" y1="80" x2="55" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2DD4BF" />
            <stop offset="50%" stopColor="#A7F3D0" />
            <stop offset="100%" stopColor="#F5F3FF" />
          </linearGradient>

          {/* Secondary rear loop gradient: Lilac to Deep Violet/Purple */}
          <linearGradient id={`${idPrefix}-lilac-purple`} x1="50" y1="20" x2="85" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#EDE9FE" />
            <stop offset="40%" stopColor="#C084FC" />
            <stop offset="85%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>

          {/* Inner bridge shadow gradient for 3D depth */}
          <linearGradient id={`${idPrefix}-inner-fold`} x1="40" y1="45" x2="70" y2="75" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#4C1D95" />
          </linearGradient>

          <filter id={`${idPrefix}-soft-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#7C3AED" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Back purple loop / leg */}
        <path
          d="M 50 25 
             C 60 40, 75 62, 78 72 
             C 81 81, 74 88, 64 86 
             C 55 84, 48 74, 42 63
             L 54 53
             C 58 60, 63 68, 68 70
             C 71 71, 72 68, 71 65
             C 68 57, 56 38, 50 25 Z"
          fill={`url(#${idPrefix}-inner-fold)`}
          opacity="0.95"
        />

        {/* Back wing curve */}
        <path
          d="M 52 32
             C 62 48, 76 68, 80 77
             C 83 83, 78 89, 70 88
             C 63 87, 56 78, 50 68
             L 59 58
             C 63 65, 68 72, 72 73
             C 74 73, 75 70, 74 67
             C 70 59, 58 42, 52 32 Z"
          fill={`url(#${idPrefix}-lilac-purple)`}
          filter={`url(#${idPrefix}-soft-shadow)`}
        />

        {/* Front main stylized triangle loop (Mint/Teal to Lilac) */}
        <path
          d="M 46 16
             C 52 14, 57 18, 60 24
             L 62 29
             C 55 42, 42 62, 36 71
             C 32 77, 26 80, 21 75
             C 16 70, 18 62, 23 53
             L 41 22
             C 43 19, 44 17, 46 16 Z"
          fill="none"
        />

        {/* Crisp continuous 3D loop geometry */}
        <path
          d="M 48 16
             C 53 15, 57 19, 61 25
             C 66 33, 56 50, 47 62
             C 43 68, 38 73, 31 75
             C 23 77, 18 70, 20 62
             C 22 54, 28 42, 35 30
             L 45 18
             C 46 17, 47 16, 48 16 Z"
          fill={`url(#${idPrefix}-teal-lilac)`}
        />

        {/* Inner negative space cutout for the iconic 'A' loop */}
        <path
          d="M 46 29
             L 37 44
             C 32 52, 28 60, 28 63
             C 28 65, 30 66, 33 65
             C 36 64, 40 60, 43 55
             C 48 46, 52 37, 52 33
             C 52 30, 48 27, 46 29 Z"
          fill="#111827"
          opacity="0.08"
        />

        {/* Center core highlight */}
        <path
          d="M 47 18
             C 50 17, 53 20, 56 25
             C 58 29, 54 37, 48 45
             L 42 36
             C 45 30, 46 23, 47 18 Z"
          fill="#FFFFFF"
          opacity="0.65"
        />
      </svg>
    </div>
  )
}
