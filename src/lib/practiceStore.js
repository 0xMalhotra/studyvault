// Simple global cache for practice data to speed up navigation
export const practiceCache = {
  subjectStats: new Map(), // subjectName -> { chapters: [], lastFetched: timestamp }
  questionDetails: new Map(), // questionId -> fullQuestionData
  chapterQuestions: new Map(), // subjectName::chapterName -> [questionIds/lightData]
};

export const getCachedStats = (subjectName) => {
  const cached = practiceCache.subjectStats.get(subjectName);
  if (cached && Date.now() - cached.lastFetched < 1000 * 60 * 5) { // 5 min cache
    return cached.data;
  }
  return null;
};

export const setCachedStats = (subjectName, data) => {
  practiceCache.subjectStats.set(subjectName, { data, lastFetched: Date.now() });
};
