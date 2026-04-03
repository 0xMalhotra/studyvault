import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import BackgroundOrbs from './components/BackgroundOrbs'

import HomePage            from './pages/HomePage'
import PracticeSubjectPage  from './pages/practice/PracticeSubjectPage'
import PracticeChapterPage  from './pages/practice/PracticeChapterPage'
import PracticeQuestionPage from './pages/practice/PracticeQuestionPage'
import PYQHomePage          from './pages/pyq/PYQHomePage'
import PYQTestPage          from './pages/pyq/PYQTestPage'
import PYQResultPage        from './pages/pyq/PYQResultPage'
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
        <Route path="/pyq/test/:attemptId/:shiftId"   element={<PYQTestPage />} />
        <Route path="/pyq/result/:attemptId/:shiftId" element={<PYQResultPage />} />
        <Route path="/calculator"                     element={<ScoreCalculatorPage />} />
      </Routes>
    </div>
  )
}

export default App
