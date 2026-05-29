import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

interface Stats {
  activeRentals: number;
  pendingReturns: number;
  pendingRepairs: number;
  inProgressRepairs: number;
  thisMonthRentals: number;
  totalPartsCost: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [schoolStats, setSchoolStats] = useState<any>(null);
  const { hasRole } = useAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [dashboardData, schoolData] = await Promise.all([
      api.dashboard.getStats(),
      hasRole('store_owner', 'admin') ? api.school.getStats() : Promise.resolve(null),
    ]);
    setStats(dashboardData as Stats);
    setSchoolStats(schoolData);
  };

  const statCards = stats
    ? [
        {
          label: '进行中租赁',
          value: stats.activeRentals,
          icon: '🎻',
          color: 'bg-blue-50 text-blue-600',
          href: '/rentals?status=active',
        },
        {
          label: '待复核归还',
          value: stats.pendingReturns,
          icon: '✅',
          color: 'bg-amber-50 text-amber-600',
          href: '/review',
          highlight: stats.pendingReturns > 0,
        },
        {
          label: '待处理维修',
          value: stats.pendingRepairs,
          icon: '⏳',
          color: 'bg-orange-50 text-orange-600',
          href: '/repairs?status=pending',
        },
        {
          label: '维修中',
          value: stats.inProgressRepairs,
          icon: '🔧',
          color: 'bg-green-50 text-green-600',
          href: '/repairs?status=in_progress',
        },
      ]
    : [];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
          <p className="text-gray-500 mt-1">今日工作概览</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className={`card hover:shadow-md transition-shadow relative ${
                card.highlight ? 'ring-2 ring-amber-400' : ''
              }`}
            >
              {card.highlight && (
                <span className="absolute top-2 right-2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
              )}
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${card.color}`}>
                  <span className="text-2xl">{card.icon}</span>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {card.value}
                  </div>
                  <div className="text-sm text-gray-500">{card.label}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {hasRole('store_owner', 'admin') && schoolStats && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">🏫 学校合作概览</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {schoolStats.activeRentals}
                </div>
                <div className="text-sm text-blue-600">进行中租赁</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  ¥{schoolStats.totalOutstanding.toLocaleString()}
                </div>
                <div className="text-sm text-red-600">待回款</div>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">
                  {schoolStats.overdueInvoices}
                </div>
                <div className="text-sm text-amber-600">逾期账单</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  ¥{schoolStats.thisMonthRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-green-600">已回款</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">📋 快捷入口</h2>
            <div className="space-y-3">
              <Link
                href="/review"
                className="flex items-center gap-3 p-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
              >
                <span className="text-xl">✅</span>
                <div>
                  <div className="font-medium text-amber-700">归还复核</div>
                  <div className="text-sm text-amber-600">处理押金结算和损坏判责</div>
                </div>
              </Link>
              <Link
                href="/repairs"
                className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <span className="text-xl">🔧</span>
                <div>
                  <div className="font-medium text-green-700">维修管理</div>
                  <div className="text-sm text-green-600">记录维修过程和备件消耗</div>
                </div>
              </Link>
              {hasRole('store_owner', 'admin') && (
                <Link
                  href="/school"
                  className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <span className="text-xl">🏫</span>
                  <div>
                    <div className="font-medium text-purple-700">学校合作</div>
                    <div className="text-sm text-purple-600">管理账单和回款</div>
                  </div>
                </Link>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">💡 操作指引</h2>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                  1
                </span>
                <p>租赁顾问在客户还琴时，先登记归还并记录乐器状态</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                  2
                </span>
                <p>维修师傅检查乐器，填写损坏评估和维修方案</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                  3
                </span>
                <p>门店老板复核损坏判责，确认押金扣款金额</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                  4
                </span>
                <p>维修完成后自动结算，备件消耗直接关联成本</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
