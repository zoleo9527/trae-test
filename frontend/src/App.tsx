import { MainLayout } from '@/components/layout/MainLayout';
import { Dashboard } from '@/pages/Dashboard';
import { ReceiptDetail } from '@/pages/ReceiptDetail';
import { ReceiptList } from '@/pages/ReceiptList';
import { ReworkList } from '@/pages/ReworkList';
import { ReworkDetail } from '@/pages/ReworkDetail';
import { Settlement } from '@/pages/Settlement';
import { SettlementDetail } from '@/pages/SettlementDetail';
import { ShippingDetail } from '@/pages/ShippingDetail';
import { ShippingList } from '@/pages/ShippingList';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/shipping" element={<ShippingList />} />
          <Route path="/shipping/:id" element={<ShippingDetail />} />
          <Route path="/receipt" element={<ReceiptList />} />
          <Route path="/receipt/:id" element={<ReceiptDetail />} />
          <Route path="/rework" element={<ReworkList />} />
          <Route path="/rework/:id" element={<ReworkDetail />} />
          <Route path="/settlement" element={<Settlement />} />
          <Route path="/settlement/:id" element={<SettlementDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
