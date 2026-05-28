'use client';

import { useAuth } from '../context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Anchor, 
  CreditCard, 
  Users, 
  Package, 
  Calendar, 
  Bell, 
  LogOut,
  Home
} from 'lucide-react';

const ROLE_MENUS = {
  agent_manager: ['/dashboard', '/berth', '/payments', '/crew', '/supplies', '/calendar', '/alerts'],
  field_coordinator: ['/dashboard', '/berth', '/crew', '/supplies', '/calendar', '/alerts'],
  document_specialist: ['/dashboard', '/berth', '/payments', '/crew', '/calendar', '/alerts'],
};

export default function Layout({ children }) {
  const { user, logout, getRoleName, hasRole } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const allMenuItems = [
    { href: '/dashboard', label: '首页', icon: Home },
    { href: '/berth', label: '靠泊计划', icon: Anchor },
    { href: '/payments', label: '费用垫付', icon: CreditCard },
    { href: '/crew', label: '船员换班', icon: Users },
    { href: '/supplies', label: '补给管理', icon: Package },
    { href: '/calendar', label: '日历视图', icon: Calendar },
    { href: '/alerts', label: '提醒中心', icon: Bell },
  ];

  const allowedMenus = ROLE_MENUS[user?.role] || allMenuItems.map(m => m.href);
  const menuItems = allMenuItems.filter(item => allowedMenus.includes(item.href));

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Anchor className="w-6 h-6 text-primary-600" />
            船舶代理系统
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-medium text-gray-900">{user?.name}</div>
              <div className="text-sm text-gray-500">{getRoleName(user?.role)}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
