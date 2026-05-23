import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transfers from './pages/Transfers';
import Inventory from './pages/Inventory';
import Products from './pages/Products';
import Stores from './pages/Stores';
import Repairs from './pages/Repairs';
import useAuthStore from './store/authStore';

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore(state => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  const initAuth = useAuthStore(state => state.init);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="transfers" element={<Transfers />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="repairs" element={<Repairs />} />
            <Route path="products" element={<Products />} />
            <Route path="stores" element={<Stores />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
