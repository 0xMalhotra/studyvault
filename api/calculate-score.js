// api/calculate-score.js
// Vercel serverless function
// npm install node-html-parser @supabase/supabase-js

import { createClient } from '@supabase/supabase-js'
import { parse } from 'node-html-parser'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ─── PARSER ─────────────────────────────────────────────────────────────────
// Based on actual Digialm HTML structure:
// Each question lives inside a <table class="menu-tbl">
//   Row 1 col 2: Question Type  ("MCQ" | "SA")
//   Row 2 col 2: Question ID    (e.g. "603421752")
//   Row 3 col 2: Option 1 ID    (e.g. "6034212556")   ← MCQ only
//   Row 4 col 2: Option 2 ID
//   Row 5 col 2: Option 3 ID
//   Row 6 col 2: Option 4 ID
//   Last row col 2: Chosen option NUMBER ("1"/"2"/"3"/"4" or "--")
//                   For SA (numerical): the numeric answer directly, or "--"

function parseDigialmHTML(html) {
  const root = parse(html)
  const questions = []

  const tables = root.querySelectorAll('table.menu-tbl')

  for (const table of tables) {
    const rows = table.querySelectorAll('tr')
    if (rows.length < 3) continue

    // Helper: get text of .bold cell in a row
    const boldText = (row) => {
      const cell = row.querySelector('td.bold')
      return cell ? cell.text.trim() : ''
    }

    const questionType = boldText(rows[0])   // "MCQ" or "SA"
    const questionId   = boldText(rows[1])   // e.g. "603421752"

    if (!questionId || !/^\d+$/.test(questionId)) continue

    const lastRow     = rows[rows.length - 1]
    const chosenRaw   = boldText(lastRow)    // "1","2","3","4", "--", or numeric answer

    let chosenOptionId = null

    if (questionType === 'MCQ') {
      // chosenRaw is the option NUMBER (1-4), not the ID
      if (chosenRaw && chosenRaw !== '--' && /^[1-4]$/.test(chosenRaw)) {
        const optionRowIndex = 2 + parseInt(chosenRaw) - 1  // rows[2] = opt1, rows[3] = opt2 ...
        if (rows[optionRowIndex]) {
          chosenOptionId = boldText(rows[optionRowIndex])  // actual option ID
        }
      }
    } else {
      // SA / Numerical — the chosen value is the answer itself (e.g. "42" or "--")
      if (chosenRaw && chosenRaw !== '--') {
        chosenOptionId = chosenRaw  // store the numeric answer string directly
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

// ─── SCORER ─────────────────────────────────────────────────────────────────
function calculateScore(parsedQuestions, answerKey) {
  // Build lookup map
  const keyMap = {}
  for (const k of answerKey) {
    keyMap[k.question_id] = {
      correctOptionId: k.correct_option_id,
      type: k.question_type,
      subject: k.subject,
    }
  }

  let score = 0, correct = 0, wrong = 0, unattempted = 0
  const analysis = []

  // Subject by position fallback (if subject not in answer key)
  const subjectByIndex = (i) => i < 25 ? 'Physics' : i < 50 ? 'Chemistry' : 'Mathematics'

  parsedQuestions.forEach((q, idx) => {
    const key = keyMap[q.questionId]

    if (!key) {
      // Not in answer key — might be a question the key hasn't been entered for
      unattempted++
      analysis.push({
        questionId:      q.questionId,
        chosenOptionId:  q.chosenOptionId,
        correctOptionId: null,
        type:            q.questionType,
        status:          'unknown',
        marks:           0,
        subject:         subjectByIndex(idx),
      })
      return
    }

    const subject = key.subject || subjectByIndex(idx)
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

  // Subject breakdown
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
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(20000),
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status} — response sheet URL may have expired`)
    html = await resp.text()
  } catch (err) {
    return res.status(502).json({ error: `Could not fetch response sheet: ${err.message}` })
  }

  // ── Parse ───────────────────────────────────────────────────
  let parsedQuestions
  try {
    parsedQuestions = parseDigialmHTML(html)
  } catch (err) {
    return res.status(422).json({ error: `HTML parsing error: ${err.message}` })
  }

  if (parsedQuestions.length === 0) {
    // Return debug info to help diagnose format differences
    const snippet = html.slice(0, 500).replace(/\s+/g, ' ')
    return res.status(422).json({
      error: 'No questions found in response sheet. The URL may be expired or the format is unexpected.',
      debug: snippet,
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

  // ── Calculate ───────────────────────────────────────────────
  const result = calculateScore(parsedQuestions, answerKey)

  return res.status(200).json({
    success: true,
    totalParsed: parsedQuestions.length,
    ...result,
  })
}
