import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ProcessingPanel } from './ProcessingPanel';
import { useOrderStore } from '../../store/useOrderStore';

export const MainLayout: React.FC = () => {
  const { selectedOrder, selectOrder } = useOrderStore();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <Outlet />
          </div>
          {selectedOrder && (
            <ProcessingPanel onClose={() => selectOrder(null)} />
          )}
        </main>
      </div>
    </div>
  );
};
