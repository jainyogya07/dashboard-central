import { ChevronRight, LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DEMO_MODE } from '../../supabase'

export function Breadcrumbs({ current, locked = false }: { current: string; locked?: boolean }) {
  const suffix = DEMO_MODE ? '?demo=1' : ''
  return (
    <div className="readability-strip flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-wider text-dim" aria-label="Breadcrumb">
      <Link className="transition-colors hover:text-lamp focus-visible:text-lamp" to={`/central${suffix}`}>Dashboard</Link>
      <ChevronRight size={12} aria-hidden="true" />
      <span className="text-muted">{current}</span>
      {locked && <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-amber/30 px-2 py-0.5 text-amber"><LockKeyhole size={11} aria-hidden="true" /> scores locked</span>}
    </div>
  )
}
