// QuestionContent.jsx
// Drop-in component for StudyVault to render question_text, options, explanation
// Handles: MathJax SVG, tables, images — all from your Supabase HTML fields.
//
// Usage:
//   import QuestionContent from './QuestionContent';
//   <QuestionContent html={question.question_text} />

import { useEffect, useRef } from "react";

/**
 * Renders raw HTML from Supabase (question_text / option HTML / explanation).
 * - Applies the .question-html-content CSS class (import jee-table-styles.css in App.css)
 * - Re-triggers MathJax typesetting after mount so SVG math renders correctly
 */
export default function QuestionContent({ html, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !html || html === "N/A") return;

    // Re-run MathJax if it's loaded (it may have already parsed the SVG inline,
    // but calling typesetPromise ensures any newly injected content is handled).
    if (window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([ref.current]).catch(console.error);
    }
  }, [html]);

  if (!html || html === "N/A") return null;

  return (
    <div
      ref={ref}
      className={`question-html-content ${className}`}
      // dangerouslySetInnerHTML is safe here because the HTML comes from
      // YOUR scraper → YOUR Supabase DB, not from untrusted user input.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
