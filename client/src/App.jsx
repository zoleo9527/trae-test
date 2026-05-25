import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Shipments from './pages/Shipments';
import ShipmentDetail from './pages/ShipmentDetail';
import Feedbacks from './pages/Feedbacks';
import Returns from './pages/Returns';
import Reconciliations from './pages/Reconciliations';
import Issues from './pages/Issues';

const ROLE_NAMES = {
  channel_manager: '渠道经理',
  distribution_specialist: '发行专员',
  finance: '财务对接'
};

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">加载中...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const AppContent = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="shipments" element={<Shipments />} />
        <Route path="shipments/:id" element={<ShipmentDetail />} />
        <Route path="feedbacks" element={<Feedbacks />} />
        <Route path="returns" element={<Returns />} />
        <Route path="reconciliations" element={
          <ProtectedRoute roles={['finance']}>
            <Reconciliations />
          </ProtectedRoute>
        } />
        <Route path="issues" element={<Issues />} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export { ROLE_NAMES };
export default App;
