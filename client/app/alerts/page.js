'use client';

import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../lib/api';
import { 
  Bell, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Ship,
  CreditCard,
  Users,
  Package
} from 'lucide-react';

const PriorityBadge = ({ priority }) => {
  const styles = {
    high: 'bg-red-100 text-red-800',
    normal: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800',
  };
  const labels = {
    high: '紧急',
    normal: '普通',
    low: '低',
  };
  return (
    <span className={`badge ${styles[priority] || styles.normal}`}>
      {labels[priority] || priority}
    </span>
  );
};

const TypeIcon = ({ type }) => {
  const icons = {
    berth: Ship,
    payment: CreditCard,
    document: Users,
    supply: Package,
  };
  const colors = {
    berth: 'text-blue-600 bg-blue-100',
    payment: 'text-green-600 bg-green-100',
    document: 'text-red-600 bg-red-100',
    supply: 'text-purple-600 bg-purple-100',
  };
  const Icon = icons[type] || Bell;
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors[type] || colors.berth}`}>
      <Icon className="w-5 h-5" />
    </div>
  );
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, typeFilter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const data = await api.alerts.list(params);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkResolved = async (id) => {
    try {
      await api.alerts.update(id, { status: 'resolved' });
      fetchAlerts();
    } catch (err) {
      console.error('Failed to update alert:', err);
    }
  };

  const pendingCount = alerts.filter(a => a.status === 'pending').length;
  const highPriorityCount = alerts.filter(a => a.priority === 'high' && a.status === 'pending').length;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">提醒中心</h1>
          <p className="text-gray-500 mt-1">查看和处理所有待办提醒</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">待处理提醒</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">紧急事项</p>
                <p className="text-2xl font-bold text-red-600">{highPriorityCount}</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">已处理</p>
                <p className="text-2xl font-bold text-gray-900">
                  {alerts.filter(a => a.status === 'resolved').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-40"
            >
              <option value="pending">待处理</option>
              <option value="resolved">已处理</option>
              <option value="">全部</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input w-40"
            >
              <option value="">全部类型</option>
              <option value="berth">靠泊</option>
              <option value="payment">费用</option>
              <option value="document">证件</option>
              <option value="supply">补给</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="card p-12 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">暂无提醒</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="card p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <TypeIcon type={alert.type} />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                            <PriorityBadge priority={alert.priority} />
                          </div>
                          <p className="text-gray-500 mt-1">{alert.description}</p>
                          <p className="text-sm text-gray-400 mt-2">
                            截止日期: {alert.due_date}
                          </p>
                        </div>
                        {alert.status === 'pending' && (
                          <button
                            onClick={() => handleMarkResolved(alert.id)}
                            className="btn btn-secondary text-sm"
                          >
                            标记已处理
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
