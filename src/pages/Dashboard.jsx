import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ── Avatar helpers ─────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  ['#3b82f6','#6366f1'], ['#10b981','#06b6d4'], ['#f59e0b','#ef4444'],
  ['#8b5cf6','#ec4899'], ['#14b8a6','#3b82f6'], ['#f97316','#f59e0b'],
]
function avatarColors(email) {
  let h = 0
  for (let i = 0; i < (email?.length || 0); i++) h = email.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length]
}
function initials(email) {
  return email ? email.split('@')[0].slice(0, 2).toUpperCase() : '?'
}

// ── Sparkline ─────────────────────────────────────────────────
function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null
  const W = 100, H = 36, P = 3
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = P + (i / (data.length - 1)) * (W - P * 2)
    const y = H - P - ((v - min) / range) * (H - P * 2)
    return `${x},${y}`
  }).join(' ')
  const id = `sp${color.replace('#','')}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline points={`${P},${H} ${pts} ${W-P},${H}`} fill={`url(#${id})`} stroke="none"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  )
}

// ── Subject bar ───────────────────────────────────────────────
function SubjectBar({ label, color, correct, wrong, unattempted }) {
  const total = correct + wrong + unattempted || 1
  const pct = Math.round((correct / total) * 100)
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-semibold" style={{ color }}>{label}</span>
        <span className="text-xs text-slate-500">{pct}% accuracy</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color},${color}88)` }}
        />
      </div>
      <div className="flex gap-4 text-xs">
        <span className="text-emerald-400">✓ {correct}</span>
        <span className="text-red-400">✗ {wrong}</span>
        <span className="text-slate-600">— {unattempted}</span>
      </div>
    </div>
  )
}

const SUBJECTS = [
  { key: 'phy', label: 'Physics',     color: '#3b82f6' },
  { key: 'che', label: 'Chemistry',   color: '#10b981' },
  { key: 'mat', label: 'Mathematics', color: '#f59e0b' },
]

export default function Dashboard() {
  const navigate   = useNavigate()
  const fileRef    = useRef()
  const [user, setUser]         = useState(null)
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }
      setUser(user)
      const saved = localStorage.getItem(`avatar_${user.id}`)
      if (saved) setAvatarUrl(saved)
      const { data, error } = await supabase
        .from('results').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!error && data) setResults(data)
      setLoading(false)
    }
    init()
  }, [navigate])

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const b64 = ev.target.result
      localStorage.setItem(`avatar_${user.id}`, b64)
      setAvatarUrl(b64)
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // ── Derived stats ─────────────────────────────────────────
  const total       = results.length
  const latest      = results[0] ?? null
  const best        = total > 0 ? Math.max(...results.map(r => r.score)) : null
  const avg         = total > 0 ? Math.round(results.reduce((s,r) => s + r.score, 0) / total) : null
  const totC        = results.reduce((s,r) => s + (r.correct||0), 0)
  const totW        = results.reduce((s,r) => s + (r.wrong||0), 0)
  const totU        = results.reduce((s,r) => s + (r.unattempted||0), 0)
  const accuracy    = (totC+totW) > 0 ? Math.round(totC/(totC+totW)*100) : 0
  const sparkData   = [...results].reverse().slice(-10).map(r => r.score)
  const trend       = results.length >= 2 ? results[0].score - results[1].score : null

  // Per-subject aggregated
  const subjectTotals = SUBJECTS.map(({ key, label, color }) => ({
    label, color,
    correct:     results.reduce((s,r) => s + (r[`${key}_correct`]||0), 0),
    wrong:       results.reduce((s,r) => s + (r[`${key}_wrong`]||0), 0),
    unattempted: results.reduce((s,r) => s + (r[`${key}_unattempted`]||0), 0),
  }))

  const sc = (s) => s === null ? '#64748b' : s >= 200 ? '#10b981' : s >= 100 ? '#f59e0b' : '#ef4444'
  const [c1, c2] = avatarColors(user?.email)

  const fmt = (ts) => new Date(ts).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
  const fmtTime = (ts) => new Date(ts).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })

  return (
    <div className="relative z-10 min-h-screen pt-20 pb-16 px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto">

        {/* ── PROFILE HEADER ── */}
        <div className="rounded-3xl p-5 mb-4 flex flex-col sm:flex-row items-center sm:items-start gap-5"
          style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-bold text-white select-none"
              style={{ background: avatarUrl ? 'transparent' : `linear-gradient(135deg,${c1},${c2})`, border:'2px solid rgba(255,255,255,0.12)' }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="pfp" className="w-full h-full object-cover"/>
                : initials(user?.email)
              }
            </div>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background:'rgba(99,102,241,0.9)', border:'2px solid var(--bg-primary)' }}
              title="Change profile picture">
              {uploading
                ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
              }
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange}/>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <p className="text-white font-bold text-lg">{user?.email?.split('@')[0]}</p>
            <p className="text-slate-500 text-sm mt-0.5">{user?.email}</p>
            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              <span className="text-xs px-2.5 py-1 rounded-lg" style={{ background:'rgba(59,130,246,0.1)', color:'#60a5fa', border:'1px solid rgba(59,130,246,0.2)' }}>🎯 JEE Aspirant</span>
              {total > 0 && <span className="text-xs px-2.5 py-1 rounded-lg" style={{ background:'rgba(16,185,129,0.1)', color:'#34d399', border:'1px solid rgba(16,185,129,0.2)' }}>📝 {total} test{total>1?'s':''} taken</span>}
              {accuracy > 0 && <span className="text-xs px-2.5 py-1 rounded-lg" style={{ background:'rgba(245,158,11,0.1)', color:'#fbbf24', border:'1px solid rgba(245,158,11,0.2)' }}>⚡ {accuracy}% accuracy</span>}
            </div>
          </div>

          <button onClick={handleLogout}
            className="text-xs px-4 py-2 rounded-xl text-slate-500 hover:text-slate-300 transition-colors self-start"
            style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
            Sign out
          </button>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 mb-4 p-1 rounded-2xl w-fit"
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
          {[['overview','📊 Overview'],['subjects','🔬 Subjects'],['history','📋 History']].map(([tab,label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: activeTab===tab ? 'rgba(255,255,255,0.09)':'transparent', color: activeTab===tab ? '#e2e8f0':'#64748b' }}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-600 text-sm">Loading your data…</div>
        ) : total === 0 ? (
          <div className="rounded-3xl p-12 text-center"
            style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-5xl mb-4">📭</div>
            <p className="text-white font-semibold text-lg mb-1">No tests yet</p>
            <p className="text-slate-500 text-sm mb-6">Take a PYQ test to see your stats here</p>
            <button onClick={() => navigate('/pyq')}
              className="px-6 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background:'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
              Start a PYQ Test →
            </button>
          </div>

        ) : activeTab === 'overview' ? (
          <div className="space-y-4">
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label:'Tests Taken',   value:total,          color:'#3b82f6', icon:'📝' },
                { label:'Best Score',    value:best??'—',      color:'#10b981', icon:'🏆' },
                { label:'Avg Score',     value:avg??'—',       color:'#f59e0b', icon:'📈' },
                { label:'Accuracy',      value:accuracy+'%',   color:'#8b5cf6', icon:'🎯' },
              ].map(({ label, value, color, icon }) => (
                <div key={label} className="rounded-2xl p-4"
                  style={{ background:`${color}0a`, border:`1px solid ${color}20` }}>
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-xl font-bold" style={{ color }}>{value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Score trend */}
            <div className="rounded-3xl p-5"
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Latest Score</p>
                  <p className="text-3xl font-bold mt-1" style={{ color: sc(latest?.score??null) }}>
                    {latest?.score??'—'}<span className="text-slate-600 text-sm font-normal"> / 300</span>
                  </p>
                  {trend !== null && (
                    <p className="text-xs mt-1" style={{ color: trend>=0 ? '#10b981':'#ef4444' }}>
                      {trend>=0?'▲':'▼'} {Math.abs(trend)} pts from previous test
                    </p>
                  )}
                </div>
                <div className="mt-2"><Sparkline data={sparkData} color={sc(avg)}/></div>
              </div>
              <div className="flex gap-5 text-xs pt-4 mt-3" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-emerald-400">✓ {totC} correct</span>
                <span className="text-red-400">✗ {totW} wrong</span>
                <span className="text-slate-600">— {totU} unattempted</span>
              </div>
            </div>

            <button onClick={() => navigate('/pyq')}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
              style={{ background:'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
              Take Another Test →
            </button>
          </div>

        ) : activeTab === 'subjects' ? (
          /* ── SUBJECTS TAB ── */
          <div className="space-y-3">
            {subjectTotals.map(({ label, color, correct, wrong, unattempted }) => (
              <div key={label} className="rounded-3xl p-5"
                style={{ background:`${color}08`, border:`1px solid ${color}20` }}>
                <SubjectBar label={label} color={color} correct={correct} wrong={wrong} unattempted={unattempted}/>
              </div>
            ))}

            {/* Per-subject score comparison */}
            <div className="rounded-3xl p-5"
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-4">Latest Test — Subject Scores</p>
              {latest && SUBJECTS.map(({ key, label, color }) => {
                const c = latest[`${key}_correct`]||0
                const w = latest[`${key}_wrong`]||0
                const s = c*4 - w
                const pct = Math.max(0, Math.round((s/100)*100))
                return (
                  <div key={key} className="flex items-center gap-3 mb-3">
                    <span className="text-xs w-20 flex-shrink-0" style={{ color }}>{label}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width:`${pct}%`, background:`linear-gradient(90deg,${color},${color}77)` }}/>
                    </div>
                    <span className="text-xs font-bold w-12 text-right" style={{ color }}>{s} pts</span>
                  </div>
                )
              })}
            </div>
          </div>

        ) : (
          /* ── HISTORY TAB ── */
          <div className="rounded-3xl overflow-hidden"
            style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-sm font-semibold text-slate-300">All Tests</p>
              <p className="text-xs text-slate-600">{total} total</p>
            </div>
            <div className="divide-y divide-white/5 max-h-[65vh] overflow-y-auto" style={{ scrollbarWidth:'thin' }}>
              {results.map((r, i) => {
                const color = sc(r.score)
                const acc = (r.correct+r.wrong)>0 ? Math.round(r.correct/(r.correct+r.wrong)*100) : 0
                return (
                  <div key={r.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background:`${color}15`, color, border:`1px solid ${color}30` }}>
                      {i+1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color }}>
                        {r.score} <span className="text-slate-600 font-normal text-xs">/ 300</span>
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">{fmt(r.created_at)} · {fmtTime(r.created_at)}</p>
                    </div>
                    <div className="flex gap-3 text-xs flex-shrink-0">
                      <span className="text-emerald-400">✓{r.correct}</span>
                      <span className="text-red-400">✗{r.wrong}</span>
                      <span className="text-slate-600">—{r.unattempted}</span>
                    </div>
                    <div className="text-xs px-2 py-0.5 rounded-lg flex-shrink-0 hidden sm:block"
                      style={{ background:`${color}12`, color, border:`1px solid ${color}25` }}>
                      {acc}%
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
