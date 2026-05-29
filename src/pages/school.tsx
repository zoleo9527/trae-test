import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { SchoolInvoice, SchoolPartner } from '../types';

export default function SchoolPage() {
  const [invoices, setInvoices] = useState<SchoolInvoice[]>([]);
  const [partners, setPartners] = useState<SchoolPartner[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    schoolPartnerId: '',
  });
  const [detailInvoice, setDetailInvoice] = useState<SchoolInvoice | null>(null);
  const [payAmount, setPayAmount] = useState('');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    const [invoicesData, partnersData, statsData]: any = await Promise.all([
      api.school.getInvoices({ ...filters, pageSize: 100 }),
      api.school.getPartners(),
      api.school.getStats(),
    ]);
    setInvoices(invoicesData.data);
    setPartners(partnersData);
    setStats(statsData);
    setLoading(false);
  };

  const handleMarkPaid = async () => {
    if (!detailInvoice || !payAmount) return;
    await api.school.markPaid(detailInvoice.id, Number(payAmount));
    setDetailInvoice(null);
    setPayAmount('');
    loadData();
  };

  const statusLabels: Record<string, { label: string; class: string }> = {
    draft: { label: '草稿', class: 'bg-gray-100 text-gray-700' },
    sent: { label: '已发送', class: 'bg-blue-100 text-blue-700' },
    paid: { label: '已结清', class: 'bg-green-100 text-green-700' },
    overdue: { label: '已逾期', class: 'bg-red-100 text-red-700' },
    cancelled: { label: '已取消', class: 'bg-gray-100 text-gray-700' },
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学校合作</h1>
          <p className="text-gray-500 mt-1">合作方管理 · 账单回款</p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="text-sm text-gray-500 mb-1">进行中租赁</div>
              <div className="text-2xl font-bold text-blue-600">{stats.activeRentals}</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500 mb-1">待回款总额</div>
              <div className="text-2xl font-bold text-red-600">¥{stats.totalOutstanding.toLocaleString()}</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500 mb-1">逾期账单</div>
              <div className="text-2xl font-bold text-amber-600">{stats.overdueInvoices}</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500 mb-1">已回款</div>
              <div className="text-2xl font-bold text-green-600">¥{stats.thisMonthRevenue.toLocaleString()}</div>
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">合作院校</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partners.map((partner) => (
              <div key={partner.id} className="p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{partner.name}</span>
                  <span className={`badge ${partner.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {partner.status === 'active' ? '合作中' : '已暂停'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <div>联系人: {partner.contactPerson} ({partner.contactPhone})</div>
                  <div>结算周期: {partner.billingCycle === 'monthly' ? '月结' : partner.billingCycle === 'biweekly' ? '双周结' : '周结'}</div>
                  <div>折扣率: {partner.discountRate}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">账单管理</h2>
            <div className="flex gap-3">
              <select
                className="input-field max-w-xs"
                value={filters.schoolPartnerId}
                onChange={(e) => setFilters({ ...filters, schoolPartnerId: e.target.value })}
              >
                <option value="">全部院校</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select
                className="input-field max-w-xs"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">全部状态</option>
                <option value="sent">待付款</option>
                <option value="paid">已结清</option>
                <option value="overdue">已逾期</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📄</div>
              <p className="text-gray-500">暂无账单</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">账单号</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">合作院校</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">账期</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">金额</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">已付/余额</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">到期日</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm text-primary-600">{invoice.invoiceNumber}</td>
                      <td className="py-3 px-4">{invoice.schoolPartnerName}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(invoice.periodStart).toLocaleDateString('zh-CN')} ~ {new Date(invoice.periodEnd).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="py-3 px-4 font-medium">¥{invoice.totalAmount.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <div className="text-green-600">¥{invoice.paidAmount.toLocaleString()}</div>
                        <div className="text-red-600 text-sm">¥{invoice.balance.toLocaleString()}</div>
                      </td>
                      <td className="py-3 px-4 text-sm">{new Date(invoice.dueDate).toLocaleDateString('zh-CN')}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${statusLabels[invoice.status]?.class}`}>
                          {statusLabels[invoice.status]?.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {invoice.balance > 0 && (
                          <button
                            onClick={() => setDetailInvoice(invoice)}
                            className="text-sm text-primary-600 hover:text-primary-700"
                          >
                            登记回款
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {detailInvoice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">登记回款</h3>
                <button onClick={() => setDetailInvoice(null)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">账单</div>
                  <div className="font-medium">{detailInvoice.invoiceNumber}</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span>账单总额</span>
                    <span>¥{detailInvoice.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>已付金额</span>
                    <span>¥{detailInvoice.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-red-600">
                    <span>待收余额</span>
                    <span>¥{detailInvoice.balance.toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">本次回款金额</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="输入金额"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    max={detailInvoice.balance}
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button onClick={() => setDetailInvoice(null)} className="btn-secondary">取消</button>
                  <button onClick={handleMarkPaid} className="btn-primary">确认登记</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
