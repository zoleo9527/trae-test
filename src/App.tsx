import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import MainLayout from './components/Layout'
import Dashboard from './pages/Dashboard'
import BatchList from './pages/BatchList'
import BatchDetail from './pages/BatchDetail'
import Sorting from './pages/Sorting'
import DamageList from './pages/DamageList'
import ClothesSearch from './pages/ClothesSearch'
import type { User } from './types'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = localStorage.getItem('user')
    if (cached) {
      setUser(JSON.parse(cached))
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData: User) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  if (loading) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
        } />
        <Route path="/*" element={
          user ? (
            <MainLayout user={user} onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<Dashboard user={user} />} />
                <Route path="/batches" element={<BatchList user={user} />} />
                <Route path="/batches/:id" element={<BatchDetail user={user} />} />
                <Route path="/sorting" element={<Sorting user={user} />} />
                <Route path="/damages" element={<DamageList user={user} />} />
                <Route path="/search" element={<ClothesSearch user={user} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
