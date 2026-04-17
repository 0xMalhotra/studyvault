// src/components/shared/MatchTable.jsx
// Renders match-the-following tables in both Practice and PYQ modes
// Parses both:
//   1. match_table JSON array: [{left, right}, ...]  ← from Supabase
//   2. Markdown pipe tables embedded in question_text ← legacy

import { useMemo } from 'react'

// ── Parse markdown pipe table from raw question_text ───────────────────────
function parseMarkdownTable(text) {
  if (!text) return null
  const rows = []
  const lines = text.split('\n')

  for (const line of lines) {
    if (!line.includes('|')) continue
    const cells = line.split('|').map(c => c.trim()).filter(Boolean)
    if (cells.length < 2) continue
    // Skip separator and header rows
    if (cells.some(c => c.startsWith(':---'))) continue
    const lower0 = cells[0].toLowerCase()
    if (lower0.startsWith('list')) continue
    rows.push({ left: cells[0], right: cells[1] })
  }
  return rows.length >= 2 ? rows : null
}

// ── Clean up roman numerals / dimension text ───────────────────────────────
function cleanCell(text) {
  if (!text) return ''
  return text
    .replace(/\xa0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function MatchTable({ matchTableJson, questionText, accentColor = '#3b82f6' }) {
  const rows = useMemo(() => {
    // Priority 1: structured JSON from Supabase
    if (matchTableJson) {
      try {
        const parsed = typeof matchTableJson === 'string'
          ? JSON.parse(matchTableJson)
          : matchTableJson
        if (Array.isArray(parsed) && parsed.length) return parsed
      } catch {}
    }
    // Priority 2: parse from markdown in question_text
    return parseMarkdownTable(questionText)
  }, [matchTableJson, questionText])

  if (!rows || rows.length === 0) return null

  return (
    <div
      className="my-4 rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${accentColor}30` }}
    >
      {/* Header */}
      <div
        className="grid grid-cols-2 text-xs font-bold uppercase tracking-wider"
        style={{ background: `${accentColor}18` }}
      >
        <div
          className="px-4 py-2.5 text-center"
          style={{ color: accentColor, borderRight: `1px solid ${accentColor}20` }}
        >
          List – I
        </div>
        <div
          className="px-4 py-2.5 text-center"
          style={{ color: accentColor }}
        >
          List – II
        </div>
      </div>

      {/* Rows */}
      {rows.map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-2 text-sm"
          style={{
            borderTop: `1px solid ${accentColor}15`,
            background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
          }}
        >
          <div
            className="px-4 py-3 text-slate-200 leading-relaxed"
            style={{ borderRight: `1px solid ${accentColor}15` }}
          >
            {cleanCell(row.left)}
          </div>
          <div className="px-4 py-3 text-slate-300 leading-relaxed font-mono text-xs sm:text-sm">
            {cleanCell(row.right)}
          </div>
        </div>
      ))}
    </div>
  )
}
