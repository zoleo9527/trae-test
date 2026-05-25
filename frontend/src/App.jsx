import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import SchedulePage from './pages/SchedulePage'
import FeedbackPage from './pages/FeedbackPage'
import FeedbackDetail from './pages/FeedbackDetail'
import ExhibitPage from './pages/ExhibitPage'
import ActivityPage from './pages/ActivityPage'
import ReviewPage from './pages/ReviewPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/schedules" element={<SchedulePage />} />
        <Route path="/feedbacks" element={<FeedbackPage />} />
        <Route path="/feedbacks/:id" element={<FeedbackDetail />} />
        <Route path="/exhibits" element={<ExhibitPage />} />
        <Route path="/activities" element={<ActivityPage />} />
        <Route path="/review" element={<ReviewPage />} />
      </Routes>
    </Layout>
  )
}

export default App
