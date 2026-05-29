import { useState, ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface NavItem {
  label: string;
  href: string;
  roles?: UserRole[];
  icon: string;
}

const navItems: NavItem[] = [
  { label: '工作台', href: '/dashboard', icon: '📊' },
  { label: '租赁管理', href: '/rentals', icon: '🎻' },
  {
    label: '归还复核',
    href: '/review',
    icon: '✅',
    roles: ['store_owner', 'admin', 'rental_consultant'],
  },
  {
    label: '维修保养',
    href: '/repairs',
    icon: '🔧',
    roles: ['repair_technician', 'store_owner', 'admin'],
  },
  {
    label: '学校合作',
    href: '/school',
    icon: '🏫',
    roles: ['store_owner', 'admin'],
  },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout, hasRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const roleLabels: Record<UserRole, string> = {
    admin: '系统管理员',
    store_owner: '门店老板',
    rental_consultant: '租赁顾问',
    repair_technician: '维修师傅',
  };

  const filteredNav = navItems.filter(
    (item) => !item.roles || item.roles.some((r) => hasRole(r))
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200">
          <h1
            className={`font-bold text-xl text-primary-600 ${
              !sidebarOpen && 'text-center'
            }`}
          >
            {sidebarOpen ? '🎵 乐器租赁' : '🎵'}
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {filteredNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
              {user?.name?.charAt(0)}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user && roleLabels[user.role]}
                </p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={logout}
              className="mt-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              退出登录
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('zh-CN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </header>
        <div className="flex-1 p-6 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
