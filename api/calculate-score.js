// api/calculate-score.js
// Vercel serverless function
// npm install @supabase/supabase-js node-html-parser

import { createClient } from '@supabase/supabase-js'
import { parse } from 'node-html-parser'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ─── PARSER ──────────────────────────────────────────────────────────────────
// Based on the REAL Digialm HTML structure (verified from live response sheet):
//
// Each question lives inside <table class="menu-tbl"> with td pairs:
//   <td align="right">Question Type :</td><td class="bold">MCQ</td>
//   <td align="right">Question ID :</td><td class="bold">8606541685</td>
//   <td align="right">Option 1 ID :</td><td class="bold">8606545733</td>
//   <td align="right">Option 2 ID :</td><td class="bold">8606545735</td>
//   <td align="right">Option 3 ID :</td><td class="bold">8606545734</td>
//   <td align="right">Option 4 ID :</td><td class="bold">8606545732</td>
//   <td>Status :</td><td>Answered</td>
//   <td>Chosen Option :</td><td class="bold">2</td>   ← NUMBER not ID
//
// For SA (numerical):
//   <td align="right">Question Type :</td><td class="bold">SA</td>
//   <td align="right">Question ID :</td><td class="bold">8606541698</td>
//   <td align="right">Given Answer :</td><td class="bold">314</td>
//
// KEY INSIGHT for MCQ:
//   "Chosen Option: 2" means the student picked option #2
//   We must look up "Option 2 ID" to get the actual option ID to compare with answer key
//
// KEY INSIGHT for SA:
//   "Given Answer: 314" IS the answer — compare directly with correct_option_id in DB

function parseDigialmHTML(html) {
  const root = parse(html)
  const questions = []

  const tables = root.querySelectorAll('table.menu-tbl')

  for (const table of tables) {
    const tableHTML = table.innerHTML

    // Helper: extract value for a label using regex on this table's HTML
    const extract = (label) => {
      // Matches: ">Label :</td><td...>VALUE</td>" with optional spaces
      const re = new RegExp(
        label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
        '\\s*:</td><td[^>]*>([^<]+)',
        'i'
      )
      return tableHTML.match(re)?.[1]?.trim() ?? null
    }

    const questionType = extract('Question Type')   // "MCQ" or "SA"
    const questionId   = extract('Question ID')     // e.g. "8606541685"

    if (!questionId || !/^\d+$/.test(questionId)) continue

    let chosenOptionId = null

    if (questionType === 'MCQ') {
      const opt1   = extract('Option 1 ID')
      const opt2   = extract('Option 2 ID')
      const opt3   = extract('Option 3 ID')
      const opt4   = extract('Option 4 ID')
      const chosen = extract('Chosen Option')   // "1", "2", "3", "4", or "--"

      if (chosen && chosen !== '--' && /^[1-4]$/.test(chosen)) {
        const optMap = { '1': opt1, '2': opt2, '3': opt3, '4': opt4 }
        chosenOptionId = optMap[chosen] ?? null
      }
    } else {
      // SA / Numerical — "Given Answer" is the actual answer value
      const givenAnswer = extract('Given Answer')   // e.g. "314", "4", or "--"
      if (givenAnswer && givenAnswer !== '--') {
        chosenOptionId = givenAnswer   // store as string; compare with DB correct_option_id
      }
    }

    questions.push({
      questionId,
      chosenOptionId,   // null = unattempted
      questionType: questionType === 'MCQ' ? 'mcq' : 'numerical',
    })
  }

  return questions
}

// ─── SCORER ──────────────────────────────────────────────────────────────────
function calculateScore(parsedQuestions, answerKey) {
  const keyMap = {}
  for (const k of answerKey) {
    keyMap[k.question_id] = {
      correctOptionId: k.correct_option_id,
      type:    k.question_type,
      subject: k.subject,
    }
  }

  let score = 0, correct = 0, wrong = 0, unattempted = 0
  const analysis = []

  const subjectByIndex = (i) =>
    i < 25 ? 'Physics' : i < 50 ? 'Chemistry' : 'Mathematics'

  parsedQuestions.forEach((q, idx) => {
    const key = keyMap[q.questionId]
    const subject = key?.subject || subjectByIndex(idx)

    if (!key) {
      unattempted++
      analysis.push({
        questionId:      q.questionId,
        chosenOptionId:  q.chosenOptionId,
        correctOptionId: null,
        type:            q.questionType,
        status:          'unknown',
        marks:           0,
        subject,
      })
      return
    }

    let status, marks

    if (!q.chosenOptionId) {
      status = 'unattempted'; marks = 0; unattempted++
    } else if (q.chosenOptionId === key.correctOptionId) {
      status = 'correct'; marks = 4; score += 4; correct++
    } else {
      status = 'wrong'
      marks  = key.type === 'numerical' ? 0 : -1
      score += marks
      wrong++
    }

    analysis.push({
      questionId:      q.questionId,
      chosenOptionId:  q.chosenOptionId,
      correctOptionId: key.correctOptionId,
      type:            key.type,
      status,
      marks,
      subject,
    })
  })

  const accuracy = (correct + wrong) > 0
    ? Math.round((correct / (correct + wrong)) * 100)
    : 0

  const subjects = ['Physics', 'Chemistry', 'Mathematics']
  const subjectBreakdown = subjects.map(sub => {
    const qs = analysis.filter(a => a.subject === sub)
    const c  = qs.filter(a => a.status === 'correct').length
    const w  = qs.filter(a => a.status === 'wrong').length
    const u  = qs.filter(a => a.status === 'unattempted' || a.status === 'unknown').length
    return { subject: sub, score: c * 4 - w, correct: c, wrong: w, unattempted: u }
  })

  return { score, correct, wrong, unattempted, accuracy, analysis, subjectBreakdown }
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' })

  const { responseSheetUrl, examDate, shift } = req.body || {}

  if (!responseSheetUrl || !examDate || !shift)
    return res.status(400).json({ error: 'Missing: responseSheetUrl, examDate, shift' })

  if (!responseSheetUrl.includes('cdn3.digialm.com'))
    return res.status(400).json({ error: 'URL must be from cdn3.digialm.com' })

  // ── Fetch HTML ──────────────────────────────────────────────
  let html
  try {
    const resp = await fetch(responseSheetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(20000),
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status} — URL may have expired`)
    html = await resp.text()
  } catch (err) {
    return res.status(502).json({ error: `Could not fetch response sheet: ${err.message}` })
  }

  // ── Parse ───────────────────────────────────────────────────
  let parsedQuestions
  try {
    parsedQuestions = parseDigialmHTML(html)
  } catch (err) {
    return res.status(422).json({ error: `Parsing error: ${err.message}` })
  }

  if (parsedQuestions.length === 0) {
    return res.status(422).json({
      error: 'No questions found. The URL may have expired or the format changed.',
      hint: 'Try re-downloading your response sheet link from the NTA portal.',
    })
  }

  // ── Fetch answer key ────────────────────────────────────────
  const { data: answerKey, error: dbErr } = await supabase
    .from('answer_keys')
    .select('question_id, correct_option_id, question_type, subject')
    .eq('exam_date', examDate)
    .eq('shift', shift)

  if (dbErr)
    return res.status(500).json({ error: `DB error: ${dbErr.message}` })

  if (!answerKey?.length)
    return res.status(404).json({
      error: `No answer key found for ${examDate} — ${shift}. It may not have been added yet.`,
      parsedCount: parsedQuestions.length,
    })

  // ── Score ───────────────────────────────────────────────────
  const result = calculateScore(parsedQuestions, answerKey)

  return res.status(200).json({
    success: true,
    totalParsed: parsedQuestions.length,
    ...result,
  })
}
