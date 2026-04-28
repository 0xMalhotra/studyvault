import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const PYQHomePage = () => {
  const navigate = useNavigate()
  const [papers, setPapers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    const fetchPapers = async () => {
      const { data, error } = await supabase
        .from('papers')
        .select('*')
        .eq('is_active', true)
        .order('exam_date', { ascending: false })

      if (error) { setError(error.message); setLoading(false); return }

      // Group: year → attempt → shifts
      const grouped = {}
      for (const p of data) {
        if (!grouped[p.year]) grouped[p.year] = {}
        if (!grouped[p.year][p.attempt]) grouped[p.year][p.attempt] = []
        grouped[p.year][p.attempt].push(p)
      }

      // Convert to array sorted by year desc
      const structured = Object.entries(grouped)
        .sort(([a], [b]) => b - a)
        .map(([year, attempts]) => ({
          year,
          attempts: Object.entries(attempts).map(([attemptLabel, shifts]) => ({
            id:     `${year}-${attemptLabel}`,
            label:  attemptLabel,
            shifts: shifts.sort((a, b) =>
              new Date(a.exam_date) - new Date(b.exam_date) ||
              a.shift.localeCompare(b.shift)
            ),
          })),
        }))

      setPapers(structured)
      setLoading(false)
    }

    fetchPapers()
  }, [])

  if (loading) return (
    <div className="relative z-10 pt-28 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading papers…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="relative z-10 pt-28 text-center text-red-400 text-sm">
      Failed to load papers: {error}
    </div>
  )

  return (
    <div className="relative z-10 min-h-screen px-4 pb-16 pt-24">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            JEE Main PYQ Papers
          </div>
          <h1 className="font-display text-4xl font-extrabold text-white tracking-tight mb-3">
            Previous Year <span style={{ color: '#f59e0b' }}>Papers</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Full papers with Physics, Chemistry & Mathematics — timed exam mode
          </p>
        </div>

        {papers.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            No papers available yet. Add papers to the Supabase <code>papers</code> table.
          </div>
        ) : (
          <div className="space-y-8">
            {papers.map(({ year, attempts }) => (
              <div key={year}>
                {/* Year heading */}
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-display text-xl font-bold text-white">{year}</h2>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  <span className="text-xs text-slate-600">
                    {attempts.reduce((n, a) => n + a.shifts.length, 0)} shifts
                  </span>
                </div>

                {attempts.map(attempt => (
                  <div key={attempt.id} className="mb-5">
                    {/* Attempt label */}
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 ml-1">
                      {attempt.label}
                    </p>

                    {/* Shift cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {attempt.shifts.map(paper => {
                        const shiftColor = paper.shift === 'Morning' ? '#3b82f6' : '#8b5cf6'
                        const date = new Date(paper.exam_date).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })

                        return (
                          <button
                            key={paper.id}
                            onClick={() => navigate(`/pyq/test/${paper.id}`)}
                            className="glass-card p-5 text-left group transition-all duration-200"
                            onMouseEnter={e => {
                              e.currentTarget.style.boxShadow = `0 16px 48px ${shiftColor}22`
                              e.currentTarget.style.borderColor = shiftColor + '44'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.boxShadow = ''
                              e.currentTarget.style.borderColor = ''
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                                  style={{ background: `${shiftColor}18`, border: `1px solid ${shiftColor}28` }}>
                                  {paper.shift === 'Morning' ? '🌅' : '🌆'}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-white">{paper.shift} Shift</p>
                                  <p className="text-xs text-slate-500">{date}</p>
                                </div>
                              </div>
                              <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors mt-1"
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>

                            <div className="flex gap-2 mt-2">
                              {['Physics', 'Chemistry', 'Maths'].map((s, i) => (
                                <span key={s} className="text-xs px-2 py-0.5 rounded-full"
                                  style={{
                                    background: ['rgba(59,130,246,0.1)','rgba(16,185,129,0.1)','rgba(245,158,11,0.1)'][i],
                                    color: ['#60a5fa','#34d399','#fbbf24'][i],
                                    border: `1px solid ${['rgba(59,130,246,0.2)','rgba(16,185,129,0.2)','rgba(245,158,11,0.2)'][i]}`
                                  }}>
                                  {s}
                                </span>
                              ))}
                              <span className="text-xs px-2 py-0.5 rounded-full ml-auto"
                                style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b' }}>
                                75 Qs
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PYQHomePage
