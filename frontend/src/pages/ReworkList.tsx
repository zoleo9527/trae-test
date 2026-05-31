import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, RefreshCw, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useRole } from '@/hooks/useRole';
import { useFilteredData } from '@/hooks/useFilteredData';
import type { ReworkStatus, ResponsibilityLabels } from '@/types';

export function ReworkList() {
  const { reworkOrders } = useFilteredData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { canCreateRework, canExecuteRework, canReviewRework } = useRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReworkStatus | 'all'>('all');

  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter === 'active') {
      setStatusFilter('in_progress');
    } else if (filter && filter !== 'all') {
      setStatusFilter(filter as ReworkStatus);
    }
  }, [searchParams]);

  const filteredReworks = reworkOrders.filter(order => {
    const matchesSearch = order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: reworkOrders.length,
    created: reworkOrders.filter(r => r.status === 'created').length,
    in_progress: reworkOrders.filter(r => r.status === 'in_progress').length,
    submitted: reworkOrders.filter(r => r.status === 'submitted').length,
    passed: reworkOrders.filter(r => r.status === 'passed').length,
    failed: reworkOrders.filter(r => r.status === 'failed').length,
    closed: reworkOrders.filter(r => r.status === 'closed').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">返工追踪</h1>
          <p className="text-sm text-gray-500 mt-1">记录返工原因、追踪整改进度、完成闭环确认</p>
        </div>
        {canCreateRework && (
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            创建返工单
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status as ReworkStatus | 'all')}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              statusFilter === status
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status === 'all' ? '全部' :
             status === 'created' ? '已创建' :
             status === 'in_progress' ? '整改中' :
             status === 'submitted' ? '待复查' :
             status === 'passed' ? '已通过' :
             status === 'failed' ? '未通过' :
             status === 'closed' ? '已闭环' : status}
            <span className="ml-1.5 text-gray-400">({count})</span>
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="搜索返工单号或标题..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReworks.map((rework) => (
          <div
            key={rework.id}
            className="card hover:shadow-md cursor-pointer transition-all"
            onClick={() => navigate(`/rework/${rework.id}`)}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-warning-500" />
                  <span className="text-sm font-medium text-gray-800">{rework.code}</span>
                </div>
                <StatusBadge status={rework.status} type="rework" />
              </div>

              <h3 className="text-sm font-medium text-gray-800 mb-2">{rework.title}</h3>
              
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{rework.reason}</p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">责任方</span>
                  <span className="text-gray-700">
                    {ResponsibilityLabels[rework.responsibleParty]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">位置</span>
                  <span className="text-gray-700">{rework.location}</span>
                </div>
                {rework.deadline && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">截止时间</span>
                    <span className={`${
                      new Date(rework.deadline) < new Date() ? 'text-danger-600' : 'text-gray-700'
                    }`}>
                      {new Date(rework.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">预估费用</span>
                  <span className="text-gray-700">
                    ¥{rework.estimatedCost?.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {rework.steps.length} 个处理步骤
                </span>
                <button className="text-xs text-primary-600 hover:text-primary-700">
                  查看详情 →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredReworks.length === 0 && (
        <div className="card">
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success-500" />
            <p className="text-gray-500">暂无返工记录</p>
          </div>
        </div>
      )}
    </div>
  );
}
