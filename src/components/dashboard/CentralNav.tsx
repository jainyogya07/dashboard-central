import { BarChart3, Bell, LayoutDashboard, MessageCircle } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { DEMO_MODE, supabase } from '../../supabase'
import { useQuery } from '@tanstack/react-query'

const suffix = DEMO_MODE ? '?demo=1' : ''

export function CentralNav() {
  const location = useLocation()
  const unread = useQuery({
    queryKey: ['nav-unread'],
    queryFn: async () => {
      if (DEMO_MODE) return { inbox: 1, chat: 1 }
      const { data } = await supabase.rpc('get_my_notifications', { p_limit: 50, p_offset: 0 })
      return { inbox: Array.isArray(data) ? data.filter((item: { read_at?: string | null }) => !item.read_at).length : 0, chat: 0 }
    },
    staleTime: 30_000,
  })
  const links = [
    { href: `/central${suffix}`, label: 'Standings', icon: LayoutDashboard },
    { href: `/analytics${suffix}`, label: 'Activity', icon: BarChart3 },
    { href: `/notifications${suffix}`, label: 'Inbox', icon: Bell },
    { href: `/chat${suffix}`, label: 'Chat', icon: MessageCircle },
  ]

  return (
    <nav aria-label="Dashboard sections" className="flex items-center gap-1 overflow-x-auto rounded-slot border border-seam bg-recess/70 p-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = location.pathname === href.split('?')[0] || (href.split('?')[0] === '/central' && location.pathname === '/')
        return (
          <Link
            key={href}
            to={href}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-slot px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              active
                ? 'bg-lamp text-void shadow-glow'
                : 'text-muted hover:bg-lit hover:text-chalk'
            }`}
          >
            <Icon size={14} aria-hidden="true" />
            {label}{((label === 'Inbox' && unread.data?.inbox) || (label === 'Chat' && unread.data?.chat)) ? <span className="nav-badge" aria-label={`${label} unread`}>{label === 'Inbox' ? unread.data?.inbox : unread.data?.chat}</span> : null}
          </Link>
        )
      })}
    </nav>
  )
}
