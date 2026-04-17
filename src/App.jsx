// src/App.jsx
// Added /pyq/test/:paperId route for Supabase-powered papers
// Legacy /pyq/test/:attemptId/:shiftId still works for local data

import { Routes, Route } from 'react-router-dom'
import Navbar           from './components/Navbar'
import BackgroundOrbs   from './components/BackgroundOrbs'
import ProtectedRoute   from './components/ProtectedRoute'

import HomePage             from './pages/HomePage'
import PracticeSubjectPage  from './pages/practice/PracticeSubjectPage'
import PracticeChapterPage  from './pages/practice/PracticeChapterPage'
import PracticeQuestionPage from './pages/practice/PracticeQuestionPage'
import PYQHomePage          from './pages/pyq/PYQHomePage'
import PYQTestPage          from './pages/pyq/PYQTestPage'
import PYQResultPage        from './pages/pyq/PYQResultPage'
import LoginPage            from './pages/auth/LoginPage'
import SignupPage           from './pages/auth/SignupPage'
import Dashboard            from './pages/Dashboard'
import Leaderboard          from './pages/Leaderboard'
import ScoreCalculatorPage  from './pages/calculator/ScoreCalculatorPage'

function App() {
  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <BackgroundOrbs />
      <Navbar />
      <Routes>
        <Route path="/"                               element={<HomePage />} />
        <Route path="/practice"                       element={<PracticeSubjectPage />} />
        <Route path="/practice/:subjectId"            element={<PracticeChapterPage />} />
        <Route path="/practice/:subjectId/:chapterId" element={<PracticeQuestionPage />} />
        <Route path="/pyq"                            element={<PYQHomePage />} />

        {/* New: Supabase-powered paper by paperId e.g. /pyq/test/2026-01-28-evening */}
        <Route path="/pyq/test/:paperId"              element={<PYQTestPage />} />

        {/* Legacy: local data paper e.g. /pyq/test/2026-jan/shift1 */}
        <Route path="/pyq/test/:attemptId/:shiftId"   element={<PYQTestPage />} />

        {/* Result page — paperId is URL-encoded, may contain slashes */}
        <Route path="/pyq/result/:paperId"            element={<PYQResultPage />} />
        <Route path="/pyq/result/:attemptId/:shiftId" element={<PYQResultPage />} />

        <Route path="/login"                          element={<LoginPage />} />
        <Route path="/signup"                         element={<SignupPage />} />
        <Route path="/calculator"                     element={<ScoreCalculatorPage />} />
        <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}

export default App
