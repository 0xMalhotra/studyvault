import { useParams, useNavigate, Link } from 'react-router-dom'
import { subjects } from '../../data/studyData'

const PracticeSubjectPage = () => {
  const navigate = useNavigate()

  return (
    <div className="relative z-10 min-h-screen px-6 pb-16 pt-28">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-8 animate-fade-in opacity-0"
          style={{ animationFillMode: 'forwards' }}>
          <Link to="/" className="hover:text-slate-400 transition-colors">Home</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-blue-400">Practice Mode</span>
        </div>

        {/* Header */}
        <div className="mb-8 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.05s' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
              📖
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">Practice Mode</h1>
              <p className="text-slate-500 text-sm">One question at a time, instant feedback</p>
            </div>
          </div>
        </div>

        {/* Subject cards */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-4">Choose a Subject</p>
          {subjects.map((subject, i) => {
            const totalQ = subject.chapters.reduce((s, c) => s + c.questionCount, 0)
            return (
              <div
                key={subject.id}
                className={`glass-card p-6 cursor-pointer group animate-fade-up opacity-0 stagger-${i + 1}`}
                style={{ animationFillMode: 'forwards' }}
                onClick={() => navigate(`/practice/${subject.id}`)}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = `0 16px 40px ${subject.glowColor}`
                  e.currentTarget.style.borderColor = subject.color + '44'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.borderColor = ''
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${subject.color}14`, border: `1px solid ${subject.color}28` }}>
                    {subject.emoji}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-bold text-white">{subject.name}</h3>
                    <p className="text-slate-500 text-xs mb-2">{subject.tagline}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-500">
                        <span className="font-semibold" style={{ color: subject.color }}>{subject.chapters.length}</span> chapters
                      </span>
                      <span className="text-xs text-slate-500">
                        <span className="font-semibold" style={{ color: subject.color }}>{totalQ}</span> questions
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:translate-x-1"
                    style={{ background: `${subject.color}18`, border: `1px solid ${subject.color}28` }}>
                    <svg className="w-4 h-4" fill="none" stroke={subject.color} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PracticeSubjectPage
