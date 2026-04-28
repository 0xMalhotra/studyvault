import { useEffect, useRef } from 'react'

export default function QuestionContent({ html, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current || !html || html === 'N/A') return

    if (window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([ref.current]).catch(console.error)
    }
  }, [html])

  if (!html || html === 'N/A') return null

  return (
    <div
      ref={ref}
      className={`question-html-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
