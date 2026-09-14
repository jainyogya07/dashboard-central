export function BoardPanel({ children, padded = true, className = '' }: { children: React.ReactNode, padded?: boolean, className?: string }) {
  return (
    <div className={`board-panel bg-white border border-seam shadow-sm rounded-panel overflow-hidden ${padded ? 'p-panel' : ''}`}>
      {children}
    </div>
  )
}
