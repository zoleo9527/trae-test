import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FileText,
  Coins,
  ClipboardCheck,
  GraduationCap,
  Users,
  Settings,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import { useAppStore, getRoleName } from '@/store/app.store';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

const roleNavItems: Record<UserRole, Array<{
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}>> = {
  manager: [
    { to: '/dashboard', label: '工作台', icon: LayoutDashboard },
    { to: '/orders', label: '订单管理', icon: Package },
    { to: '/appeals', label: '申诉管理', icon: FileText, badge: 0 },
    { to: '/subsidies', label: '补贴管理', icon: Coins, badge: 0 },
    { to: '/assessments', label: '考核管理', icon: ClipboardCheck, badge: 0 },
    { to: '/training', label: '培训管理', icon: GraduationCap, badge: 0 },
    { to: '/riders', label: '骑手管理', icon: Users },
    { to: '/settings', label: '规则配置', icon: Settings },
  ],
  dispatcher: [
    { to: '/dashboard', label: '工作台', icon: LayoutDashboard },
    { to: '/orders', label: '订单处理', icon: Package },
    { to: '/subsidies', label: '补贴审核', icon: Coins, badge: 0 },
    { to: '/assessments', label: '考核发起', icon: ClipboardCheck, badge: 0 },
    { to: '/riders', label: '骑手信息', icon: Users },
  ],
  customer_service: [
    { to: '/dashboard', label: '工作台', icon: LayoutDashboard },
    { to: '/appeals', label: '申诉处理', icon: FileText, badge: 0 },
    { to: '/orders', label: '订单查询', icon: Package },
    { to: '/riders', label: '骑手信息', icon: Users },
  ],
};

export function Sidebar() {
  const { userRole, currentUser, pendingCounts, logout } = useAppStore();
  const navigate = useNavigate();

  if (!userRole) return null;

  const navItems = roleNavItems[userRole].map(item => ({
    ...item,
    badge: item.to === '/appeals' ? pendingCounts.appeals
      : item.to === '/subsidies' ? pendingCounts.subsidies
      : item.to === '/assessments' ? pendingCounts.assessments
      : item.to === '/training' ? pendingCounts.trainings
      : undefined,
  }));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-primary-800 text-white min-h-screen flex flex-col">
      <div className="p-5 border-b border-primary-700">
        <h1 className="text-xl font-bold tracking-wide">骑手考核系统</h1>
        <p className="text-xs text-primary-300 mt-1">Rider Assessment Platform</p>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-5 py-3 text-sm transition-colors duration-150',
                isActive
                  ? 'bg-primary-700 text-white border-r-4 border-accent-amber'
                  : 'text-primary-200 hover:bg-primary-700/50 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-accent-amber text-primary-900 text-xs font-bold rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-primary-700">
        {currentUser && (
          <div className="flex items-center gap-3 mb-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full bg-primary-600"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <p className="text-xs text-primary-300">{getRoleName(currentUser.role)}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-primary-200 hover:bg-primary-700 rounded transition-colors"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>
    </div>
  );
}
