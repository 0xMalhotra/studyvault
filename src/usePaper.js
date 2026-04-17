// src/hooks/usePaper.js
// Fetches a full paper's questions from Supabase, shaped for PYQTestPage

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePaper(paperId) {
  const [questions, setQuestions] = useState(null)
  const [paper, setPaper]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    if (!paperId) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      // Fetch paper metadata
      const { data: paperData, error: paperErr } = await supabase
        .from('papers')
        .select('*')
        .eq('id', paperId)
        .single()

      if (paperErr || !paperData) {
        if (!cancelled) setError('Paper not found')
        setLoading(false)
        return
      }

      // Fetch questions via the view, ordered by position
      const { data: qData, error: qErr } = await supabase
        .from('paper_with_questions')
        .select('*')
        .eq('paper_id', paperId)
        .order('position', { ascending: true })

      if (qErr) {
        if (!cancelled) setError(qErr.message)
        setLoading(false)
        return
      }

      // Shape questions into the format PYQTestPage expects:
      // { id, subject, question, options, correctAnswer, explanation, difficulty }
      const shaped = (qData || []).map(q => ({
        id:            q.question_id,
        subject:       q.subject,
        question:      q.question_text,
        options:       [q.option_a, q.option_b, q.option_c, q.option_d],
        correctAnswer: q.correct_answer,   // actual text, e.g. "6.76"
        explanation:   q.explanation || '',
        difficulty:    q.difficulty,
        chapter:       q.chapter,
        image:         q.image_url || null,
      }))

      if (!cancelled) {
        setPaper(paperData)
        setQuestions(shaped)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [paperId])

  return { paper, questions, loading, error }
}


// ── usePapers hook — fetches all available papers for the home page picker ──
export function usePapers() {
  const [papers, setPapers]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('papers')
        .select('*')
        .eq('is_active', true)
        .order('exam_date', { ascending: false })

      if (!error && data) {
        // Group by year then attempt for the existing PYQHomePage structure
        const byYear = {}
        for (const p of data) {
          if (!byYear[p.year]) byYear[p.year] = {}
          const att = p.attempt
          if (!byYear[p.year][att]) byYear[p.year][att] = []
          byYear[p.year][att].push(p)
        }

        // Convert to the pyqData array shape the existing PYQHomePage uses:
        // [{ year, attempts: [{ id, label, shifts: [{ id, label, date, paperId }] }] }]
        const structured = Object.entries(byYear)
          .sort(([a], [b]) => b - a)
          .map(([year, attempts]) => ({
            year,
            attempts: Object.entries(attempts).map(([attemptLabel, papers]) => ({
              id:     `${year}-${attemptLabel.toLowerCase().replace(/\s+/g, '-')}`,
              label:  attemptLabel,
              shifts: papers
                .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date) || a.shift.localeCompare(b.shift))
                .map(p => ({
                  id:      p.id,                  // e.g. '2026-01-28-evening'
                  label:   p.label,               // '28 Jan 2026 — Evening Shift'
                  date:    p.exam_date,
                  paperId: p.id,
                })),
            })),
          }))

        setPapers(structured)
      }
      setLoading(false)
    }
    load()
  }, [])

  return { papers, loading }
}
