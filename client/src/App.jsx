import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import RepairList from './pages/RepairList.jsx'
import RepairDetail from './pages/RepairDetail.jsx'
import VisitList from './pages/VisitList.jsx'
import LensTransferList from './pages/LensTransferList.jsx'
import RefundList from './pages/RefundList.jsx'
import OptometryList from './pages/OptometryList.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="repairs" element={<RepairList />} />
        <Route path="repairs/:id" element={<RepairDetail />} />
        <Route path="visits" element={<VisitList />} />
        <Route path="lens-transfers" element={<LensTransferList />} />
        <Route path="refunds" element={<RefundList />} />
        <Route path="optometry" element={<OptometryList />} />
      </Route>
    </Routes>
  )
}
