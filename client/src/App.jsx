import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useEffect } from 'react';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Performances from './pages/Performances';
import Orders from './pages/Orders';
import Rehearsals from './pages/Rehearsals';
import ChainView from './pages/ChainView';

const ROLES = {
  THEATER_MANAGER: 'theater_manager',
  TICKET_SUPERVISOR: 'ticket_supervisor',
  BACKEND_COORDINATOR: 'backend_coordinator'
};

const routeRoles = {
  '/orders': [ROLES.THEATER_MANAGER, ROLES.TICKET_SUPERVISOR],
  '/rehearsals': [ROLES.THEATER_MANAGER, ROLES.BACKEND_COORDINATOR]
};

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const RoleGuard = ({ children, requiredRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    if (!loading && user && requiredRoles && !requiredRoles.includes(user.role)) {
      console.warn(`角色 ${user.role} 无权访问路径: ${location.pathname}`);
    }
  }, [user, loading, requiredRoles, location.pathname]);
  
  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>;
  }
  
  if (requiredRoles && !requiredRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="performances" element={<Performances />} />
        <Route path="chain" element={<ChainView />} />
        <Route path="orders" element={
          <RoleGuard requiredRoles={[ROLES.THEATER_MANAGER, ROLES.TICKET_SUPERVISOR]}>
            <Orders />
          </RoleGuard>
        } />
        <Route path="rehearsals" element={
          <RoleGuard requiredRoles={[ROLES.THEATER_MANAGER, ROLES.BACKEND_COORDINATOR]}>
            <Rehearsals />
          </RoleGuard>
        } />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
