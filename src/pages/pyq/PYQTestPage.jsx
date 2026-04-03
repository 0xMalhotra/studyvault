
import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { pyqData } from '../../data/pyqData'
import ExamTimer from '../../components/shared/ExamTimer'
import QuestionPalette from '../../components/shared/QuestionPalette'
import OptionButton from '../../components/shared/OptionButton'
import { supabase } from '../../lib/supabase'

const subjectColors = { Physics: '#3b82f6', Chemistry: '#10b981', Mathematics: '#f59e0b' }

const PYQTestPage = () => {
  const [zoomImage, setZoomImage] = useState(null);
  const { attemptId, shiftId } = useParams()
  const navigate = useNavigate()
  const [answers, setAnswers] = useState({})

  const paper = (() => {
    for (const y of pyqData) {
      for (const a of y.attempts) {
        if (a.id === attemptId) {
          const s = a.shifts.find(sh => sh.id === shiftId)
          if (s) return { ...s, year: y.year, attemptLabel: a.label }
        }
      }
    }
    return null
  })()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [submitted, setSubmitted]       = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [paletteOpen, setPaletteOpen]   = useState(false)
  const [timeExpired, setTimeExpired]   = useState(false)

  if (!paper) return (
    <div className="relative z-10 pt-28 text-center text-slate-500">
      Paper not found. <button onClick={() => navigate('/pyq')} className="underline">Go back</button>
    </div>
  )

  const questions = paper.questions
  const q = questions[currentIndex]
  const accentColor = subjectColors[q?.subject] || '#3b82f6'
  const totalQ = questions.length

  useEffect(() => {
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: {
        ...prev[currentIndex],
        visited: true,
      },
    }))
  }, [currentIndex])

  const handleSelect = (opt) => {
    if (submitted) return
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: { ...prev[currentIndex], answer: opt },
    }))
  }

  const handleSubmit = async () => {
    setSubmitted(true)
    setShowConfirm(false)

    // ── Overall stats ──
    let correct = 0, wrong = 0, unattempted = 0
    // ── Per-subject stats ──
    const subjectStats = {
      Physics:     { correct: 0, wrong: 0, unattempted: 0 },
      Chemistry:   { correct: 0, wrong: 0, unattempted: 0 },
      Mathematics: { correct: 0, wrong: 0, unattempted: 0 },
    }

    questions.forEach((q, idx) => {
      const ans = answers[idx]
      const sub = q.subject
      if (!ans?.answer) {
        unattempted++
        if (subjectStats[sub]) subjectStats[sub].unattempted++
      } else if (ans.answer === q.correctAnswer) {
        correct++
        if (subjectStats[sub]) subjectStats[sub].correct++
      } else {
        wrong++
        if (subjectStats[sub]) subjectStats[sub].wrong++
      }
    })

    const score = correct * 4 - wrong

    // ── Save to Supabase ──
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('results').insert({
          user_id:     user.id,
          score,
          correct,
          wrong,
          unattempted,
          // subject breakdown stored as individual columns
          phy_correct:     subjectStats.Physics.correct,
          phy_wrong:       subjectStats.Physics.wrong,
          phy_unattempted: subjectStats.Physics.unattempted,
          che_correct:     subjectStats.Chemistry.correct,
          che_wrong:       subjectStats.Chemistry.wrong,
          che_unattempted: subjectStats.Chemistry.unattempted,
          mat_correct:     subjectStats.Mathematics.correct,
          mat_wrong:       subjectStats.Mathematics.wrong,
          mat_unattempted: subjectStats.Mathematics.unattempted,
        })
      }
    } catch (err) {
      console.error('Failed to save result:', err)
    }

    navigate(`/pyq/result/${attemptId}/${shiftId}`, { state: { answers, questions } })
  }

  const handleExpire = () => {
    setTimeExpired(true)
    handleSubmit()
  }

  const subjectLabel = q?.subject

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* TOP BAR */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0 z-40"
        style={{ background: 'rgba(8,11,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-base">📚</div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold font-display truncate">JEE Main {paper.year}</p>
            <p className="text-slate-600 text-xs truncate">{paper.attemptLabel} · {paper.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExamTimer totalSeconds={10800} onExpire={handleExpire} />
          <button
            onClick={() => setPaletteOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors lg:hidden"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Palette
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff' }}
          >
            Submit
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Subject strip */}
          <div className="px-4 py-2 flex items-center gap-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
              <span className="text-xs font-semibold" style={{ color: accentColor }}>{subjectLabel}</span>
            </div>
            <span className="text-slate-700 text-xs">·</span>
            <span className="text-xs text-slate-600 font-mono">Q {currentIndex + 1} / {totalQ}</span>
            <div className="ml-auto flex gap-1">
              {['Physics', 'Chemistry', 'Mathematics'].map((s, si) => {
                const start = si * 25
                const inSection = currentIndex >= start && currentIndex < start + 25
                return (
                  <button
                    key={s}
                    onClick={() => setCurrentIndex(start)}
                    className="text-xs px-2 py-0.5 rounded-full transition-all"
                    style={{
                      background: inSection ? `${subjectColors[s]}18` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${inSection ? subjectColors[s] + '40' : 'rgba(255,255,255,0.06)'}`,
                      color: inSection ? subjectColors[s] : '#475569',
                    }}
                  >
                    {s.slice(0, 4)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Question content */}
          <div className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full">
            <div className="glass-card-static p-6 mb-5" style={{ border: `1px solid ${accentColor}22` }}>
              <p className="text-slate-100 text-sm md:text-base leading-relaxed font-medium">{q.question}</p>
              {q.image && (
                <div className="mt-4 cursor-zoom-in" onClick={() => setZoomImage(q.image)}>
                  <img src={q.image} alt="Diagram" className="w-full max-h-72 object-contain rounded-xl border border-white/10 bg-slate-900" />
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              {q.options.map((opt, i) => (
                <OptionButton
                  key={opt} opt={opt} index={i}
                  selected={answers[currentIndex]?.answer}
                  correctAnswer={null} mode="pyq-active"
                  accentColor={accentColor} onClick={handleSelect}
                />
              ))}
            </div>

            <div className="flex items-center justify-between mt-6 gap-3">
              <button
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: currentIndex === 0 ? '#334155' : '#94a3b8', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Prev
              </button>

              <button
                onClick={() => setAnswers(prev => ({ ...prev, [currentIndex]: { ...prev[currentIndex], marked: !prev[currentIndex]?.marked } }))}
                className="px-4 py-2.5 rounded-2xl text-xs font-medium"
                style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)', color: '#facc15' }}
              >
                {answers[currentIndex]?.marked ? 'Unmark' : 'Mark for Review'}
              </button>

              <button
                onClick={() => setAnswers(prev => ({ ...prev, [currentIndex]: { ...prev[currentIndex], answer: undefined, marked: undefined } }))}
                className="px-4 py-2.5 rounded-2xl text-xs font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}
              >
                Clear
              </button>

              <button
                onClick={() => setCurrentIndex(i => Math.min(totalQ - 1, i + 1))}
                disabled={currentIndex === totalQ - 1}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all"
                style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30`, color: accentColor, cursor: currentIndex === totalQ - 1 ? 'not-allowed' : 'pointer' }}
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* PALETTE */}
        <>
          {paletteOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setPaletteOpen(false)} />}
          <div
            className={`fixed right-0 top-0 bottom-0 z-40 w-72 flex flex-col pt-16 lg:relative lg:w-64 lg:flex lg:pt-0 transition-transform duration-300 ${paletteOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
            style={{ background: 'rgba(8,11,20,0.97)', borderLeft: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}
          >
            <div className="p-4 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Question Palette</p>
                <button onClick={() => setPaletteOpen(false)} className="lg:hidden text-slate-600 hover:text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <QuestionPalette total={totalQ} answers={answers} currentIndex={currentIndex} onJump={i => { setCurrentIndex(i); setPaletteOpen(false) }} />
              </div>
            </div>
          </div>
        </>
      </div>

      {/* SUBMIT MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="glass-card p-7 max-w-sm w-full animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
            <div className="text-3xl mb-3 text-center">⚠️</div>
            <h3 className="font-display text-lg font-bold text-white text-center mb-1">Submit Test?</h3>
            <p className="text-slate-500 text-sm text-center mb-5">
              You've answered{' '}
              <span className="text-white font-semibold">{Object.values(answers).filter(a => a?.answer).length}</span>
              {' '}of {totalQ} questions.
              <br />
              <span className="text-amber-400">{totalQ - Object.values(answers).filter(a => a?.answer).length} unattempted</span>. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}
              >
                Go Back
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}

      {zoomImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setZoomImage(null)}>
          <img src={zoomImage} alt="zoom" className="max-w-full max-h-full" />
        </div>
      )}
    </div>
  )
}

export default PYQTestPage
