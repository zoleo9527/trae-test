import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FileCheck,
  RefreshCw,
  Scale,
} from 'lucide-react';
import { useRole } from '@/hooks/useRole';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

export function Sidebar() {
  const location = useLocation();
  const { currentRole, canViewAllData } = useRole();

  const navItems: NavItem[] = [
    {
      path: '/',
      label: '总览看板',
      icon: LayoutDashboard,
      roles: ['project_manager', 'quality_engineer', 'team_leader'],
    },
    {
      path: '/shipping',
      label: '材料发货',
      icon: Package,
      roles: ['project_manager', 'quality_engineer', 'team_leader'],
    },
    {
      path: '/receipt',
      label: '回单核验',
      icon: FileCheck,
      roles: ['project_manager', 'quality_engineer', 'team_leader'],
    },
    {
      path: '/rework',
      label: '返工追踪',
      icon: RefreshCw,
      roles: ['project_manager', 'quality_engineer', 'team_leader'],
    },
    {
      path: '/settlement',
      label: '结算中心',
      icon: Scale,
      roles: ['project_manager', 'quality_engineer'],
    },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentRole));

  return (
    <aside className="w-60 bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-5 border-b border-gray-200">
        <h1 className="text-lg font-bold text-primary-700">地坪材料管理</h1>
        <p className="text-xs text-gray-500 mt-1">施工协同平台</p>
      </div>

      <nav className="flex-1 py-4">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-400 text-center">
          v0.1.0
        </div>
      </div>
    </aside>
  );
}
