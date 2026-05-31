import React, { useState } from 'react';
import { Bell, User, ChevronDown } from 'lucide-react';
import { RoleSwitcher } from '@/components/shared/RoleSwitcher';
import { useRole } from '@/hooks/useRole';
import { useAlert } from '@/hooks/useAlert';
import { AlertTypeLabels } from '@/types';
import { useNavigate } from 'react-router-dom';
import { getDetailRoute, type TargetType } from '@/utils/routeMapping';

export function Header() {
  const { currentUser } = useRole();
  const { alerts, unreadCount, markAsRead } = useAlert();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const recentAlerts = alerts.slice(0, 5);

  const handleAlertClick = (alert: any) => {
    markAsRead(alert.id);
    setShowNotifications(false);
    navigate(getDetailRoute(alert.targetType as TargetType, alert.targetId));
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-medium text-gray-800">
          地坪施工-材料管理系统
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <RoleSwitcher />

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="font-medium text-gray-800">通知中心</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {recentAlerts.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    暂无通知
                  </div>
                ) : (
                  recentAlerts.map((alert) => (
                    <button
                      key={alert.id}
                      onClick={() => handleAlertClick(alert)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                        !alert.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">
                              {alert.title}
                            </span>
                            {!alert.read && (
                              <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {alert.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        {AlertTypeLabels[alert.type]} · {new Date(alert.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-gray-500" />
            )}
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium text-gray-800">
              {currentUser?.name || '未登录'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
