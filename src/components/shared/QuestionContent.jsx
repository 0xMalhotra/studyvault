import { useEffect, useRef, useMemo } from 'react'

export default function QuestionContent({ html, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current || !html || html === 'N/A') return

    if (window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([ref.current]).catch(console.error)
    }
  }, [html])

  // Append cache buster to images in the HTML string
  const processedHtml = useMemo(() => {
    if (!html || typeof html !== 'string') return html;
    const cacheBuster = `v=${Date.now()}`;
    return html.replace(/src="([^"]+)"/g, (match, src) => {
      if (src.includes('v=')) return match;
      const separator = src.includes('?') ? '&' : '?';
      return `src="${src}${separator}${cacheBuster}"`;
    });
  }, [html]);

  return (
    <div
      ref={ref}
      className={`question-html-content ${className}`}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  )
}
