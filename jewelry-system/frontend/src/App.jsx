import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import Documents from './pages/Documents';
import Supplements from './pages/Supplements';
import Refunds from './pages/Refunds';
import Reports from './pages/Reports';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="cases" element={<Cases />} />
            <Route path="cases/:id" element={<CaseDetail />} />
            <Route path="documents" element={<Documents />} />
            <Route path="supplements" element={<Supplements />} />
            <Route 
              path="refunds" 
              element={
                <ProtectedRoute permission="refunds">
                  <Refunds />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="reports" 
              element={
                <ProtectedRoute permission="reports">
                  <Reports />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
