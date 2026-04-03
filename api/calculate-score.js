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

  // Start by finding all the side-menus
  const tables = root.querySelectorAll('table.menu-tbl')

  for (const table of tables) {
    // THE FIX: Traverse UP the DOM tree to find the master container.
    // This ensures we catch the "Given Answer" even if Digialm placed it
    // outside the side-menu and inside the main question body.
    let container = table;
    while (container && container.tagName !== 'HTML') {
      if (container.getAttribute && (container.getAttribute('class') || '').includes('questionPnlTbl')) {
        break;
      }
      if (!container.parentNode) break;
      container = container.parentNode;
    }
    // Fallback to the table itself if the wrapper isn't found
    if (!container || container.tagName === 'HTML') container = table;

    const tds = container.querySelectorAll('td');
    
    // Multi-keyword safe extractor
    const extract = (labels) => {
      const keys = Array.isArray(labels) ? labels : [labels];
      for (let i = 0; i < tds.length - 1; i++) {
        // Safe text extraction accounting for different node-html-parser versions
        const raw = tds[i].text || tds[i].textContent || '';
        const cellText = raw.replace(/&nbsp;/g, ' ').toLowerCase().trim();
        
        if (keys.some(k => cellText.includes(k.toLowerCase()))) {
          const nextRaw = tds[i + 1].text || tds[i + 1].textContent || '';
          const val = nextRaw.replace(/&nbsp;/g, ' ').trim();
          return (val === '' || val === '--') ? null : val;
        }
      }
      return null;
    }

    const questionType = extract('Question Type') || '';
    const isMcq = questionType.toUpperCase().includes('MCQ');
    const questionId = extract('Question ID');

    if (!questionId || !/^\d+$/.test(questionId)) continue;

    let chosenOptionId = null;

    if (isMcq) {
      const opt1   = extract('Option 1 ID')
      const opt2   = extract('Option 2 ID')
      const opt3   = extract('Option 3 ID')
      const opt4   = extract('Option 4 ID')
      const chosen = extract('Chosen Option')

      if (chosen && /^[1-4]$/.test(chosen)) {
        const optMap = { '1': opt1, '2': opt2, '3': opt3, '4': opt4 }
        chosenOptionId = optMap[chosen] ?? null
      }
    } else {
      // SA / Numerical 
      // Broaden search terms to catch any variation Digialm throws at us
      const givenAnswer = extract(['Given Answer', 'Short Answer', 'Chosen Option', 'Answer :']);
      
      if (givenAnswer && givenAnswer.toLowerCase() !== 'not answered') {
        chosenOptionId = givenAnswer;
      }
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

    // Ensure clean strings to avoid ghost spacing issues
    const chosen = q.chosenOptionId ? String(q.chosenOptionId).trim() : null;
    const correctAns = key.correctOptionId ? String(key.correctOptionId).trim() : null;

    if (!chosen || chosen === '--') {
      status = 'unattempted'; marks = 0; unattempted++;
    } else {
      const chosenNum = Number(chosen);
      const correctNum = Number(correctAns);

      // 1. Perfect string match (Handles MCQs and identical SA strings)
      if (chosen === correctAns) {
        status = 'correct'; marks = 4; score += 4; correct++;
      } 
      // 2. Equivalent numeric value (Catches "05" == "5" or "314.0" == "314")
      else if (!isNaN(chosenNum) && !isNaN(correctNum) && chosenNum === correctNum) {
        status = 'correct'; marks = 4; score += 4; correct++;
      } 
      // 3. Incorrect answer
      else {
        status = 'wrong';
        // Flexible check: Determine penalty (MCQ: -1, Numerical: 0)
        // Accounts for DB variations like 'integer', 'sa', or 'numerical'
        const isNumericalType = q.questionType === 'numerical' || 
                                key.type?.toLowerCase().includes('num') || 
                                key.type?.toLowerCase().includes('int');
        marks = isNumericalType ? 0 : -1;
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