import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { subjects } from '../../data/studyData'
import OptionButton from '../../components/shared/OptionButton'

const PracticeQuestionPage = () => {
  const { subjectId, chapterId } = useParams()
  const navigate = useNavigate()

  const subject = subjects.find(s => s.id === subjectId)
  const chapter = subject?.chapters.find(c => c.id === chapterId)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState({ correct: 0, incorrect: 0 })

  if (!subject || !chapter) return (
    <div className="relative z-10 pt-28 text-center text-slate-500">
      Not found. <Link to="/practice" className="underline">Go back</Link>
    </div>
  )

  const questions = chapter.questions
  const question = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1
  const isCorrect = selected === question.correctAnswer

  const handleCheck = () => {
    if (!selected) return
    setChecked(true)
    if (selected === question.correctAnswer) {
      setScore(s => ({ ...s, correct: s.correct + 1 }))
    } else {
      setScore(s => ({ ...s, incorrect: s.incorrect + 1 }))
    }
  }

  const handleNext = () => {
    if (isLast) return
    setCurrentIndex(i => i + 1)
    setSelected(null)
    setChecked(false)
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setSelected(null)
    setChecked(false)
    setScore({ correct: 0, incorrect: 0 })
  }

  const progress = ((currentIndex + (checked ? 1 : 0)) / questions.length) * 100

  // Finished all questions
  if (isLast && checked) {
    const finalCorrect = score.correct + (isCorrect ? 0 : 0) // already updated in handleCheck
    const pct = Math.round((score.correct / questions.length) * 100)

    return (
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-28 pb-16">
        <div className="max-w-md w-full">
          <div className="glass-card p-8 text-center animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
            <div className="text-5xl mb-4">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📚'}</div>
            <h2 className="font-display text-2xl font-extrabold text-white mb-1">Chapter Complete!</h2>
            <p className="text-slate-500 text-sm mb-6">{chapter.name} · {subject.name}</p>

            {/* Score ring */}
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="font-display text-3xl font-extrabold" style={{ color: '#10b981' }}>{score.correct}</div>
                <div className="text-xs text-slate-500">Correct</div>
              </div>
              <div className="w-px h-12" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="text-center">
                <div className="font-display text-3xl font-extrabold" style={{ color: '#ef4444' }}>{score.incorrect}</div>
                <div className="text-xs text-slate-500">Incorrect</div>
              </div>
              <div className="w-px h-12" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="text-center">
                <div className="font-display text-3xl font-extrabold text-white">{pct}%</div>
                <div className="text-xs text-slate-500">Score</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleRestart}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all duration-200"
                style={{ background: `${subject.color}18`, border: `1px solid ${subject.color}30`, color: subject.color }}>
                Restart
              </button>
              <button onClick={() => navigate(`/practice/${subjectId}`)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white transition-all duration-200"
                style={{ background: subject.color }}>
                Next Chapter
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-10 min-h-screen px-4 pb-16 pt-24">
      <div className="max-w-2xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
            <Link to="/practice" className="hover:text-slate-400 transition-colors">Practice</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link to={`/practice/${subjectId}`} className="hover:text-slate-400 transition-colors" style={{ color: subject.color }}>
              {subject.name}
            </Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-400">{chapter.name}</span>
          </div>
          {/* Score mini */}
          <div className="flex items-center gap-3 text-xs flex-shrink-0">
            <span className="text-emerald-400 font-semibold">✓ {score.correct}</span>
            <span className="text-red-400 font-semibold">✗ {score.incorrect}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 rounded-full mb-6" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: subject.color }} />
        </div>

        {/* Question card */}
        <div className="glass-card p-7 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          {/* Q header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-mono font-bold"
                style={{ background: `${subject.color}18`, border: `1px solid ${subject.color}28`, color: subject.color }}>
                {String(currentIndex + 1).padStart(2, '0')}
              </div>
              <span className="text-xs text-slate-500 font-mono">of {questions.length}</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full"
              style={{
                background: question.difficulty === 'Easy' ? 'rgba(16,185,129,0.08)' : question.difficulty === 'Hard' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                border: question.difficulty === 'Easy' ? '1px solid rgba(16,185,129,0.25)' : question.difficulty === 'Hard' ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(245,158,11,0.25)',
                color: question.difficulty === 'Easy' ? '#10b981' : question.difficulty === 'Hard' ? '#ef4444' : '#f59e0b',
              }}>
              {question.difficulty}
            </span>
          </div>

          {/* Question text */}
          <p className="text-slate-100 text-base leading-relaxed font-medium mb-5">
            {question.question}
          </p>

          {/* Question image (if present) */}
          {question.image && (
            <div className="mb-5 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <img src={question.image} alt="Question diagram" className="w-full object-contain max-h-64 bg-slate-900" />
            </div>
          )}

          {/* Options */}
          <div className="space-y-2.5 mb-6">
            {question.options.map((opt, i) => (
              <OptionButton
                key={opt}
                opt={opt}
                index={i}
                selected={checked ? selected : (selected === opt ? opt : null)}
                correctAnswer={checked ? question.correctAnswer : null}
                mode={checked ? 'practice' : 'pyq-active'}
                accentColor={subject.color}
                onClick={(o) => !checked && setSelected(o)}
              />
            ))}
          </div>

          {/* Explanation (after check) */}
          <div
            className="overflow-hidden transition-all duration-500 ease-in-out"
            style={{ maxHeight: checked ? '220px' : '0px', opacity: checked ? 1 : 0 }}
          >
            <div className="p-4 rounded-2xl mb-4"
              style={{ background: `${subject.color}0a`, border: `1px solid ${subject.color}22` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }}>
                  {isCorrect
                    ? <svg className="w-3 h-3" fill="none" stroke="#10b981" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    : <svg className="w-3 h-3" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  }
                </div>
                <span className="text-xs font-bold" style={{ color: isCorrect ? '#10b981' : '#ef4444' }}>
                  {isCorrect ? 'Correct!' : `Incorrect — Answer: ${question.correctAnswer}`}
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{question.explanation}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {!checked ? (
              <button
                onClick={handleCheck}
                disabled={!selected}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200"
                style={{
                  background: selected ? subject.color : 'rgba(255,255,255,0.05)',
                  color: selected ? '#fff' : '#475569',
                  cursor: selected ? 'pointer' : 'not-allowed',
                }}
              >
                Check Answer
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setSelected(null); setChecked(false) }}
                  className="py-3.5 px-5 rounded-2xl text-sm font-semibold transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}
                >
                  Retry
                </button>
                {!isLast ? (
                  <button
                    onClick={handleNext}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200"
                    style={{ background: subject.color }}>
                    Next Question
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/practice/${subjectId}`)}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-200"
                    style={{ background: subject.color }}>
                    Finish Chapter 🎉
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PracticeQuestionPage
