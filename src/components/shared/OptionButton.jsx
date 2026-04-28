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
    // During test — only show selection, no correct/wrong
    if (isSelected) {
      bg = `${accentColor}18`
      border = accentColor
      text = '#fff'
      labelColor = accentColor
    } else {
      bg = 'rgba(255,255,255,0.03)'
      border = 'rgba(255,255,255,0.09)'
      text = '#94a3b8'
      labelColor = 'rgba(255,255,255,0.2)'
    }
  } else if (mode === 'pyq-result') {
    // After submission — show correct/wrong
    if (isCorrect) {
      bg = 'rgba(16,185,129,0.10)'; border = 'rgba(16,185,129,0.45)'; text = '#d1fae5'; labelColor = '#10b981'
    } else if (isSelected && !isCorrect) {
      bg = 'rgba(239,68,68,0.10)'; border = 'rgba(239,68,68,0.45)'; text = '#fecaca'; labelColor = '#ef4444'
    } else {
      bg = 'rgba(255,255,255,0.02)'; border = 'rgba(255,255,255,0.05)'; text = '#475569'; labelColor = 'rgba(255,255,255,0.08)'
    }
  } else {
    // Practice mode — show after selection
    if (!isAnswered) {
      bg = 'rgba(255,255,255,0.03)'; border = 'rgba(255,255,255,0.09)'; text = '#94a3b8'; labelColor = 'rgba(255,255,255,0.2)'
    } else if (isCorrect) {
      bg = 'rgba(16,185,129,0.10)'; border = 'rgba(16,185,129,0.45)'; text = '#d1fae5'; labelColor = '#10b981'
    } else if (isSelected) {
      bg = 'rgba(239,68,68,0.10)'; border = 'rgba(239,68,68,0.45)'; text = '#fecaca'; labelColor = '#ef4444'
    } else {
      bg = 'rgba(255,255,255,0.02)'; border = 'rgba(255,255,255,0.05)'; text = '#475569'; labelColor = 'rgba(255,255,255,0.08)'
    }
  }

  const canHover = !isAnswered || mode === 'pyq-active'
  const locked = mode === 'pyq-result' || (mode === 'practice' && isAnswered)

  return (
    <button
      onClick={() => !locked && onClick?.(optionValue)}
      disabled={locked}
      className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200"
      style={{ background: bg, border: `1px solid ${border}`, cursor: locked ? 'default' : 'pointer' }}
      onMouseEnter={e => {
        if (!locked) { e.currentTarget.style.background = `${accentColor}12`; e.currentTarget.style.borderColor = `${accentColor}50` }
      }}
      onMouseLeave={e => {
        if (!locked) { e.currentTarget.style.background = bg; e.currentTarget.style.borderColor = border }
      }}
    >
      <span
        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ background: labelColor + '22', color: labelColor, border: `1px solid ${labelColor}44` }}
      >
        {LABELS[index]}
      </span>
      <div className="text-sm flex-1 min-w-0" style={{ color: text }}>
        {hasHtml(optionValue) ? <QuestionContent html={optionValue} /> : optionValue}
      </div>
      {mode !== 'pyq-active' && isAnswered && isCorrect && (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="#10b981" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {mode !== 'pyq-active' && isAnswered && isSelected && !isCorrect && (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  )
}

export default OptionButton
