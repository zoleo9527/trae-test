import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './stores/useAuthStore'
import Login from './pages/Login'
import MainLayout from './components/MainLayout'
import Dashboard from './pages/Dashboard'
import ReviewPanel from './pages/ReviewPanel'
import ProjectDetail from './pages/ProjectDetail'
import Renewals from './pages/Renewals'
import Projects from './pages/Projects'

function App() {
  const { user, init } = useAuthStore()

  useEffect(() => {
    init()
  }, [init])

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <MainLayout /> : <Navigate to="/login" />}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="review" element={<ReviewPanel />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="renewals" element={<Renewals />} />
      </Route>
    </Routes>
  )
}

export default App
