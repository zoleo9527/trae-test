import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROLE_NAMES } from '../utils/format';

const menuItems = [
  { path: '/dashboard', label: '总览看板', icon: '📊', roles: ['manager', 'sales', 'warehouse'] },
  { path: '/inventory', label: '库存管理', icon: '📦', roles: ['manager', 'sales', 'warehouse'] },
  { path: '/stock-take', label: '库存盘点', icon: '✅', roles: ['manager', 'sales', 'warehouse'] },
  { path: '/loss-reports', label: '损耗上报', icon: '📝', roles: ['manager', 'sales', 'warehouse'] },
  { path: '/products', label: '产品管理', icon: '🍵', roles: ['manager', 'sales', 'warehouse'] },
  { path: '/price-adjustments', label: '价格管理', icon: '💰', roles: ['manager'] },
  { path: '/logs', label: '操作日志', icon: '📋', roles: ['manager'] }
];

export default function AppLayout({ children, user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 fixed h-full z-40`}
      >
        <div className="h-16 flex items-center px-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-tea-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
              茶
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-gray-800">茶叶经销</h1>
                <p className="text-xs text-gray-500">库存管理系统</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
          {filteredMenu.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${
                location.pathname.startsWith(item.path) && item.path !== '/'
                  ? 'active'
                  : location.pathname === item.path
                  ? 'active'
                  : ''
              }`}
              title={item.label}
            >
              <span className="text-xl shrink-0">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="sidebar-item w-full justify-center"
            title={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}
          >
            <span className="text-xl">{sidebarOpen ? '◀' : '▶'}</span>
            {sidebarOpen && <span>收起菜单</span>}
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {filteredMenu.find(m => location.pathname.startsWith(m.path))?.label || '茶叶经销库存管理系统'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
              >
                <div className="w-9 h-9 bg-tea-100 rounded-full flex items-center justify-center text-tea-700 font-medium">
                  {user?.name?.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-500">{ROLE_NAMES[user?.role]}</p>
                </div>
                <span className="text-gray-400">▼</span>
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-medium text-gray-800">{user?.name}</p>
                      <p className="text-sm text-gray-500">{ROLE_NAMES[user?.role]}</p>
                    </div>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
