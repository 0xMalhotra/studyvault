import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { subjects } from '../../data/studyData'
import OptionButton from '../../components/shared/OptionButton'
import MatchTable from '../../components/shared/MatchTable'
import QuestionContent from '../../components/shared/QuestionContent'
import { supabase } from '../../lib/supabase'

// ─── Image base URL ───────────────────────────────────────────────────────────
// Option A - Supabase Storage: 'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/scraped-images/'
// Option B - Vite public folder: '/scraped_images/'
const IMAGE_BASE = '/scraped_images/'

// ─── Slugify ──────────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const OPTION_FIELDS = ['option_a', 'option_b', 'option_c', 'option_d']

function getOptionByLetter(row) {
  const index = { A: 0, B: 1, C: 2, D: 3 }[String(row.correct_option || '').trim().toUpperCase()]
  if (index === undefined) return null
  return row[OPTION_FIELDS[index]] || null
}

function stripHtml(html) {
  if (!html) return ''
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function ordinal(day) {
  const n = Number(day)
  if (!Number.isFinite(n)) return day
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  const suffix = n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th'
  return `${n}${suffix}`
}

function formatDateLabel(dateValue, fallbackYear) {
  if (!dateValue) return ''

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const [year, month, day] = String(dateValue).split('T')[0].split('-')
  const monthName = months[Number(month) - 1]

  if (!day || !monthName) return ''
  return `${ordinal(day)} ${monthName}, ${year || fallbackYear}`
}

function formatExamMeta(row) {
  const year = row.source_year || row.exam_year || ''
  const date = formatDateLabel(row.source_date || row.exam_date, year)
  const shift = row.source_shift || row.exam_shift || ''
  return [date || year, shift].filter(Boolean).join(' ')
}

function mapSupabaseQuestion(row) {
  const options = OPTION_FIELDS
    .map(field => row[field])
    .filter(option => option && option !== 'N/A')
  const correctOptionHtml = getOptionByLetter(row)
  const correctAnswer = correctOptionHtml || row.correct_answer || null

  return {
    id: row.id,
    question: row.question_text,
    options,
    correctAnswer,
    answerLabel: row.correct_option || stripHtml(row.correct_answer),
    answerText: stripHtml(row.correct_answer || correctAnswer),
    explanation: row.explanation || '',
    difficulty: row.difficulty || 'Medium',
    year: row.source_year?.toString() || row.exam_year?.toString() || '',
    examDate: formatDateLabel(row.source_date || row.exam_date, row.source_year || row.exam_year),
    examShiftLabel: row.source_shift || row.exam_shift || '',
    examMeta: formatExamMeta(row),
    examShift: row.exam_shift_raw || '',
    image: row.image_url ? IMAGE_BASE + row.image_url : null,
    match_table: row.match_table,
    question_type_detail: row.question_type_detail || 'standard',
    isHtml: true,
  }
}

// ─── MathText — renders inline KaTeX if katex is installed, else plain text ──
// Install: npm install katex  then add  import 'katex/dist/katex.min.css'  in main.jsx
function MathText({ text, className = '' }) {
  const [katex, setKatex] = useState(null)

  useEffect(() => {
    import('katex').then(mod => setKatex(mod.default)).catch(() => {})
  }, [])

  const html = useMemo(() => {
    if (!katex || !text) return null
    // Split on $...$ and $$...$$
    const parts = []
    const pattern = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g
    let last = 0, match
    while ((match = pattern.exec(text)) !== null) {
      if (match.index > last) parts.push({ type: 'text', val: text.slice(last, match.index) })
      const raw = match[1]
      const display = raw.startsWith('$$')
      const latex = display ? raw.slice(2, -2) : raw.slice(1, -1)
      try {
        parts.push({ type: 'math', val: katex.renderToString(latex, { displayMode: display, throwOnError: false, output: 'html', strict: false }), display })
      } catch {
        parts.push({ type: 'text', val: raw })
      }
      last = match.index + raw.length
    }
    if (last < text.length) parts.push({ type: 'text', val: text.slice(last) })
    if (!parts.some(p => p.type === 'math')) return null
    return parts.map((p, i) =>
      p.type === 'text'
        ? `<span>${p.val.replace(/</g, '&lt;')}</span>`
        : `<span${p.display ? ' style="display:block;margin:8px 0"' : ''}>${p.val}</span>`
    ).join('')
  }, [katex, text])

  if (html) return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
  return <span className={className}>{text}</span>
}

// ─── Strip match-table markdown from question text (rendered separately) ─────
function getDisplayText(q) {
  if (!q) return ''
  let text = q.question || ''
  if (q.question_type_detail === 'match' || q.match_table) {
    text = text.replace(/(\|.+\|\s*\n?)+/g, '')
    text = text.replace(/\.tg\s*\{[^}]*\}/g, '').replace(/\.tg\s+\.[a-z0-9-]+\{[^}]*\}/g, '')
    const firstMatch = text.match(/(Match\s+(List|the LIST)[^\n]*)/i)
    if (firstMatch) text = text.replace(/(Match\s+(List|the LIST)[^\n]*\n?)+/gi, firstMatch[0] + '\n')
  }
  return text.replace(/\s+/g, ' ').trim()
}

// ─── Palette dot ──────────────────────────────────────────────────────────────
function PaletteDot({ index, current, state, onClick, color }) {
  const cur = index === current
  const cfg = cur
    ? { bg: color, border: color, tc: '#fff' }
    : state === 'correct'
    ? { bg: 'rgba(16,185,129,0.2)',  border: 'rgba(16,185,129,0.6)',  tc: '#10b981' }
    : state === 'incorrect'
    ? { bg: 'rgba(239,68,68,0.2)',   border: 'rgba(239,68,68,0.6)',   tc: '#ef4444' }
    : state === 'skipped'
    ? { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.5)',  tc: '#f59e0b' }
    : { bg: 'rgba(255,255,255,0.04)',border: 'rgba(255,255,255,0.1)', tc: '#475569' }
  return (
    <button onClick={() => onClick(index)}
      className="w-8 h-8 rounded-xl text-xs font-bold transition-all duration-150 flex-shrink-0"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.tc, transform: cur ? 'scale(1.15)' : 'scale(1)' }}>
      {index + 1}
    </button>
  )
}

function LegendItem({ bg, border, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: bg, border: `1px solid ${border}` }} />
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const PracticeQuestionPage = () => {
  const { subjectId, chapterId } = useParams()
  const navigate = useNavigate()

  const subject      = subjects.find(s => s.id === subjectId)
  const localChapter = subject?.chapters?.find(c => c.id === chapterId)

  const [questions, setQuestions]     = useState(null)
  const [loading, setLoading]         = useState(true)
  const [chapterName, setChapterName] = useState(localChapter?.name || '')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [qStates, setQStates]           = useState({})
  const [paletteOpen, setPaletteOpen]   = useState(false)
  const [zoomImage, setZoomImage]       = useState(null)
  const paletteRef = useRef()

  // ── Load questions ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!subject) { setLoading(false); return }

    let cancelled = false

    const fallbackToLocal = () => {
      if (!localChapter) return false
      setChapterName(localChapter.name)
      setQuestions(localChapter.questions)
      setLoading(false)
      return true
    }

    const fetch = async () => {
      setLoading(true)
      setQuestions(null)
      setCurrentIndex(0)
      setQStates({})

      const { data: chapData } = await supabase
        .from('questions').select('chapter').eq('subject', subject.name)
      if (cancelled) return
      if (!chapData) {
        if (!fallbackToLocal()) setLoading(false)
        return
      }

      const matched = [...new Set(chapData.map(r => r.chapter))].find(name =>
        slugify(name) === chapterId || (localChapter && slugify(name) === slugify(localChapter.name))
      )
      if (!matched) {
        if (!fallbackToLocal()) setLoading(false)
        return
      }
      setChapterName(matched)

      const { data: qData, error: qError } = await supabase
        .from('questions').select('*')
        .eq('subject', subject.name).eq('chapter', matched)
        .order('source_year', { ascending: false })
      if (cancelled) return
      if (qError || !qData) {
        if (!fallbackToLocal()) setLoading(false)
        return
      }

      const mapped = qData.map(mapSupabaseQuestion).filter(q => q.correctAnswer)
      if (mapped.length === 0) {
        if (!fallbackToLocal()) setLoading(false)
        return
      }

      setQuestions(mapped)
      setLoading(false)
    }
    fetch()
    return () => { cancelled = true }
  }, [subjectId, chapterId, subject, localChapter])

  useEffect(() => {
    const h = e => { if (paletteRef.current && !paletteRef.current.contains(e.target)) setPaletteOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // ── Guards ──────────────────────────────────────────────────────────────────
  if (!subject) return (
    <div className="relative z-10 pt-28 text-center text-slate-500">
      Subject not found. <Link to="/practice" className="underline">Go back</Link>
    </div>
  )
  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
          style={{ borderColor: `${subject.color}30`, borderTopColor: subject.color }} />
        <p className="text-slate-500 text-sm">Loading questions…</p>
      </div>
    </div>
  )
  if (!questions || questions.length === 0) return (
    <div className="relative z-10 pt-28 text-center text-slate-500">
      No questions found. <Link to={`/practice/${subjectId}`} className="underline">Go back</Link>
    </div>
  )

  // ── Derived ─────────────────────────────────────────────────────────────────
  const totalQ     = questions.length
  const question   = questions[currentIndex]
  const isFirst    = currentIndex === 0
  const isLast     = currentIndex === totalQ - 1
  const { selected = null, checked = false } = qStates[currentIndex] || {}
  const isCorrect  = selected === question.correctAnswer
  const hasMatch   = question.question_type_detail === 'match' || !!question.match_table
  const displayText     = question.isHtml ? question.question : getDisplayText(question)
  const answeredCount   = Object.values(qStates).filter(s => s.checked).length
  const correctCount    = Object.entries(qStates).filter(([i, s]) => s.checked && s.selected === questions[+i]?.correctAnswer).length
  const incorrectCount  = Object.entries(qStates).filter(([i, s]) => s.checked && s.selected !== questions[+i]?.correctAnswer).length
  const progress        = (answeredCount / totalQ) * 100

  const qStatus = i => {
    const s = qStates[i]
    if (!s?.selected && !s?.checked) return 'unanswered'
    if (s.checked) return s.selected === questions[i]?.correctAnswer ? 'correct' : 'incorrect'
    if (s.selected) return 'skipped'
    return 'unanswered'
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const upd      = patch => setQStates(p => ({ ...p, [currentIndex]: { ...(p[currentIndex] || {}), ...patch } }))
  const setSelAns= val   => upd({ selected: val, checked: false })
  const doCheck  = ()    => { if (selected) upd({ checked: true }) }
  const doRetry  = ()    => upd({ selected: null, checked: false })
  const doNext   = ()    => { if (!isLast)  { setCurrentIndex(i => i + 1); setPaletteOpen(false) } }
  const doPrev   = ()    => { if (!isFirst) { setCurrentIndex(i => i - 1); setPaletteOpen(false) } }
  const jumpTo   = i     => { setCurrentIndex(i); setPaletteOpen(false) }
  const doRestart= ()    => { setCurrentIndex(0); setQStates({}); setPaletteOpen(false) }

  // ── Finished screen ──────────────────────────────────────────────────────────
  if (answeredCount === totalQ) {
    const pct = Math.round((correctCount / totalQ) * 100)
    return (
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-28 pb-16">
        <div className="max-w-md w-full">
          <div className="glass-card p-8 text-center animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
            <div className="text-5xl mb-4">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📚'}</div>
            <h2 className="font-display text-2xl font-extrabold text-white mb-1">Chapter Complete!</h2>
            <p className="text-slate-500 text-sm mb-6">{chapterName} · {subject.name}</p>
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="font-display text-3xl font-extrabold" style={{ color: '#10b981' }}>{correctCount}</div>
                <div className="text-xs text-slate-500">Correct</div>
              </div>
              <div className="w-px h-12" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="text-center">
                <div className="font-display text-3xl font-extrabold" style={{ color: '#ef4444' }}>{incorrectCount}</div>
                <div className="text-xs text-slate-500">Incorrect</div>
              </div>
              <div className="w-px h-12" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="text-center">
                <div className="font-display text-3xl font-extrabold text-white">{pct}%</div>
                <div className="text-xs text-slate-500">Score</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={doRestart} className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                style={{ background: `${subject.color}18`, border: `1px solid ${subject.color}30`, color: subject.color }}>
                Restart
              </button>
              <button onClick={() => navigate(`/practice/${subjectId}`)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white"
                style={{ background: subject.color }}>
                Back to Chapters
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Difficulty badge config ───────────────────────────────────────────────
  const diffCfg = question.difficulty === 'Hard'
    ? { bg: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }
    : question.difficulty === 'Easy'
    ? { bg: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }
    : { bg: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }

  return (
    <div className="relative z-10 min-h-screen pb-16 pt-24" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-5xl mx-auto px-4 flex gap-5">

        {/* ── QUESTION COLUMN ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Breadcrumb + live score */}
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
              <Link to="/practice" className="hover:text-slate-400 transition-colors">Practice</Link>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              <Link to={`/practice/${subjectId}`} className="hover:text-slate-400" style={{ color: subject.color }}>{subject.name}</Link>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              <span className="text-slate-400 truncate max-w-32 sm:max-w-none">{chapterName}</span>
            </div>
            <div className="flex items-center gap-3 text-xs flex-shrink-0">
              <span className="text-emerald-400 font-semibold">✓ {correctCount}</span>
              <span className="text-red-400 font-semibold">✗ {incorrectCount}</span>
              <span className="text-slate-600">{answeredCount}/{totalQ}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 rounded-full mb-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: subject.color }} />
          </div>

          {/* Question card */}
          <div className="glass-card p-7 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>

            {/* Meta row */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-mono font-bold"
                  style={{ background: `${subject.color}18`, border: `1px solid ${subject.color}28`, color: subject.color }}>
                  {String(currentIndex + 1).padStart(2, '0')}
                </div>
                <span className="text-xs text-slate-500 font-mono">of {totalQ}</span>
                {(question.examDate || question.examShiftLabel || question.examMeta || question.year) && (
                  <div
                    className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-xl px-2.5 py-1 text-xs"
                    style={{
                      background: `linear-gradient(135deg, ${subject.color}16, rgba(255,255,255,0.035))`,
                      border: `1px solid ${subject.color}30`,
                      boxShadow: `0 0 0 1px rgba(255,255,255,0.025) inset`,
                    }}
                    title={question.examMeta || question.year}
                  >
                    <svg className="h-3.5 w-3.5 flex-shrink-0" style={{ color: subject.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M5 11h14M7 5h10a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
                    </svg>
                    <span className="truncate font-semibold text-slate-200">
                      {question.examDate || question.year || question.examMeta}
                    </span>
                    {question.examShiftLabel && (
                      <span
                        className="flex-shrink-0 rounded-lg px-1.5 py-0.5 font-semibold"
                        style={{
                          background: `${subject.color}18`,
                          color: subject.color,
                          border: `1px solid ${subject.color}25`,
                        }}
                      >
                        {question.examShiftLabel}
                      </span>
                    )}
                  </div>
                )}
                {hasMatch && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>
                    Match
                  </span>
                )}
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full flex-shrink-0" style={diffCfg}>
                {question.difficulty}
              </span>
            </div>

            {/* ── Question text — rendered via MathText ── */}
            <div className="text-slate-100 text-base leading-relaxed font-medium mb-2">
              {question.isHtml ? <QuestionContent html={displayText} /> : <MathText text={displayText} />}
            </div>

            {/* Match table */}
            {hasMatch && (
              <MatchTable matchTableJson={question.match_table} questionText={question.question} accentColor={subject.color} />
            )}

            {/* Image */}
            {question.image && (
              <div className="mb-5 mt-3 rounded-2xl overflow-hidden cursor-zoom-in"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => setZoomImage(question.image)}>
                <img src={question.image} alt="Diagram" className="w-full object-contain max-h-64 bg-slate-900" />
              </div>
            )}

            {/* Options — each also passed through MathText via OptionButton */}
            <div className="space-y-2.5 mb-6 mt-4">
              {question.options.map((opt, i) => (
                <OptionButton key={opt + i} opt={opt} index={i}
                  selected={checked ? selected : (selected === opt ? opt : null)}
                  correctAnswer={checked ? question.correctAnswer : null}
                  mode={checked ? 'practice' : 'pyq-active'}
                  accentColor={subject.color}
                  onClick={o => !checked && setSelAns(o)} />
              ))}
            </div>

            {/* Explanation */}
            <div className="overflow-hidden transition-all duration-500"
              style={{ maxHeight: checked ? '320px' : '0px', opacity: checked ? 1 : 0 }}>
              <div className="p-4 rounded-2xl mb-4 overflow-y-auto"
                style={{ background: `${subject.color}0a`, border: `1px solid ${subject.color}22`, maxHeight: 260 }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }}>
                    {isCorrect
                      ? <svg className="w-3 h-3" fill="none" stroke="#10b981" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                      : <svg className="w-3 h-3" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                    }
                  </div>
                  <span className="text-xs font-bold" style={{ color: isCorrect ? '#10b981' : '#ef4444' }}>
                    {isCorrect ? 'Correct!' : `Incorrect — Answer: ${question.answerLabel || question.answerText || question.correctAnswer}`}
                  </span>
                </div>
                <div className="text-slate-400 text-xs leading-relaxed">
                  {question.isHtml ? <QuestionContent html={question.explanation} /> : <MathText text={question.explanation} />}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              {!checked ? (
                <button onClick={doCheck} disabled={!selected}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all"
                  style={{ background: selected ? subject.color : 'rgba(255,255,255,0.05)', color: selected ? '#fff' : '#475569', cursor: selected ? 'pointer' : 'not-allowed' }}>
                  Check Answer
                </button>
              ) : (
                <>
                  <button onClick={doRetry} className="py-3.5 px-5 rounded-2xl text-sm font-semibold"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
                    Retry
                  </button>
                  {!isLast ? (
                    <button onClick={doNext}
                      className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
                      style={{ background: subject.color }}>
                      Next <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    </button>
                  ) : (
                    <button onClick={() => navigate(`/practice/${subjectId}`)}
                      className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white"
                      style={{ background: subject.color }}>
                      Finish Chapter 🎉
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Prev / Next nav */}
          <div className="flex items-center justify-between mt-4 gap-3">
            <button onClick={doPrev} disabled={isFirst}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: isFirst ? '#334155' : '#94a3b8', cursor: isFirst ? 'not-allowed' : 'pointer' }}
              onMouseEnter={e => { if (!isFirst) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              Previous
            </button>

            <button onClick={() => setPaletteOpen(o => !o)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#94a3b8' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
              Questions
            </button>

            <button onClick={doNext} disabled={isLast}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all"
              style={{ background: isLast ? 'rgba(255,255,255,0.03)' : `${subject.color}18`, border: `1px solid ${isLast ? 'rgba(255,255,255,0.07)' : subject.color + '30'}`, color: isLast ? '#334155' : subject.color, cursor: isLast ? 'not-allowed' : 'pointer' }}
              onMouseEnter={e => { if (!isLast) e.currentTarget.style.background = `${subject.color}28` }}
              onMouseLeave={e => { e.currentTarget.style.background = isLast ? 'rgba(255,255,255,0.03)' : `${subject.color}18` }}>
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        {/* ── DESKTOP PALETTE SIDEBAR ──────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col w-60 flex-shrink-0">
          <div className="sticky top-24 rounded-3xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Questions</p>
              <span className="text-xs text-slate-600">{answeredCount}/{totalQ}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: subject.color }} />
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4 overflow-y-auto" style={{ maxHeight: 240, scrollbarWidth: 'thin' }}>
              {questions.map((_, i) => (
                <PaletteDot key={i} index={i} current={currentIndex} state={qStatus(i)} onClick={jumpTo} color={subject.color} />
              ))}
            </div>
            <div className="space-y-1.5 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <LegendItem bg="rgba(16,185,129,0.2)"   border="rgba(16,185,129,0.6)"  label="Correct" />
              <LegendItem bg="rgba(239,68,68,0.2)"    border="rgba(239,68,68,0.6)"   label="Incorrect" />
              <LegendItem bg="rgba(245,158,11,0.15)"  border="rgba(245,158,11,0.5)"  label="Answered, unchecked" />
              <LegendItem bg="rgba(255,255,255,0.04)" border="rgba(255,255,255,0.1)" label="Not visited" />
            </div>
            <button onClick={doRestart}
              className="w-full mt-4 py-2 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
              Restart Chapter
            </button>
          </div>
        </div>
      </div>

      {/* Mobile palette drawer */}
      {paletteOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div ref={paletteRef} className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-5"
            style={{ background: '#0d1120', border: '1px solid rgba(255,255,255,0.09)', maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">Question Palette</p>
              <button onClick={() => setPaletteOpen(false)} className="text-slate-500 hover:text-slate-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {questions.map((_, i) => (
                <PaletteDot key={i} index={i} current={currentIndex} state={qStatus(i)} onClick={jumpTo} color={subject.color} />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <LegendItem bg="rgba(16,185,129,0.2)"   border="rgba(16,185,129,0.6)" label="Correct" />
              <LegendItem bg="rgba(239,68,68,0.2)"    border="rgba(239,68,68,0.6)"  label="Incorrect" />
              <LegendItem bg="rgba(245,158,11,0.15)"  border="rgba(245,158,11,0.5)" label="Answered" />
              <LegendItem bg="rgba(255,255,255,0.04)" border="rgba(255,255,255,0.1)"label="Not visited" />
            </div>
          </div>
        </div>
      )}

      {/* Zoom image */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setZoomImage(null)}>
          <img src={zoomImage} alt="zoom" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </div>
  )
}

export default PracticeQuestionPage
