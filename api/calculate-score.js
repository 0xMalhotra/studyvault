// api/calculate-score.js
export const maxDuration = 60; // Allows up to 60 seconds execution

import { createClient } from '@supabase/supabase-js'
import { parse } from 'node-html-parser'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ─── PARSER ──────────────────────────────────────────────────────────────────
function parseDigialmHTML(html) {
  const root = parse(html)
  const questions = []

  // Get every question's right-hand menu table to use as a starting anchor
  const menus = root.querySelectorAll('table.menu-tbl')

  for (const menu of menus) {
    // Traverse upwards to capture the ENTIRE question container.
    // This guarantees we capture the SA 'Given Answer' located in the left column.
    let container = menu;
    while (container.parentNode && container.tagName !== 'BODY') {
      const classes = container.getAttribute('class') || '';
      // Stop when we hit the main question wrapper
      if (classes.includes('question-pnl') || classes.includes('questionRowTbl')) {
        break;
      }
      container = container.parentNode;
    }

    // FAILSAFE: If Digialm changed their class names entirely, force the container
    // to step up 5 levels from the menu, which mathematically captures the whole row.
    if (container.tagName === 'BODY' || container.tagName === 'HTML') {
       container = menu;
       for(let i = 0; i < 5 && container.parentNode; i++) {
         container = container.parentNode;
       }
    }

    // Now scan every table cell inside this specific, isolated question block
    const tds = container.querySelectorAll('td')
    
    const extract = (labels) => {
      const keys = Array.isArray(labels) ? labels : [labels]
      for (let i = 0; i < tds.length - 1; i++) {
        // Clean formatting and convert to lowercase for bulletproof matching
        const cellText = (tds[i].textContent || '').replace(/&nbsp;/g, ' ').toLowerCase().trim()
        
        if (keys.some(k => cellText.includes(k.toLowerCase()))) {
          const val = (tds[i + 1].textContent || '').replace(/&nbsp;/g, ' ').trim()
          // Catch unattempted variations
          if (val === '' || val === '--' || val.toLowerCase().includes('not answered')) return null;
          return val;
        }
      }
      return null
    }

    const questionId = extract('Question ID')
    if (!questionId || !/^\d+$/.test(questionId)) continue

    const questionType = extract('Question Type') || ''
    const isMcq = questionType.toUpperCase().includes('MCQ')

    let chosenOptionId = null

    if (isMcq) {
      const chosenIdx = extract('Chosen Option')
      if (chosenIdx && /^[1-4]$/.test(chosenIdx)) {
        chosenOptionId = extract(`Option ${chosenIdx} ID`)
      }
    } else {
      // Numerical / SA
      // Digialm uses 'Given Answer' for Numerical type, but check 'Chosen Option' just in case
      chosenOptionId = extract(['Given Answer', 'Chosen Option'])
    }

    questions.push({
      questionId,
      chosenOptionId,
      questionType: isMcq ? 'mcq' : 'numerical',
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
      type: k.question_type,
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
        questionId: q.questionId,
        chosenOptionId: q.chosenOptionId,
        correctOptionId: null,
        type: q.questionType,
        status: 'unknown',
        marks: 0,
        subject,
      })
      return
    }

    let status, marks

    // Strip ghost spacing for direct comparison
    const chosen = q.chosenOptionId ? String(q.chosenOptionId).trim() : null;
    const correctAns = key.correctOptionId ? String(key.correctOptionId).trim() : null;

    if (!chosen) {
      status = 'unattempted'; marks = 0; unattempted++;
    } else {
      const isNumericalQuestion = q.questionType === 'numerical' || key.type === 'numerical';
      let isCorrect = false;

      // 1. Perfect string match (MCQs and identical strings)
      if (chosen === correctAns) {
        isCorrect = true;
      } 
      // 2. Mathematical match (Ensures "05" == "5")
      else if (isNumericalQuestion) {
        const chosenNum = Number(chosen);
        const correctNum = Number(correctAns);
        if (!isNaN(chosenNum) && !isNaN(correctNum) && chosenNum === correctNum) {
          isCorrect = true;
        }
      }

      if (isCorrect) {
        status = 'correct'; marks = 4; score += 4; correct++;
      } else {
        status = 'wrong';
        // Numericals receive 0 negative marking, MCQs receive -1
        marks = isNumericalQuestion ? 0 : -1;
        score += marks;
        wrong++;
      }
    }

    analysis.push({
      questionId: q.questionId,
      chosenOptionId: q.chosenOptionId,
      correctOptionId: key.correctOptionId,
      type: key.type || q.questionType,
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(50000), 
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