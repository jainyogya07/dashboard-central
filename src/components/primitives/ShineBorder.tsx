import React, { ReactNode } from 'react'

interface ShineBorderProps {
  children: ReactNode
  className?: string
  color?: string[]
  borderWidth?: number
  duration?: number
}

export function ShineBorder({
  children,
  className = '',
  color = ['#2DD4BF', '#A78BFA', '#8B5CF6'],
  borderWidth = 1.5,
  duration = 8,
}: ShineBorderProps) {
  return (
    <div
      className={`relative rounded-2xl p-[1.5px] overflow-hidden ${className}`}
      style={{
        background: `conic-gradient(from 0deg, ${color.join(', ')}, ${color[0]})`,
      }}
    >
      <div
        className="absolute inset-[-100%] animate-[spin_8s_linear_infinite]"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${color[0]} 60deg, ${color[1]} 180deg, ${color[2]} 300deg, transparent 360deg)`,
        }}
      />
      <div className="relative bg-white rounded-[15px] h-full w-full z-10">
        {children}
      </div>
    </div>
  )
}
