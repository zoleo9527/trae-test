import React, { useState } from 'react';
import { Bell, Search, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { Avatar } from '../common/Avatar';

export const Header: React.FC = () => {
  const { user } = useAuthStore();
  const { notifications, getUnreadCount, markAsRead } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = getUnreadCount();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索订单号、客户姓名..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bakery-brown-500/20 focus:border-bakery-brown-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-bakery-alert text-white text-xs font-medium rounded-full flex items-center justify-center animate-bounce-subtle">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">通知中心</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    暂无通知
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !notif.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${
                            notif.type === 'warning'
                              ? 'bg-yellow-500'
                              : notif.type === 'error'
                              ? 'bg-red-500'
                              : notif.type === 'success'
                              ? 'bg-green-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 text-sm">
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <Avatar src={user.avatar} name={user.name} role={user.role} />
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-800">{user.name}</p>
              <p className="text-xs text-gray-500">
                {user.role === 'manager' && '门店主理人'}
                {user.role === 'chef' && '后厨负责人'}
                {user.role === 'customer_service' && '客服'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>
    </header>
  );
};
