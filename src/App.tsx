import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useAuthStore } from "@/stores/authStore"
import Layout from "@/components/Layout"
import Login from "@/pages/Login"
import Home from "@/pages/Home"
import Rolls from "@/pages/Rolls"
import NewRoll from "@/pages/NewRoll"
import RollDetail from "@/pages/RollDetail"
import CalendarView from "@/pages/CalendarView"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const currentUser = useAuthStore((state) => state.currentUser)
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const currentUser = useAuthStore((state) => state.currentUser)
  if (currentUser) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/rolls" element={<Rolls />} />
          <Route path="/rolls/new" element={<NewRoll />} />
          <Route path="/rolls/:id" element={<RollDetail />} />
          <Route path="/calendar" element={<CalendarView />} />
        </Route>
      </Routes>
    </Router>
  )
}
