import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Bell, User } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { roleLabels } from '@/types';
import { cn } from '@/lib/utils';

export function Header() {
  const { currentUser, users, switchUser, getPendingExceptionsCount, getPendingLedgerCount, getPendingFinanceCount } = useStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const pendingExceptions = getPendingExceptionsCount();
  const pendingLedger = getPendingLedgerCount();
  const pendingFinance = getPendingFinanceCount();
  const totalPending = pendingExceptions + pendingLedger + pendingFinance;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">欢迎回来，{currentUser.name}</h2>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
          {roleLabels[currentUser.role]}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          {totalPending > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {totalPending}
            </span>
          )}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-500" />
              </div>
            )}
            <ChevronDown className={cn('w-4 h-4 text-gray-500 transition-transform', showUserMenu && 'rotate-180')} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">切换角色</p>
                <p className="text-xs text-gray-500">模拟不同用户视角</p>
              </div>
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    switchUser(user.id);
                    setShowUserMenu(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors',
                    user.id === currentUser.id && 'bg-blue-50'
                  )}
                >
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{roleLabels[user.role]}</p>
                  </div>
                  {user.id === currentUser.id && (
                    <span className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
