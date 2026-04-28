const { createClient } = require('@supabase/supabase-js')
const { readFileSync } = require('fs')
const { resolve } = require('path')

const OPTION_FIELDS = ['option_a', 'option_b', 'option_c', 'option_d']
const BATCH_SIZE = 50

function loadEnvFile(path) {
  const env = {}
  try {
    const lines = readFileSync(path, 'utf8').split(/\r?\n/)
    for (const line of lines) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (match) env[match[1]] = match[2].trim()
    }
  } catch {
    return env
  }
  return env
}

function clean(value) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text && text !== 'N/A' ? text : null
}

function stripAssistiveMml(html) {
  if (!html || html === 'N/A') return html
  return html.replace(/<mjx-assistive-mml[^>]*>[\s\S]*?<\/mjx-assistive-mml>/gi, '')
}

function parseExamShift(raw) {
  if (!raw || raw === 'N/A') {
    return { source_exam: null, source_year: null, source_date: null, source_shift: null }
  }

  const yearMatch = raw.match(/(\d{4})/)
  const shiftMatch = raw.match(/(\d+(?:st|nd|rd|th)\s+\w+)\s+(Morning Shift|Evening Shift|Morning Slot|Evening Slot)/i)
  const year = yearMatch ? Number(yearMatch[1]) : null
  const sourceDate = shiftMatch && year ? parseSourceDate(shiftMatch[1], year) : null

  return {
    source_exam: raw.includes('JEE Main') ? 'JEE Main' : null,
    source_year: year,
    source_date: sourceDate,
    source_shift: shiftMatch ? shiftMatch[2] : null,
  }
}

function parseSourceDate(dateLabel, year) {
  const months = {
    january: '01',
    february: '02',
    march: '03',
    april: '04',
    may: '05',
    june: '06',
    july: '07',
    august: '08',
    september: '09',
    october: '10',
    november: '11',
    december: '12',
  }
  const match = String(dateLabel).match(/(\d+)(?:st|nd|rd|th)?\s+(\w+)/i)
  if (!match) return null

  const day = match[1].padStart(2, '0')
  const month = months[match[2].toLowerCase()]
  return month ? `${year}-${month}-${day}` : null
}

function mapRow(raw) {
  const source = parseExamShift(raw.exam_shift_raw)
  const hasOptions = OPTION_FIELDS.some(field => clean(raw[field]))

  return {
    subject: clean(raw.subject) || 'Physics',
    chapter: clean(raw.chapter),
    question_text: stripAssistiveMml(clean(raw.question_text)),
    option_a: hasOptions ? stripAssistiveMml(clean(raw.option_a)) : null,
    option_b: hasOptions ? stripAssistiveMml(clean(raw.option_b)) : null,
    option_c: hasOptions ? stripAssistiveMml(clean(raw.option_c)) : null,
    option_d: hasOptions ? stripAssistiveMml(clean(raw.option_d)) : null,
    correct_option: clean(raw.correct_option)?.toUpperCase() || null,
    correct_answer: clean(raw.correct_answer),
    explanation: stripAssistiveMml(clean(raw.explanation)),
    question_type: hasOptions ? 'mcq' : 'numerical',
    question_type_detail: clean(raw.question_type_detail) || 'standard',
    difficulty: clean(raw.difficulty) || 'Medium',
    source_exam: source.source_exam,
    source_year: source.source_year,
    source_shift: source.source_shift,
    source_date: source.source_date,
    exam_shift_raw: clean(raw.exam_shift_raw),
  }
}

async function main() {
  const env = { ...loadEnvFile(resolve(process.cwd(), '.env')), ...process.env }
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY
  const fileArg = process.argv.find(arg => arg.endsWith('.json'))
  const dataPath = resolve(fileArg || 'supabase_ready_data.json')
  const replace = process.argv.includes('--replace')

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const raw = JSON.parse(readFileSync(dataPath, 'utf8'))
  const rows = raw.map(mapRow)
  const subject = rows[0]?.subject
  const chapter = rows[0]?.chapter
  const broken = rows.filter(row => !row.correct_option && !row.correct_answer)

  console.log(`Loaded ${rows.length} questions from ${dataPath}`)
  console.log(`Subject: ${subject}`)
  console.log(`Chapter: ${chapter}`)
  if (broken.length) console.log(`Warning: ${broken.length} questions are missing an answer`)

  const supabase = createClient(supabaseUrl, supabaseKey)

  if (replace && subject && chapter) {
    console.log('Deleting existing rows for this subject/chapter...')
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('subject', subject)
      .eq('chapter', chapter)

    if (error) throw new Error(`Delete failed: ${error.message}`)
  }

  let inserted = 0
  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const batch = rows.slice(index, index + BATCH_SIZE)
    const { error } = await supabase.from('questions').insert(batch)
    if (error) throw new Error(`Insert failed at row ${index + 1}: ${error.message}`)
    inserted += batch.length
    console.log(`Inserted ${inserted}/${rows.length}`)
  }

  console.log(`Done. Uploaded ${inserted} questions.`)
}

main().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
