import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import InspectionList from './pages/InspectionList'
import InspectionDetail from './pages/InspectionDetail'
import RectificationList from './pages/RectificationList'
import RectificationDetail from './pages/RectificationDetail'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inspections" element={<InspectionList />} />
        <Route path="/inspections/:id" element={<InspectionDetail />} />
        <Route path="/rectifications" element={<RectificationList />} />
        <Route path="/rectifications/:id" element={<RectificationDetail />} />
      </Routes>
    </Layout>
  )
}

export default App
