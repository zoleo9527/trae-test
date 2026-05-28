import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { AppProvider } from './store/AppContext'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Deliveries from './pages/Deliveries'
import BucketReturns from './pages/BucketReturns'
import Inventory from './pages/Inventory'
import Complaints from './pages/Complaints'
import Users from './pages/Users'

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<ProtectedRoute path="/"><Dashboard /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute path="/orders"><Orders /></ProtectedRoute>} />
            <Route path="/deliveries" element={<ProtectedRoute path="/deliveries"><Deliveries /></ProtectedRoute>} />
            <Route path="/bucket-returns" element={<ProtectedRoute path="/bucket-returns"><BucketReturns /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute path="/inventory"><Inventory /></ProtectedRoute>} />
            <Route path="/complaints" element={<ProtectedRoute path="/complaints"><Complaints /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute path="/users"><Users /></ProtectedRoute>} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  )
}
