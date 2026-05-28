'use client';

import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../lib/api';
import { 
  Ship, 
  CreditCard, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Users,
  Package,
  TrendingUp,
  DollarSign
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const styles = {
    confirmed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-800',
  };
  const labels = {
    confirmed: '已确认',
    pending: '待处理',
    completed: '已完成',
    paid: '已支付',
    overdue: '已逾期',
    draft: '草稿',
  };
  return (
    <span className={`badge ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

export default function DashboardPage() {
  const [stats, setStats] = useState({
    berthPlans: 0,
    pendingPayments: 0,
    overduePayments: 0,
    totalAmount: 0,
  });
  const [recentBerths, setRecentBerths] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [berths, payments, alertList] = await Promise.all([
          api.berth.list(),
          api.payments.list(),
          api.alerts.list({ status: 'pending' }),
        ]);
        
        setRecentBerths(berths.slice(0, 5));
        setRecentPayments(payments.slice(0, 5));
        setAlerts(alertList.slice(0, 5));
        
        setStats({
          berthPlans: berths.filter(b => b.status !== 'draft').length,
          pendingPayments: payments.filter(p => p.status === 'pending').length,
          overduePayments: payments.filter(p => p.status === 'overdue').length,
          totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        });
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作概览</h1>
          <p className="text-gray-500 mt-1">欢迎回来，这是您的工作面板</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月靠泊计划</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.berthPlans}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Ship className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待处理费用</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingPayments}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已逾期款项</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.overduePayments}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">垫付总金额</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ¥{stats.totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">近期靠泊计划</h2>
              <a href="/berth" className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
                查看全部 <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            <div className="divide-y divide-gray-100">
              {recentBerths.map((berth) => (
                <div key={berth.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{berth.ship_name}</p>
                      <p className="text-sm text-gray-500">
                        {berth.arrival_date?.split(' ')[0]} - {berth.berth_number || '待定'}
                      </p>
                    </div>
                    <StatusBadge status={berth.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">费用垫付记录</h2>
              <a href="/payments" className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
                查看全部 <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            <div className="divide-y divide-gray-100">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{payment.supplier}</p>
                      <p className="text-sm text-gray-500">{payment.ship_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">¥{payment.amount.toLocaleString()}</p>
                      <StatusBadge status={payment.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">待处理提醒</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    alert.priority === 'high' ? 'bg-red-100' : 
                    alert.priority === 'normal' ? 'bg-yellow-100' : 'bg-gray-100'
                  }`}>
                    {alert.type === 'document' && <Users className="w-5 h-5" />}
                    {alert.type === 'payment' && <CreditCard className="w-5 h-5" />}
                    {alert.type === 'supply' && <Package className="w-5 h-5" />}
                    {alert.type === 'berth' && <Ship className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{alert.title}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        alert.priority === 'high' ? 'bg-red-100 text-red-700' : 
                        alert.priority === 'normal' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {alert.priority === 'high' ? '紧急' : alert.priority === 'normal' ? '普通' : '低'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{alert.description}</p>
                    <p className="text-xs text-gray-400 mt-1">截止: {alert.due_date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
