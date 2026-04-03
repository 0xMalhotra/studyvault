import { useState, useRef } from 'react'

const EXAM_DATES = [
  { label: '22 Jan 2026', value: '2026-01-22' },
  { label: '23 Jan 2026', value: '2026-01-23' },
  { label: '24 Jan 2026', value: '2026-01-24' },
  { label: '28 Jan 2026', value: '2026-01-28' },
  { label: '29 Jan 2026', value: '2026-01-29' },
]
const SHIFTS = ['Shift 1', 'Shift 2']

const SUBJECT_COLORS = {
  Physics:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)' },
  Chemistry:   { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' },
  Mathematics: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
}

// Use relative URL — works on Vercel (same origin) and via vite proxy locally
const API_URL = '/api/calculate-score'

// ─── Sub-components ──────────────────────────────────────────────────────────
function GlassInput({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
        {label}
      </label>
      {children}
    </div>
  )
}

function StatCard({ label, value, color, icon, delay = '0ms' }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-2 animate-fade-up opacity-0"
      style={{ animationFillMode:'forwards', animationDelay:delay, background:`${color}0d`, border:`1px solid ${color}30` }}>
      <div className="text-2xl">{icon}</div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  )
}

function SubjectCard({ subject, data }) {
  const { color, bg, border } = SUBJECT_COLORS[subject] || { color:'#64748b', bg:'rgba(100,116,139,0.1)', border:'rgba(100,116,139,0.25)' }
  const total = data.correct + data.wrong + data.unattempted || 1
  const pct   = Math.round((data.correct / total) * 100)
  return (
    <div className="rounded-2xl p-4" style={{ background:bg, border:`1px solid ${border}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background:color }}/>
          <span className="text-xs font-semibold" style={{ color }}>{subject}</span>
        </div>
        <span className="text-lg font-bold" style={{ color }}>{data.score}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background:'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width:`${pct}%`, background:`linear-gradient(90deg,${color},${color}88)` }}/>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-emerald-400">✓ {data.correct}</span>
        <span className="text-red-400">✗ {data.wrong}</span>
        <span className="text-slate-500">— {data.unattempted}</span>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 mt-6">
      {[160, 100, 300].map((h, i) => (
        <div key={i} className="rounded-3xl animate-pulse"
          style={{ height:h, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)' }}/>
      ))}
    </div>
  )
}

function AnalysisRow({ item, index }) {
  const cfg = {
    correct:     { bg:'rgba(16,185,129,0.07)',   border:'rgba(16,185,129,0.2)',   badge:'rgba(16,185,129,0.15)',  badgeText:'#10b981', label:'✓ Correct',  marks:'+4' },
    wrong:       { bg:'rgba(239,68,68,0.07)',     border:'rgba(239,68,68,0.2)',    badge:'rgba(239,68,68,0.15)',   badgeText:'#ef4444', label:'✗ Wrong',    marks: item.type==='numerical' ? '0' : '-1' },
    unattempted: { bg:'rgba(100,116,139,0.04)',   border:'rgba(100,116,139,0.1)', badge:'rgba(100,116,139,0.12)', badgeText:'#64748b', label:'— Skipped',  marks:'0' },
    unknown:     { bg:'rgba(100,116,139,0.04)',   border:'rgba(100,116,139,0.08)',badge:'rgba(100,116,139,0.1)',  badgeText:'#475569', label:'? N/A',       marks:'—' },
  }[item.status] || {}
  const subColor = SUBJECT_COLORS[item.subject]?.color || '#94a3b8'

  return (
    <tr style={{ background:cfg.bg, borderBottom:`1px solid ${cfg.border}` }}>
      <td className="px-4 py-3 text-xs text-slate-600 font-mono">{index+1}</td>
      <td className="px-4 py-3 text-xs font-mono text-slate-400">{item.questionId}</td>
      <td className="px-4 py-3">
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:`${subColor}18`, color:subColor }}>
          {item.subject}
        </span>
      </td>
      <td className="px-4 py-3 text-xs font-mono text-slate-300 max-w-32 truncate">
        {item.chosenOptionId || <span className="text-slate-600 italic">—</span>}
      </td>
      <td className="px-4 py-3 text-xs font-mono text-slate-300 max-w-32 truncate">
        {item.correctOptionId || '—'}
      </td>
      <td className="px-4 py-3">
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
          style={{ background:cfg.badge, color:cfg.badgeText }}>
          {cfg.label}
        </span>
      </td>
      <td className="px-4 py-3 text-right text-xs font-bold font-mono" style={{ color:cfg.badgeText }}>
        {cfg.marks}
      </td>
    </tr>
  )
}

function shareScore(result) {
  const text = `📊 JEE Main 2026 Score (via StudyVault)\n\n🎯 ${result.score}/300\n✅ ${result.correct} correct  ❌ ${result.wrong} wrong  ⏭️ ${result.unattempted} skipped\n📈 Accuracy: ${result.accuracy}%\n\nCalculate yours → studyvault.vercel.app/calculator`
  if (navigator.share) navigator.share({ title:'My JEE Score', text })
  else { navigator.clipboard.writeText(text); alert('Score copied to clipboard!') }
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ScoreCalculatorPage() {
  const [url, setUrl]         = useState('')
  const [date, setDate]       = useState('')
  const [shift, setShift]     = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const resultRef = useRef()

  const isValidUrl = url.trim().includes('cdn3.digialm.com')
  const canSubmit  = url && date && shift && !loading

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e8f0',
    borderRadius: 14,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    fontSize: 14,
  }

  const handleCalculate = async () => {
    if (!canSubmit) return
    if (!isValidUrl) { setError('URL must contain cdn3.digialm.com'); return }
    setError(''); setResult(null); setLoading(true)

    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseSheetUrl: url.trim(), examDate: date, shift }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || `Server error ${resp.status}`)
      setResult(data)
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 150)
    } catch (err) {
      // Show friendly message for network errors (common on localhost without proxy)
      if (err.message === 'Failed to fetch') {
        setError('Network error: make sure you are running `vercel dev` for local testing, or deploy to Vercel.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const filtered = result?.analysis?.filter(a => {
    if (activeTab === 'all')         return true
    if (activeTab === 'correct')     return a.status === 'correct'
    if (activeTab === 'wrong')       return a.status === 'wrong'
    if (activeTab === 'unattempted') return a.status === 'unattempted'
    return true
  }) || []

  const scoreColor = result
    ? result.score >= 200 ? '#10b981' : result.score >= 100 ? '#f59e0b' : '#ef4444'
    : '#3b82f6'

  return (
    <div className="relative z-10 min-h-screen pt-20 pb-16 px-4" style={{ background:'var(--bg-primary)' }}>

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex:0 }}>
        <div className="absolute top-20 left-1/3 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background:'radial-gradient(circle,#3b82f6,transparent)' }}/>
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full opacity-8 blur-3xl"
          style={{ background:'radial-gradient(circle,#8b5cf6,transparent)' }}/>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">

        {/* Hero */}
        <div className="text-center mb-10 animate-fade-up opacity-0" style={{ animationFillMode:'forwards' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.3)', color:'#60a5fa' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>
            JEE Main 2026 · Jan Attempt
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
            Score{' '}
            <span style={{ background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Calculator
            </span>
          </h1>
          <p className="text-slate-400 text-base max-w-md mx-auto leading-relaxed">
            Paste your Digialm response sheet link for instant score analysis.{' '}
            <span className="text-slate-300 font-medium">No login required.</span>
          </p>
        </div>

        {/* Input card */}
        <div className="rounded-3xl p-7 mb-6 animate-fade-up opacity-0"
          style={{ animationFillMode:'forwards', animationDelay:'80ms', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', backdropFilter:'blur(20px)' }}>

          <div className="space-y-5">
            {/* URL */}
            <GlassInput label="Response Sheet Link (cdn3)">
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://cdn3.digialm.com/per/g28/pub/..."
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor='rgba(99,102,241,0.5)'}
                  onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
                />
                {url && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold">
                    {isValidUrl
                      ? <span className="text-emerald-400">✓ Valid</span>
                      : <span className="text-red-400">✗ Must be cdn3.digialm.com</span>}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1.5">
                Login to NTA portal → My Application → Response Sheet → copy the link
              </p>
            </GlassInput>

            {/* Date + Shift */}
            <div className="grid grid-cols-2 gap-4">
              <GlassInput label="Exam Date">
                <select value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, cursor:'pointer' }}
                  onFocus={e => e.target.style.borderColor='rgba(99,102,241,0.5)'}
                  onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}>
                  <option value="" style={{ background:'#0d1120' }}>Select date…</option>
                  {EXAM_DATES.map(d => (
                    <option key={d.value} value={d.value} style={{ background:'#0d1120' }}>{d.label}</option>
                  ))}
                </select>
              </GlassInput>

              <GlassInput label="Shift">
                <div className="flex gap-2">
                  {SHIFTS.map(s => (
                    <button key={s} onClick={() => setShift(s)}
                      className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all duration-200"
                      style={{
                        background: shift===s ? 'rgba(99,102,241,0.2)':'rgba(255,255,255,0.05)',
                        border: shift===s ? '1px solid rgba(99,102,241,0.5)':'1px solid rgba(255,255,255,0.1)',
                        color: shift===s ? '#a5b4fc':'#64748b',
                        transform: shift===s ? 'scale(1.02)':'scale(1)',
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </GlassInput>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-2xl"
                style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
                <span className="text-red-400 flex-shrink-0 mt-0.5">⚠</span>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Button */}
            <button onClick={handleCalculate} disabled={!canSubmit}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background:'linear-gradient(135deg,#3b82f6,#6366f1,#8b5cf6)',
                boxShadow: canSubmit ? '0 8px 32px rgba(99,102,241,0.35)':'none',
              }}
              onMouseEnter={e => { if(canSubmit) e.currentTarget.style.transform='translateY(-2px) scale(1.005)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='none' }}>
              {loading
                ? <span className="flex items-center justify-center gap-3">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    Fetching & Analysing…
                  </span>
                : '⚡ Calculate My Score'
              }
            </button>
          </div>
        </div>

        {loading && <LoadingSkeleton/>}

        {/* Results */}
        {result && !loading && (
          <div ref={resultRef} className="space-y-4">

            {/* Score banner */}
            <div className="rounded-3xl p-7 text-center relative overflow-hidden animate-fade-up opacity-0"
              style={{ animationFillMode:'forwards', background:'rgba(255,255,255,0.03)', border:`1px solid ${scoreColor}30` }}>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                <div className="w-64 h-64 rounded-full blur-3xl" style={{ background:scoreColor }}/>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Your Score</p>
              <div>
                <span className="text-7xl font-extrabold"
                  style={{ background:`linear-gradient(135deg,${scoreColor},${scoreColor}bb)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  {result.score}
                </span>
                <span className="text-3xl font-bold text-slate-600">/300</span>
              </div>
              <p className="text-slate-400 text-sm mt-3 mb-5">
                {result.score>=250?'🎉 Outstanding!':result.score>=180?'🔥 Excellent!':result.score>=120?'📚 Keep pushing!':'💪 Every attempt teaches something!'}
              </p>
              <div className="max-w-sm mx-auto mb-5">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Accuracy</span>
                  <span className="font-semibold text-slate-300">{result.accuracy}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.07)' }}>
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width:`${result.accuracy}%`, background:`linear-gradient(90deg,${scoreColor},${scoreColor}88)` }}/>
                </div>
              </div>
              <button onClick={() => shareScore(result)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-semibold transition-all"
                style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color:'#94a3b8' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.11)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.07)'}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                </svg>
                Share Score
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Correct"     value={result.correct}     color="#10b981" icon="✅" delay="50ms"/>
              <StatCard label="Wrong"       value={result.wrong}       color="#ef4444" icon="❌" delay="100ms"/>
              <StatCard label="Unattempted" value={result.unattempted} color="#64748b" icon="⏭️" delay="150ms"/>
            </div>

            {/* Subject breakdown */}
            {result.subjectBreakdown?.length > 0 && (
              <div className="rounded-3xl p-5 animate-fade-up opacity-0"
                style={{ animationFillMode:'forwards', animationDelay:'180ms', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-4">Subject Breakdown</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {result.subjectBreakdown.map(s => (
                    <SubjectCard key={s.subject} subject={s.subject} data={s}/>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis table */}
            <div className="rounded-3xl overflow-hidden animate-fade-up opacity-0"
              style={{ animationFillMode:'forwards', animationDelay:'220ms', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3"
                style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                <div>
                  <p className="text-sm font-semibold text-slate-300">Detailed Analysis</p>
                  <p className="text-xs text-slate-600 mt-0.5">{result.totalParsed} questions parsed</p>
                </div>
                <div className="flex gap-1 p-1 rounded-xl" style={{ background:'rgba(255,255,255,0.04)' }}>
                  {[['all',`All (${result.analysis.length})`],['correct',`✓ ${result.correct}`],['wrong',`✗ ${result.wrong}`],['unattempted',`— ${result.unattempted}`]].map(([key,label]) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background:activeTab===key?'rgba(255,255,255,0.09)':'transparent', color:activeTab===key?'#e2e8f0':'#64748b' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-auto max-h-[60vh]" style={{ scrollbarWidth:'thin' }}>
                <table className="w-full text-left" style={{ borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'rgba(255,255,255,0.04)', position:'sticky', top:0, zIndex:10 }}>
                      {['#','Question ID','Subject','Your Answer','Correct Answer','Status','Marks'].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0
                      ? <tr><td colSpan={7} className="text-center py-10 text-slate-600 text-sm">No questions in this category</td></tr>
                      : filtered.map((item, i) => <AnalysisRow key={item.questionId} item={item} index={i}/>)
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={() => { setResult(null); setUrl(''); setDate(''); setShift(''); window.scrollTo({ top:0, behavior:'smooth' }) }}
              className="w-full py-3 rounded-2xl text-sm text-slate-500 hover:text-slate-300 transition-colors"
              style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
              ← Calculate Another Score
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
