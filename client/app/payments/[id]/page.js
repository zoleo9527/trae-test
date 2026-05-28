'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Layout from '../../../components/Layout';
import { api } from '../../../lib/api';
import { 
  CreditCard, 
  ArrowLeft,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Plus,
  Send,
  Ship
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

export default function PaymentDetailPage() {
  const params = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [collectionData, setCollectionData] = useState({
    amount: '',
    received_date: '',
    payer: '',
    payment_method: 'bank_transfer',
    reference_number: '',
    notes: '',
  });

  useEffect(() => {
    fetchPaymentDetail();
  }, [params.id]);

  const fetchPaymentDetail = async () => {
    try {
      setLoading(true);
      const data = await api.payments.get(params.id);
      setPayment(data);
      if (data.remaining_amount > 0) {
        setCollectionData(prev => ({ ...prev, amount: data.remaining_amount.toString() }));
      }
    } catch (err) {
      console.error('Failed to fetch payment detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await api.payments.addCommunication(params.id, {
        subject: '回款沟通',
        content: newMessage,
        direction: 'external',
      });
      setNewMessage('');
      fetchPaymentDetail();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleAddCollection = async (e) => {
    e.preventDefault();
    try {
      await api.payments.addCollection(params.id, {
        ...collectionData,
        amount: parseFloat(collectionData.amount),
      });
      setShowCollectionForm(false);
      setCollectionData({
        amount: '',
        received_date: '',
        payer: '',
        payment_method: 'bank_transfer',
        reference_number: '',
        notes: '',
      });
      fetchPaymentDetail();
    } catch (err) {
      console.error('Failed to add collection:', err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </Layout>
    );
  }

  if (!payment) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">记录不存在</div>
        </div>
      </Layout>
    );
  }

  const collectedTotal = payment.collections?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
  const remainingAmount = payment.amount - collectedTotal;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <a href="/payments" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </a>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{payment.invoice_number}</h1>
              <StatusBadge status={payment.status} />
            </div>
            <p className="text-gray-500 mt-1">{payment.supplier}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">垫付金额</p>
                <p className="text-xl font-bold text-gray-900">¥{payment.amount.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">已回款</p>
                <p className="text-xl font-bold text-green-600">¥{collectedTotal.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                remainingAmount > 0 ? 'bg-orange-100' : 'bg-gray-100'
              }`}>
                <Clock className={`w-5 h-5 ${remainingAmount > 0 ? 'text-orange-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">待回款</p>
                <p className={`text-xl font-bold ${remainingAmount > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                  ¥{remainingAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                payment.status === 'overdue' ? 'bg-red-100' : 'bg-purple-100'
              }`}>
                {payment.status === 'overdue' ? (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                ) : (
                  <Clock className="w-5 h-5 text-purple-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">到期日</p>
                <p className={`text-lg font-bold ${payment.status === 'overdue' ? 'text-red-600' : 'text-gray-900'}`}>
                  {payment.due_date?.split(' ')[0]}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">基本信息</h3>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">关联船舶</span>
                <span className="font-medium flex items-center gap-2">
                  <Ship className="w-4 h-4" />
                  {payment.ship_name}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">供应商</span>
                <span className="font-medium">{payment.supplier}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">费用描述</span>
                <span className="font-medium">{payment.description}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">支付日期</span>
                <span className="font-medium">{payment.paid_date?.split(' ')[0] || '未支付'}</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">回款记录</h3>
              {remainingAmount > 0 && (
                <button
                  onClick={() => setShowCollectionForm(!showCollectionForm)}
                  className="btn btn-secondary text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  登记回款
                </button>
              )}
            </div>

            {showCollectionForm && (
              <form onSubmit={handleAddCollection} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">回款金额</label>
                    <input
                      type="number"
                      value={collectionData.amount}
                      onChange={(e) => setCollectionData({ ...collectionData, amount: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">到账日期</label>
                    <input
                      type="date"
                      value={collectionData.received_date}
                      onChange={(e) => setCollectionData({ ...collectionData, received_date: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">付款方</label>
                    <input
                      type="text"
                      value={collectionData.payer}
                      onChange={(e) => setCollectionData({ ...collectionData, payer: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">支付方式</label>
                    <select
                      value={collectionData.payment_method}
                      onChange={(e) => setCollectionData({ ...collectionData, payment_method: e.target.value })}
                      className="input"
                    >
                      <option value="bank_transfer">银行转账</option>
                      <option value="check">支票</option>
                      <option value="cash">现金</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">参考号</label>
                  <input
                    type="text"
                    value={collectionData.reference_number}
                    onChange={(e) => setCollectionData({ ...collectionData, reference_number: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">确认回款</button>
                  <button
                    type="button"
                    onClick={() => setShowCollectionForm(false)}
                    className="btn btn-secondary"
                  >
                    取消
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {payment.collections?.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无回款记录</p>
              ) : (
                payment.collections?.map((col) => (
                  <div key={col.id} className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-700" />
                        </div>
                        <div>
                          <p className="font-medium text-green-800">¥{col.amount.toLocaleString()}</p>
                          <p className="text-xs text-green-600">{col.payer} · {col.received_date}</p>
                        </div>
                      </div>
                      {col.reference_number && (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          {col.reference_number}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">沟通记录</h3>
          <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
            {payment.communications?.map((comm) => (
              <div key={comm.id} className={`p-4 rounded-lg ${
                comm.direction === 'external' ? 'bg-orange-50 border border-orange-100' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comm.from_name}</span>
                    {comm.direction === 'external' && (
                      <span className="text-xs px-2 py-0.5 bg-orange-200 text-orange-800 rounded">外部</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{comm.created_at}</span>
                </div>
                {comm.subject && <p className="text-sm font-medium mb-1">{comm.subject}</p>}
                <p className="text-gray-700">{comm.content}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="记录供应商沟通内容..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="input flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button onClick={handleSendMessage} className="btn btn-primary">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
