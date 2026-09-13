import type { ReactNode } from 'react'

export function Starfield() {
  return null
}

export function Haze() {
  return <div className="absolute inset-0 bg-gradient-to-br from-white via-recess to-lit -z-10 pointer-events-none" aria-hidden="true" />
}

export function Wordmark({
  children,
  size = 'hero',
  className = '',
}: {
  children: string
  size?: 'hero' | 'board' | 'sm'
  glitch?: boolean
  className?: string
}) {
  const sizes = {
    hero: 'text-5xl md:text-7xl',
    board: 'text-3xl md:text-4xl',
    sm: 'text-2xl',
  }

  return (
    <h1 className={`font-display font-black text-chalk tracking-tight ${sizes[size]} ${className}`}>
      {children}
    </h1>
  )
}

export function VoidScreen({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`relative min-h-screen bg-recess overflow-hidden isolate ${className}`}>
      <Haze />
      {children}
    </div>
  )
}
