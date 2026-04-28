// src/components/shared/MathText.jsx
// Renders text that may contain LaTeX math expressions.
// Uses KaTeX for math rendering — install with:
//   npm install katex
// Then add to index.html or main.jsx:
//   import 'katex/dist/katex.min.css'
//
// Supported LaTeX delimiters:
//   Inline:  $...$  or  \(...\)
//   Display: $$...$$ or  \[...\]

import { useMemo } from 'react'

// Dynamically import katex only when needed
let katex = null
const loadKatex = async () => {
  if (!katex) {
    const mod = await import('katex')
    katex = mod.default
  }
  return katex
}

// Synchronous render using katex if already loaded, fallback to plain text
function renderMathInline(latex, displayMode = false) {
  if (!katex) return null
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: 'html',
      strict: false,
    })
  } catch {
    return null
  }
}

// Split text into math and non-math segments
function parseSegments(text) {
  if (!text) return [{ type: 'text', content: '' }]

  const segments = []
  // Match $$...$$ (display), $...$ (inline), \[...\] (display), \(...\) (inline)
  const mathPattern = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$\n]+?\$|\\\([\s\S]+?\\\))/g

  let lastIndex = 0
  let match

  while ((match = mathPattern.exec(text)) !== null) {
    // Text before math
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }

    const raw = match[1]
    let latex, displayMode

    if (raw.startsWith('$$') || raw.startsWith('\\[')) {
      latex = raw.startsWith('$$') ? raw.slice(2, -2) : raw.slice(2, -2)
      displayMode = true
    } else {
      latex = raw.startsWith('$') ? raw.slice(1, -1) : raw.slice(2, -2)
      displayMode = false
    }

    segments.push({ type: 'math', content: latex, displayMode })
    lastIndex = match.index + raw.length
  }

  // Remaining text
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return segments.length ? segments : [{ type: 'text', content: text }]
}

// ── React component ───────────────────────────────────────────────────────────
export default function MathText({ text, className = '' }) {
  const [katexLoaded, setKatexLoaded] = useState(false)

  // Load KaTeX on mount
  useEffect(() => {
    loadKatex().then(() => setKatexLoaded(true))
  }, [])

  const segments = useMemo(() => parseSegments(text), [text])

  // If no math detected or katex not loaded yet, render plain text
  const hasMath = segments.some(s => s.type === 'math')

  if (!hasMath || !katexLoaded) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <span key={i}>{seg.content}</span>
        }
        const html = renderMathInline(seg.content, seg.displayMode)
        if (!html) return <span key={i} className="text-amber-400 font-mono text-xs">${seg.content}$</span>
        return (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: html }}
            className={seg.displayMode ? 'block my-2' : 'inline'}
          />
        )
      })}
    </span>
  )
}

// Need useState and useEffect — import at top
import { useState, useEffect } from 'react'
