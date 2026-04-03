import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import OptionButton from '../../components/shared/OptionButton'

const subjectColors = { Physics: '#3b82f6', Chemistry: '#10b981', Mathematics: '#f59e0b' }

const PYQResultPage = () => {
  const { state } = useLocation()
  const navigate  = useNavigate()
  const [activeTab, setActiveTab] = useState('all')   // 'all' | 'correct' | 'incorrect' | 'unattempted'
  const [expandedQ, setExpandedQ] = useState(null)

  if (!state?.questions) {
    return (
      <div className="relative z-10 pt-28 text-center text-slate-500">
        No result data found.{' '}
        <button onClick={() => navigate('/pyq')} className="underline">Go to PYQ</button>
      </div>
    )
  }

  const { answers, questions } = state

  // ── Scoring: +4 correct, -1 wrong, 0 unattempted ──
  // answers[idx] is { answer, marked, visited } — extract .answer for comparison
  let correct = 0, incorrect = 0, unattempted = 0
  const results = questions.map((q, idx) => {
    const ans       = answers[idx]
    const userAnswer = ans?.answer   // the actual selected option string (or undefined)
    let status
    if (!userAnswer) { unattempted++; status = 'unattempted' }
    else if (userAnswer === q.correctAnswer) { correct++; status = 'correct' }
    else { incorrect++; status = 'incorrect' }
    return { ...q, userAnswer, status, index: idx }
  })

  const totalMarks    = correct * 4 - incorrect * 1
  const maxMarks      = questions.length * 4
  const pct           = Math.round((totalMarks / maxMarks) * 100)
  const accuracy      = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0

  // Per-subject breakdown
  const subjectBreakdown = ['Physics', 'Chemistry', 'Mathematics'].map(sub => {
    const qs    = results.filter(r => r.subject === sub)
    const cor   = qs.filter(r => r.status === 'correct').length
    const inc   = qs.filter(r => r.status === 'incorrect').length
    const unat  = qs.filter(r => r.status === 'unattempted').length
    const marks = cor * 4 - inc
    return { sub, cor, inc, unat, marks, total: qs.length, color: subjectColors[sub] }
  })

  const filteredResults = results.filter(r => {
    if (activeTab === 'all') return true
    return r.status === activeTab
  })

  const tabCounts = {
    all: results.length,
    correct: correct,
    incorrect: incorrect,
    unattempted: unattempted,
  }

  const scoreColor = pct >= 60 ? '#10b981' : pct >= 35 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative z-10 min-h-screen px-4 pb-16 pt-20">
      <div className="max-w-4xl mx-auto">
        {/* ── RESULT BANNER ── */}
        <div className="glass-card p-7 mb-6 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Score ring */}
            <div className="flex-shrink-0 relative">
              <svg className="w-28 h-28" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - Math.max(0, totalMarks) / maxMarks)}`}
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
                <text x="50" y="47" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="Syne">{totalMarks}</text>
                <text x="50" y="60" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="DM Sans">/{maxMarks}</text>
              </svg>
            </div>

            {/* Stats */}
            <div className="flex-1 text-center md:text-left">
              <p className="text-slate-500 text-sm mb-1">Test Result</p>
              <h1 className="font-display text-3xl font-extrabold text-white mb-3">
                {pct >= 80 ? '🎉 Excellent!' : pct >= 60 ? '👍 Good Job!' : pct >= 35 ? '📚 Keep Practicing' : '💪 Don\'t Give Up'}
              </h1>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Correct',      value: correct,     color: '#10b981' },
                  { label: 'Incorrect',    value: incorrect,   color: '#ef4444' },
                  { label: 'Unattempted',  value: unattempted, color: '#64748b' },
                  { label: 'Accuracy',     value: accuracy + '%', color: '#3b82f6' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center p-3 rounded-2xl"
                    style={{ background: `${color}0e`, border: `1px solid ${color}22` }}>
                    <div className="font-display text-xl font-bold" style={{ color }}>{value}</div>
                    <div className="text-xs text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── SUBJECT BREAKDOWN ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {subjectBreakdown.map(({ sub, cor, inc, unat, marks, total, color }) => (
            <div key={sub} className="glass-card-static p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-xs font-semibold" style={{ color }}>{sub}</span>
                <span className="ml-auto font-display text-lg font-bold" style={{ color }}>{marks}</span>
              </div>
              <div className="w-full h-1.5 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div className="h-full rounded-full" style={{ width: `${(cor / total) * 100}%`, background: color }} />
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span className="text-emerald-400">✓ {cor}</span>
                <span className="text-red-400">✗ {inc}</span>
                <span>– {unat}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── SOLUTION REVIEW ── */}
        <div className="glass-card-static p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-white">Solutions</h2>
            <button
              onClick={() => navigate('/pyq')}
              className="text-xs px-3 py-1.5 rounded-xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#64748b' }}
            >
              New Test
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {[
              { key: 'all', label: 'All' },
              { key: 'correct', label: '✓ Correct' },
              { key: 'incorrect', label: '✗ Wrong' },
              { key: 'unattempted', label: '– Skipped' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: activeTab === key
                    ? key === 'correct' ? 'rgba(16,185,129,0.15)' : key === 'incorrect' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${activeTab === key
                    ? key === 'correct' ? 'rgba(16,185,129,0.4)' : key === 'incorrect' ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)'
                    : 'rgba(255,255,255,0.08)'}`,
                  color: activeTab === key
                    ? key === 'correct' ? '#10b981' : key === 'incorrect' ? '#ef4444' : '#3b82f6'
                    : '#64748b',
                }}
              >
                {label} ({tabCounts[key]})
              </button>
            ))}
          </div>

          {/* Question list */}
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {filteredResults.map((r) => {
              const color = subjectColors[r.subject]
              const isExpanded = expandedQ === r.index
              const statusColor = r.status === 'correct' ? '#10b981' : r.status === 'incorrect' ? '#ef4444' : '#64748b'

              return (
                <div
                  key={r.index}
                  className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${statusColor}22` }}
                  onClick={() => setExpandedQ(isExpanded ? null : r.index)}
                >
                  {/* Collapsed header */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold flex-shrink-0"
                      style={{ background: `${color}14`, color }}>
                      {r.index + 1}
                    </div>
                    <p className="text-sm text-slate-300 flex-1 line-clamp-1 leading-tight">{r.question}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-bold" style={{ color: statusColor }}>
                        {r.status === 'correct' ? '+4' : r.status === 'incorrect' ? '-1' : '0'}
                      </span>
                      <svg
                        className="w-4 h-4 text-slate-600 transition-transform duration-200"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                      onClick={e => e.stopPropagation()}>
                      <p className="text-slate-200 text-sm leading-relaxed my-4">{r.question}</p>
                      {r.image && (
                        <div className="mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                          <img src={r.image} alt="Diagram" className="w-full object-contain max-h-48 bg-slate-900" />
                        </div>
                      )}
                      <div className="space-y-2 mb-4">
                        {r.options.map((opt, i) => (
                          <OptionButton
                            key={opt}
                            opt={opt}
                            index={i}
                            selected={r.userAnswer}
                            correctAnswer={r.correctAnswer}
                            mode="pyq-result"
                            accentColor={color}
                          />
                        ))}
                      </div>
                      <div className="p-3 rounded-2xl" style={{ background: `${color}08`, border: `1px solid ${color}1a` }}>
                        <p className="text-xs font-semibold mb-1" style={{ color }}>Explanation</p>
                        <p className="text-slate-400 text-xs leading-relaxed">{r.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PYQResultPage
