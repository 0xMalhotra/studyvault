import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ── Avatar helpers (same as Dashboard) ───────────────────────
const GRADIENTS = [
  ['#3b82f6','#6366f1'], ['#10b981','#06b6d4'], ['#f59e0b','#ef4444'],
  ['#8b5cf6','#ec4899'], ['#14b8a6','#3b82f6'], ['#f97316','#f59e0b'],
]
function avatarColors(str) {
  let h = 0
  for (let i = 0; i < (str?.length||0); i++) h = str.charCodeAt(i) + ((h<<5)-h)
  return GRADIENTS[Math.abs(h) % GRADIENTS.length]
}
function initials(email) {
  return email ? email.split('@')[0].slice(0,2).toUpperCase() : '?'
}

const MEDAL = ['🥇','🥈','🥉']
const sc = (s) => s >= 200 ? '#10b981' : s >= 100 ? '#f59e0b' : '#ef4444'

export default function Leaderboard() {
  const navigate = useNavigate()
  const [rows, setRows]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [filter, setFilter]     = useState('best') // best | avg | tests

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      // Fetch all results — we'll aggregate in JS
      // (For large scale, use a Postgres view instead)
      const { data, error } = await supabase
        .from('results')
        .select('user_id, score, correct, wrong, unattempted, created_at')

      if (error || !data) { setLoading(false); return }

      // Group by user_id
      const map = {}
      data.forEach(r => {
        if (!map[r.user_id]) {
          map[r.user_id] = { user_id: r.user_id, scores: [], correct: 0, wrong: 0 }
        }
        map[r.user_id].scores.push(r.score)
        map[r.user_id].correct += r.correct || 0
        map[r.user_id].wrong   += r.wrong   || 0
      })

      // Fetch display names from auth (only available for own user)
      // We'll use user_id short hash as display name for others
      const leaderboard = Object.values(map).map(u => ({
        user_id:  u.user_id,
        tests:    u.scores.length,
        best:     Math.max(...u.scores),
        avg:      Math.round(u.scores.reduce((a,b)=>a+b,0) / u.scores.length),
        accuracy: (u.correct+u.wrong) > 0 ? Math.round(u.correct/(u.correct+u.wrong)*100) : 0,
        isMe:     u.user_id === user?.id,
      }))

      setRows(leaderboard)
      setLoading(false)
    }
    init()
  }, [])

  const sorted = [...rows].sort((a, b) => {
    if (filter === 'best')  return b.best  - a.best
    if (filter === 'avg')   return b.avg   - a.avg
    if (filter === 'tests') return b.tests - a.tests
    return 0
  })

  const displayName = (row) => {
    if (row.isMe && currentUser?.email) return currentUser.email.split('@')[0]
    // Show anonymized ID for other users
    return 'Student ' + row.user_id.slice(0, 6).toUpperCase()
  }

  return (
    <div className="relative z-10 min-h-screen pt-20 pb-16 px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-slate-500 text-sm mt-1">Top performers across all PYQ tests</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-2xl w-fit mx-auto"
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
          {[['best','🏆 Best Score'],['avg','📈 Avg Score'],['tests','📝 Tests Taken']].map(([key,label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: filter===key ? 'rgba(255,255,255,0.09)':'transparent', color: filter===key ? '#e2e8f0':'#64748b' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-3xl overflow-hidden"
          style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.08)' }}>

          {loading ? (
            <div className="text-center py-16 text-slate-600 text-sm">Loading leaderboard…</div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-600 text-sm">No data yet. Be the first!</p>
              <button onClick={() => navigate('/pyq')}
                className="mt-4 px-5 py-2.5 rounded-2xl text-xs font-bold text-white"
                style={{ background:'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                Take a Test
              </button>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="grid grid-cols-12 px-5 py-3 text-xs text-slate-600 uppercase tracking-wider font-semibold"
                style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div className="col-span-1">#</div>
                <div className="col-span-5">Student</div>
                <div className="col-span-2 text-center">Best</div>
                <div className="col-span-2 text-center">Avg</div>
                <div className="col-span-2 text-center">Tests</div>
              </div>

              <div className="divide-y divide-white/5">
                {sorted.map((row, i) => {
                  const [c1, c2] = avatarColors(row.user_id)
                  const name     = displayName(row)
                  const rankColor = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : '#475569'
                  const color    = sc(row.best)

                  return (
                    <div
                      key={row.user_id}
                      className="grid grid-cols-12 items-center px-5 py-3.5 transition-colors"
                      style={{
                        background: row.isMe ? 'rgba(99,102,241,0.07)' : 'transparent',
                        borderLeft: row.isMe ? '2px solid rgba(99,102,241,0.5)' : '2px solid transparent',
                      }}
                    >
                      {/* Rank */}
                      <div className="col-span-1 font-bold text-sm" style={{ color: rankColor }}>
                        {i < 3 ? MEDAL[i] : i + 1}
                      </div>

                      {/* Avatar + name */}
                      <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background:`linear-gradient(135deg,${c1},${c2})` }}>
                          {initials(name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-200 truncate">
                            {name}
                            {row.isMe && <span className="ml-1.5 text-xs text-indigo-400">(you)</span>}
                          </p>
                          <p className="text-xs text-slate-600">{row.accuracy}% acc</p>
                        </div>
                      </div>

                      {/* Best */}
                      <div className="col-span-2 text-center font-bold text-sm" style={{ color }}>
                        {row.best}
                      </div>

                      {/* Avg */}
                      <div className="col-span-2 text-center text-sm text-slate-400">
                        {row.avg}
                      </div>

                      {/* Tests */}
                      <div className="col-span-2 text-center text-sm text-slate-400">
                        {row.tests}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {!loading && sorted.length > 0 && (
          <p className="text-center text-xs text-slate-700 mt-4">
            Showing {sorted.length} student{sorted.length>1?'s':''}. Rankings update after each test.
          </p>
        )}
      </div>
    </div>
  )
}
