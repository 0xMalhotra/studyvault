import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { subjects } from '../../data/studyData'
import { supabase } from '../../lib/supabase'
import { getCachedStats, setCachedStats, practiceCache } from '../../lib/practiceStore'

// Slug a chapter name for use as URL param
// e.g. "Units, Measurements and Errors" → "units-measurements-and-errors"
function slugify(str) {
  if (!str) return ''
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const PracticeChapterPage = () => {
  const { subjectId } = useParams()
  const navigate = useNavigate()

  const subject = subjects.find(s => s.id === subjectId)

  // Chapters from Supabase (distinct chapter names for this subject)
  const [sbChapters, setSbChapters] = useState([])
  const [loadingSb, setLoadingSb]   = useState(true)

  useEffect(() => {
    if (!subject) return
    let cancelled = false

    const fetchAllCounts = async () => {
      // 1. Check Cache First
      const cached = getCachedStats(subject.name)
      if (cached) {
        setSbChapters(cached)
        setLoadingSb(false)
        return
      }

      // 2. Optimistic UI: Use local data if available to show something instantly
      // (This is handled by the merge logic below, but we set loadingSb to false if we want instant feel)
      
      try {
        let allData = []
        let from = 0
        let step = 1000

        while (true) {
          const { data, error } = await supabase
            .from('questions')
            .select('chapter, correct_option, correct_answer, option_a') // Added option_a for consistency with QuestionPage
            .eq('subject', subject.name)
            .range(from, from + step - 1)
          
          if (cancelled || error || !data || data.length === 0) break
          allData = [...allData, ...data]
          if (data.length < step) break
          from += step
        }

        if (cancelled) return

        const counts = {}
        for (const row of allData) {
          // Only count valid questions
          if (!row.correct_option && !row.correct_answer) continue
          const slug = slugify(row.chapter)
          if (!counts[slug]) counts[slug] = { name: row.chapter, count: 0, mcq: 0, num: 0 }
          counts[slug].count += 1
          if (row.option_a === 'N/A') counts[slug].num += 1; else counts[slug].mcq += 1
        }
        
        const result = Object.entries(counts)
          .map(([slug, info]) => ({ 
            slug, 
            name: info.name, 
            count: info.count,
            mcq: info.mcq,
            num: info.num
          }))
          .sort((a, b) => a.name.localeCompare(b.name))

        setCachedStats(subject.name, result)
        setSbChapters(result)
      } catch (err) {
        console.error("Error fetching counts:", err)
      } finally {
        if (!cancelled) setLoadingSb(false)
      }
    }

    fetchAllCounts()
    return () => { cancelled = true }
  }, [subject])

  if (!subject) return (
    <div className="relative z-10 pt-28 text-center text-slate-500">
      Subject not found. <Link to="/practice" className="underline">Go back</Link>
    </div>
  )

  // Merge: hardcoded local chapters + Supabase chapters
  // Supabase chapters take priority if they exist; local ones fill gaps
  const sbChapterSlugs    = new Set(sbChapters.map(c => c.slug))

  const sbMap = Object.fromEntries(sbChapters.map(c => [c.slug, c]))
  const allChapters = [
    ...(subject.chapters || []).map(localChap => {
      const sb = sbMap[localChap.id] || sbMap[slugify(localChap.name)]
      const count = sb ? sb.count : (localChap.questionCount || 0)
      return {
        ...localChap,
        questionCount: count,
        source: sb ? 'supabase' : 'local',
        description: sb ? `${count} PYQ Questions available` : (localChap.description || 'Practice questions available')
      }
    }),
    ...sbChapters.filter(c => !(subject.chapters || []).some(lc => lc.id === c.slug || slugify(lc.name) === c.slug))
      .map(c => ({
        id:            c.slug,
        name:          c.name,
        questionCount: c.count,
        source:        'supabase',
        icon:          '📖',
        description:   `${c.count} PYQ questions found in database`,
      })),
  ]

  return (
    <div className="relative z-10 min-h-screen px-4 pb-16 pt-24">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-2 text-xs text-slate-600 mb-4">
            <Link to="/practice" className="hover:text-slate-400 transition-colors">Practice</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span style={{ color: subject.color }}>{subject.name}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: `${subject.color}18`, border: `1px solid ${subject.color}28` }}>
              {subject.emoji}
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold text-white">{subject.name}</h1>
              <p className="text-slate-500 text-sm">
                {allChapters.length} chapters · {allChapters.reduce((n, c) => n + c.questionCount, 0)} questions
              </p>
            </div>
          </div>
        </div>

        {/* Chapter grid */}
        {loadingSb ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-3xl animate-pulse h-28"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }} />
            ))}
          </div>
        ) : allChapters.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            No chapters found. Upload questions to Supabase or add them to studyData.js.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {allChapters.map((chapter, i) => (
              <button
                key={chapter.id}
                onClick={() => navigate(`/practice/${subjectId}/${chapter.id}`)}
                className="glass-card p-5 text-left group animate-fade-up opacity-0"
                style={{ animationFillMode: 'forwards', animationDelay: `${i * 40}ms` }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = `0 16px 48px ${subject.color}22`
                  e.currentTarget.style.borderColor = subject.color + '44'
                  
                  // PREFETCH: Load question list for this chapter in background
                  const cacheKey = `${subject.name}::${chapter.name}::ids`
                  if (!practiceCache.chapterQuestions.has(cacheKey)) {
                    supabase.from('questions')
                      .select('id, question_type_detail, option_a')
                      .eq('subject', subject.name)
                      .eq('chapter', chapter.name)
                      .order('source_date', { ascending: false, nullsFirst: false })
                      .order('source_year', { ascending: false, nullsFirst: false })
                      .then(({ data }) => {
                        if (data) {
                          practiceCache.chapterQuestions.set(cacheKey, data.map(r => ({
                            id: r.id, isPlaceholder: true, isNumerical: r.option_a === 'N/A' && r.question_type_detail !== 'match'
                          })))
                        }
                      })
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.borderColor = ''
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: `${subject.color}18`, border: `1px solid ${subject.color}28` }}>
                    {chapter.icon}
                  </div>
                  <div className="flex items-center gap-2">
                    {chapter.source === 'supabase' && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                        PYQ
                      </span>
                    )}
                    <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                <h3 className="font-semibold text-white text-sm mb-1 leading-snug">{chapter.name}</h3>
                <p className="text-xs text-slate-500">{chapter.description}</p>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs font-semibold" style={{ color: subject.color }}>
                    {chapter.questionCount} questions
                  </span>
                  <div className="h-1 w-16 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="h-full rounded-full w-0 group-hover:w-full transition-all duration-500"
                      style={{ background: subject.color }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PracticeChapterPage
