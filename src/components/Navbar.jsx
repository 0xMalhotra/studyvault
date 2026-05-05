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

  if (path.startsWith('/pyq/test')) return null

  const isHome        = path === '/'
  const isPractice    = path.startsWith('/practice')
  const isPYQ         = path.startsWith('/pyq')
  const isCalculator  = path.startsWith('/calculator')
  const isDashboard   = path === '/dashboard'
  const isLeaderboard = path === '/leaderboard'

  const modeBadge = isPractice
    ? { label: 'Practice Mode',    color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  dot: 'bg-emerald-400' }
    : isPYQ && !path.startsWith('/pyq/result')
    ? { label: 'PYQ Mode',         color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  dot: 'bg-amber-400'  }
    : path.startsWith('/pyq/result')
    ? { label: 'Result',           color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  dot: 'bg-emerald-400'}
    : isCalculator
    ? { label: 'Score Calculator', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)', dot: 'bg-violet-400' }
    : isDashboard
    ? { label: 'Dashboard',        color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)',  dot: 'bg-blue-400'    }
    : isLeaderboard
    ? { label: 'Leaderboard',      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  dot: 'bg-amber-400'  }
    : null

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 py-4"
      style={{
        background: 'rgba(5,7,10,0.6)',
        backdropFilter: 'blur(32px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Logo ── */}
      <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all duration-300 group-hover:scale-110 shadow-lg bg-white/5 border border-white/10">
          🚀
        </div>
        <span className="font-display font-black text-xl tracking-tighter text-white hidden sm:block uppercase">
          STUDY<span className="text-emerald-500">VAULT</span>
        </span>
      </Link>

      {/* ── Center Mode Pill ── */}
      {modeBadge && (
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-2xl animate-fade-in"
          style={{ 
            background: modeBadge.bg, 
            border: `1px solid ${modeBadge.border}`,
            color: modeBadge.color 
          }}
        >
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${modeBadge.dot}`} style={{ boxShadow: `0 0 12px ${modeBadge.color}` }} />
          {modeBadge.label}
        </div>
      )}

      {/* ── Right Actions ── */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="hidden md:flex items-center gap-8 mr-4 border-r border-white/10 pr-8">
          <Link to="/" className={`text-[11px] font-black tracking-[0.1em] uppercase transition-all ${isHome ? 'text-white' : 'text-slate-500 hover:text-slate-200'}`}>
            Home
          </Link>
          {user && (
            <>
              <Link to="/leaderboard" className={`text-[11px] font-black tracking-[0.1em] uppercase transition-all ${isLeaderboard ? 'text-white' : 'text-slate-500 hover:text-slate-200'}`}>
                Ranks
              </Link>
              <Link to="/dashboard" className={`text-[11px] font-black tracking-[0.1em] uppercase transition-all ${isDashboard ? 'text-white' : 'text-slate-500 hover:text-slate-200'}`}>
                Dashboard
              </Link>
            </>
          )}
        </div>

        {user ? (
          <button onClick={handleLogout}
            className="px-6 py-2.5 rounded-xl text-[11px] font-black tracking-widest uppercase text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-white/5">
            Log out
          </button>
        ) : (
          <Link to="/login"
            className="px-7 py-2.5 rounded-xl text-[11px] font-black tracking-widest uppercase text-white shadow-xl transition-all active:scale-95 bg-gradient-to-br from-emerald-500 to-emerald-700 hover:shadow-emerald-500/20">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  )
}

export default Navbar
