// QuestionPalette.jsx
// answers shape: { [questionIndex]: { answer?: string, marked?: bool, visited?: bool } }
// currentIndex: index of the question currently on screen (handled OUTSIDE getStatus)

const QuestionPalette = ({ total = 75, answers, currentIndex, onJump }) => {
  const subjects = [
    { label: "Physics",     start: 0,  end: 24, color: "#3b82f6" },
    { label: "Chemistry",   start: 25, end: 49, color: "#10b981" },
    { label: "Mathematics", start: 50, end: 74, color: "#f59e0b" },
  ]

  // ─── Status logic ────────────────────────────────────────────────────────────
  // Returns one of: notVisited | notAnswered | answered | marked | markedAnswered
  // "current" is NOT a status — it is handled separately via isCurrent below.
  const getStatus = (idx) => {
    const q = answers[idx]

    // No entry at all → never opened
    if (!q) return "notVisited"

    // Has both marked flag AND a saved answer
    if (q.marked && q.answer) return "markedAnswered"

    // Marked for review but no answer saved
    if (q.marked) return "marked"

    // Has a saved answer (and not marked)
    if (q.answer) return "answered"

    // visited flag set by useEffect in parent, but no answer chosen yet
    if (q.visited) return "notAnswered"

    // Entry exists but none of the above → treat as notVisited
    return "notVisited"
  }

  // ─── Per-status base styles ───────────────────────────────────────────────────
  const statusStyles = {
    notVisited:    { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.15)", text: "#94a3b8" },
    notAnswered:   { bg: "rgba(239,68,68,0.22)",   border: "rgba(239,68,68,0.65)",   text: "#fca5a5" },
    answered:      { bg: "rgba(34,197,94,0.18)",   border: "rgba(34,197,94,0.55)",   text: "#86efac" },
    marked:        { bg: "rgba(250,204,21,0.18)",  border: "rgba(250,204,21,0.55)",  text: "#fde047" },
    markedAnswered:{ bg: "rgba(249,115,22,0.18)",  border: "rgba(249,115,22,0.55)",  text: "#fdba74" },
  }

  // ─── Stats ───────────────────────────────────────────────────────────────────
  const answered    = Object.values(answers).filter(q => q?.answer).length
  const unattempted = total - answered

  return (
    <div
      className="flex flex-col h-full p-4 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
      }}
    >
      {/* ── Legend ── */}
      <div
        className="flex flex-wrap gap-x-3 gap-y-2 mb-4 text-xs p-3 rounded-xl"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {[
          { label: "Not visited",      bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.15)" },
          { label: "Not answered",     bg: "rgba(239,68,68,0.18)",   border: "rgba(239,68,68,0.55)"   },
          { label: "Answered",         bg: "rgba(34,197,94,0.18)",   border: "rgba(34,197,94,0.55)"   },
          { label: "Marked",           bg: "rgba(250,204,21,0.18)",  border: "rgba(250,204,21,0.55)"  },
          { label: "Marked+Answered",  bg: "rgba(249,115,22,0.18)",  border: "rgba(249,115,22,0.55)"  },
          { label: "Current",          bg: "transparent",            border: "#3b82f6", ring: true    },
        ].map(({ label, bg, border, ring }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded flex-shrink-0"
              style={{
                background: bg,
                border: `${ring ? "2px" : "1px"} solid ${border}`,
                boxShadow: ring ? `0 0 0 1.5px #3b82f6` : "none",
              }}
            />
            <span className="text-slate-400">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Question grid ── */}
      <div
        className="flex-1 overflow-y-auto space-y-4 pr-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {subjects.map(({ label, start, end, color }) => (
          <div key={label}>
            {/* Section header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-xs font-semibold" style={{ color }}>{label}</span>
            </div>

            {/* Grid of question buttons */}
            <div className="grid grid-cols-6 gap-1.5">
              {Array.from({ length: end - start + 1 }, (_, i) => {
                const idx    = start + i
                const status = getStatus(idx)               // never "current"
                const isCurrent = idx === currentIndex      // separate flag

                const { bg, border, text } = statusStyles[status]

                return (
                  <button
                    key={idx}
                    onClick={() => onJump(idx)}
                    title={`Q${idx + 1} — ${status}`}
                    className="w-full aspect-square flex items-center justify-center text-xs font-mono font-semibold rounded-lg transition-all duration-150 hover:scale-110"
                    style={{
                      background: bg,
                      // Current overrides border with a vivid blue; status bg stays intact
                      border: isCurrent
                        ? "2px solid #3b82f6"
                        : `1px solid ${border}`,
                      color: text,
                      // Glowing ring for current question on top of any status color
                      boxShadow: isCurrent
                        ? "0 0 0 2px rgba(59,130,246,0.45), inset 0 0 8px rgba(255,255,255,0.05)"
                        : "inset 0 0 8px rgba(255,255,255,0.04)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                    }}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Stats bar ── */}
      <div
        className="mt-4 p-3 rounded-2xl text-xs"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex justify-between mb-2">
          <span className="text-slate-500">Answered</span>
          <span className="text-white font-medium">{answered} / {total}</span>
        </div>
        <div
          className="w-full h-1.5 rounded-full"
          style={{ background: "rgba(255,255,255,0.07)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(answered / total) * 100}%`,
              background: "linear-gradient(90deg, #3b82f6, #10b981)",
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default QuestionPalette
