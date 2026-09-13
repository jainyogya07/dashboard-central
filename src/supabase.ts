import { TEAMS, SPRINT_INFO } from './config/teams'

function load<T>(key: string, def: T): T {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : def
  } catch { return def }
}
function save(key: string, val: any) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {}
}

// Ensure clean migration to authentic TSJ 2026 PDF data (no arbitrary points or fake names)
const SEED_VERSION = 'tsj_2026_pdf_v5_clean'
if (localStorage.getItem('mock_seed_version') !== SEED_VERSION) {
  localStorage.removeItem('mock_users')
  localStorage.removeItem('mock_profiles')
  localStorage.removeItem('mock_submissions')
  localStorage.removeItem('mock_submission_proofs')
  localStorage.removeItem('mock_session')
  localStorage.setItem('mock_seed_version', SEED_VERSION)
}

let session = load('mock_session', null as any)
const users = load('mock_users', [] as any[])
const profiles = load('mock_profiles', [] as any[])
let submissions = load('mock_submissions', [] as any[])
let submission_proofs = load('mock_submission_proofs', [] as any[])


// Find team ASCEND for user Yogay Jain
const ascendTeam = TEAMS.find(t => t.name === 'ASCEND') || TEAMS[0]

// --- PRE-SEED AUTHENTIC ACCOUNT (Yogay Jain - Team ASCEND, Technical) ---
if (!users.find(u => u.email === 'admin@example.com' || u.email === 'yogay@aarvak.in')) {
  const seedUser = { id: 'user-yogay-jain', email: 'yogay@aarvak.in' }
  const seedProfile = {
    id: seedUser.id,
    full_name: 'Yogay Jain',
    department: 'Technical',
    team_id: ascendTeam.id,
    is_active: true
  }
  const seedSession = { 
    user: seedUser, 
    access_token: 'mock-token.' + btoa(JSON.stringify({ user_role: 'lead' })) + '.sig' 
  }
  
  users.push(seedUser)
  session = seedSession
  
  save('mock_users', users)
  save('mock_session', session)
}
// ------------------------

// Pre-seed all 43 authentic team members from Tech-Sprint'26-27.pdf
if (profiles.length === 0) {
  const generatedProfiles: any[] = []
  
  TEAMS.forEach(team => {
    team.members.forEach(m => {
      const isYogay = m.name === 'Yogay Jain'
      generatedProfiles.push({
        id: isYogay ? 'user-yogay-jain' : `m-${team.slug}-${m.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        full_name: m.name,
        team_id: team.id,
        sprint_track: m.department,
        dept_code: m.deptCode,
        is_active: true
      })
    })
  })
  
  profiles.push(...generatedProfiles)
  save('mock_profiles', profiles)
}

// 75 Days Sprint Config from Tech Sprint Journey PDF (TSJ / 2026)
const sprint_config = { 
  sprint_start: new Date(Date.now() - 4 * 86400 * 1000).toISOString(), 
  total_days: SPRINT_INFO.totalDays // 75 Days
}


const listeners: any[] = []
function notifyAuth(event: string, newSession: any) {
  session = newSession
  save('mock_session', session)
  listeners.forEach(l => l(event, newSession))
}

const auth = {
  getSession: async () => ({ data: { session }, error: null }),
  refreshSession: async () => ({ data: { session }, error: null }),
  signUp: async ({ email }: any) => {
    if (users.find(u => u.email === email)) {
      return { data: { user: { identities: [] } }, error: null }
    }
    const user = { id: crypto.randomUUID(), email }
    users.push(user)
    save('mock_users', users)
    const newSession = { user, access_token: 'mock-token.' + btoa(JSON.stringify({ user_role: 'lead' })) + '.sig' }
    notifyAuth('SIGNED_IN', newSession)
    return { data: { user, session: newSession }, error: null }
  },
  signInWithPassword: async ({ email }: any) => {
    const user = users.find(u => u.email === email)
    if (!user) return { data: { session: null }, error: { code: 'invalid_credentials', message: 'Invalid login credentials' } }
    const newSession = { user, access_token: 'mock-token.' + btoa(JSON.stringify({ user_role: 'lead' })) + '.sig' }
    notifyAuth('SIGNED_IN', newSession)
    return { data: { session: newSession }, error: null }
  },
  signOut: async () => {
    notifyAuth('SIGNED_OUT', null)
    return { error: null }
  },
  resend: async () => ({ error: null }),
  onAuthStateChange: (cb: any) => {
    listeners.push(cb)
    return { data: { subscription: { unsubscribe: () => {
      const idx = listeners.indexOf(cb)
      if (idx > -1) listeners.splice(idx, 1)
    } } } }
  }
}

// ── REAL-TIME EVENT BUS & CROSS-TAB BROADCAST ──
const REALTIME_CHANNEL_NAME = 'aarvak-live-sync-v1'
let broadcastChan: BroadcastChannel | null = null
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChan = new BroadcastChannel(REALTIME_CHANNEL_NAME)
  }
} catch (e) {
  console.warn('BroadcastChannel not available, falling back to local events')
}

interface RealtimeListener {
  id: string
  table: string
  callback: (payload: any) => void
}
const realtimeListeners: RealtimeListener[] = []

export function notifyRealtime(table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) {
  // 1. Notify intra-tab listeners
  realtimeListeners.forEach(l => {
    if (l.table === '*' || l.table === table) {
      try { l.callback({ table, eventType: event, new: payload, old: null }) } catch (err) { console.error(err) }
    }
  })

  // 2. Dispatch custom DOM event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aarvak-realtime-update', {
      detail: { table, event, payload, timestamp: Date.now() }
    }))
  }

  // 3. Post to cross-tab BroadcastChannel
  if (broadcastChan) {
    try {
      broadcastChan.postMessage({ table, event, payload, timestamp: Date.now() })
    } catch (e) {
      console.warn('Failed to broadcast across tabs:', e)
    }
  }
}

// Listen for cross-tab updates
if (broadcastChan) {
  broadcastChan.onmessage = (ev) => {
    const data = ev.data
    if (!data) return
    // Reload data caches from localStorage
    if (data.table === 'submissions') {
      submissions = load('mock_submissions', [])
    }
    if (data.table === 'profiles') {
      const freshProfiles = load('mock_profiles', [])
      profiles.length = 0
      profiles.push(...freshProfiles)
    }
    // Notify local subscribers
    realtimeListeners.forEach(l => {
      if (l.table === '*' || l.table === data.table) {
        try { l.callback({ table: data.table, eventType: data.event, new: data.payload, old: null }) } catch (err) {}
      }
    })
    // Also trigger window event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aarvak-realtime-update', { detail: data }))
    }
  }
}

class QueryBuilder {
  table: string
  filters: any[] = []
  
  constructor(table: string) { this.table = table }

  select() { return this }
  insert(data: any) {
    const rows = Array.isArray(data) ? data : [data]
    if (this.table === 'profiles') {
      profiles.push(...rows)
      save('mock_profiles', profiles)
      rows.forEach(r => notifyRealtime('profiles', 'INSERT', r))
    } else if (this.table === 'submissions') {
      submissions.push(...rows)
      save('mock_submissions', submissions)
      rows.forEach(r => notifyRealtime('submissions', 'INSERT', r))
    } else if (this.table === 'submission_proofs') {
      submission_proofs.push(...rows)
      save('mock_submission_proofs', submission_proofs)
      rows.forEach(r => notifyRealtime('submission_proofs', 'INSERT', r))
    }
    return Promise.resolve({ data, error: null })
  }
  update(data: any) { 
    if (this.table === 'submissions') {
      save('mock_submissions', submissions)
      notifyRealtime('submissions', 'UPDATE', data)
    } else if (this.table === 'profiles') {
      save('mock_profiles', profiles)
      notifyRealtime('profiles', 'UPDATE', data)
    } else if (this.table === 'submission_proofs') {
      save('mock_submission_proofs', submission_proofs)
      notifyRealtime('submission_proofs', 'UPDATE', data)
    }
    return this 
  }
  
  eq(col: string, val: any) {
    this.filters.push((row: any) => row[col] === val)
    return this
  }
  in(col: string, vals: any[]) {
    this.filters.push((row: any) => vals.includes(row[col]))
    return this
  }
  order() { return this }
  limit(n: number) { 
    this.filters.push({ _limit: n })
    return this 
  }
  
  _getRows() {
    let rows: any[] = []
    if (this.table === 'profiles') rows = profiles
    if (this.table === 'teams') rows = TEAMS
    if (this.table === 'submissions') rows = submissions
    if (this.table === 'submission_proofs') rows = submission_proofs
    if (this.table === 'sprint_config') rows = [sprint_config]
    
    let limitNum: number | null = null
    for (const f of this.filters) {
      if (typeof f === 'function') {
        rows = rows.filter(f)
      } else if (f && f._limit) {
        limitNum = f._limit
      }
    }
    if (limitNum !== null) {
      rows = rows.slice(0, limitNum)
    }
    return rows
  }

  then(resolve: any) {
    return resolve({ data: this._getRows(), error: null })
  }
  
  single() {
    const rows = this._getRows()
    return Promise.resolve({ data: rows[0] || null, error: rows.length ? null : new Error('No row') })
  }
  
  maybeSingle() {
    const rows = this._getRows()
    return Promise.resolve({ data: rows[0] || null, error: null })
  }
}

export const supabase = {
  auth,
  from: (table: string) => new QueryBuilder(table),
  notifyRealtime,
  functions: {
    invoke: async <T = any>(fn: string, opts?: any): Promise<{ data: T | null; error: any }> => {
      return { data: null, error: null }
    }
  },
  // Helper to sync external submissions coming from API / Webhook
  syncExternalDeliverable: (sub: any) => {
    // Avoid duplicate
    const exists = submissions.find((s: any) => s.id === sub.id)
    if (!exists) {
      submissions.unshift(sub)
      save('mock_submissions', submissions)
    }
    notifyRealtime('submissions', 'INSERT', sub)
    return sub
  },
  rpc: async (fn: string, args: any) => {
    const currentUser = session?.user
    const userProfile = profiles.find(p => p.id === currentUser?.id)
    const teamId = userProfile?.team_id || TEAMS[0].id
    const teamSubs = submissions.filter(s => s.team_id === teamId && s.status === 'verified')

    if (fn === 'get_team_total') {
      // Points come strictly from verified submissions (0 if none)
      const total = teamSubs.reduce((sum, s) => sum + (s.net_points || 0), 0)
      return { data: total, error: null }
    }
    if (fn === 'get_board_feed') {
      const feed = teamSubs.map(s => {
        const p = profiles.find(pr => pr.id === s.member_id)
        const actLabel = typeof s.activity_catalog === 'object' ? s.activity_catalog?.label : s.activity_catalog
        const actLevel = typeof s.activity_catalog === 'object' ? s.activity_catalog?.level : ''
        return {
          id: s.id,
          member_name: p?.full_name || 'Team Engineer',
          activity_label: actLabel || s.description || 'Verified Milestone',
          activity_level: actLevel || 'Production Gold',
          occurred_on: s.submitted_at,
          posted_at: s.decided_at || s.submitted_at
        }
      })
      return { data: feed, error: null }
    }
    if (fn === 'get_my_submissions') {
      const mine = submissions.filter(s => s.member_id === currentUser?.id)
      const formatted = mine.map(s => ({
        id: s.id,
        activity_label: typeof s.activity_catalog === 'object' ? s.activity_catalog?.label : s.description,
        activity_level: typeof s.activity_catalog === 'object' ? s.activity_catalog?.level : '',
        status: s.status,
        decision_note: s.status === 'needs_info' ? 'Please provide the PR link and benchmark run' : 'Verified by Lead Reviewer.'
      }))
      return { data: formatted, error: null }
    }
    if (fn === 'get_submission_proofs') {
      const sId = args?.p_submission_id
      const proofs = submission_proofs.filter((sp: any) => sp.submission_id === sId)
      return { data: proofs, error: null }
    }
    return { data: null, error: null }
  },
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: any) => ({ data: { path }, error: null }),
      remove: async (paths: string[]) => ({ data: null, error: null }),
      createSignedUrl: async (path: string, ttl: number) => ({ data: { signedUrl: path }, error: null }),
    })
  },

  channel: (channelName: string) => {
    const registeredIds: string[] = []
    const channelObj = {
      on: (eventType: string, filter: { event: string; schema?: string; table: string }, callback: Function) => {
        const id = `${channelName}-${filter.table}-${Math.random().toString(36).substring(2, 8)}`
        realtimeListeners.push({ id, table: filter.table, callback: (p) => callback(p) })
        registeredIds.push(id)
        return channelObj
      },
      subscribe: () => ({
        unsubscribe: () => {
          registeredIds.forEach(regId => {
            const idx = realtimeListeners.findIndex(l => l.id === regId)
            if (idx > -1) realtimeListeners.splice(idx, 1)
          })
        }
      })
    }
    return channelObj
  },
  removeChannel: () => {}
} as any

