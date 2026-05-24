import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, PrivateRoute } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorkOrderList from './pages/WorkOrderList';
import WorkOrderDetail from './pages/WorkOrderDetail';
import FollowUpList from './pages/FollowUpList';
import MemberList from './pages/MemberList';
import MainLayout from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="work-orders" element={<WorkOrderList />} />
          <Route path="work-orders/:id" element={<WorkOrderDetail />} />
          <Route path="follow-ups" element={<FollowUpList />} />
          <Route path="members" element={<MemberList />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
