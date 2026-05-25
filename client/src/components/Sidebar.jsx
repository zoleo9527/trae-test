import {
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    FileWarning,
    Layers,
    LayoutDashboard,
    PhoneCall,
    Scale,
    Users,
    Warehouse
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { ROLES, ROLE_PERMISSIONS } from '../data/constants.js';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '工作台', permission: 'dashboard' },
  { path: '/weighing', icon: Scale, label: '过磅单管理', permission: 'weighing' },
  { path: '/coldroom', icon: Warehouse, label: '冷库库存', permission: 'coldroom' },
  { path: '/grading', icon: Layers, label: '分级配货', permission: 'grading' },
  { path: '/customers', icon: Users, label: '客户管理', permission: 'customers' },
  { path: '/credit', icon: CreditCard, label: '赊销账龄', permission: 'credit' },
  { path: '/collection', icon: PhoneCall, label: '回款催办', permission: 'collection' },
  { path: '/loss', icon: AlertTriangle, label: '损耗管理', permission: 'loss' },
  { path: '/complaints', icon: FileWarning, label: '客诉赔付', permission: 'complaints' }
];

export default function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen, currentUser, stats } = useApp();
  const [collapsed, setCollapsed] = useState(!sidebarOpen);

  const hasPermission = (permission) => {
    return ROLE_PERMISSIONS[currentUser.role]?.includes(permission);
  };

  const visibleMenuItems = menuItems.filter(item => hasPermission(item.permission));

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-60'
      } bg-gray-900 text-white transition-all duration-300 flex flex-col h-screen sticky top-0`}
    >
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍎</span>
            <div>
              <h1 className="font-bold text-sm">水果批发管理</h1>
              <p className="text-xs text-gray-400">赊销账龄系统</p>
            </div>
          </div>
        )}
        {collapsed && <span className="text-2xl mx-auto">🍎</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const hasBadge = item.path === '/collection' && stats.pendingCollection > 0;
          const hasWarning = item.path === '/credit' && stats.totalOverdueAmount > 0;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors relative ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && hasBadge && (
                <span className="ml-auto bg-danger-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {stats.pendingCollection}
                </span>
              )}
              {!collapsed && hasWarning && !hasBadge && (
                <span className="ml-auto bg-warning-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  !
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
            {currentUser.name.charAt(0)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-400">
                {currentUser.role === ROLES.MANAGER && '业务经理'}
                {currentUser.role === ROLES.SALES && '销售员'}
                {currentUser.role === ROLES.WAREHOUSE && '库管员'}
                {currentUser.role === ROLES.FINANCE && '财务'}
                {currentUser.role === ROLES.PURCHASE && '采购员'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
