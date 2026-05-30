'use client';

import MultiConditionFilter, { FilterCondition, FilterValues } from '@/components/filters/MultiConditionFilter';
import AppLayout from '@/components/layout/AppLayout';
import DataTable, { Column } from '@/components/tables/DataTable';
import { api } from '@/services/api';
import { PaginatedResponse, Reconciliation, WalletTransaction } from '@/types';
import {
    formatCurrency,
    formatDateTime,
    getReconciliationStatusColor,
    getReconciliationStatusLabel,
    getReconciliationStatusColor as getTxReconStatusColor
} from '@/utils/format';
import {
    AlertTriangle,
    CheckCircle,
    Download,
    Eye,
    FileText,
    Plus,
    RefreshCw,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const filterConditions: FilterCondition[] = [
  { key: 'member_name_like', label: '会员姓名', type: 'text', placeholder: '请输入姓名' },
  { key: 'phone_like', label: '手机号码', type: 'text', placeholder: '请输入手机号' },
  {
    key: 'type',
    label: '交易类型',
    type: 'select',
    options: [
      { label: '充值', value: 'recharge' },
      { label: '消费', value: 'consume' },
      { label: '退款', value: 'refund' },
      { label: '调账', value: 'adjust' },
    ],
  },
  {
    key: 'reconciliation_status',
    label: '对账状态',
    type: 'select',
    options: [
      { label: '待对账', value: 'pending' },
      { label: '已匹配', value: 'matched' },
      { label: '不匹配', value: 'mismatched' },
      { label: '已调账', value: 'adjusted' },
    ],
  },
  { key: 'created_at', label: '交易时间', type: 'dateRange' },
  { key: 'amount', label: '交易金额', type: 'numberRange' },
  {
    key: 'operator_id',
    label: '操作人',
    type: 'select',
    options: [
      { label: '张经理', value: '1' },
      { label: '李教练', value: '2' },
      { label: '赵前台', value: '4' },
    ],
  },
];

export default function ReconciliationPage() {
  const [filters, setFilters] = useState<FilterValues>({});
  const [transactions, setTransactions] = useState<PaginatedResponse<WalletTransaction & { member_name: string; operator_name: string }> | null>(null);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'reconciliation'>('transactions');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [todaySummary, setTodaySummary] = useState<{
    recharge_total: number;
    recharge_gift: number;
    consume_total: number;
    consume_count: number;
    pending_count: number;
    adjusted_count: number;
  } | null>(null);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });

      const res = await api.get<PaginatedResponse<WalletTransaction & { member_name: string; operator_name: string }>>(
        `/wallet/transactions?${params.toString()}`
      );
      if (res.success) {
        setTransactions(res.data || null);
      }
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadReconciliations = async () => {
    try {
      const res = await api.get<{ items: Reconciliation[] }>('/reconciliation?pageSize=20');
      if (res.success) {
        setReconciliations(res.data?.items || []);
      }
    } catch (e) {
      console.error('Load error:', e);
    }
  };

  const loadStatistics = async () => {
    try {
      const res = await api.get<{ todaySummary: { recharge_total: number; recharge_gift: number; consume_total: number; consume_count: number; pending_count: number; adjusted_count: number } }>('/reconciliation/statistics');
      if (res.success && res.data?.todaySummary) {
        setTodaySummary(res.data.todaySummary);
      }
    } catch (e) {
      console.error('Load statistics error:', e);
    }
  };

  useEffect(() => {
    loadStatistics();
    if (activeTab === 'transactions') {
      loadTransactions();
    } else {
      loadReconciliations();
    }
  }, [activeTab]);

  const handleSearch = () => {
    loadTransactions();
  };

  const handleReset = () => {
    setFilters({});
    loadTransactions();
  };

  const handleGenerateReconciliation = async () => {
    if (!confirm(`确定要生成 ${selectedDate} 的对账数据吗？`)) return;
    try {
      await api.post('/reconciliation/generate', { date: selectedDate });
      alert('对账生成成功');
      loadReconciliations();
    } catch (e: any) {
      alert(e.response?.data?.message || '生成失败');
    }
  };

  const handleApproveReconciliation = async (id: number) => {
    if (!confirm('确定审核通过该对账单吗？')) return;
    try {
      await api.put(`/reconciliation/${id}/approve`, { remark: '审核通过' });
      alert('审核通过');
      loadReconciliations();
    } catch (e: any) {
      alert(e.response?.data?.message || '操作失败');
    }
  };

  const handleAdjust = async (transactionId: number) => {
    const amount = prompt('请输入调账金额（正数增加，负数减少）：');
    if (!amount || isNaN(parseFloat(amount))) return;

    const remark = prompt('请输入调账备注：');
    if (!remark) return;

    try {
      await api.post('/reconciliation/adjust', {
        transaction_id: transactionId,
        adjust_amount: parseFloat(amount),
        remark,
      });
      alert('调账成功，操作已记录');
      loadTransactions();
    } catch (e: any) {
      alert(e.response?.data?.message || '调账失败');
    }
  };

  const transactionColumns: Column<WalletTransaction & { member_name: string; operator_name: string }>[] = [
    {
      key: 'id',
      title: '流水号',
      width: '100px',
      render: (row) => <span className="font-mono text-sm">#{row.id.toString().padStart(6, '0')}</span>,
    },
    { key: 'member_name', title: '会员', sortable: true },
    {
      key: 'type',
      title: '类型',
      width: '100px',
      render: (row) => (
        <span className={`badge ${row.type === 'recharge' ? 'badge-green' : 'badge-red'}`}>
          {row.type === 'recharge' ? '充值' : row.type === 'consume' ? '消费' : row.type === 'refund' ? '退款' : '调账'}
        </span>
      ),
    },
    {
      key: 'amount',
      title: '金额',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className={`font-semibold ${row.type === 'recharge' ? 'text-green-600' : 'text-red-600'}`}>
          {row.type === 'recharge' ? '+' : '-'}
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'principal_amount',
      title: '本金',
      align: 'right',
      render: (row) => formatCurrency(row.principal_amount),
    },
    {
      key: 'gift_amount',
      title: '赠送金',
      align: 'right',
      render: (row) => <span className="text-gold-800">{formatCurrency(row.gift_amount)}</span>,
    },
    {
      key: 'reconciliation_status',
      title: '对账状态',
      width: '100px',
      render: (row) => (
        <span className={`badge ${getTxReconStatusColor(row.reconciliation_status)}`}>
          {row.reconciliation_status === 'pending'
            ? '待对账'
            : row.reconciliation_status === 'matched'
            ? '已匹配'
            : row.reconciliation_status === 'mismatched'
            ? '不匹配'
            : '已调账'}
        </span>
      ),
    },
    { key: 'operator_name', title: '操作人', width: '100px' },
    { key: 'created_at', title: '交易时间', sortable: true, render: (row) => formatDateTime(row.created_at) },
    {
      key: 'actions',
      title: '操作',
      width: '150px',
      align: 'center',
      fixed: 'right',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <button className="text-blue-600 hover:text-blue-800 p-1" title="查看详情">
            <Eye size={16} />
          </button>
          {row.reconciliation_status === 'mismatched' || row.reconciliation_status === 'pending' ? (
            <button
              onClick={() => handleAdjust(row.id)}
              className="text-orange-600 hover:text-orange-800 p-1"
              title="调账"
            >
              <RefreshCw size={16} />
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'transactions'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FileText size={18} className="inline mr-2" />
                交易流水
              </button>
              <button
                onClick={() => setActiveTab('reconciliation')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'reconciliation'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <CheckCircle size={18} className="inline mr-2" />
                日终对账
              </button>
            </div>

            {activeTab === 'reconciliation' && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">对账日期</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input-field w-40"
                  />
                </div>
                <button onClick={handleGenerateReconciliation} className="btn-primary flex items-center gap-2">
                  <Plus size={18} />
                  生成对账
                </button>
                <button className="btn-secondary flex items-center gap-2">
                  <Download size={18} />
                  导出报表
                </button>
              </div>
            )}
          </div>

          {activeTab === 'transactions' && (
            <>
              <MultiConditionFilter
                conditions={filterConditions}
                value={filters}
                onChange={setFilters}
                onSearch={handleSearch}
                onReset={handleReset}
              />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700 mb-1">今日充值</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(todaySummary?.recharge_total || 0)}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700 mb-1">今日消费</p>
                  <p className="text-2xl font-bold text-red-700">{formatCurrency(todaySummary?.consume_total || 0)}</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-700 mb-1 flex items-center gap-1">
                    <AlertTriangle size={14} /> 待对账
                  </p>
                  <p className="text-2xl font-bold text-yellow-700">{todaySummary?.pending_count || 0} 笔</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-700 mb-1">已调账</p>
                  <p className="text-2xl font-bold text-purple-700">{todaySummary?.adjusted_count || 0} 笔</p>
                </div>
              </div>

              <DataTable
                columns={transactionColumns}
                data={transactions?.items || []}
                loading={loading}
                pagination={transactions || undefined}
                onPageChange={(page) => {
                  setFilters((f) => ({ ...f, page }));
                  setTimeout(loadTransactions, 0);
                }}
                onPageSizeChange={(pageSize) => {
                  setFilters((f) => ({ ...f, pageSize }));
                  setTimeout(loadTransactions, 0);
                }}
                highlightRows={(row) => row.reconciliation_status === 'mismatched'}
              />
            </>
          )}

          {activeTab === 'reconciliation' && (
            <div className="space-y-4">
              {reconciliations.length > 0 ? (
                reconciliations.map((recon) => (
                  <div key={recon.id} className="border border-gray-200 rounded-xl p-6 hover:border-primary-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-800">{recon.reconciliation_date} 对账单</h4>
                          <span className={`badge ${getReconciliationStatusColor(recon.status)}`}>
                            {getReconciliationStatusLabel(recon.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          生成时间: {formatDateTime(recon.created_at)}
                          {recon.reviewed_at && ` · 审核时间: ${formatDateTime(recon.reviewed_at)}`}
                        </p>
                      </div>
                      {recon.status === 'pending' && (
                        <button
                          onClick={() => handleApproveReconciliation(recon.id)}
                          className="btn-primary"
                        >
                          审核通过
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-1">充值总额</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(recon.total_recharge)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-1">消费总额</p>
                        <p className="text-xl font-bold text-red-600">{formatCurrency(recon.total_consume)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-1">现金应收</p>
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(recon.total_cash)}</p>
                      </div>
                      <div className={`rounded-lg p-4 ${recon.difference !== 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                        <p className="text-sm text-gray-500 mb-1">差额</p>
                        <p className={`text-xl font-bold ${recon.difference !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {recon.difference > 0 ? '+' : ''}
                          {formatCurrency(recon.difference)}
                        </p>
                      </div>
                    </div>

                    {recon.remark && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">备注：</span>
                          {recon.remark}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">暂无对账记录</p>
                  <p className="text-sm text-gray-400 mt-1">点击上方"生成对账"按钮创建对账单</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
