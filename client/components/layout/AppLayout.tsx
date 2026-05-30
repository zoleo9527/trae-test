'use client';

import { useAuthStore } from '@/store/auth';
import { UserRole } from '@/types';
import {
    AlertTriangle,
    Calendar,
    ChevronRight,
    History,
    LayoutDashboard,
    LogOut,
    Package,
    Settings,
    User,
    Users,
    Wallet
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const sidebarItems: SidebarItem[] = [
  {
    label: '数据概览',
    href: '/manager/dashboard',
    icon: <LayoutDashboard size={20} />,
    roles: ['manager', 'coach'],
  },
  {
    label: '前台工作台',
    href: '/reception',
    icon: <Users size={20} />,
    roles: ['reception', 'manager'],
  },
  {
    label: '教练工作台',
    href: '/coach',
    icon: <Calendar size={20} />,
    roles: ['coach', 'manager'],
  },
  {
    label: '对账中心',
    href: '/manager/reconciliation',
    icon: <Wallet size={20} />,
    roles: ['manager'],
  },
  {
    label: '器材管理',
    href: '/manager/equipment',
    icon: <Package size={20} />,
    roles: ['manager'],
  },
  {
    label: '异常处理',
    href: '/manager/exceptions',
    icon: <AlertTriangle size={20} />,
    roles: ['manager'],
  },
  {
    label: '操作日志',
    href: '/manager/audit-logs',
    icon: <History size={20} />,
    roles: ['manager'],
  },
  {
    label: '口径配置',
    href: '/manager/config',
    icon: <Settings size={20} />,
    roles: ['manager'],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, loadUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await loadUser();
      setIsLoading(false);
    };
    init();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const filteredItems = sidebarItems.filter((item) => item.roles.includes(user.role));

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      manager: '场馆经理',
      coach: '教练主管',
      reception: '前台',
    };
    return labels[role];
  };

  const getRoleBadgeColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      manager: 'bg-gold-800',
      coach: 'bg-blue-600',
      reception: 'bg-primary-600',
    };
    return colors[role];
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-primary-900 text-white flex flex-col">
        <div className="p-6 border-b border-primary-800">
          <h1 className="text-xl font-serif font-bold text-gold-800">⛳ 高尔夫练习场</h1>
          <p className="text-sm text-gray-400 mt-1">会员储值与对账系统</p>
        </div>

        <div className="p-4 border-b border-primary-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-700 flex items-center justify-center">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.name}</p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs ${getRoleBadgeColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`sidebar-link w-full text-left ${isActive ? 'sidebar-link-active' : ''}`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={16} />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-primary-800">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-left text-red-300 hover:bg-red-900/30 hover:text-red-200"
          >
            <LogOut size={20} />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {filteredItems.find((item) => pathname === item.href || pathname.startsWith(item.href + '/'))?.label ||
                  '系统'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}
