import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'

// ─── Exam date/shift config ────────────────────────────────────────────────
const EXAM_DATES = [
  { value: '2026-01-22', label: '22 January 2026' },
  { value: '2026-01-23', label: '23 January 2026' },
  { value: '2026-01-24', label: '24 January 2026' },
  { value: '2026-01-28', label: '28 January 2026' },
  { value: '2026-01-29', label: '29 January 2026' },
]

const SHIFTS = [
  { value: 'shift1', label: 'Shift 1 — Morning (9:00 AM)' },
  { value: 'shift2', label: 'Shift 2 — Evening (3:00 PM)' },
]

const SUBJECT_COLORS = {
  Physics:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)'  },
  Chemistry:   { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)'  },
  Mathematics: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)'  },
  Other:       { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.3)'  },
}

// ─── Sub-components ────────────────────────────────────────────────────────

const GlassCard = ({ children, className = '', style = {} }) => (
  <div
    className={`rounded-2xl ${className}`}
    style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.09)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      ...style,
    }}
  >
    {children}
  </div>
)

const InputField = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
      {label}
    </label>
    {children}
  </div>
)

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '12px',
  color: '#e2e8f0',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

const LoadingSpinner = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

const StatCard = ({ label, value, color, icon }) => (
  <div
    className="flex flex-col items-center justify-center p-5 rounded-2xl"
    style={{ background: `${color}12`, border: `1px solid ${color}30` }}
  >
    <span className="text-2xl mb-1">{icon}</span>
    <span className="font-display text-2xl font-extrabold" style={{ color }}>{value}</span>
    <span className="text-xs text-slate-500 mt-0.5">{label}</span>
  </div>
)

const StatusBadge = ({ status }) => {
  const map = {
    correct:    { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', color: '#10b981', label: 'Correct', icon: '✓' },
    wrong:      { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)',  color: '#ef4444', label: 'Wrong',   icon: '✗' },
    unattempted:{ bg: 'rgba(100,116,139,0.12)',border: 'rgba(100,116,139,0.3)', color: '#64748b', label: 'Skipped', icon: '—' },
  }
  const s = map[status] || map.unattempted
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
    >
      {s.icon} {s.label}
    </span>
  )
}

const RowBackground = {
  correct:     'rgba(16,185,129,0.05)',
  wrong:       'rgba(239,68,68,0.05)',
  unattempted: 'transparent',
}

// ─── Main Component ────────────────────────────────────────────────────────
const ScoreCalculatorPage = () => {
  const [url, setUrl]         = useState('')
  const [examDate, setExamDate] = useState('')
  const [shift, setShift]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [result, setResult]   = useState(null)
  const [filter, setFilter]   = useState('all')  // 'all' | 'correct' | 'wrong' | 'unattempted'
  const resultRef = useRef(null)

  const isValid = url.startsWith('https://cdn3.digialm.com') && examDate && shift

  const handleCalculate = async () => {
    if (!isValid) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/calculate-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseSheetUrl: url, examDate, shift }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }

      setResult(data)
      // Smooth scroll to results
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    if (!result) return
    const text = `🎯 My JEE Main Score: ${result.score}/300\n✅ Correct: ${result.correct} | ❌ Wrong: ${result.wrong} | ⬜ Skipped: ${result.unattempted}\n📊 Accuracy: ${result.accuracy}%\nCalculated on StudyVault`
    if (navigator.share) {
      navigator.share({ title: 'My JEE Main Score', text })
    } else {
      navigator.clipboard.writeText(text)
      alert('Score copied to clipboard!')
    }
  }

  const scorePercent = result ? Math.max(0, (result.score / result.maxScore) * 100) : 0
  const scoreColor = result
    ? result.score >= 200 ? '#10b981'
    : result.score >= 120 ? '#f59e0b'
    : '#ef4444'
    : '#3b82f6'

  const filteredAnalysis = result?.analysis?.filter(q => {
    if (filter === 'all') return true
    return q.status === filter
  }) || []

  return (
    <div className="relative z-10 min-h-screen px-4 pb-20 pt-24">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div style={{
          position: 'absolute', top: '-150px', left: '-100px',
          width: '500px', height: '500px', borderRadius: '50%', filter: 'blur(80px)',
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', right: '-80px',
          width: '400px', height: '400px', borderRadius: '50%', filter: 'blur(80px)',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
        }} />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-8 animate-fade-in opacity-0"
          style={{ animationFillMode: 'forwards' }}>
          <Link to="/" className="hover:text-slate-400 transition-colors">Home</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span style={{ color: '#8b5cf6' }}>Score Calculator</span>
        </div>

        {/* ── Hero ── */}
        <div className="text-center mb-10 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-slate-400 mb-5"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            JEE Main 2026 — January Attempt
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
            <span style={{
              background: 'linear-gradient(135deg, #a78bfa, #60a5fa, #34d399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Score Calculator
            </span>
          </h1>
          <p className="text-slate-500 text-base max-w-md mx-auto">
            Paste your Digialm response sheet link. Get your score instantly — no login required.
          </p>
        </div>

        {/* ── Input Card ── */}
        <GlassCard
          className="p-6 mb-5 animate-fade-up opacity-0 stagger-1"
          style={{ animationFillMode: 'forwards' }}
        >
          <div className="space-y-4">
            {/* URL input */}
            <InputField label="Digialm Response Sheet URL">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://cdn3.digialm.com/per/g28/pub/..."
                  style={{ ...inputStyle, paddingLeft: '36px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px' }}
                  onFocus={e => { e.target.style.borderColor = '#8b5cf6'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.15)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
              {url && !url.startsWith('https://cdn3.digialm.com') && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  URL must start with https://cdn3.digialm.com
                </p>
              )}
            </InputField>

            <div className="grid grid-cols-2 gap-3">
              {/* Date selector */}
              <InputField label="Exam Date">
                <select
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  style={{ ...inputStyle, padding: '10px 12px', cursor: 'pointer' }}
                  onFocus={e => { e.target.style.borderColor = '#8b5cf6'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.15)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' }}
                >
                  <option value="" style={{ background: '#0d1120' }}>Select date...</option>
                  {EXAM_DATES.map(d => (
                    <option key={d.value} value={d.value} style={{ background: '#0d1120' }}>{d.label}</option>
                  ))}
                </select>
              </InputField>

              {/* Shift selector */}
              <InputField label="Shift">
                <select
                  value={shift}
                  onChange={e => setShift(e.target.value)}
                  style={{ ...inputStyle, padding: '10px 12px', cursor: 'pointer' }}
                  onFocus={e => { e.target.style.borderColor = '#8b5cf6'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.15)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' }}
                >
                  <option value="" style={{ background: '#0d1120' }}>Select shift...</option>
                  {SHIFTS.map(s => (
                    <option key={s.value} value={s.value} style={{ background: '#0d1120' }}>{s.label}</option>
                  ))}
                </select>
              </InputField>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Calculate button */}
            <button
              onClick={handleCalculate}
              disabled={!isValid || loading}
              className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all duration-200"
              style={{
                background: isValid && !loading
                  ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)'
                  : 'rgba(255,255,255,0.06)',
                color: isValid && !loading ? '#fff' : '#475569',
                cursor: isValid && !loading ? 'pointer' : 'not-allowed',
                boxShadow: isValid && !loading ? '0 8px 30px rgba(139,92,246,0.35)' : 'none',
                transform: isValid && !loading ? 'scale(1)' : 'scale(1)',
              }}
              onMouseEnter={e => { if (isValid && !loading) e.currentTarget.style.transform = 'scale(1.02)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {loading ? (
                <>
                  <LoadingSpinner />
                  Fetching & Calculating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Calculate My Score
                </>
              )}
            </button>
          </div>
        </GlassCard>

        {/* ── How it works ── */}
        {!result && !loading && (
          <GlassCard className="p-5 animate-fade-up opacity-0 stagger-2" style={{ animationFillMode: 'forwards' }}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">How it works</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { step: '01', text: 'Paste your Digialm response sheet URL', icon: '🔗' },
                { step: '02', text: 'Select exam date and shift', icon: '📅' },
                { step: '03', text: 'Get instant score with full analysis', icon: '📊' },
              ].map(({ step, text, icon }) => (
                <div key={step} className="text-center">
                  <div className="text-2xl mb-2">{icon}</div>
                  <div className="text-xs font-mono text-violet-400 mb-1">{step}</div>
                  <p className="text-xs text-slate-500 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-40 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
            </div>
            <div className="h-64 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
          </div>
        )}

        {/* ── Results ── */}
        {result && (
          <div ref={resultRef} className="space-y-4 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>

            {/* Score card */}
            <GlassCard className="p-7" style={{ border: `1px solid ${scoreColor}30` }}>
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Score ring */}
                <div className="relative flex-shrink-0">
                  <svg className="w-32 h-32" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke={scoreColor} strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - scorePercent / 100)}`}
                      transform="rotate(-90 50 50)"
                      style={{ transition: 'stroke-dashoffset 1.2s ease' }}
                    />
                    <text x="50" y="46" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Syne">
                      {result.score}
                    </text>
                    <text x="50" y="60" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="DM Sans">
                      /{result.maxScore}
                    </text>
                  </svg>
                </div>

                {/* Score details */}
                <div className="flex-1 text-center md:text-left">
                  <div className="text-slate-500 text-sm mb-1">
                    {EXAM_DATES.find(d => d.value === result.examDate)?.label} · {result.shift === 'shift1' ? 'Shift 1' : 'Shift 2'}
                  </div>
                  <div className="font-display text-5xl font-extrabold mb-1" style={{ color: scoreColor }}>
                    {result.score}
                    <span className="text-xl text-slate-600 font-normal">/300</span>
                  </div>
                  <div className="flex items-center gap-3 justify-center md:justify-start mt-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                      style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
                      <span className="font-bold">{result.accuracy}%</span> Accuracy
                    </div>
                    <div className="text-xs text-slate-600">
                      {result.totalQuestions} questions parsed
                    </div>
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all duration-200"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Correct"   value={result.correct}     color="#10b981" icon="✓" />
              <StatCard label="Wrong"     value={result.wrong}       color="#ef4444" icon="✗" />
              <StatCard label="Skipped"   value={result.unattempted} color="#64748b" icon="—" />
            </div>

            {/* Subject breakdown */}
            {result.subjects && Object.keys(result.subjects).filter(s => s !== 'Other').length > 0 && (
              <GlassCard className="p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Subject-wise Breakdown</p>
                <div className="space-y-3">
                  {Object.entries(result.subjects)
                    .filter(([sub]) => sub !== 'Other' && (result.subjects[sub].correct + result.subjects[sub].wrong + result.subjects[sub].unattempted > 0))
                    .map(([sub, data]) => {
                      const sc = SUBJECT_COLORS[sub] || SUBJECT_COLORS.Other
                      const total = data.correct + data.wrong + data.unattempted
                      const pct = total > 0 ? (data.correct / total) * 100 : 0
                      return (
                        <div key={sub}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: sc.color }} />
                              <span className="text-sm font-medium text-white">{sub}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-emerald-400">✓ {data.correct}</span>
                              <span className="text-red-400">✗ {data.wrong}</span>
                              <span className="font-bold" style={{ color: sc.color }}>{data.score} pts</span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, background: sc.color }} />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </GlassCard>
            )}

            {/* Analysis table */}
            <GlassCard className="overflow-hidden">
              {/* Table header */}
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-sm font-semibold text-white">Detailed Analysis</p>
                {/* Filter tabs */}
                <div className="flex items-center gap-1">
                  {[
                    { key: 'all',         label: `All (${result.analysis.length})` },
                    { key: 'correct',     label: `✓ ${result.correct}` },
                    { key: 'wrong',       label: `✗ ${result.wrong}` },
                    { key: 'unattempted', label: `— ${result.unattempted}` },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150"
                      style={{
                        background: filter === tab.key ? 'rgba(139,92,246,0.2)' : 'transparent',
                        border: `1px solid ${filter === tab.key ? 'rgba(139,92,246,0.4)' : 'transparent'}`,
                        color: filter === tab.key ? '#a78bfa' : '#64748b',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sticky table header */}
              <div className="overflow-x-auto">
                <div style={{ maxHeight: '400px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.04)', position: 'sticky', top: 0, zIndex: 10 }}>
                        <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider">#</th>
                        <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider">Question ID</th>
                        <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider">Your Answer</th>
                        <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider">Correct Answer</th>
                        <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider">Type</th>
                        <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider">Status</th>
                        <th className="text-right px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider">Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAnalysis.map((q, i) => {
                        const marks = q.status === 'correct' ? '+4'
                          : q.status === 'wrong' && q.questionType === 'mcq' ? '-1' : '0'
                        const marksColor = q.status === 'correct' ? '#10b981'
                          : q.status === 'wrong' && q.questionType === 'mcq' ? '#ef4444' : '#64748b'

                        return (
                          <tr
                            key={q.questionId}
                            style={{
                              background: RowBackground[q.status],
                              borderBottom: '1px solid rgba(255,255,255,0.04)',
                            }}
                          >
                            <td className="px-4 py-3 text-slate-600 font-mono">{i + 1}</td>
                            <td className="px-4 py-3 font-mono text-slate-300">{q.questionId}</td>
                            <td className="px-4 py-3 font-mono text-slate-400">
                              {q.chosenOptionId || <span className="text-slate-600 italic">—</span>}
                            </td>
                            <td className="px-4 py-3 font-mono text-emerald-400">{q.correctOptionId}</td>
                            <td className="px-4 py-3">
                              <span className="px-1.5 py-0.5 rounded text-slate-500 uppercase text-xs"
                                style={{ background: 'rgba(255,255,255,0.05)' }}>
                                {q.questionType === 'numerical' ? 'NUM' : 'MCQ'}
                              </span>
                            </td>
                            <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                            <td className="px-4 py-3 text-right font-bold font-mono" style={{ color: marksColor }}>
                              {marks}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {filteredAnalysis.length === 0 && (
                    <div className="text-center py-10 text-slate-600 text-sm">
                      No questions match this filter.
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Recalculate */}
            <div className="text-center">
              <button
                onClick={() => { setResult(null); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors py-2 px-5 rounded-xl"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              >
                ↺ Calculate Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScoreCalculatorPage
