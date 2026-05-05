import { useState, useEffect, useRef, useMemo, Fragment } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { subjects } from '../../data/studyData'
import OptionButton from '../../components/shared/OptionButton'
import MatchTable from '../../components/shared/MatchTable'
import QuestionContent from '../../components/shared/QuestionContent'
import { supabase } from '../../lib/supabase'
import { haptics } from '../../lib/haptics'

// ─── Image base URL ───────────────────────────────────────────────────────────
const IMAGE_BASE = '/scraped_images/'

// ─── Slugify ──────────────────────────────────────────────────────────────────
function slugify(str) {
  if (!str) return ''
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const OPTION_FIELDS = ['option_a', 'option_b', 'option_c', 'option_d']

// ─── Simple Global Cache ──────────────────────────────────────────────────────
const questionCache = new Map()
const sidebarCache = new Map()

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
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
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
    image: row.image_url ? (row.image_url.startsWith('http') ? row.image_url : `${IMAGE_BASE}${row.image_url}`) : null,
    examDateRaw: row.source_date || row.exam_date || null,
    match_table: row.match_table,
    question_type_detail: row.question_type_detail || 'standard',
    isHtml: true,
  }
}

function MathText({ text, className = '' }) {
  const [katex, setKatex] = useState(null)
  useEffect(() => {
    import('katex').then(mod => setKatex(mod.default)).catch(() => {})
  }, [])
  const html = useMemo(() => {
    if (!katex || !text) return null
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
      } catch { parts.push({ type: 'text', val: raw }) }
      last = match.index + raw.length
    }
    if (last < text.length) parts.push({ type: 'text', val: text.slice(last) })
    if (!parts.some(p => p.type === 'math')) return null
    return parts.map((p, i) => p.type === 'text' ? `<span>${p.val.replace(/</g, '&lt;')}</span>` : `<span${p.display ? ' style="display:block;margin:8px 0"' : ''}>${p.val}</span>`).join('')
  }, [katex, text])
  if (html) return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
  return <span className={className}>{text}</span>
}

function getDisplayText(q) {
  if (!q) return ''
  let text = q.question || ''
  if (q.question_type_detail === 'match' || q.match_table) {
    text = text.replace(/(\|.+\|\s*\n?)+/g, '').replace(/\.tg\s*\{[^}]*\}/g, '').replace(/\.tg\s+\.[a-z0-9-]+\{[^}]*\}/g, '')
    const firstMatch = text.match(/(Match\s+(List|the LIST)[^\n]*)/i)
    if (firstMatch) text = text.replace(/(Match\s+(List|the LIST)[^\n]*\n?)+/gi, firstMatch[0] + '\n')
  }
  return text.replace(/\s+/g, ' ').trim()
}

function QuestionSkeleton({ subjectColor }) {
  return (
    <div className="relative z-10 min-h-screen pb-16 pt-24" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-full mx-auto px-6 lg:px-8 flex gap-6">
        <div className="hidden xl:flex flex-col w-56 flex-shrink-0">
          <div className="sticky top-24 rounded-3xl p-4 space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="h-6 w-24 skeleton rounded-md opacity-20" />
            <div className="space-y-2">{[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-10 w-full skeleton rounded-xl opacity-10" />)}</div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="glass-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex gap-2">
                <div className="h-6 w-20 skeleton rounded-full opacity-20" /><div className="h-6 w-32 skeleton rounded-full opacity-10" />
              </div>
              <div className="h-6 w-16 skeleton rounded-full opacity-20" />
            </div>
            <div className="space-y-3 mb-10">
              <div className="h-5 w-full skeleton rounded-md opacity-20" /><div className="h-5 w-[90%] skeleton rounded-md opacity-20" /><div className="h-5 w-[40%] skeleton rounded-md opacity-20" />
            </div>
            <div className="h-48 w-full skeleton rounded-2xl mb-10 opacity-5" />
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-14 w-full skeleton rounded-2xl opacity-10" />)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function checkNumerical(userStr, dbAnsStr) {
  if (!userStr || !dbAnsStr || dbAnsStr === 'N/A') return false;
  const parseNum = (s) => {
    const m = String(s).match(/-?\d*\.?\d+/);
    return m ? parseFloat(m[0]) : null;
  };
  const u = parseNum(userStr);
  const d = parseNum(dbAnsStr);
  if (u === null || d === null) return false;
  return Math.abs(u - d) < 0.01;
}

export default function PracticeQuestionPage() {
  const { subjectId, chapterId } = useParams()
  const navigate = useNavigate()
  const subject = subjects.find(s => s.id === subjectId)
  const localChapter = subject?.chapters?.find(c => c.id === chapterId)

  const [loading, setLoading] = useState(true)
  const [chapterName, setChapterName] = useState(localChapter?.name || '')
  const [questions, setQuestions] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [qStates, setQStates] = useState({})
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [zoomImage, setZoomImage] = useState(null)
  const [allChapters, setAllChapters] = useState([])
  const [filter, setFilter] = useState('all') // 'all', 'mcq', 'numerical'
  const paletteRef = useRef()

  useEffect(() => {
    if (!subject) { setLoading(false); return }
    let cancelled = false

    const fetchQuestions = async (chapterName) => {
      const cacheKey = `${subject.name}::${chapterName}::ids`
      if (questionCache.has(cacheKey)) {
        setQuestions(questionCache.get(cacheKey)); setLoading(false); return
      }
      
      // OPTIMIZATION: Fetch only IDs first for instant navigator load
      const { data: qData, error: qError } = await supabase
        .from('questions')
        .select('id, question_type_detail, option_a') // Fetch minimal info needed for structure
        .eq('subject', subject.name)
        .eq('chapter', chapterName)
        .order('source_date', { ascending: false, nullsFirst: false })
        .order('source_year', { ascending: false, nullsFirst: false })
      
      if (cancelled) return
      if (qError || !qData || qData.length === 0) { if (!fallbackToLocal()) setLoading(false); return }
      
      // Store light versions (placeholders)
      const lightMapped = qData.map(row => ({ 
        id: row.id, 
        isPlaceholder: true,
        isNumerical: row.option_a === 'N/A' && row.question_type_detail !== 'match'
      }))
      
      questionCache.set(cacheKey, lightMapped)
      setQuestions(lightMapped)
      setLoading(false)
    }

    const fallbackToLocal = () => {
      if (!localChapter) return false
      setChapterName(localChapter.name); setQuestions(localChapter.questions); setLoading(false)
      return true
    }

    const resolveAndFetch = async () => {
      setLoading(true); setQuestions(null); setCurrentIndex(0); setQStates({})
      if (allChapters.length > 0) {
        const matched = allChapters.find(c => c.id === chapterId || slugify(c.name) === chapterId)
        if (matched) { setChapterName(matched.name); await fetchQuestions(matched.name); return }
      }
      // Fallback: Resolve chapter name from DB if not in syllabus
      const { data: chapData } = await supabase.from('questions').select('chapter').eq('subject', subject.name).limit(1).eq('chapter', chapterId) 
      // Note: This fallback is simplified for speed
      const matched = chapData?.[0]?.chapter || localChapter?.name
      if (!matched) { if (!fallbackToLocal()) setLoading(false); return }
      setChapterName(matched); await fetchQuestions(matched)
    }
    resolveAndFetch()
    return () => { cancelled = true }
  }, [subjectId, chapterId, subject, localChapter, allChapters])

  // ─── NEW: Lazy Load Full Question Data ──────────────────────────────────────
  const [fullDataCache, setFullDataCache] = useState({})
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    if (!questions || !questions[currentIndex]) return
    const q = questions[currentIndex]
    if (!q.isPlaceholder) return // Already have full data (local or already fetched)
    if (fullDataCache[q.id]) return // Already in details cache

    let cancelled = false
    const fetchDetail = async () => {
      setLoadingDetails(true)
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', q.id)
        .single()
      
      if (!cancelled && !error && data) {
        const full = mapSupabaseQuestion(data)
        setFullDataCache(prev => ({ ...prev, [q.id]: full }))
        
        // PREFETCH NEXT 2 QUESTIONS
        const nextIndices = [currentIndex + 1, currentIndex + 2]
        nextIndices.forEach(idx => {
          const nq = questions[idx]
          if (nq && nq.isPlaceholder && !fullDataCache[nq.id]) {
            supabase.from('questions').select('*').eq('id', nq.id).single().then(({ data: ndata }) => {
              if (ndata) {
                const nfull = mapSupabaseQuestion(ndata)
                setFullDataCache(p => ({ ...p, [nq.id]: nfull }))
              }
            })
          }
        })
      }
      setLoadingDetails(false)
    }
    fetchDetail()
    return () => { cancelled = true }
  }, [currentIndex, questions, fullDataCache])

  useEffect(() => {
    if (!subject) return
    let cancelled = false

    const fetchAllStats = async () => {
      let allData = []
      let from = 0
      let step = 1000

      while (true) {
        const { data, error } = await supabase
          .from('questions')
          .select('chapter, option_a')
          .eq('subject', subject.name)
          .range(from, from + step - 1)
        
        if (cancelled || error || !data || data.length === 0) break
        allData = [...allData, ...data]
        if (data.length < step) break
        from += step
      }

      if (cancelled) return
      if (allData.length === 0) {
        setAllChapters((subject.chapters || []).map(c => ({ 
          ...c, 
          count: c.questionCount || 0,
          mcq: Math.floor((c.questionCount || 0) * 0.8),
          num: Math.ceil((c.questionCount || 0) * 0.2)
        })))
        return
      }

      const stats = {}
      for (const row of allData) {
        const slug = slugify(row.chapter)
        if (!stats[slug]) stats[slug] = { name: row.chapter, total: 0, mcq: 0, num: 0 }
        stats[slug].total += 1
        if (row.option_a === 'N/A') stats[slug].num += 1; else stats[slug].mcq += 1
      }
      
      const localIds = new Set((subject.chapters || []).map(c => c.id))
      const merged = (subject.chapters || []).map(localChap => {
        const s = stats[localChap.id] || stats[slugify(localChap.name)] || { total: 0, mcq: 0, num: 0 }
        const finalCount = s.total || localChap.questionCount || 0
        return { 
          ...localChap, 
          count: finalCount, 
          mcq: s.mcq || (s.total === 0 ? Math.floor(finalCount * 0.8) : 0), 
          num: s.num || (s.total === 0 ? Math.ceil(finalCount * 0.2) : 0) 
        }
      })
      
      const extras = Object.keys(stats)
        .filter(slug => !localIds.has(slug))
        .map(slug => ({
          id: slug,
          name: stats[slug].name,
          count: stats[slug].total,
          mcq: stats[slug].mcq,
          num: stats[slug].num
        }))

      setAllChapters([...merged, ...extras])
    }

    fetchAllStats()
    return () => { cancelled = true }
  }, [subject])

  const segregatedData = useMemo(() => {
    if (!questions) return { all: [], mcq: [], numerical: [], mcqCount: 0 }
    const mcqs = questions.filter(q => !q.isNumerical)
    const nums = questions.filter(q => q.isNumerical)
    return {
      all: [...mcqs, ...nums],
      mcq: mcqs,
      numerical: nums,
      mcqCount: mcqs.length
    }
  }, [questions])

  const filteredQuestions = useMemo(() => {
    if (filter === 'all') return segregatedData.all
    if (filter === 'mcq') return segregatedData.mcq
    if (filter === 'numerical') return segregatedData.numerical
    return segregatedData.all
  }, [segregatedData, filter])

  const handleFilterChange = (f) => {
    if (f === filter) return
    const currentQ = filteredQuestions[currentIndex]
    setFilter(f)
    
    // Find next index in the target list
    const nextList = f === 'all' ? segregatedData.all : (f === 'mcq' ? segregatedData.mcq : segregatedData.numerical)
    if (currentQ) {
      const nextIdx = nextList.findIndex(q => q.id === currentQ.id)
      setCurrentIndex(nextIdx >= 0 ? nextIdx : 0)
    } else {
      setCurrentIndex(0)
    }
    setPaletteOpen(false)
  }

  useEffect(() => {
    const h = e => { if (paletteRef.current && !paletteRef.current.contains(e.target)) setPaletteOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const [completedChapters, setCompletedChapters] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`completed_${subjectId}`) || '[]') } catch { return [] }
  })

  const totalQ = filteredQuestions?.length || 0
  const answeredCount = Object.values(qStates).filter(s => s.checked).length

  useEffect(() => {
    if (totalQ > 0 && answeredCount === totalQ && !completedChapters.includes(chapterId)) {
      const next = [...completedChapters, chapterId]
      setCompletedChapters(next)
      localStorage.setItem(`completed_${subjectId}`, JSON.stringify(next))
    }
  }, [answeredCount, totalQ, chapterId, completedChapters, subjectId])

  if (!subject) return <div className="relative z-10 pt-28 text-center text-slate-500">Subject not found. <Link to="/practice" className="underline">Go back</Link></div>
  if (loading) return <QuestionSkeleton subjectColor={subject.color} />
  if (!questions || questions.length === 0) return <div className="relative z-10 pt-28 text-center text-slate-500">No questions found. <Link to={`/practice/${subjectId}`} className="underline">Go back</Link></div>

  const rawQ = filteredQuestions[currentIndex]
  const question = rawQ?.isPlaceholder ? (fullDataCache[rawQ.id] || rawQ) : rawQ
  const isPlaceholder = question.isPlaceholder

  const isFirst = currentIndex === 0
  const isLast = currentIndex === totalQ - 1
  const { selected = null, numAnswer = '', checked = false, isReview = false } = qStates[currentIndex] || {}
  const hasMatch = !isPlaceholder && (question.question_type_detail === 'match' || !!question.match_table)
  const isNumerical = isPlaceholder ? question.isNumerical : (question.options?.length === 0 && !hasMatch)
  
  let isCorrect = false
  if (!isPlaceholder) {
    if (isNumerical) { if (checked && numAnswer) isCorrect = checkNumerical(numAnswer, question.correctAnswer) || checkNumerical(numAnswer, question.answerText) }
    else { isCorrect = selected === question.correctAnswer }
  }

  const displayText = isPlaceholder ? '' : (question.isHtml ? question.question : getDisplayText(question))
  const correctCount = Object.entries(qStates).filter(([i, s]) => {
    if (!s.checked) return false
    const q = questions[+i]
    if (q.isPlaceholder) {
       const full = fullDataCache[q.id]
       if (!full) return false
       if (q.isNumerical) return checkNumerical(s.numAnswer, full.correctAnswer) || checkNumerical(s.numAnswer, full.answerText)
       return s.selected === full.correctAnswer
    }
    const isNum = q.options.length === 0 && !(q.question_type_detail === 'match' || !!q.match_table)
    if (isNum) return checkNumerical(s.numAnswer, q.correctAnswer) || checkNumerical(s.numAnswer, q.answerText)
    return s.selected === q.correctAnswer
  }).length

  const incorrectCount = Object.entries(qStates).filter(([i, s]) => {
    if (!s.checked) return false
    const q = questions[+i]
    if (q.isPlaceholder) {
       const full = fullDataCache[q.id]
       if (!full) return false
       if (q.isNumerical) return !(checkNumerical(s.numAnswer, full.correctAnswer) || checkNumerical(s.numAnswer, full.answerText))
       return s.selected !== full.correctAnswer
    }
    const isNum = q.options.length === 0 && !(q.question_type_detail === 'match' || !!q.match_table)
    if (isNum) return !(checkNumerical(s.numAnswer, q.correctAnswer) || checkNumerical(s.numAnswer, q.answerText))
    return s.selected !== q.correctAnswer
  }).length
  const progress = (answeredCount / totalQ) * 100

  const qStatus = i => {
    const s = qStates[i]
    if (s?.isReview) return 'review'
    if (!s?.selected && !s?.numAnswer && !s?.checked) return 'unanswered'
    if (s.checked) {
      const q = filteredQuestions[i]
      const full = q.isPlaceholder ? fullDataCache[q.id] : q
      if (!full) return 'skipped'
      const isNum = q.isPlaceholder ? q.isNumerical : (q.options.length === 0 && !(q.question_type_detail === 'match' || !!q.match_table))
      if (isNum) return (checkNumerical(s.numAnswer, full.correctAnswer) || checkNumerical(s.numAnswer, full.answerText)) ? 'correct' : 'incorrect'
      return s.selected === full.correctAnswer ? 'correct' : 'incorrect'
    }
    if (s.selected || s.numAnswer) return 'skipped'
    return 'unanswered'
  }

  const upd = patch => setQStates(p => ({ ...p, [currentIndex]: { ...(p[currentIndex] || {}), ...patch } }))
  const setSelAns = val => upd({ selected: val, checked: false })
  const setNumAns = val => { haptics.light(); upd({ numAnswer: val, checked: false }) }
  const toggleRev = () => { haptics.light(); upd({ isReview: !isReview }) }
  const doCheck = () => {
    if (selected || (isNumerical && numAnswer)) {
      let correct = false;
      if (isNumerical) {
        correct = checkNumerical(numAnswer, question.correctAnswer) || checkNumerical(numAnswer, question.answerText);
      } else {
        correct = selected === question.correctAnswer;
      }
      
      if (correct) haptics.success();
      else haptics.error();
      
      upd({ checked: true, isReview: false })
    }
  }
  const doRetry = () => upd({ selected: null, numAnswer: '', checked: false })
  const doNext = () => { if (!isLast) { haptics.light(); setCurrentIndex(i => i + 1); setPaletteOpen(false) } }
  const doPrev = () => { if (!isFirst) { haptics.light(); setCurrentIndex(i => i - 1); setPaletteOpen(false) } }
  const jumpTo = i => { haptics.light(); setCurrentIndex(i); setPaletteOpen(false) }
  const doRestart = () => { haptics.medium(); setCurrentIndex(0); setQStates({}); setPaletteOpen(false) }

  if (answeredCount === totalQ) {
    const pct = Math.round((correctCount / totalQ) * 100)
    return (
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-28 pb-16">
        <div className="max-w-md w-full">
          <div className="glass-card p-8 text-center animate-fade-up">
            <div className="text-5xl mb-4">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📚'}</div>
            <h2 className="font-display text-2xl font-extrabold text-white mb-1">Chapter Complete!</h2>
            <p className="text-slate-500 text-sm mb-6">{chapterName} · {subject.name}</p>
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="text-center"><div className="text-3xl font-bold text-emerald-500">{correctCount}</div><div className="text-xs text-slate-500">Correct</div></div>
              <div className="w-px h-12 bg-white/10" /><div className="text-center"><div className="text-3xl font-bold text-red-500">{incorrectCount}</div><div className="text-xs text-slate-500">Incorrect</div></div>
              <div className="w-px h-12 bg-white/10" /><div className="text-center"><div className="text-3xl font-bold text-white">{pct}%</div><div className="text-xs text-slate-500">Score</div></div>
            </div>
            <div className="flex gap-3">
              <button onClick={doRestart} className="flex-1 py-3 rounded-2xl text-sm font-semibold" style={{ background: `${subject.color}18`, color: subject.color }}>Restart</button>
              <button onClick={() => navigate(`/practice/${subjectId}`)} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white" style={{ background: subject.color }}>Back</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const difficulty = isPlaceholder ? 'Medium' : (question.difficulty || 'Medium')
  const diffCfg = difficulty === 'Hard' ? { bg: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' } : difficulty === 'Easy' ? { bg: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' } : { bg: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }

  return (
    <div className="relative z-10 min-h-screen pb-16 pt-24" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-full mx-auto px-6 lg:px-8 flex gap-6">
        
        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
        <div className="hidden xl:flex flex-col w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-5">
            <div className="rounded-3xl overflow-hidden glass-card">
              <div className="px-5 pt-5 pb-4 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xl">{subject.emoji}</span>
                  <p className="text-sm font-bold text-slate-200 truncate">{subject.name}</p>
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-8">{allChapters.length} Chapters</p>
              </div>
              <div className="overflow-y-auto py-3 scrollbar-hide" style={{ maxHeight: 'calc(100vh - 380px)' }}>
                {allChapters.map(ch => {
                  const isActive = ch.id === chapterId || slugify(ch.name) === chapterId
                  const isDone = completedChapters.includes(ch.id)
                  return (
                    <button key={ch.id} onClick={() => navigate(`/practice/${subjectId}/${ch.id}`)} 
                      className={`w-full text-left px-5 py-3.5 transition-all group border-l-4 relative ${isActive ? 'bg-white/5 border-emerald-500' : 'border-transparent hover:bg-white/[0.02]'}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className={`text-[12px] leading-tight truncate font-bold ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>{ch.name}</p>
                        {isDone && <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className={`flex items-center px-2 py-0.5 rounded-lg gap-1.5 transition-colors ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-500'}`}>
                          <span className="text-[8px] font-black uppercase tracking-tighter opacity-70">MCQ</span>
                          <span className="text-[10px] font-mono font-black">{ch.mcq}</span>
                        </div>
                        <div className={`flex items-center px-2 py-0.5 rounded-lg gap-1.5 transition-colors ${isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-500'}`}>
                          <span className="text-[8px] font-black uppercase tracking-tighter opacity-70">NUM</span>
                          <span className="text-[10px] font-mono font-black">{ch.num}</span>
                        </div>
                      </div>
                      {isActive && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* PROGRESS BENTO BOX */}
            <div className="glass-card p-6 flex items-center gap-6 group">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-white/[0.05]" strokeWidth="3" />
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-emerald-500 transition-all duration-1000" strokeWidth="3" 
                    strokeDasharray={`${(completedChapters.length / allChapters.length) * 100}, 100`} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.4))' }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-black text-white">{Math.round((completedChapters.length / allChapters.length) * 100 || 0)}%</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Subject Progress</p>
                <p className="text-[13px] font-bold text-white truncate">{completedChapters.length} / {allChapters.length}</p>
                <p className="text-[10px] text-slate-400 font-medium">Chapters Finished</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── CENTER COLUMN ────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-slate-500">
              <Link to="/practice" className="hover:text-slate-300 transition-colors">StudyVault</Link>
              <span className="opacity-20">/</span>
              <span style={{ color: subject.color }}>{subject.name}</span>
            </div>
            <button onClick={toggleRev} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all ${isReview ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-slate-500 hover:text-slate-300 border border-transparent'}`}>
              <svg className="w-3.5 h-3.5" fill={isReview ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
              {isReview ? 'Reviewing' : 'Mark for Review'}
            </button>
          </div>

          {/* NEW: Filter Bar */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'all', label: 'All Questions', icon: '🎯' },
              { id: 'mcq', label: 'Multiple Choice', icon: '🔘' },
              { id: 'numerical', label: 'Numerical Answer', icon: '🔢' }
            ].map(f => (
              <button key={f.id} onClick={() => handleFilterChange(f.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filter === f.id ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10'}`}>
                <span>{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>

          <div className="glass-card overflow-hidden p-6 sm:p-10 mb-8 pb-10 relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase" style={{ ...diffCfg }}>{difficulty}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Q {currentIndex + 1} / {totalQ}</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isPlaceholder ? '...' : question.examMeta}</div>
            </div>

            <div className="mb-10 text-base sm:text-lg font-medium leading-relaxed text-slate-100 min-h-[100px]">
              {isPlaceholder ? (
                <div className="space-y-3">
                  <div className="h-5 w-full skeleton rounded-md opacity-20" />
                  <div className="h-5 w-[90%] skeleton rounded-md opacity-20" />
                  <div className="h-5 w-[40%] skeleton rounded-md opacity-20" />
                </div>
              ) : (
                <>
                  {question.isHtml ? <QuestionContent html={displayText} /> : <MathText text={displayText} />}
                  {question.image && (
                    <div className="mt-8 mx-auto max-w-xl rounded-2xl overflow-hidden bg-white/5 p-3 border border-white/5 group relative">
                      <img src={question.image} className="max-w-[85%] mx-auto rounded-xl shadow-2xl transition-all duration-300 group-hover:scale-[1.02] cursor-zoom-in" onClick={() => setZoomImage(question.image)} />
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-2 py-1 rounded-lg text-white text-[9px] font-bold backdrop-blur-md border border-white/10 pointer-events-none uppercase tracking-widest">Click to Zoom</div>
                    </div>
                  )}
                </>
              )}
            </div>

            {isPlaceholder ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {[1,2,3,4].map(i => <div key={i} className="h-14 w-full skeleton rounded-2xl opacity-10" />)}
              </div>
            ) : isNumerical ? (
              <div className="mb-8 max-w-xs mx-auto">
                <div className="mb-4 p-4 rounded-2xl text-right text-3xl font-mono min-h-[72px] flex items-center justify-end bg-black/40 border border-white/10 text-white shadow-inner">{numAnswer || '0'}</div>
                <div className="grid grid-cols-3 gap-2">{['1','2','3','4','5','6','7','8','9','-','0','.'].map(k => (
                  <button key={k} onClick={() => !checked && (k === '-' ? setNumAns(numAnswer.startsWith('-') ? numAnswer.slice(1) : '-' + numAnswer) : k === '.' ? !numAnswer.includes('.') && setNumAns(numAnswer + k) : setNumAns(numAnswer + k))} 
                    className="h-14 rounded-xl bg-white/5 font-bold text-lg hover:bg-white/10 active:scale-95 transition-all border border-white/[0.03]">{k}</button>
                ))}</div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={() => !checked && setNumAns('')} className="py-3.5 rounded-xl text-[10px] font-bold bg-red-500/10 text-red-400 uppercase tracking-widest hover:bg-red-500/20 transition-colors border border-red-500/20">Clear</button>
                  <button onClick={() => !checked && setNumAns(numAnswer.slice(0,-1))} className="py-3.5 rounded-xl text-[10px] font-bold bg-white/5 text-slate-400 uppercase tracking-widest hover:bg-white/10 transition-colors border border-white/10">Delete</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {question.options.map((opt, i) => (
                  <OptionButton 
                    key={`${question.id}-${i}`} 
                    opt={opt} 
                    index={i} 
                    selected={selected} 
                    correctAnswer={checked ? question.correctAnswer : null} 
                    mode={checked ? 'practice' : 'pyq-active'} 
                    accentColor={subject.color} 
                    onClick={o => !checked && setSelAns(o)} 
                  />
                ))}
              </div>
            )}

            {checked && !isPlaceholder && (
              <div className="p-6 rounded-3xl mb-8 bg-white/5 border border-white/5 animate-fade-in">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>{isCorrect ? 'Correct!' : `Incorrect - Answer: ${question.answerLabel || question.answerText}`}</p>
                <div className="text-slate-400 text-[14px] leading-relaxed font-normal">{question.isHtml ? <QuestionContent html={question.explanation} /> : <MathText text={question.explanation} />}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR (NAVIGATOR + STATS) ─────────────────────────────────── */}
        <div className="hidden lg:flex flex-col w-64 flex-shrink-0 gap-4 sticky top-24 h-[calc(100vh-120px)]">
          
          {/* TOP 60%: NAVIGATOR */}
          <div className="glass-card flex-[0.6] flex flex-col min-h-0 overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/[0.01]">
              <div className="flex p-1 rounded-xl bg-black/20 border border-white/5 gap-1">
                {['all', 'mcq', 'numerical'].map(f => (
                  <button key={f} onClick={() => handleFilterChange(f)}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${filter === f ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}>
                    {f === 'numerical' ? 'NUM' : f}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
              <div className="grid grid-cols-5 gap-2">
                {filteredQuestions.map((q, i) => {
                  const status = qStatus(i); const isCur = i === currentIndex
                  const isNum = q.isPlaceholder ? q.isNumerical : (q.options?.length === 0 && !(q.question_type_detail === 'match' || !!q.match_table))
                  const showHeader = filter === 'all' && (i === 0 || i === segregatedData.mcqCount)
                  
                  let bg = 'rgba(255,255,255,0.03)', border = 'rgba(255,255,255,0.05)', text = '#475569'
                  if (status === 'correct') { bg = 'rgba(16,185,129,0.15)'; border = 'rgba(16,185,129,0.3)'; text = '#10b981' }
                  else if (status === 'incorrect') { bg = 'rgba(239,68,68,0.15)'; border = 'rgba(239,68,68,0.3)'; text = '#ef4444' }
                  else if (status === 'review') { bg = 'rgba(245,158,11,0.15)'; border = 'rgba(245,158,11,0.3)'; text = '#f59e0b' }
                  else if (status === 'skipped') { bg = 'rgba(255,255,255,0.1)'; border = 'rgba(255,255,255,0.2)'; text = '#cbd5e1' }
                  
                  return (
                    <Fragment key={q.id}>
                      {showHeader && (
                        <div className={`col-span-5 text-[8px] font-black uppercase tracking-[0.2em] py-2 mb-2 ${i === 0 ? 'text-slate-500' : 'text-blue-500 border-t border-white/5 pt-4 mt-2'}`}>
                          {i === 0 ? 'Section A: MCQs' : 'Section B: Numerical'}
                        </div>
                      )}
                      <button onClick={() => jumpTo(i)} 
                        className={`h-10 rounded-xl text-[10px] font-black border transition-all relative overflow-hidden ${isCur ? 'scale-110 z-10' : 'hover:bg-white/5 active:scale-95'}`} 
                        style={{ background: isCur ? subject.color : bg, borderColor: isCur ? subject.color : border, color: isCur ? '#fff' : text, boxShadow: isCur ? `0 0 20px ${subject.color}60` : 'none' }}>
                        {i + 1}
                        <div className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full" style={{ background: isNum ? '#3b82f6' : 'transparent' }} />
                      </button>
                    </Fragment>
                  )
                })}
              </div>
            </div>
          </div>

          {/* BOTTOM 40%: STATS */}
          <div className="glass-card flex-[0.4] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-white/[0.02]">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Chapter Stats</p>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center flex flex-col justify-center">
                  <p className="text-[8px] font-black text-emerald-500 mb-1 uppercase tracking-tighter">CORRECT</p>
                  <p className="text-xl font-black text-emerald-400 leading-none">{correctCount}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-center flex flex-col justify-center">
                  <p className="text-[8px] font-black text-red-500 mb-1 uppercase tracking-tighter">ERRORS</p>
                  <p className="text-xl font-black text-red-400 leading-none">{incorrectCount}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Accuracy</p>
                  <p className="text-[14px] font-black text-white">{answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0}%</p>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${answeredCount > 0 ? (correctCount / answeredCount) * 100 : 0}%` }} />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Completion</p>
                  <p className="text-[14px] font-black text-white">{Math.round(progress)}%</p>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-1000" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${subject.color}, #fff)` }} />
                </div>
              </div>

              <button onClick={doRestart} className="w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all border border-white/5 mt-2">Restart Chapter</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── ALIGNED FIXED NAVIGATION DOCK ───────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-full mx-auto px-6 lg:px-8 flex gap-6">
          <div className="hidden xl:block w-72 flex-shrink-0" /> {/* Left Spacer */}
          <div className="flex-1 min-w-0 flex justify-center items-end pb-8 pt-10 pointer-events-auto">
            <div className="bg-[#0a0c12] p-2.5 flex gap-2.5 shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10 rounded-[24px] w-full max-w-xl animate-fade-up ring-1 ring-white/[0.05]">
              <button onClick={doPrev} disabled={isFirst} 
                className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center disabled:opacity-10 hover:bg-white/[0.07] transition-all active:scale-95 border border-white/5 group">
                <svg className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
              </button>
              
              {!checked ? (
                <button onClick={doCheck} disabled={(!isNumerical && !selected) || (isNumerical && !numAnswer)} 
                  className="flex-1 h-14 rounded-2xl font-black uppercase tracking-[0.25em] text-[12px] text-white shadow-xl transition-all active:scale-[0.98] disabled:opacity-20 disabled:cursor-not-allowed overflow-hidden relative group" 
                  style={{ background: (selected || numAnswer) ? subject.color : 'rgba(255,255,255,0.06)' }}>
                  <span className="relative z-10">Check Answer</span>
                  {(selected || numAnswer) && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />}
                </button>
              ) : (
                <button onClick={doNext} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-[0.25em] text-[12px] text-white shadow-2xl transition-all active:scale-[0.98] overflow-hidden relative group" 
                  style={{ background: subject.color }}>
                  <span className="relative z-10">{isLast ? 'Finish Chapter' : 'Next Question'}</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </button>
              )}

              <button onClick={doNext} disabled={isLast} 
                className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center disabled:opacity-10 hover:bg-white/[0.07] transition-all active:scale-95 border border-white/5 group">
                <svg className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
          <div className="hidden lg:block w-64 flex-shrink-0" /> {/* Right Spacer */}
        </div>
      </div>

      {/* ── ZOOM MODAL ────────────────────────────────────────────────────── */}
      {zoomImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in" onClick={() => setZoomImage(null)}>
          <img src={zoomImage} alt="zoom" className="max-w-full max-h-full rounded-3xl bg-white p-4 shadow-2xl" />
          <button className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors" onClick={() => setZoomImage(null)}>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}
    </div>
  )
}
