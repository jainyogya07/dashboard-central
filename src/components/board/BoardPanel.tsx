export function BoardPanel({ children, padded = true }: { children: React.ReactNode, padded?: boolean }) {
  return (
    <div className={`bg-white border border-seam shadow-sm rounded-panel overflow-hidden ${padded ? 'p-panel' : ''}`}>
      {children}
    </div>
  )
}
