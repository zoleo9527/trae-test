import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { Layout } from '@/components/Layout'
import LoginPage from '@/pages/Login'
import DashboardPage from '@/pages/Dashboard'
import InspectionPage from '@/pages/Inspection'
import WorkOrderPage from '@/pages/WorkOrder'
import SitePage from '@/pages/Site'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/inspection"
            element={
              <PrivateRoute>
                <InspectionPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/workorders"
            element={
              <PrivateRoute>
                <WorkOrderPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/sites"
            element={
              <PrivateRoute>
                <SitePage />
              </PrivateRoute>
            }
          />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}
