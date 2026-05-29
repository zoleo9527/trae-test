import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from '@/store/app.store';
import { Layout } from '@/components/layout/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { OrderProcessPage } from '@/pages/OrderProcessPage';
import { AppealsPage } from '@/pages/AppealsPage';
import { SubsidiesPage } from '@/pages/SubsidiesPage';
import { AssessmentsPage } from '@/pages/AssessmentsPage';
import { TrainingPage } from '@/pages/TrainingPage';
import { RidersPage } from '@/pages/RidersPage';
import { RiderProfilePage } from '@/pages/RiderProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';
import type { UserRole } from '@/types';

function ProtectedLayout({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const { isLoggedIn, userRole } = useAppStore();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:orderId/process" element={<OrderProcessPage />} />
        </Route>

        <Route element={<ProtectedLayout allowedRoles={['manager', 'customer_service']} />}>
          <Route path="/appeals" element={<AppealsPage />} />
        </Route>

        <Route element={<ProtectedLayout allowedRoles={['manager', 'dispatcher']} />}>
          <Route path="/subsidies" element={<SubsidiesPage />} />
          <Route path="/assessments" element={<AssessmentsPage />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/riders" element={<RidersPage />} />
          <Route path="/riders/:riderId" element={<RiderProfilePage />} />
        </Route>

        <Route element={<ProtectedLayout allowedRoles={['manager']} />}>
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
