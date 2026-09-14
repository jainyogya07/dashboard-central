import { FormEvent, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Send } from 'lucide-react'
import { BoardLayout } from '../components/layout/BoardLayout'
import { BoardPanel } from '../components/board/BoardPanel'
import { CentralNav } from '../components/dashboard/CentralNav'
import { ReadinessPanel } from '../components/dashboard/ReadinessPanel'
import { EmptyState, ErrorState } from '../components/feedback/EmptyState'
import { Skeleton } from '../components/primitives/Skeleton'
import { DEMO_MODE, supabase } from '../supabase'
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs'

type ChatMessage = { id: string; author: string; body: string; created_at: string }
const demoMessages: ChatMessage[] = [
  { id: 'demo-chat-1', author: 'AARVAK control', body: 'Welcome to the 75-day sprint. Keep proof attached to every submission.', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'demo-chat-2', author: 'ECHO crew', body: 'The next weekly challenge brief is ready for review.', created_at: new Date(Date.now() - 1800000).toISOString() },
]

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>(demoMessages)
  const [draft, setDraft] = useState('')
  const chatQuery = useQuery({
    queryKey: ['chat-messages'],
    queryFn: async (): Promise<ChatMessage[]> => {
      if (DEMO_MODE) return demoMessages
      const { data, error } = await supabase.rpc('get_chat_messages' as never)
      if (error) throw error
      return (Array.isArray(data) ? data : []) as ChatMessage[]
    },
    retry: false,
  })

  const currentMessages = DEMO_MODE ? messages : (chatQuery.data ?? [])
  async function send(event: FormEvent) {
    event.preventDefault()
    const body = draft.trim()
    if (!body) return
    if (DEMO_MODE) {
      setMessages(current => [...current, { id: `demo-chat-${Date.now()}`, author: 'You', body, created_at: new Date().toISOString() }])
      setDraft('')
      return
    }
    await supabase.rpc('send_chat_message' as never, { p_body: body, p_author: 'Yogay Jain (ASCEND)' } as any)
    setDraft('')
    await chatQuery.refetch()
  }

  return (
    <BoardLayout topbar={<div className="flex w-full items-center justify-between"><span className="font-display text-sm font-bold tracking-sign text-chalk">AARVAK TSJ 2026 DASHBOARD</span><span className="label text-lamp">CHAT</span></div>}>
      <CentralNav />
      <Breadcrumbs current="Member chat" />
      <ReadinessPanel demo={DEMO_MODE} unavailable={!DEMO_MODE && chatQuery.isError} />
      <BoardPanel padded={false}>
        <div className="border-b border-seam px-panel py-panel">
          <div className="flex items-center gap-3"><MessageCircle className="text-lamp" size={20} aria-hidden="true" /><div><p className="label text-lamp">Member chat</p><h1 className="mt-1 font-display text-2xl font-bold text-chalk">Talk, coordinate, ship.</h1></div></div>
          <p className="mt-2 text-sm text-muted">Keep coordination here. Private scores and unrevealed results never appear in chat.</p>
        </div>
        {!DEMO_MODE && chatQuery.isLoading ? <div className="space-y-3 p-panel"><Skeleton variant="row" /><Skeleton variant="row" /></div> :
          !DEMO_MODE && chatQuery.isError ? <div className="p-panel"><ErrorState headline="Chat is not deployed" body="No supported chat RPC is available in this Supabase project yet. Messages are not being faked." /></div> :
          currentMessages.length === 0 ? <EmptyState headline="No messages yet" body="Start the first team-safe conversation." /> :
          <div className="space-y-3 p-panel">{currentMessages.map(message => <article key={message.id} className="rounded-slot border border-seam bg-lit/70 p-3"><div className="flex justify-between gap-3"><strong className="text-sm text-chalk">{message.author}</strong><time className="label text-dim">{new Date(message.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</time></div><p className="mt-1 text-sm leading-6 text-chalk/80">{message.body}</p></article>)}</div>}
        <form onSubmit={send} className="flex gap-2 border-t border-seam p-panel">
          <label htmlFor="chat-message" className="sr-only">Message</label>
          <input id="chat-message" value={draft} onChange={event => setDraft(event.target.value)} placeholder="Write a message to sprint squads…" className="min-w-0 flex-1 rounded-slot border border-seam bg-recess px-3 py-2 text-sm text-chalk placeholder:text-dim" />
          <button type="submit" disabled={!draft.trim()} className="rounded-slot bg-lamp px-3 text-void transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message"><Send size={16} aria-hidden="true" /></button>
        </form>
      </BoardPanel>
    </BoardLayout>
  )
}
