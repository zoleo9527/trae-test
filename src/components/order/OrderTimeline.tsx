import React from 'react';
import { Clock, User, ChefHat, MessageSquare, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';
import type { OrderHistory, UserRole } from '../../types';

interface OrderTimelineProps {
  history: OrderHistory[];
}

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case 'manager':
      return Settings;
    case 'chef':
      return ChefHat;
    case 'customer_service':
      return MessageSquare;
    default:
      return User;
  }
};

const getRoleColor = (role: UserRole) => {
  switch (role) {
    case 'manager':
      return 'bg-bakery-brown-100 text-bakery-brown-600';
    case 'chef':
      return 'bg-bakery-matcha/20 text-bakery-matcha';
    case 'customer_service':
      return 'bg-blue-100 text-blue-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ history }) => {
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        操作时间线
      </h4>
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
        <div className="space-y-4">
          {sortedHistory.map((item, index) => {
            const Icon = getRoleIcon(item.operatorRole);
            const isLatest = index === 0;
            
            return (
              <div key={item.id} className="relative flex gap-4">
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${getRoleColor(item.operatorRole)} ${isLatest ? 'ring-4 ring-white shadow-md' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800">
                      {item.operator}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDateTime(item.timestamp)}
                    </span>
                    {isLatest && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        最新
                      </span>
                    )}
                  </div>
                  <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-1 ${
                    item.action.includes('改单') || item.action.includes('退款')
                      ? 'bg-orange-100 text-orange-700'
                      : item.action.includes('逾期')
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {item.action}
                  </div>
                  {item.remarks && (
                    <p className="text-sm text-gray-600 mt-1">{item.remarks}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
