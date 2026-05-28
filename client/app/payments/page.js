'use client';

import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  CreditCard, 
  Plus, 
  Search, 
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const styles = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    settled: 'bg-blue-100 text-blue-800',
    overdue: 'bg-red-100 text-red-800',
  };
  const labels = {
    paid: '已支付',
    pending: '待支付',
    settled: '已结清',
    overdue: '已逾期',
  };
  return (
    <span className={`badge ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

export default function PaymentsPage() {
  const { hasRole } = useAuth();
  const [payments, setPayments] = useState([]);
  const [berths, setBerths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showOverdue, setShowOverdue] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    berth_plan_id: '',
    invoice_number: '',
    supplier: '',
    amount: '',
    currency: 'CNY',
    description: '',
    due_date: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canCreate = hasRole('agent_manager');

  useEffect(() => {
    fetchData();
  }, [statusFilter, showOverdue]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (showOverdue) params.overdue = 'true';
      
      const [paymentsData, berthsData] = await Promise.all([
        api.payments.list(params),
        api.berth.list(),
      ]);
      
      setPayments(paymentsData);
      setBerths(berthsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        berth_plan_id: parseInt(formData.berth_plan_id),
      };
      await api.payments.create(submitData);
      setShowModal(false);
      setFormData({
        berth_plan_id: '',
        invoice_number: '',
        supplier: '',
        amount: '',
        currency: 'CNY',
        description: '',
        due_date: '',
      });
      fetchData();
    } catch (err) {
      setError(err.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPayments = payments.filter(p => 
    p.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ship_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPending = payments.filter(p => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + (p.remaining_amount || p.amount || 0), 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">费用垫付与回款</h1>
            <p className="text-gray-500 mt-1">管理垫付费用和回款核对</p>
          </div>
          {canCreate && (
            <button 
              onClick={() => setShowModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新增垫付
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">待回款金额</p>
                <p className="text-2xl font-bold text-gray-900">¥{totalPending.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">已逾期笔数</p>
                <p className="text-2xl font-bold text-red-600">
                  {payments.filter(p => p.status === 'overdue').length}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">已结清</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payments.filter(p => p.status === 'settled').length} 笔
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索供应商或船名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-40"
            >
              <option value="">全部状态</option>
              <option value="pending">待支付</option>
              <option value="paid">已支付</option>
              <option value="settled">已结清</option>
            </select>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOverdue}
                onChange={(e) => setShowOverdue(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm text-gray-700">仅显示逾期</span>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">发票号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">供应商</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">关联船舶</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">已回款</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">待回款</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">到期日</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{payment.invoice_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{payment.supplier}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{payment.ship_name}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ¥{payment.amount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-green-600">
                      ¥{payment.collected_amount?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={payment.remaining_amount > 0 ? 'text-orange-600' : 'text-green-600'}>
                        ¥{payment.remaining_amount?.toLocaleString() || payment.amount?.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {payment.due_date?.split(' ')[0]}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`/payments/${payment.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm flex items-center"
                      >
                        详情 <ChevronRight className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="新增垫付费用">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关联靠泊计划 *</label>
            <select
              value={formData.berth_plan_id}
              onChange={(e) => setFormData({ ...formData, berth_plan_id: e.target.value })}
              className="input"
              required
            >
              <option value="">请选择靠泊计划</option>
              {berths.map(b => (
                <option key={b.id} value={b.id}>{b.ship_name} ({b.arrival_date?.split(' ')[0]})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">发票号 *</label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                className="input"
                placeholder="如: INV-2026-0005"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">供应商 *</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="input"
                placeholder="请输入供应商名称"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">金额 (元) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="input"
                placeholder="请输入金额"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">到期日期 *</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">费用描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows="2"
              placeholder="请输入费用描述"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
              {submitting ? '创建中...' : '创建垫付'}
            </button>
            <button 
              type="button" 
              onClick={() => setShowModal(false)}
              className="btn btn-secondary"
            >
              取消
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
