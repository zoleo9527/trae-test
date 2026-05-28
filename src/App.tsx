import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
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
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/deliveries" element={<Deliveries />} />
            <Route path="/bucket-returns" element={<BucketReturns />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/users" element={<Users />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  )
}
