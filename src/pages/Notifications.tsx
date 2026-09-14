import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { BoardLayout } from '../components/layout/BoardLayout'
import { BoardPanel } from '../components/board/BoardPanel'
import { SignLabel } from '../components/board/SignLabel'
import { EmptyState, ErrorState } from '../components/feedback/EmptyState'
import { Skeleton } from '../components/primitives/Skeleton'
import { Seam } from '../components/primitives/Seam'
import { TextButton } from '../components/primitives/Controls'
import { DEMO_MODE, supabase } from '../supabase'
import { CentralNav } from '../components/dashboard/CentralNav'
import { ReadinessPanel } from '../components/dashboard/ReadinessPanel'
type Notification = { id: string; category: string; title: string; body: string; href: string | null; created_at: string; read_at: string | null }

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function Notifications() {
  const queryClient = useQueryClient()
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (DEMO_MODE) {
        return [
          { id: 'demo-1', category: 'result_announced', title: 'Standings are live', body: 'The latest approved activity is now reflected on the society board.', href: '/central?demo=1', created_at: new Date().toISOString(), read_at: null },
          { id: 'demo-2', category: 'milestone', title: 'A new signal came through', body: 'Teams are building momentum. Open Activity to see the approved contribution trail.', href: '/analytics?demo=1', created_at: new Date(Date.now() - 86400000).toISOString(), read_at: new Date(Date.now() - 43200000).toISOString() },
        ] satisfies Notification[]
      }
      const { data, error } = await supabase.rpc('get_my_notifications', {
        p_limit: 50,
        p_offset: 0,
      })
      if (error) throw error
      return data ?? []
    },
  })

  const notifications = (notificationsQuery.data ?? []) as Notification[]
  const unreadCount = notifications.filter((notification: Notification) => !notification.read_at).length

  async function markRead(id: string) {
    if (DEMO_MODE) {
      queryClient.setQueryData<Notification[]>(['notifications'], current =>
        (current ?? []).map(notification => notification.id === id ? { ...notification, read_at: new Date().toISOString() } : notification),
      )
      return
    }
    const { error } = await supabase.rpc('mark_notification_read', { p_notification_id: id })
    if (error) throw error
    await queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  async function markAllRead() {
    if (DEMO_MODE) {
      queryClient.setQueryData<Notification[]>(['notifications'], current =>
        (current ?? []).map(notification => ({ ...notification, read_at: notification.read_at ?? new Date().toISOString() })),
      )
      return
    }
    const { error } = await supabase.rpc('mark_all_notifications_read')
    if (error) throw error
    await queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  return (
    <BoardLayout
      topbar={
        <div className="flex items-center justify-between w-full">
          <span className="font-display font-bold text-sm text-chalk tracking-sign uppercase">AARVAK TSJ 2026 DASHBOARD</span>
          <TextButton onClick={() => window.history.back()}>Back</TextButton>
        </div>
      }
    >
      <CentralNav />
      <ReadinessPanel demo={DEMO_MODE} unavailable={notificationsQuery.isError} />
      <BoardPanel padded={false}>
        <div className="px-panel pt-panel pb-2 flex items-center justify-between gap-3">
          <SignLabel>Inbox {unreadCount > 0 ? `· ${unreadCount} unread` : ''}</SignLabel>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="label text-lamp/80 hover:text-lamp inline-flex items-center gap-1.5"
            >
              <CheckCheck size={14} aria-hidden="true" /> Mark all read
            </button>
          )}
        </div>
        <Seam />
        {notificationsQuery.isLoading ? (
          <div>{[...Array(4)].map((_, index) => <Skeleton key={index} variant="row" />)}</div>
        ) : notificationsQuery.isError ? (
          <div className="px-panel py-8">
            <ErrorState headline="Could not load notifications" body="The notification inbox failed to load." retry={() => void notificationsQuery.refetch()} />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState headline="Nothing new" body="Important updates will appear here." />
        ) : (
          <div className="flex flex-col">
            {notifications.map((notification: Notification) => (
              <div key={notification.id}>
                <div className={`m-2 flex gap-3 rounded-slot border border-seam dark:border-white/10 p-4 sm:p-5 ${notification.read_at ? 'bg-enamel dark:bg-[#121218]/70' : 'bg-lit dark:bg-[#181824]'}`}>
                  <Bell className="text-lamp shrink-0 mt-0.5" size={18} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-chalk font-medium">{notification.title}</p>
                      {!notification.read_at && (
                        <button type="button" onClick={() => void markRead(notification.id)} className="label text-lamp/80 hover:text-lamp shrink-0">
                          Mark read
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-chalk/70 mt-1">{notification.body}</p>
                    <p className="label text-dim mt-2">{formatDate(notification.created_at)}</p>
                  </div>
                </div>
                <Seam />
              </div>
            ))}
          </div>
        )}
      </BoardPanel>
    </BoardLayout>
  )
}
