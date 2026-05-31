import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Cake,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/useAuthStore';
import { Avatar } from '../common/Avatar';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  allowedRoles?: string[];
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
          'hover:bg-bakery-brown-100/50 hover:text-bakery-brown-700',
          isActive
            ? 'bg-bakery-brown-500 text-white shadow-md'
            : 'text-gray-600'
        )
      }
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </NavLink>
  );
};

export const Sidebar: React.FC = () => {
  const { user, logout, hasPermission } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-bakery-brown-500 rounded-xl flex items-center justify-center">
            <Cake className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-bakery-brown-800">手作烘焙坊</h1>
            <p className="text-xs text-gray-500">订单管理系统</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <NavItem to="/dashboard" icon={Home} label="工作台" />
        <NavItem to="/orders" icon={FileText} label="订单管理" />
        {hasPermission(['manager', 'chef']) && (
          <NavItem to="/schedule" icon={Calendar} label="产能排期" />
        )}
        {hasPermission(['manager']) && (
          <NavItem to="/analytics" icon={BarChart3} label="数据复盘" />
        )}
        {hasPermission(['manager']) && (
          <NavItem to="/settings" icon={Settings} label="系统设置" />
        )}
      </nav>

      <div className="p-4 border-t border-gray-100">
        {user && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <Avatar src={user.avatar} name={user.name} role={user.role} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{user.name}</p>
              <p className="text-xs text-gray-500">
                {user.role === 'manager' && '门店主理人'}
                {user.role === 'chef' && '后厨负责人'}
                {user.role === 'customer_service' && '客服'}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
};
