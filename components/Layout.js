import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

const menuItems = [
  { id: 'dashboard', name: '站内概览', icon: '📊', path: '/' },
  { id: 'schedule', name: '排班看板', icon: '📋', path: '/schedule' },
  { id: 'grid_docs', name: '并网资料', icon: '📄', path: '/grid-docs' },
  { id: 'payment', name: '回款节点', icon: '💰', path: '/payment' },
  { id: 'work_orders', name: '工单管理', icon: '🔧', path: '/work-orders' },
  { id: 'spare_parts', name: '备件管理', icon: '📦', path: '/spare-parts' },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout, canAccess, ROLES } = useAuth();
  const router = useRouter();

  const filteredMenuItems = menuItems.filter(item => canAccess(item.id) || user?.role === ROLES.STATION_MANAGER);

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">☀️</span>
              <span className="font-bold text-gray-800">光伏运维</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="flex-1 py-4 px-2">
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                router.pathname === item.path
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="font-medium">{item.name}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
              {user.avatar}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.roleName}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={logout}
              className="w-full mt-3 text-sm text-gray-500 hover:text-red-500 flex items-center gap-2"
            >
              <span>🚪</span> 退出登录
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              {menuItems.find(m => m.path === router.pathname)?.name || '光伏运维管理系统'}
            </h1>
            <p className="text-sm text-gray-500">{user.stationName}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">{user.name}</p>
              <p className="text-xs text-gray-500">{user.roleName}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
              {user.avatar}
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
