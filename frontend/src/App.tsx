import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Orders from './pages/Orders'
import Payments from './pages/Payments'
import Reminders from './pages/Reminders'
import Exceptions from './pages/Exceptions'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/exceptions" element={<Exceptions />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
