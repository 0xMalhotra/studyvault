import { useNavigate } from 'react-router-dom'

const ModeCard = ({ mode }) => {
  const navigate = useNavigate()

  return (
    <div
      className={`glass-card p-8 cursor-pointer group animate-fade-up opacity-0 stagger-${mode.stagger} relative overflow-hidden`}
      style={{ animationFillMode: 'forwards' }}
      onClick={() => navigate(mode.path)}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 24px 60px ${mode.glow}`
        e.currentTarget.style.borderColor = mode.color + '44'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = ''
        e.currentTarget.style.borderColor = ''
      }}
    >
      <div
        className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${mode.color}14, transparent 70%)` }}
      />
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6"
          style={{ background: `${mode.color}14`, border: `1px solid ${mode.color}28`, color: mode.color }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: mode.color }} />
          {mode.tag}
        </div>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
          style={{ background: `${mode.color}18`, border: `1px solid ${mode.color}28` }}>
          {mode.icon}
        </div>
        <h2 className="font-display text-xl font-extrabold text-white mb-2 tracking-tight">{mode.title}</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-5">{mode.desc}</p>
        <ul className="space-y-1.5 mb-6">
          {mode.features.map(f => (
            <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke={mode.color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="text-xs text-slate-600">{mode.cta}</span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 group-hover:gap-3"
            style={{ background: `${mode.color}18`, border: `1px solid ${mode.color}28`, color: mode.color }}>
            Start
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

const modes = [
  {
    stagger: 1,
    path: '/practice',
    icon: '📖',
    tag: 'Chapter-wise',
    title: 'Practice Mode',
    desc: 'Study chapter by chapter with instant feedback. One question at a time.',
    features: [
      'Subject → Chapter → Question',
      'Instant answer reveal',
      'Full explanation per question',
      'Score tracked per session',
    ],
    cta: '3 Subjects · 12 Chapters',
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.25)',
  },
  {
    stagger: 2,
    path: '/pyq',
    icon: '🗓️',
    tag: 'Exam Simulation',
    title: 'PYQ Mode',
    desc: 'Simulate real JEE Main with previous year papers. 75 questions, 3-hour timer.',
    features: [
      'Select Year → Attempt → Shift',
      '75 questions with 3-hour timer',
      'Real exam question palette',
      'Detailed result & solutions',
    ],
    cta: '4 Years · 16 Papers',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.25)',
  },
  {
    stagger: 3,
    path: '/calculator',
    icon: '🧮',
    tag: 'JEE Main 2026',
    title: 'Score Calculator',
    desc: 'Paste your Digialm response sheet URL. Get your exact score instantly with full analysis.',
    features: [
      'Works with cdn3.digialm.com links',
      '+4 / -1 marking with numericals',
      'Subject-wise breakdown',
      'No login required',
    ],
    cta: 'Jan 2026 · All shifts',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.25)',
  },
]

const HomePage = () => (
  <div className="relative z-10 min-h-screen px-6 pb-16 pt-28">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-14 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-slate-400 mb-6"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          JEE Main 2026 Preparation · PCM
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-extrabold mb-4 tracking-tight leading-none">
          <span className="shimmer-text">Your Complete</span>
          <br />
          <span className="text-white">JEE Toolkit.</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-lg mx-auto leading-relaxed">
          Practice, simulate real papers, and calculate your score — everything in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {modes.map(mode => <ModeCard key={mode.path} mode={mode} />)}
      </div>

      <div className="grid grid-cols-3 gap-4 p-5 rounded-2xl animate-fade-up opacity-0 stagger-4"
        style={{ animationFillMode: 'forwards', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { value: '75+', label: 'Practice Questions', color: '#3b82f6' },
          { value: '16',  label: 'Previous Year Papers', color: '#f59e0b' },
          { value: '∞',   label: 'Score Calculations', color: '#8b5cf6' },
        ].map(({ value, label, color }) => (
          <div key={label} className="text-center">
            <div className="font-display text-2xl font-extrabold mb-0.5" style={{ color }}>{value}</div>
            <div className="text-xs text-slate-600">{label}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

export default HomePage
