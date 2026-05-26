import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import StockTake from './pages/StockTake';
import StockTakeDetail from './pages/StockTakeDetail';
import LossReports from './pages/LossReports';
import LossReportDetail from './pages/LossReportDetail';
import Products from './pages/Products';
import PriceAdjustments from './pages/PriceAdjustments';
import OperationLogs from './pages/OperationLogs';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <AppLayout user={user} onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route path="/dashboard" element={<Dashboard user={user} />} />
                  <Route path="/inventory" element={<Inventory user={user} />} />
                  <Route path="/stock-take" element={<StockTake user={user} />} />
                  <Route path="/stock-take/:id" element={<StockTakeDetail user={user} />} />
                  <Route path="/loss-reports" element={<LossReports user={user} />} />
                  <Route path="/loss-reports/:id" element={<LossReportDetail user={user} />} />
                  <Route path="/products" element={<Products user={user} />} />
                  <Route path="/price-adjustments" element={<PriceAdjustments user={user} />} />
                  <Route path="/logs" element={<OperationLogs user={user} />} />
                </Routes>
              </AppLayout>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
