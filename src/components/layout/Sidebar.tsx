import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Calculator,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: '汇总看板', icon: LayoutDashboard, roles: ['owner', 'weigher', 'accountant'] },
  { path: '/ledger', label: '环保台账', icon: FileText, roles: ['owner', 'weigher', 'accountant'] },
  { path: '/exceptions', label: '异常上报', icon: AlertTriangle, roles: ['owner', 'weigher', 'accountant'] },
  { path: '/prices', label: '价格调整', icon: TrendingUp, roles: ['owner', 'accountant'] },
  { path: '/finance', label: '财务结算', icon: Calculator, roles: ['owner', 'accountant'] },
];

export function Sidebar() {
  const location = useLocation();
  const currentRole = useStore((state) => state.currentRole);

  const filteredNavItems = navItems.filter((item) => item.roles.includes(currentRole));

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">废品回收站</h1>
            <p className="text-xs text-gray-500">环保管理系统</p>
          </div>
        </div>
      </div>
      <nav className="p-4">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
