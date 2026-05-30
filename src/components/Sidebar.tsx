import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, GitBranch, Package, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import RoleSwitcher from './RoleSwitcher';

const navItems = [
  { path: '/', label: '首页仪表盘', icon: LayoutDashboard },
  { path: '/pipeline', label: '订单流水线', icon: GitBranch },
  { path: '/batches', label: '批次追踪', icon: Package },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-amber-400 flex items-center gap-2">
          <Package className="w-6 h-6" />
          洗涤工厂
        </h1>
        <p className="text-xs text-slate-400 mt-1">门店交接与回单核验系统</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-amber-500 text-slate-900 font-medium'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-4">
        <RoleSwitcher />
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer transition-colors">
          <Settings className="w-5 h-5" />
          <span className="text-sm">系统设置</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 text-slate-400 text-xs">
          <User className="w-4 h-4" />
          <span>v1.0.0 | 演示模式</span>
        </div>
      </div>
    </aside>
  );
}
