// api/calculate-score.js
// Vercel Serverless Function
// POST /api/calculate-score
// Body: { responseSheetUrl, examDate, shift }

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // service role for server-side reads
)

// ─── Parse the Digialm HTML response sheet ───────────────────────────────────
// The HTML contains a table where each row has:
//   - Question ID  (in a td with specific class/attribute)
//   - Chosen Option ID (or "--" if not attempted)
//
// Actual selectors confirmed from real Digialm HTML structure:
//   Each question block: <div class="question-pnl">
//     QuestionID:   <td class="bold">Question ID</td><td>{id}</td>
//     ChosenOption: <td class="bold">Chosen Option</td><td>{optionId or --}</td>

function parseResponseSheet(html) {
  const questions = []

  // Digialm response sheets use a repeating table pattern.
  // We extract all "Question ID" and "Chosen Option" pairs using regex
  // because we're in a Node env without a real DOM (and cheerio adds weight).
  //
  // Pattern observed in real sheets:
  // <td class="bold">Question ID</td>\s*<td[^>]*>(\d+)</td>
  // <td class="bold">Chosen Option</td>\s*<td[^>]*>(\d+|--)</td>

  const questionIdRegex = /Question ID<\/td>\s*<td[^>]*>\s*(\d+)\s*<\/td>/gi
  const chosenOptionRegex = /Chosen Option<\/td>\s*<td[^>]*>\s*([0-9]+|--)\s*<\/td>/gi

  const questionIds = []
  const chosenOptions = []

  let match
  while ((match = questionIdRegex.exec(html)) !== null) {
    questionIds.push(match[1].trim())
  }
  while ((match = chosenOptionRegex.exec(html)) !== null) {
    chosenOptions.push(match[1].trim())
  }

  if (questionIds.length === 0) {
    throw new Error('Could not parse question IDs from response sheet. Check the URL.')
  }

  if (questionIds.length !== chosenOptions.length) {
    throw new Error(
      `Parsing mismatch: found ${questionIds.length} questions but ${chosenOptions.length} chosen options.`
    )
  }

  for (let i = 0; i < questionIds.length; i++) {
    const chosen = chosenOptions[i]
    questions.push({
      questionId: questionIds[i],
      chosenOptionId: chosen === '--' || chosen === '' ? null : chosen,
    })
  }

  return questions
}

// ─── Score calculation ────────────────────────────────────────────────────────
function calculateScore(parsedQuestions, answerKeyMap) {
  let score = 0
  let correct = 0
  let wrong = 0
  let unattempted = 0
  const analysis = []

  for (const { questionId, chosenOptionId } of parsedQuestions) {
    const keyEntry = answerKeyMap[questionId]

    // If this question ID doesn't exist in our answer key, skip silently
    if (!keyEntry) continue

    const { correctOptionId, questionType } = keyEntry
    let status

    if (!chosenOptionId) {
      // Not attempted
      status = 'unattempted'
      unattempted++
      // 0 marks
    } else if (chosenOptionId === correctOptionId) {
      // Correct
      status = 'correct'
      correct++
      score += 4
    } else {
      // Wrong
      status = 'wrong'
      wrong++
      // Numerical type: no negative marking
      if (questionType === 'mcq') {
        score -= 1
      }
    }

    analysis.push({
      questionId,
      chosenOptionId,
      correctOptionId,
      questionType,
      status,
    })
  }

  const totalAttempted = correct + wrong
  const accuracy = totalAttempted > 0
    ? Math.round((correct / totalAttempted) * 100)
    : 0

  return { score, correct, wrong, unattempted, accuracy, analysis }
}

// ─── Subject breakdown ────────────────────────────────────────────────────────
function subjectBreakdown(analysis, answerKeyRows) {
  // answerKeyRows may contain a `subject` column if you add it
  // For now we split by position: Q1-25 Physics, Q26-50 Chemistry, Q51-75 Maths
  // But since question IDs are NTA-assigned, we rely on subject column in answer_keys
  const subjectMap = {}
  for (const row of answerKeyRows) {
    if (row.subject) subjectMap[row.question_id] = row.subject
  }

  const subjects = { Physics: { correct: 0, wrong: 0, unattempted: 0, score: 0 },
                     Chemistry: { correct: 0, wrong: 0, unattempted: 0, score: 0 },
                     Mathematics: { correct: 0, wrong: 0, unattempted: 0, score: 0 },
                     Other: { correct: 0, wrong: 0, unattempted: 0, score: 0 } }

  for (const q of analysis) {
    const sub = subjectMap[q.questionId] || 'Other'
    if (!subjects[sub]) subjects[sub] = { correct: 0, wrong: 0, unattempted: 0, score: 0 }
    subjects[sub][q.status]++
    if (q.status === 'correct') subjects[sub].score += 4
    if (q.status === 'wrong' && q.questionType === 'mcq') subjects[sub].score -= 1
  }

  return subjects
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { responseSheetUrl, examDate, shift } = req.body || {}

  // ── Input validation ──
  if (!responseSheetUrl || !examDate || !shift) {
    return res.status(400).json({ error: 'Missing required fields: responseSheetUrl, examDate, shift' })
  }

  if (!responseSheetUrl.startsWith('https://cdn3.digialm.com')) {
    return res.status(400).json({ error: 'Invalid URL. Must start with https://cdn3.digialm.com' })
  }

  try {
    // ── Step 1: Fetch the response sheet HTML ──
    let html
    try {
      const response = await fetch(responseSheetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ScoreCalculator/1.0)',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from Digialm`)
      }
      html = await response.text()
    } catch (fetchErr) {
      return res.status(502).json({
        error: 'Could not fetch response sheet. Make sure the URL is correct and accessible.',
        detail: fetchErr.message,
      })
    }

    // ── Step 2: Parse HTML ──
    let parsedQuestions
    try {
      parsedQuestions = parseResponseSheet(html)
    } catch (parseErr) {
      return res.status(422).json({
        error: 'Failed to parse response sheet HTML.',
        detail: parseErr.message,
      })
    }

    // ── Step 3: Fetch answer key from Supabase ──
    const { data: answerKeyRows, error: dbError } = await supabase
      .from('answer_keys')
      .select('question_id, correct_option_id, question_type, subject')
      .eq('exam_date', examDate)
      .eq('shift', shift)

    if (dbError) {
      return res.status(500).json({ error: 'Database error fetching answer key.', detail: dbError.message })
    }

    if (!answerKeyRows || answerKeyRows.length === 0) {
      return res.status(404).json({
        error: `No answer key found for ${examDate} ${shift}. It may not be uploaded yet.`,
      })
    }

    // Build a map: questionId → { correctOptionId, questionType, subject }
    const answerKeyMap = {}
    for (const row of answerKeyRows) {
      answerKeyMap[row.question_id] = {
        correctOptionId: row.correct_option_id,
        questionType: row.question_type,
        subject: row.subject,
      }
    }

    // ── Step 4: Calculate score ──
    const result = calculateScore(parsedQuestions, answerKeyMap)
    const subjects = subjectBreakdown(result.analysis, answerKeyRows)

    // ── Step 5: Return ──
    return res.status(200).json({
      ...result,
      totalQuestions: parsedQuestions.length,
      maxScore: 300,
      subjects,
      examDate,
      shift,
    })

  } catch (err) {
    console.error('Score calculation error:', err)
    return res.status(500).json({ error: 'Internal server error.', detail: err.message })
  }
}
