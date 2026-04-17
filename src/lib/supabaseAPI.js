import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 1. Fetch for PYQ Mode (By Paper)
export async function fetchFullPaper(examDate, shift) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_date', examDate)
    .eq('shift', shift);

  if (error) {
    console.error("Error fetching paper:", error);
    return [];
  }
  return data;
}

// 2. Fetch for Practice Mode (By Subject & Chapter, sorted newest first)
export async function fetchPracticeQuestions(subject, chapter) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('subject', subject.toLowerCase())
    .eq('chapter', chapter)
    .order('year', { ascending: false }); // Descending order of year!

  if (error) {
    console.error("Error fetching practice questions:", error);
    return [];
  }
  return data;
}

// 3. Fetch Dynamic Chapter List
// This gets all unique chapters for a subject so you don't have to hardcode the sidebar!
export async function fetchChaptersForSubject(subject) {
  // Supabase RPC or a distinct query to get unique chapters
  // For now, a simple fetch of unique values:
  const { data, error } = await supabase
    .from('questions')
    .select('chapter')
    .eq('subject', subject.toLowerCase());
    
  if (error) return [];
  // Filter out duplicates
  return [...new Set(data.map(q => q.chapter))]; 
}