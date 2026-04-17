import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { subjects } from '../../data/studyData'
import OptionButton from '../../components/shared/OptionButton'
import MatchTable from '../../components/shared/MatchTable'

// ── Supabase chapter fetch ─────────────────────────────────────────────────
import { supabase } from '../../lib/supabase'

// Image base URL — update this to your Supabase Storage bucket URL
// or the path where your scraped_images folder is served from
const IMAGE_BASE = '/scraped_images/'

// ── Palette dot ───────────────────────────────────────────────────────────────
function PaletteDot({ index, current, state, onClick, color }) {
  const isCurrent = index === current
  let bg, border, textColor
  if (isCurrent)             { bg=color;                       border=color;                        textColor='#fff' }
  else if (state==='correct')   { bg='rgba(16,185,129,0.2)';  border='rgba(16,185,129,0.6)';  textColor='#10b981' }
  else if (state==='incorrect') { bg='rgba(239,68,68,0.2)';   border='rgba(239,68,68,0.6)';   textColor='#ef4444' }
  else if (state==='skipped')   { bg='rgba(245,158,11,0.15)'; border='rgba(245,158,11,0.5)';  textColor='#f59e0b' }
  else                          { bg='rgba(255,255,255,0.04)'; border='rgba(255,255,255,0.1)'; textColor='#475569' }
  return (
    <button onClick={() => onClick(index)}
      className="w-8 h-8 rounded-xl text-xs font-bold transition-all duration-150 flex-shrink-0"
      style={{ background:bg, border:`1px solid ${border}`, color:textColor,
               transform:isCurrent?'scale(1.15)':'scale(1)' }}>
      {index+1}
    </button>
  )
}

function LegendItem({ bg, border, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background:bg, border:`1px solid ${border}` }}/>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}

// ── Detect if question text contains a match table ────────────────────────
function isMatchQuestion(question) {
  return !!(question.match_table ||
    (question.question && (question.question.includes('| List') ||
     question.question.includes('| (A)') ||
     question.question.includes('| A.'))))
}

// ── Clean question text for display (strip pipe table from text body) ─────
function getDisplayText(question) {
  if (!question.question) return ''
  let text = question.question
  // Strip the pipe table portion — it will be rendered by MatchTable component
  text = text.replace(/(\|.+\|\s*\n?)+/g, '')
  // Strip .tg CSS
  text = text.replace(/\.tg\s*\{[^}]*\}/g, '').replace(/\.tg\s+\.[a-z0-9-]+\{[^}]*\}/g, '')
  // Remove "Match List - I with List - II" duplication
  text = text.replace(/(Match (List|the LIST)[- ]+(I|1|II|2)[^\n]*\n?)+/gi, match => {
    // Keep only the first occurrence
    return match.split('\n')[0] + '\n'
  })
  return text.replace(/\s+/g, ' ').trim()
}

const PracticeQuestionPage = () => {
  const { subjectId, chapterId } = useParams()
  const navigate = useNavigate()

  const subject = subjects.find(s => s.id === subjectId)
  const localChapter = subject?.chapters.find(c => c.id === chapterId)

  // Supabase chapter questions (if no local chapter found)
  const [sbQuestions, setSbQuestions] = useState(null)
  const [sbLoading, setSbLoading]     = useState(false)

  useEffect(() => {
    if (localChapter) return  // use local data
    if (!chapterId) return

    setSbLoading(true)
    // Decode chapterId back to chapter name, e.g. 'units-measurements' → query by chapter name
    // Convention: chapterId in URL is the slug, chapters table has a slug column
    // OR: we query by subject + chapter slug mapping stored in studyData
    supabase
      .from('questions')
      .select('*')
      .eq('subject', subject?.name || '')
      .order('source_year', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          const shaped = data.map((q, i) => ({
            id:           q.id,
            question:     q.question_text,
            options:      [q.option_a, q.option_b, q.option_c, q.option_d],
            correctAnswer: q.correct_answer,
            explanation:  q.explanation || '',
            difficulty:   q.difficulty,
            year:         q.source_year?.toString(),
            examShift:    q.exam_shift_raw,
            chapter:      q.chapter,
            image:        q.image_url ? IMAGE_BASE + q.image_url : null,
            match_table:  q.match_table,
            question_type_detail: q.question_type_detail,
          }))
          setSbQuestions(shaped)
        }
        setSbLoading(false)
      })
  }, [chapterId, localChapter, subject])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [qStates, setQStates]           = useState({})
  const [paletteOpen, setPaletteOpen]   = useState(false)
  const [zoomImage, setZoomImage]       = useState(null)
  const paletteRef = useRef()

  useEffect(() => {
    const handler = (e) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) setPaletteOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!subject) return (
    <div className="relative z-10 pt-28 text-center text-slate-500">
      Not found. <Link to="/practice" className="underline">Go back</Link>
    </div>
  )

  if (!localChapter && sbLoading) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background:'var(--bg-primary)' }}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-slate-500 text-sm">Loading questions…</p>
      </div>
    </div>
  )

  const questions  = localChapter ? localChapter.questions : sbQuestions
  const chapterName = localChapter ? localChapter.name : chapterId

  if (!questions || questions.length === 0) return (
    <div className="relative z-10 pt-28 text-center text-slate-500">
      No questions found. <Link to="/practice" className="underline">Go back</Link>
    </div>
  )

  const totalQ     = questions.length
  const question   = questions[currentIndex]
  const isFirst    = currentIndex === 0
  const isLast     = currentIndex === totalQ - 1
  const qState     = qStates[currentIndex] || { selected: null, checked: false }
  const { selected, checked } = qState
  const isCorrect  = selected === question.correctAnswer
  const hasMatch   = isMatchQuestion(question)
  const displayText = hasMatch ? getDisplayText(question) : question.question

  const setSelected = (val) =>
    setQStates(prev => ({ ...prev, [currentIndex]: { ...(prev[currentIndex]||{}), selected:val, checked:false } }))

  const handleCheck = () => {
    if (!selected) return
    setQStates(prev => ({ ...prev, [currentIndex]: { ...(prev[currentIndex]||{}), checked:true } }))
  }

  const handleRetry = () =>
    setQStates(prev => ({ ...prev, [currentIndex]: { selected:null, checked:false } }))

  const handleNext = () => { if (!isLast) { setCurrentIndex(i => i+1); setPaletteOpen(false) } }
  const handlePrev = () => { if (!isFirst) { setCurrentIndex(i => i-1); setPaletteOpen(false) } }
  const jumpTo = (i) => { setCurrentIndex(i); setPaletteOpen(false) }

  const handleRestart = () => { setCurrentIndex(0); setQStates({}); setPaletteOpen(false) }

  const answeredCount  = Object.values(qStates).filter(s => s.checked).length
  const correctCount   = Object.entries(qStates).filter(([i,s]) => s.checked && s.selected === questions[+i].correctAnswer).length
  const incorrectCount = Object.entries(qStates).filter(([i,s]) => s.checked && s.selected !== questions[+i].correctAnswer).length

  const qStatus = (i) => {
    const s = qStates[i]
    if (!s || (!s.selected && !s.checked)) return 'unanswered'
    if (s.checked) return s.selected === questions[i].correctAnswer ? 'correct' : 'incorrect'
    if (s.selected) return 'skipped'
    return 'unanswered'
  }

  const progress = (answeredCount / totalQ) * 100

  // Finished screen
  if (answeredCount === totalQ) {
    const pct = Math.round((correctCount / totalQ) * 100)
    return (
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-28 pb-16">
        <div className="max-w-md w-full">
          <div className="glass-card p-8 text-center animate-fade-up opacity-0" style={{ animationFillMode:'forwards' }}>
            <div className="text-5xl mb-4">{pct>=80?'🎉':pct>=50?'👍':'📚'}</div>
            <h2 className="font-display text-2xl font-extrabold text-white mb-1">Chapter Complete!</h2>
            <p className="text-slate-500 text-sm mb-6">{chapterName} · {subject.name}</p>
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="text-center"><div className="font-display text-3xl font-extrabold" style={{color:'#10b981'}}>{correctCount}</div><div className="text-xs text-slate-500">Correct</div></div>
              <div className="w-px h-12" style={{background:'rgba(255,255,255,0.1)'}}/>
              <div className="text-center"><div className="font-display text-3xl font-extrabold" style={{color:'#ef4444'}}>{incorrectCount}</div><div className="text-xs text-slate-500">Incorrect</div></div>
              <div className="w-px h-12" style={{background:'rgba(255,255,255,0.1)'}}/>
              <div className="text-center"><div className="font-display text-3xl font-extrabold text-white">{pct}%</div><div className="text-xs text-slate-500">Score</div></div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleRestart} className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all"
                style={{background:`${subject.color}18`,border:`1px solid ${subject.color}30`,color:subject.color}}>Restart</button>
              <button onClick={() => navigate(`/practice/${subjectId}`)} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white"
                style={{background:subject.color}}>Next Chapter</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-10 min-h-screen pb-16 pt-24" style={{ background:'var(--bg-primary)' }}>
      <div className="max-w-5xl mx-auto px-4 flex gap-5">

        {/* ── MAIN COLUMN ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Breadcrumb + score */}
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
              <Link to="/practice" className="hover:text-slate-400 transition-colors">Practice</Link>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              <Link to={`/practice/${subjectId}`} className="hover:text-slate-400 transition-colors" style={{color:subject.color}}>{subject.name}</Link>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              <span className="text-slate-400">{chapterName}</span>
            </div>
            <div className="flex items-center gap-3 text-xs flex-shrink-0">
              <span className="text-emerald-400 font-semibold">✓ {correctCount}</span>
              <span className="text-red-400 font-semibold">✗ {incorrectCount}</span>
              <span className="text-slate-600">{answeredCount}/{totalQ}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 rounded-full mb-5" style={{background:'rgba(255,255,255,0.07)'}}>
            <div className="h-full rounded-full transition-all duration-500" style={{width:`${progress}%`,background:subject.color}}/>
          </div>

          {/* Question card */}
          <div className="glass-card p-7 animate-fade-up opacity-0" style={{animationFillMode:'forwards'}}>

            {/* Q header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-mono font-bold"
                  style={{background:`${subject.color}18`,border:`1px solid ${subject.color}28`,color:subject.color}}>
                  {String(currentIndex+1).padStart(2,'0')}
                </div>
                <span className="text-xs text-slate-500 font-mono">of {totalQ}</span>
                {question.year && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',color:'#64748b'}}>
                    {question.year}
                  </span>
                )}
                {hasMatch && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.3)',color:'#a78bfa'}}>
                    Match
                  </span>
                )}
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: question.difficulty==='Easy'?'rgba(16,185,129,0.08)':question.difficulty==='Hard'?'rgba(239,68,68,0.08)':'rgba(245,158,11,0.08)',
                  border: question.difficulty==='Easy'?'1px solid rgba(16,185,129,0.25)':question.difficulty==='Hard'?'1px solid rgba(239,68,68,0.25)':'1px solid rgba(245,158,11,0.25)',
                  color: question.difficulty==='Easy'?'#10b981':question.difficulty==='Hard'?'#ef4444':'#f59e0b',
                }}>
                {question.difficulty}
              </span>
            </div>

            {/* Question text */}
            <p className="text-slate-100 text-base leading-relaxed font-medium mb-2">{displayText}</p>

            {/* Match table */}
            {hasMatch && (
              <MatchTable
                matchTableJson={question.match_table}
                questionText={question.question}
                accentColor={subject.color}
              />
            )}

            {/* Image */}
            {question.image && (
              <div className="mb-5 rounded-2xl overflow-hidden cursor-zoom-in"
                style={{border:'1px solid rgba(255,255,255,0.1)'}}
                onClick={() => setZoomImage(question.image)}>
                <img src={question.image} alt="Question diagram"
                  className="w-full object-contain max-h-64 bg-slate-900"/>
              </div>
            )}

            {/* Options */}
            <div className="space-y-2.5 mb-6 mt-4">
              {question.options.map((opt, i) => (
                <OptionButton key={opt} opt={opt} index={i}
                  selected={checked ? selected : (selected===opt?opt:null)}
                  correctAnswer={checked ? question.correctAnswer : null}
                  mode={checked ? 'practice' : 'pyq-active'}
                  accentColor={subject.color}
                  onClick={(o) => !checked && setSelected(o)}/>
              ))}
            </div>

            {/* Explanation */}
            <div className="overflow-hidden transition-all duration-500"
              style={{maxHeight:checked?'300px':'0px',opacity:checked?1:0}}>
              <div className="p-4 rounded-2xl mb-4 overflow-y-auto"
                style={{background:`${subject.color}0a`,border:`1px solid ${subject.color}22`,maxHeight:220}}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{background:isCorrect?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'}}>
                    {isCorrect
                      ? <svg className="w-3 h-3" fill="none" stroke="#10b981" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                      : <svg className="w-3 h-3" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                    }
                  </div>
                  <span className="text-xs font-bold" style={{color:isCorrect?'#10b981':'#ef4444'}}>
                    {isCorrect ? 'Correct!' : `Incorrect — Answer: ${question.correctAnswer}`}
                  </span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">{question.explanation}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              {!checked ? (
                <button onClick={handleCheck} disabled={!selected}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all"
                  style={{background:selected?subject.color:'rgba(255,255,255,0.05)',color:selected?'#fff':'#475569',cursor:selected?'pointer':'not-allowed'}}>
                  Check Answer
                </button>
              ) : (
                <>
                  <button onClick={handleRetry}
                    className="py-3.5 px-5 rounded-2xl text-sm font-semibold transition-all"
                    style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b'}}>
                    Retry
                  </button>
                  {!isLast ? (
                    <button onClick={handleNext}
                      className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
                      style={{background:subject.color}}>
                      Next <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    </button>
                  ) : (
                    <button onClick={() => navigate(`/practice/${subjectId}`)}
                      className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white"
                      style={{background:subject.color}}>
                      Finish Chapter 🎉
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Prev / Next nav bar */}
          <div className="flex items-center justify-between mt-4 gap-3">
            <button onClick={handlePrev} disabled={isFirst}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all"
              style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',color:isFirst?'#334155':'#94a3b8',cursor:isFirst?'not-allowed':'pointer'}}
              onMouseEnter={e=>{ if(!isFirst) e.currentTarget.style.background='rgba(255,255,255,0.08)' }}
              onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.05)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              Previous
            </button>

            <button onClick={() => setPaletteOpen(o=>!o)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all"
              style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',color:'#94a3b8'}}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
              Questions
            </button>

            <button onClick={handleNext} disabled={isLast}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all"
              style={{background:isLast?'rgba(255,255,255,0.03)':`${subject.color}18`,border:`1px solid ${isLast?'rgba(255,255,255,0.07)':subject.color+'30'}`,color:isLast?'#334155':subject.color,cursor:isLast?'not-allowed':'pointer'}}
              onMouseEnter={e=>{ if(!isLast) e.currentTarget.style.background=`${subject.color}28` }}
              onMouseLeave={e=>{ e.currentTarget.style.background=isLast?'rgba(255,255,255,0.03)':`${subject.color}18` }}>
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        {/* ── DESKTOP PALETTE ──────────────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col w-60 flex-shrink-0">
          <div className="sticky top-24 rounded-3xl p-4"
            style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Questions</p>
              <span className="text-xs text-slate-600">{answeredCount}/{totalQ}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden mb-4" style={{background:'rgba(255,255,255,0.07)'}}>
              <div className="h-full rounded-full transition-all duration-500" style={{width:`${progress}%`,background:subject.color}}/>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {questions.map((_,i) => (
                <PaletteDot key={i} index={i} current={currentIndex} state={qStatus(i)} onClick={jumpTo} color={subject.color}/>
              ))}
            </div>
            <div className="space-y-1.5 pt-3" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
              <LegendItem bg="rgba(16,185,129,0.2)"   border="rgba(16,185,129,0.6)"  label="Correct"/>
              <LegendItem bg="rgba(239,68,68,0.2)"    border="rgba(239,68,68,0.6)"   label="Incorrect"/>
              <LegendItem bg="rgba(245,158,11,0.15)"  border="rgba(245,158,11,0.5)"  label="Answered, unchecked"/>
              <LegendItem bg="rgba(255,255,255,0.04)" border="rgba(255,255,255,0.1)" label="Not visited"/>
            </div>
            <button onClick={handleRestart}
              className="w-full mt-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b'}}>
              Restart Chapter
            </button>
          </div>
        </div>
      </div>

      {/* Mobile palette drawer */}
      {paletteOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" style={{background:'rgba(0,0,0,0.6)'}}>
          <div ref={paletteRef}
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-5"
            style={{background:'#0d1120',border:'1px solid rgba(255,255,255,0.09)',maxHeight:'70vh',overflowY:'auto'}}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">Question Palette</p>
              <button onClick={() => setPaletteOpen(false)} className="text-slate-500 hover:text-slate-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {questions.map((_,i) => (
                <PaletteDot key={i} index={i} current={currentIndex} state={qStatus(i)} onClick={jumpTo} color={subject.color}/>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-3" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
              <LegendItem bg="rgba(16,185,129,0.2)"   border="rgba(16,185,129,0.6)" label="Correct"/>
              <LegendItem bg="rgba(239,68,68,0.2)"    border="rgba(239,68,68,0.6)"  label="Incorrect"/>
              <LegendItem bg="rgba(245,158,11,0.15)"  border="rgba(245,158,11,0.5)" label="Answered"/>
              <LegendItem bg="rgba(255,255,255,0.04)" border="rgba(255,255,255,0.1)"label="Not visited"/>
            </div>
          </div>
        </div>
      )}

      {/* Zoom image */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomImage(null)}>
          <img src={zoomImage} alt="zoom" className="max-w-full max-h-full rounded-xl"/>
        </div>
      )}
    </div>
  )
}

export default PracticeQuestionPage
