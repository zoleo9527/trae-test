import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  FileCheck,
  RefreshCw,
  Scale,
  AlertTriangle,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import { useApp } from '@/store/AppContext';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function Dashboard() {
  const { state } = useApp();
  const navigate = useNavigate();
  const stats = state.dashboardStats;
  const [activeTab, setActiveTab] = useState<'alerts' | 'pending' | 'activity'>('alerts');

  if (!stats) return <div className="p-8">加载中...</div>;

  const pendingApprovals = state.shippingOrders.filter(o => o.status === 'pending_approval');
  const pendingReceipts = state.receipts.filter(r => r.status === 'pending');
  const pendingReworks = state.reworkOrders.filter(r => ['in_progress', 'submitted'].includes(r.status));
  const openAlerts = state.alerts.filter(a => !a.handled);

  const COLORS = ['#1E40AF', '#10B981', '#F97316', '#EF4444'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">总览看板</h1>
          <p className="text-sm text-gray-500 mt-1">
            {state.currentProject?.name || '全部项目'} · 实时数据汇总
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="待审核发货单"
          value={pendingApprovals.length}
          icon={Clock}
          color="warning"
          onClick={() => navigate('/shipping?filter=pending')}
        />
        <StatCard
          title="待签收回单"
          value={pendingReceipts.length}
          icon={FileCheck}
          color="primary"
          onClick={() => navigate('/receipt?filter=pending')}
        />
        <StatCard
          title="进行中返工"
          value={pendingReworks.length}
          icon={RefreshCw}
          color="danger"
          onClick={() => navigate('/rework?filter=active')}
        />
        <StatCard
          title="待处理预警"
          value={openAlerts.length}
          icon={AlertTriangle}
          color="danger"
          onClick={() => setActiveTab('alerts')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <span className="font-medium text-gray-800">月度发货金额趋势</span>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="card-body h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthlyShippingTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [`¥${value.toLocaleString()}`, '发货金额']}
                  contentStyle={{ borderRadius: '4px', border: '1px solid #E5E7EB' }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#1E40AF"
                  strokeWidth={2}
                  dot={{ fill: '#1E40AF', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <span className="font-medium text-gray-800">材料用量占比</span>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="card-body h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={stats.materialUsage}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.materialUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, '占比']} />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {stats.materialUsage.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('alerts')}
                className={`text-sm font-medium transition-colors ${
                  activeTab === 'alerts' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                预警中心
                {openAlerts.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-danger-100 text-danger-700 text-xs rounded-full">
                    {openAlerts.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`text-sm font-medium transition-colors ${
                  activeTab === 'pending' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                待办事项
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`text-sm font-medium transition-colors ${
                  activeTab === 'activity' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                操作日志
              </button>
            </div>
          </div>
          <div className="card-body max-h-80 overflow-y-auto">
            {activeTab === 'alerts' && (
              <div className="space-y-3">
                {openAlerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success-500" />
                    <p>暂无待处理预警</p>
                  </div>
                ) : (
                  openAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/${alert.targetType}/${alert.targetId}`)}
                    >
                      <div className={`p-2 rounded-lg ${
                        alert.priority === 'high' ? 'bg-danger-100' :
                        alert.priority === 'medium' ? 'bg-warning-100' : 'bg-gray-100'
                      }`}>
                        <AlertCircle className={`w-4 h-4 ${
                          alert.priority === 'high' ? 'text-danger-600' :
                          alert.priority === 'medium' ? 'text-warning-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">{alert.title}</span>
                          {!alert.read && (
                            <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{alert.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: zhCN })}
                        </p>
                      </div>
                      <StatusBadge status={alert.priority} type="priority" />
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'pending' && (
              <div className="space-y-3">
                {pendingApprovals.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/shipping/${order.id}`)}
                  >
                    <div className="p-2 rounded-lg bg-warning-100">
                      <Clock className="w-4 h-4 text-warning-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800">{order.code}</div>
                      <p className="text-xs text-gray-500 mt-1">{order.title}</p>
                      <p className="text-xs text-gray-400 mt-1">待项目负责人审核</p>
                    </div>
                    <StatusBadge status={order.status} type="shipping" />
                  </div>
                ))}

                {pendingReceipts.map((receipt) => {
                  const shipping = state.shippingOrders.find(s => s.id === receipt.shippingId);
                  return (
                    <div
                      key={receipt.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/receipt/${receipt.id}`)}
                    >
                      <div className="p-2 rounded-lg bg-primary-100">
                        <FileCheck className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800">
                          {shipping?.code || '回单'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{shipping?.title}</p>
                        <p className="text-xs text-gray-400 mt-1">待班组长签收</p>
                      </div>
                      <StatusBadge status={receipt.status} type="receipt" />
                    </div>
                  );
                })}

                {pendingApprovals.length === 0 && pendingReceipts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success-500" />
                    <p>暂无待办事项</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-3">
                {state.actionLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {log.userName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{log.userName}</span>
                        <span className="text-xs text-gray-500">{log.action}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{log.detail}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: zhCN })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <span className="font-medium text-gray-800">返工原因统计</span>
          </div>
          <div className="card-body h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.reworkReasons} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#9CA3AF" fontSize={12} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#F97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
