import QuestionContent from './QuestionContent'

const LABELS = ['A', 'B', 'C', 'D']

function hasHtml(value) {
  return typeof value === 'string' && /<\/?[a-z][\s\S]*>/i.test(value)
}

// mode: 'practice' | 'pyq-active' | 'pyq-result'
const OptionButton = ({
  opt,
  index,
  selected,
  correctAnswer,
  mode = 'practice',
  accentColor = '#3b82f6',
  onClick,
}) => {
  const optionValue = opt ?? ''
  const isSelected  = selected === optionValue
  const isCorrect   = optionValue === correctAnswer
  const isAnswered  = selected !== null && selected !== undefined

  let bg, border, text, labelColor

  if (mode === 'pyq-active') {
    if (isSelected) {
      bg = `${accentColor}18`
      border = accentColor
      text = '#fff'
      labelColor = accentColor
    } else {
      bg = 'rgba(255, 255, 255, 0.03)'
      border = 'rgba(255, 255, 255, 0.08)'
      text = '#94a3b8'
      labelColor = 'rgba(255, 255, 255, 0.2)'
    }
  } else if (mode === 'pyq-result') {
    if (isCorrect) {
      bg = 'rgba(16, 185, 129, 0.1)'; border = '#10b981'; text = '#d1fae5'; labelColor = '#10b981'
    } else if (isSelected && !isCorrect) {
      bg = 'rgba(239, 68, 68, 0.1)'; border = '#ef4444'; text = '#fecaca'; labelColor = '#ef4444'
    } else {
      bg = 'rgba(255, 255, 255, 0.02)'; border = 'rgba(255, 255, 255, 0.05)'; text = '#475569'; labelColor = 'rgba(255, 255, 255, 0.08)'
    }
  } else {
    // Standard Practice Mode logic
    const hasResult = correctAnswer !== null && correctAnswer !== undefined;
    
    if (!isAnswered) {
      bg = 'rgba(255, 255, 255, 0.03)'; border = 'rgba(255, 255, 255, 0.08)'; text = '#94a3b8'; labelColor = 'rgba(255, 255, 255, 0.2)'
    } else if (hasResult) {
      // Show result colors
      if (isCorrect) {
        bg = 'rgba(16, 185, 129, 0.1)'; border = '#10b981'; text = '#d1fae5'; labelColor = '#10b981'
      } else if (isSelected) {
        bg = 'rgba(239, 68, 68, 0.1)'; border = '#ef4444'; text = '#fecaca'; labelColor = '#ef4444'
      } else {
        bg = 'rgba(255, 255, 255, 0.02)'; border = 'rgba(255, 255, 255, 0.05)'; text = '#475569'; labelColor = 'rgba(255, 255, 255, 0.08)'
      }
    } else if (isSelected) {
      // Just highlight the selection (no result yet)
      bg = `${accentColor}18`; border = accentColor; text = '#fff'; labelColor = accentColor
    } else {
      bg = 'rgba(255, 255, 255, 0.03)'; border = 'rgba(255, 255, 255, 0.08)'; text = '#94a3b8'; labelColor = 'rgba(255, 255, 255, 0.2)'
    }
  }

  const locked = mode === 'pyq-result' || (mode === 'practice' && isAnswered)

  return (
    <button
      onClick={() => !locked && onClick?.(optionValue)}
      disabled={locked}
      className="w-full text-left flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300"
      style={{ background: bg, border: `1px solid ${border}`, cursor: locked ? 'default' : 'pointer' }}
      onMouseEnter={e => {
        if (!locked) { 
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; 
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.transform = 'translateX(4px)';
        }
      }}
      onMouseLeave={e => {
        if (!locked) { 
          e.currentTarget.style.background = bg; 
          e.currentTarget.style.borderColor = border;
          e.currentTarget.style.transform = 'translateX(0)';
        }
      }}
    >
      <span
        className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 transition-all"
        style={{ background: labelColor + '22', color: labelColor, border: `1px solid ${labelColor}44` }}
      >
        {LABELS[index]}
      </span>
      <div className="text-sm sm:text-base font-medium flex-1 min-w-0" style={{ color: text }}>
        {hasHtml(optionValue) ? <QuestionContent html={optionValue} /> : optionValue}
      </div>
      {mode !== 'pyq-active' && isAnswered && isCorrect && (
        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
          <svg className="w-3.5 h-3.5" fill="none" stroke="#10b981" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
      )}
      {mode !== 'pyq-active' && isAnswered && isSelected && !isCorrect && (
        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
          <svg className="w-3.5 h-3.5" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
      )}
    </button>
  )
}

export default OptionButton
