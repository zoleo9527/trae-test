import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  AlertTriangle, 
  LogOut,
  FileText,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { roleLabels } from '../utils/format';

interface NavItem {
  label: string;
  icon: ReactNode;
  href: string;
  roles?: string[];
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const navItems: NavItem[] = [
    { label: '仪表板', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
    { label: '学生列表', icon: <Users size={20} />, href: '/students' },
    { label: '日历视图', icon: <Calendar size={20} />, href: '/calendar' },
    { label: '问题追踪', icon: <AlertTriangle size={20} />, href: '/issues' },
  ];

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">留学服务系统</h1>
          <p className="text-xs text-gray-500 mt-1">文书流转与截点提醒</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                router.pathname === item.href
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <User size={20} className="text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{roleLabels[user?.role || '']}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            <LogOut size={18} />
            退出登录
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
