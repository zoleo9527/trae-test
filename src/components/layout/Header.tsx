import { Bell, Search, ChevronDown, User } from 'lucide-react';
import { useState } from 'react';
import { useAppStore, getRoleName } from '@/store/app.store';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';

const roles: UserRole[] = ['manager', 'dispatcher', 'customer_service'];

export function Header() {
  const { currentUser, userRole, setUserRole } = useAppStore();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  if (!currentUser) return null;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索订单号、骑手姓名..."
            className="pl-9 pr-4 py-2 w-80 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md text-sm hover:bg-gray-50 transition-colors"
          >
            <span className="text-gray-600">当前角色：</span>
            <span className="font-medium text-primary-700">{getRoleName(userRole!)}</span>
            <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', showRoleMenu && 'rotate-180')} />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 animate-fade-in">
              <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">切换角色（演示用）</div>
              {roles.map(role => (
                <button
                  key={role}
                  onClick={() => {
                    setUserRole(role);
                    setShowRoleMenu(false);
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2',
                    userRole === role && 'bg-primary-50 text-primary-700'
                  )}
                >
                  <User className="w-4 h-4" />
                  {getRoleName(role)}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent-red rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full bg-gray-200"
          />
          <span className="text-sm font-medium text-gray-700">{currentUser.name}</span>
        </div>
      </div>
    </header>
  );
}
