import { useEffect, useState, useRef } from 'react'

// totalSeconds: total exam time in seconds
// onExpire: called when timer hits 0
const ExamTimer = ({ totalSeconds = 10800, onExpire }) => {
  const [remaining, setRemaining] = useState(totalSeconds)
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          onExpire?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const h = Math.floor(remaining / 3600)
  const m = Math.floor((remaining % 3600) / 60)
  const s = remaining % 60
  const fmt = (n) => String(n).padStart(2, '0')

  const pct = remaining / totalSeconds
  const isWarning = remaining < 900  // last 15 min
  const isDanger  = remaining < 300  // last 5 min

  const color = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981'

  return (
    <div
      className="flex items-center gap-2.5 px-4 py-2 rounded-2xl"
      style={{
        background: isDanger ? 'rgba(239,68,68,0.10)' : isWarning ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
        border: `1px solid ${color}30`,
      }}
    >
      {/* Clock icon */}
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke={color} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2" />
      </svg>

      <span className="font-mono text-sm font-semibold tabular-nums" style={{ color }}>
        {fmt(h)}:{fmt(m)}:{fmt(s)}
      </span>

      {isDanger && (
        <span className="text-xs font-medium animate-pulse" style={{ color }}>
          Hurry!
        </span>
      )}
    </div>
  )
}

export default ExamTimer
