import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ChangeOrders from './pages/ChangeOrders';
import ChangeOrderDetail from './pages/ChangeOrderDetail';
import Rectification from './pages/Rectification';
import FeeTracking from './pages/FeeTracking';
import ScanModal from './components/ScanModal';
import { users } from './data/mockData';

function App() {
  const [currentUser, setCurrentUser] = useState(users[0]);
  const [scanModalOpen, setScanModalOpen] = useState(false);

  return (
    <Layout 
      currentUser={currentUser} 
      onUserChange={setCurrentUser}
      onOpenScan={() => setScanModalOpen(true)}
    >
      <Routes>
        <Route path="/" element={<Dashboard currentUser={currentUser} />} />
        <Route path="/change-orders" element={<ChangeOrders currentUser={currentUser} />} />
        <Route path="/change-orders/:id" element={<ChangeOrderDetail currentUser={currentUser} />} />
        <Route path="/rectification" element={<Rectification currentUser={currentUser} />} />
        <Route path="/fee-tracking" element={<FeeTracking currentUser={currentUser} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ScanModal open={scanModalOpen} onClose={() => setScanModalOpen(false)} />
    </Layout>
  );
}

export default App;
