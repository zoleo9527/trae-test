import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Performances from './pages/Performances';
import Orders from './pages/Orders';
import Rehearsals from './pages/Rehearsals';
import ChainView from './pages/ChainView';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
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
        <Route path="orders" element={<Orders />} />
        <Route path="rehearsals" element={<Rehearsals />} />
        <Route path="chain" element={<ChainView />} />
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
