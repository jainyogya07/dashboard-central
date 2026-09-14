export function BoardPanel({ children, padded = true, className = '' }: { children: React.ReactNode, padded?: boolean, className?: string }) {
  return (
    <div className={`bg-white border border-seam shadow-sm rounded-panel overflow-hidden ${padded ? 'p-panel' : ''} ${className}`}>
      {children}
    </div>
  )
}
