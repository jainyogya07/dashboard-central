import React, { useState } from 'react'
import { getTeamConfig } from '../../config/teams'

export interface TeamLogoProps {
  teamName: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero'
  shape?: 'rounded' | 'circle'
  animated?: boolean
  floating?: boolean
  shadow?: boolean
  className?: string
}

const SIZE_MAP = {
  xs: 'w-6 h-6 rounded-md text-[10px]',
  sm: 'w-8 h-8 rounded-lg text-xs',
  md: 'w-11 h-11 rounded-[12px] text-sm',
  lg: 'w-16 h-16 rounded-[16px] text-base',
  xl: 'w-20 h-20 rounded-[18px] text-lg',
  hero: 'w-28 h-28 sm:w-32 sm:h-32 rounded-[22px] text-xl'
}

const CIRCLE_SIZE_MAP = {
  xs: 'w-6 h-6 rounded-full text-[10px]',
  sm: 'w-8 h-8 rounded-full text-xs',
  md: 'w-11 h-11 rounded-full text-sm',
  lg: 'w-16 h-16 rounded-full text-base',
  xl: 'w-20 h-20 rounded-full text-lg',
  hero: 'w-28 h-28 sm:w-32 sm:h-32 rounded-full text-xl'
}

export function TeamLogo({
  teamName,
  size = 'md',
  shape = 'rounded',
  animated = true,
  floating = false,
  shadow = false,
  className = ''
}: TeamLogoProps) {
  const [imgError, setImgError] = useState(false)
  const config = getTeamConfig(teamName)

  const sizeClass = shape === 'circle' ? CIRCLE_SIZE_MAP[size] : SIZE_MAP[size]
  const logoUrl = config?.logo
  const displayName = config?.name || teamName || 'Team'

  const shadowClass = shadow 
    ? (size === 'hero' || size === 'xl' ? 'apple-product-shadow-lg' : 'apple-product-shadow') 
    : ''
  
  const animClass = animated
    ? 'transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-0.5'
    : ''

  const floatClass = floating ? 'animate-float-slow' : ''

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-[#1d1d1f] border border-[#e0e0e0]/70 select-none ${sizeClass} ${shadowClass} ${animClass} ${floatClass} ${className}`}
      title={displayName}
    >
      {logoUrl && !imgError ? (
        <img
          src={logoUrl}
          alt={`${displayName} Logo`}
          className="w-full h-full object-cover object-center"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="font-semibold text-white tracking-wider">
          {displayName.slice(0, 2).toUpperCase()}
        </span>
      )}

      {/* Subtle Apple sheen reflection on hover */}
      {animated && (
        <div 
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
        />
      )}
    </div>
  )
}
