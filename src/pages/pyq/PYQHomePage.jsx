import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { pyqData } from '../../data/pyqData'

const PYQHomePage = () => {
  const navigate = useNavigate()
  const [selectedYear, setSelectedYear]       = useState(null)
  const [selectedAttempt, setSelectedAttempt] = useState(null)
  const [selectedShift, setSelectedShift]     = useState(null)

  const yearData    = pyqData.find(y => y.year === selectedYear)
  const attemptData = yearData?.attempts.find(a => a.id === selectedAttempt)

  const canStart = selectedYear && selectedAttempt && selectedShift

  const handleStart = () => {
    if (!canStart) return
    // Encode selection in URL
    navigate(`/pyq/test/${selectedAttempt}/${selectedShift}`)
  }

  const Chip = ({ label, active, color = '#3b82f6', onClick }) => (
    <button
      onClick={onClick}
      className="px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200"
      style={{
        background: active ? `${color}20` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? color : 'rgba(255,255,255,0.09)'}`,
        color: active ? color : '#64748b',
        transform: active ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {label}
    </button>
  )

  return (
    <div className="relative z-10 min-h-screen px-6 pb-16 pt-28">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-8 animate-fade-in opacity-0"
          style={{ animationFillMode: 'forwards' }}>
          <Link to="/" className="hover:text-slate-400 transition-colors">Home</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-amber-400">PYQ Mode</span>
        </div>

        {/* Header */}
        <div className="mb-8 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.05s' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
              🗓️
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">PYQ Mode</h1>
              <p className="text-slate-500 text-sm">JEE Main — Full 75-question test with 3-hour timer</p>
            </div>
          </div>
        </div>

        {/* Step 1: Year */}
        <div className="glass-card-static p-6 mb-4 animate-fade-up opacity-0 stagger-1"
          style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>1</div>
            <span className="text-sm font-semibold text-white">Select Year</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {pyqData.map(y => (
              <Chip
                key={y.year}
                label={y.year}
                active={selectedYear === y.year}
                color="#f59e0b"
                onClick={() => { setSelectedYear(y.year); setSelectedAttempt(null); setSelectedShift(null) }}
              />
            ))}
          </div>
        </div>

        {/* Step 2: Attempt */}
        <div
          className="glass-card-static p-6 mb-4 animate-fade-up opacity-0 stagger-2 transition-all duration-300"
          style={{ animationFillMode: 'forwards', opacity: selectedYear ? undefined : 0.4, pointerEvents: selectedYear ? 'auto' : 'none' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>2</div>
            <span className="text-sm font-semibold text-white">Select Attempt</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(yearData?.attempts || []).map(a => (
              <Chip
                key={a.id}
                label={a.label}
                active={selectedAttempt === a.id}
                color="#3b82f6"
                onClick={() => { setSelectedAttempt(a.id); setSelectedShift(null) }}
              />
            ))}
            {!selectedYear && <span className="text-xs text-slate-600 italic">Select a year first</span>}
          </div>
        </div>

        {/* Step 3: Shift */}
        <div
          className="glass-card-static p-6 mb-6 animate-fade-up opacity-0 stagger-3 transition-all duration-300"
          style={{ animationFillMode: 'forwards', opacity: selectedAttempt ? undefined : 0.4, pointerEvents: selectedAttempt ? 'auto' : 'none' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>3</div>
            <span className="text-sm font-semibold text-white">Select Shift</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(attemptData?.shifts || []).map(s => (
              <Chip
                key={s.id}
                label={s.label}
                active={selectedShift === s.id}
                color="#10b981"
                onClick={() => setSelectedShift(s.id)}
              />
            ))}
            {!selectedAttempt && <span className="text-xs text-slate-600 italic">Select an attempt first</span>}
          </div>
        </div>

        {/* Start button */}
        <div className="animate-fade-up opacity-0 stagger-4" style={{ animationFillMode: 'forwards' }}>
          {/* Info strip */}
          <div className="flex items-center gap-6 mb-4 px-2">
            {[
              { icon: '⏱️', text: '3 Hours' },
              { icon: '📝', text: '75 Questions' },
              { icon: '🎯', text: '+4 / -1 Marking' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleStart}
            disabled={!canStart}
            className="w-full py-4 rounded-2xl text-base font-bold transition-all duration-300"
            style={{
              background: canStart
                ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                : 'rgba(255,255,255,0.05)',
              color: canStart ? '#fff' : '#475569',
              cursor: canStart ? 'pointer' : 'not-allowed',
              boxShadow: canStart ? '0 8px 30px rgba(245,158,11,0.3)' : 'none',
            }}
          >
            {canStart ? '🚀 Start Full Test' : 'Complete Selection Above'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PYQHomePage
