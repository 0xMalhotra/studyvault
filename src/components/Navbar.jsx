import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const Navbar = () => {
  const location = useLocation()
  const navigate  = useNavigate()
  const path      = location.pathname
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (path.startsWith('/pyq/test')) return null

  const isHome        = path === '/'
  const isPractice    = path.startsWith('/practice')
  const isPYQ         = path.startsWith('/pyq')
  const isCalculator  = path.startsWith('/calculator')
  const isDashboard   = path === '/dashboard'
  const isLeaderboard = path === '/leaderboard'

  const modeBadge = isPractice
    ? { label: 'Practice Mode',    color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)',  dot: 'bg-blue-400'   }
    : isPYQ && !path.startsWith('/pyq/result')
    ? { label: 'PYQ Mode',         color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  dot: 'bg-amber-400'  }
    : path.startsWith('/pyq/result')
    ? { label: 'Result',           color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  dot: 'bg-emerald-400'}
    : isCalculator
    ? { label: 'Score Calculator', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)', dot: 'bg-violet-400' }
    : isDashboard
    ? { label: 'Dashboard',        color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.25)',  dot: 'bg-indigo-400' }
    : isLeaderboard
    ? { label: 'Leaderboard',      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  dot: 'bg-amber-400'  }
    : null

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3.5"
      style={{
        background: 'rgba(8,11,20,0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* ── Logo ── */}
      <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-transform duration-300 group-hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          📚
        </div>
        <span className="font-display font-bold text-base tracking-tight text-white hidden sm:block">
          Study<span style={{ color: '#3b82f6' }}>Vault</span>
        </span>
      </Link>

      {/* ── Center mode badge ── */}
      {modeBadge && (
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
          style={{ background: modeBadge.bg, border: `1px solid ${modeBadge.border}`, color: modeBadge.color }}
        >
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${modeBadge.dot}`} />
          {modeBadge.label}
        </div>
      )}

      {/* ── Right actions ── */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Home button — shown on every non-home page */}
        {!isHome && (
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors duration-200 px-3 py-1.5 rounded-xl"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            <span className="hidden sm:inline">Home</span>
          </Link>
        )}

        {/* Home page quick-nav links */}
        {isHome && (
          <div className="flex items-center gap-2">
            <Link to="/practice" className="text-xs px-3 py-1.5 rounded-xl transition-colors"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#3b82f6' }}>
              Practice
            </Link>
            <Link to="/pyq" className="text-xs px-3 py-1.5 rounded-xl transition-colors"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}>
              PYQ
            </Link>
            <Link to="/calculator" className="text-xs px-3 py-1.5 rounded-xl transition-colors"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#8b5cf6' }}>
              ⚡ Calc
            </Link>
          </div>
        )}

        {/* Leaderboard — always visible when logged in */}
        {user && (
          <Link
            to="/leaderboard"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-colors"
            style={{
              background: isLeaderboard ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.07)',
              border: '1px solid rgba(245,158,11,0.25)',
              color: '#fbbf24',
            }}
          >
            🏆<span className="hidden sm:inline ml-1">Ranks</span>
          </Link>
        )}

        {/* Auth section */}
        {user ? (
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-colors"
              style={{
                background: isDashboard ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: '#818cf8',
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-xl transition-colors text-slate-500 hover:text-slate-300"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="text-xs px-3 py-1.5 rounded-xl font-medium transition-all"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff' }}
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}

export default Navbar
