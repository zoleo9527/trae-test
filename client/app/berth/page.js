'use client';

import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Ship, 
  Plus, 
  Search, 
  ChevronRight,
  Clock,
  FileText
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const styles = {
    confirmed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    draft: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  const labels = {
    confirmed: '已确认',
    pending: '待确认',
    completed: '已完成',
    draft: '草稿',
    cancelled: '已取消',
  };
  return (
    <span className={`badge ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

export default function BerthPage() {
  const { user, hasRole } = useAuth();
  const [berths, setBerths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    ship_name: '',
    arrival_date: '',
    departure_date: '',
    berth_number: '',
    purpose: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canCreate = hasRole('agent_manager', 'field_coordinator');

  useEffect(() => {
    fetchBerths();
  }, [statusFilter]);

  const fetchBerths = async () => {
    try {
      setLoading(true);
      const data = await api.berth.list({ status: statusFilter });
      setBerths(data);
    } catch (err) {
      console.error('Failed to fetch berths:', err);
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
        ship_name: formData.ship_name,
        arrival_date: formData.arrival_date,
        departure_date: formData.departure_date,
        berth_number: formData.berth_number,
        purpose: formData.purpose,
        agent_id: user?.id,
      };
      await api.berth.create(submitData);
      setShowModal(false);
      setFormData({
        ship_name: '',
        arrival_date: '',
        departure_date: '',
        berth_number: '',
        purpose: '',
      });
      fetchBerths();
    } catch (err) {
      setError(err.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBerths = berths.filter(b => 
    b.ship_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">靠泊计划</h1>
            <p className="text-gray-500 mt-1">管理船舶靠泊安排和相关服务</p>
          </div>
          {canCreate && (
            <button 
              onClick={() => setShowModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新建计划
            </button>
          )}
        </div>

        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索船名..."
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
              <option value="pending">待确认</option>
              <option value="confirmed">已确认</option>
              <option value="completed">已完成</option>
              <option value="draft">草稿</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBerths.map((berth) => (
              <a
                key={berth.id}
                href={`/berth/${berth.id}`}
                className="card p-6 hover:shadow-md transition-shadow cursor-pointer block"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <Ship className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{berth.ship_name}</h3>
                        <StatusBadge status={berth.status} />
                      </div>
                      <p className="text-gray-500 mt-1">{berth.purpose}</p>
                      <div className="flex items-center gap-6 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          到港: {berth.arrival_date?.split(' ')[0]}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          泊位: {berth.berth_number || '待定'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="新建靠泊计划">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">船名 *</label>
            <input
              type="text"
              value={formData.ship_name}
              onChange={(e) => setFormData({ ...formData, ship_name: e.target.value })}
              className="input"
              placeholder="请输入船名"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">到港日期 *</label>
              <input
                type="datetime-local"
                value={formData.arrival_date}
                onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">离港日期</label>
              <input
                type="datetime-local"
                value={formData.departure_date}
                onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">泊位号</label>
              <input
                type="text"
                value={formData.berth_number}
                onChange={(e) => setFormData({ ...formData, berth_number: e.target.value })}
                className="input"
                placeholder="如: A-01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">靠泊目的 *</label>
              <select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="input"
                required
              >
                <option value="">请选择</option>
                <option value="集装箱装卸">集装箱装卸</option>
                <option value="散货装卸">散货装卸</option>
                <option value="燃油补给">燃油补给</option>
                <option value="船员换班">船员换班</option>
                <option value="检修">检修</option>
                <option value="其他">其他</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
              {submitting ? '创建中...' : '创建计划'}
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
