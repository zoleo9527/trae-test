import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DistributionPage from './pages/DistributionPage'
import ReturnPage from './pages/ReturnPage'
import PaymentPage from './pages/PaymentPage'
import ExceptionPage from './pages/ExceptionPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/distributions" element={<DistributionPage />} />
        <Route path="/returns" element={<ReturnPage />} />
        <Route path="/payments" element={<PaymentPage />} />
        <Route path="/exceptions" element={<ExceptionPage />} />
      </Routes>
    </Layout>
  )
}

export default App
