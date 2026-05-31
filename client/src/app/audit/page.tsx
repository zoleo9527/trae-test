'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { Search } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeValue?: any;
  afterValue?: any;
  operator: { name: string; role: string };
  createdAt: string;
  ipAddress?: string;
}

const actionMap: Record<string, string> = {
  ORDER_CREATE: '创建订单',
  ORDER_UPDATE: '更新订单',
  ORDER_STATUS_CHANGE: '订单状态变更',
  PRODUCTION_CREATE: '创建生产',
  PRODUCTION_START: '开始生产',
  PRODUCTION_COMPLETE: '完成生产',
  PRODUCTION_REWORK: '安排返工',
  WASTE_RECORD_CREATE: '创建损耗记录',
  REFUND_CREATE: '创建退款',
  REFUND_APPROVE: '批准退款',
  REFUND_REJECT: '驳回退款',
  REFUND_COMPLETE: '完成退款',
  STOCK_UPDATE: '库存变更',
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ entityType: '', action: '' });

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const loadLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.entityType) params.append('entityType', filter.entityType);
      if (filter.action) params.append('action', filter.action);
      
      const res = await api.get(`/audit?${params.toString()}`);
      setLogs(res.data.logs);
    } catch (error) {
      console.error('加载日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">加载中...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">审计日志</h2>
        <div className="flex gap-2">
          <select
            value={filter.entityType}
            onChange={(e) => setFilter({ ...filter, entityType: e.target.value })}
            className="w-40 text-sm"
          >
            <option value="">全部类型</option>
            <option value="Order">订单</option>
            <option value="Production">生产</option>
            <option value="WasteRecord">损耗</option>
            <option value="Refund">退款</option>
          </select>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>操作</th>
              <th>实体类型</th>
              <th>操作人</th>
              <th>角色</th>
              <th>变更详情</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="text-sm">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td>
                  <span className="text-sm font-medium">
                    {actionMap[log.action] || log.action}
                  </span>
                </td>
                <td className="text-sm">{log.entityType}</td>
                <td className="text-sm">{log.operator.name}</td>
                <td>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {log.operator.role === 'OWNER' && '主理人'}
                    {log.operator.role === 'KITCHEN' && '后厨'}
                    {log.operator.role === 'CUSTOMER_SERVICE' && '客服'}
                  </span>
                </td>
                <td className="text-sm max-w-xs">
                  {log.beforeValue || log.afterValue ? (
                    <div className="space-y-1">
                      {log.beforeValue && (
                        <div className="text-red-600 text-xs truncate">
                          前: {JSON.stringify(log.beforeValue)}
                        </div>
                      )}
                      {log.afterValue && (
                        <div className="text-green-600 text-xs truncate">
                          后: {JSON.stringify(log.afterValue)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <p className="text-center text-gray-400 py-8">暂无审计日志</p>
        )}
      </div>
    </Layout>
  );
}
