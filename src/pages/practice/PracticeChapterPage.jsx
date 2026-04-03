import { useParams, useNavigate, Link } from 'react-router-dom'
import { subjects } from '../../data/studyData'

const PracticeChapterPage = () => {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const subject = subjects.find(s => s.id === subjectId)

  if (!subject) return (
    <div className="relative z-10 pt-28 text-center text-slate-500">
      Not found. <Link to="/practice" className="underline">Go back</Link>
    </div>
  )

  return (
    <div className="relative z-10 min-h-screen px-6 pb-16 pt-28">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-8 animate-fade-in opacity-0 flex-wrap"
          style={{ animationFillMode: 'forwards' }}>
          <Link to="/" className="hover:text-slate-400 transition-colors">Home</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link to="/practice" className="hover:text-slate-400 transition-colors text-blue-400">Practice</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span style={{ color: subject.color }}>{subject.name}</span>
        </div>

        {/* Subject header */}
        <div className="glass-card-static p-7 mb-8 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '0.05s' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: `${subject.color}18`, border: `1px solid ${subject.color}28` }}>
              {subject.emoji}
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">{subject.name}</h1>
              <p className="text-slate-500 text-sm">{subject.tagline}</p>
            </div>
          </div>
        </div>

        {/* Chapters */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-4">Choose a Chapter</p>
          {subject.chapters.map((chapter, i) => (
            <div
              key={chapter.id}
              className={`glass-card p-5 cursor-pointer group animate-fade-up opacity-0 stagger-${i + 1}`}
              style={{ animationFillMode: 'forwards' }}
              onClick={() => navigate(`/practice/${subjectId}/${chapter.id}`)}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = `0 12px 30px ${subject.glowColor}`
                e.currentTarget.style.borderColor = subject.color + '40'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = ''
                e.currentTarget.style.borderColor = ''
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${subject.color}12`, border: `1px solid ${subject.color}22` }}>
                  {chapter.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-white text-sm">{chapter.name}</h3>
                  <p className="text-slate-500 text-xs">{chapter.description}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                  style={{ background: `${subject.color}12`, border: `1px solid ${subject.color}25`, color: subject.color }}>
                  {chapter.questionCount} Q
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PracticeChapterPage
