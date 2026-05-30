'use client';

import { TimelineEvent } from '@/types';
import { AlertTriangle, Calendar, ChevronDown, ChevronRight, Clock, CreditCard, Package, User, Wallet } from 'lucide-react';
import { useState } from 'react';

interface TimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
}

const typeConfig = {
  recharge: {
    icon: <Wallet size={16} />,
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  consume: {
    icon: <CreditCard size={16} />,
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  booking: {
    icon: <Calendar size={16} />,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  equipment: {
    icon: <Package size={16} />,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  exception: {
    icon: <AlertTriangle size={16} />,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
};

export default function Timeline({ events, loading = false }: TimelineProps) {
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Clock size={48} className="mx-auto mb-3 text-gray-300" />
        <p>暂无记录</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

      <div className="space-y-4">
        {events.map((event) => {
          const config = typeConfig[event.type];
          const isExpanded = expandedIds.includes(event.id);

          return (
            <div key={event.id} className="relative pl-12 animate-fade-in">
              <div
                className={`absolute left-0 w-10 h-10 rounded-full ${config.color} text-white flex items-center justify-center ring-4 ring-white`}
              >
                {config.icon}
              </div>

              <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4 transition-all duration-200`}>
                <div className="flex items-start justify-between gap-4 cursor-pointer" onClick={() => toggleExpand(event.id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      {event.amount !== undefined && (
                        <span className={`text-sm font-semibold ${event.type === 'recharge' ? 'text-green-600' : 'text-red-600'}`}>
                          {event.type === 'recharge' ? '+' : '-'}¥{event.amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {event.operator_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDateTime(event.created_at)}
                      </span>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">详细信息</h5>
                    <div className="bg-white rounded-lg p-3 text-sm">
                      <pre className="whitespace-pre-wrap text-gray-600 font-mono text-xs overflow-x-auto">
                        {JSON.stringify(event.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
