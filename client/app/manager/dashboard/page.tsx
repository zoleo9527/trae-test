'use client';

import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/services/api';
import { DashboardOverview, Exception, Reconciliation, TrendData } from '@/types';
import { formatCurrency, getExceptionStatusColor, getExceptionStatusLabel, getReconciliationStatusColor, getReconciliationStatusLabel } from '@/utils/format';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Calendar,
    FileText,
    Target,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [recentReconciliations, setRecentReconciliations] = useState<Reconciliation[]>([]);
  const [pendingExceptions, setPendingExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [overviewRes, trendsRes, reconRes, excepRes] = await Promise.all([
        api.get<DashboardOverview>('/dashboard/overview'),
        api.get<TrendData[]>('/dashboard/trends?days=7'),
        api.get<{ items: Reconciliation[] }>('/reconciliation?pageSize=5'),
        api.get<{ items: Exception[] }>('/exceptions?status=pending&pageSize=5'),
      ]);

      if (overviewRes.success) setOverview(overviewRes.data || null);
      if (trendsRes.success) setTrends(trendsRes.data || []);
      if (reconRes.success) setRecentReconciliations(reconRes.data?.items || []);
      if (excepRes.success) setPendingExceptions(excepRes.data?.items || []);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const statCards = overview
    ? [
        {
          label: '今日营收',
          value: formatCurrency(overview.today_revenue),
          icon: <TrendingUp size={24} />,
          color: 'bg-green-500',
          bgColor: 'bg-green-50',
          textColor: 'text-green-600',
          trend: '+12.5%',
          trendUp: true,
        },
        {
          label: '储值总余额',
          value: formatCurrency(overview.total_wallet_balance),
          icon: <Wallet size={24} />,
          color: 'bg-blue-500',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-600',
          trend: '+5.2%',
          trendUp: true,
        },
        {
          label: '今日到场',
          value: `${overview.today_bookings} 人次`,
          icon: <Calendar size={24} />,
          color: 'bg-purple-500',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-600',
          trend: '+3',
          trendUp: true,
        },
        {
          label: '球道利用率',
          value: `${overview.bay_utilization}%`,
          icon: <Target size={24} />,
          color: 'bg-gold-800',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-600',
          trend: '-2%',
          trendUp: false,
        },
      ]
    : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, index) => (
            <div key={index} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center ${card.textColor}`}>
                  {card.icon}
                </div>
                <span
                  className={`flex items-center gap-1 text-sm font-medium ${
                    card.trendUp ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {card.trendUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {card.trend}
                </span>
              </div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-primary-900 to-primary-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">近7天收支趋势</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-400"></span> 充值
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-400"></span> 消费
                </span>
              </div>
            </div>
            <div className="flex items-end justify-between h-48 gap-2">
              {trends.map((day, index) => {
                const maxValue = Math.max(...trends.map((t) => Math.max(t.recharge, t.consume)), 1000);
                const rechargeHeight = (day.recharge / maxValue) * 100;
                const consumeHeight = (day.consume / maxValue) * 100;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end justify-center gap-1 h-40">
                      <div
                        className="w-3 bg-green-400 rounded-t transition-all duration-500"
                        style={{ height: `${rechargeHeight}%` }}
                      ></div>
                      <div
                        className="w-3 bg-red-400 rounded-t transition-all duration-500"
                        style={{ height: `${consumeHeight}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-primary-200">{day.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{overview?.pending_exceptions || 0}</p>
                  <p className="text-sm text-yellow-600">待处理异常</p>
                </div>
              </div>
              <button className="w-full btn-gold text-sm py-2">立即处理</button>
            </div>

            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{overview?.pending_reconciliation || 0}</p>
                  <p className="text-sm text-blue-600">待审核对账</p>
                </div>
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg transition-colors">
                去审核
              </button>
            </div>

            <div className="col-span-2 card">
              <h4 className="font-semibold text-gray-800 mb-3">储值余额分布</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">本金余额</span>
                    <span className="font-medium">{formatCurrency(overview?.total_principal_balance || 0)}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 rounded-full" style={{ width: `${overview && overview.total_wallet_balance > 0 ? Math.round((overview.total_principal_balance / overview.total_wallet_balance) * 100) : 0}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">赠送金余额</span>
                    <span className="font-medium">{formatCurrency(overview?.total_gift_balance || 0)}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gold-800 rounded-full" style={{ width: `${overview && overview.total_wallet_balance > 0 ? Math.round((overview.total_gift_balance / overview.total_wallet_balance) * 100) : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">最近对账记录</h3>
              <button className="text-sm text-primary-600 hover:text-primary-700">查看全部</button>
            </div>
            <div className="space-y-3">
              {recentReconciliations.map((recon) => (
                <div key={recon.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{recon.reconciliation_date}</p>
                    <p className="text-sm text-gray-500">
                      充值: {formatCurrency(recon.total_recharge)} · 消费: {formatCurrency(recon.total_consume)}
                    </p>
                  </div>
                  <span className={`badge ${getReconciliationStatusColor(recon.status)}`}>
                    {getReconciliationStatusLabel(recon.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">待处理异常</h3>
              <button className="text-sm text-primary-600 hover:text-primary-700">查看全部</button>
            </div>
            <div className="space-y-3">
              {pendingExceptions.length > 0 ? (
                pendingExceptions.map((ex) => (
                  <div key={ex.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-red-800">{ex.title}</span>
                      <span className={`badge ${getExceptionStatusColor(ex.status)}`}>
                        {getExceptionStatusLabel(ex.status)}
                      </span>
                    </div>
                    <p className="text-sm text-red-600 line-clamp-2">{ex.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">暂无待处理异常</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
