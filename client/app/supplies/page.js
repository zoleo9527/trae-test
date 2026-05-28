'use client';

import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Package, 
  Plus, 
  Search,
  Clock,
  CheckCircle
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const styles = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
  };
  const labels = {
    completed: '已完成',
    pending: '待处理',
    in_progress: '进行中',
  };
  return (
    <span className={`badge ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

const CategoryBadge = ({ category }) => {
  const styles = {
    food: 'bg-green-100 text-green-800',
    fuel: 'bg-orange-100 text-orange-800',
    material: 'bg-blue-100 text-blue-800',
  };
  const labels = {
    food: '食品',
    fuel: '燃油',
    material: '物料',
  };
  return (
    <span className={`badge ${styles[category] || styles.material}`}>
      {labels[category] || category}
    </span>
  );
};

export default function SuppliesPage() {
  const { hasRole } = useAuth();
  const [supplies, setSupplies] = useState([]);
  const [berths, setBerths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    berth_plan_id: '',
    category: 'food',
    items: '',
    estimated_cost: '',
    delivery_date: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canCreate = hasRole('field_coordinator');

  useEffect(() => {
    fetchData();
  }, [categoryFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      
      const [suppliesData, berthsData] = await Promise.all([
        api.supplies.list(params),
        api.berth.list(),
      ]);
      
      setSupplies(suppliesData);
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
        berth_plan_id: parseInt(formData.berth_plan_id),
        estimated_cost: parseFloat(formData.estimated_cost),
        items: formData.items.split(/[,，]/).map(s => s.trim()).filter(Boolean),
      };
      await api.supplies.create(submitData);
      setShowModal(false);
      setFormData({
        berth_plan_id: '',
        category: 'food',
        items: '',
        estimated_cost: '',
        delivery_date: '',
        notes: '',
      });
      fetchData();
    } catch (err) {
      setError(err.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSupplies = supplies.filter(s => 
    s.ship_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEstimated = supplies.reduce((sum, s) => sum + (s.estimated_cost || 0), 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">补给管理</h1>
            <p className="text-gray-500 mt-1">管理船舶物资和燃油补给</p>
          </div>
          {canCreate && (
            <button 
              onClick={() => setShowModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新增申请
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">待处理申请</p>
                <p className="text-2xl font-bold text-gray-900">
                  {supplies.filter(s => s.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">预估总费用</p>
                <p className="text-2xl font-bold text-gray-900">
                  ¥{totalEstimated.toLocaleString()}
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
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-2xl font-bold text-gray-900">
                  {supplies.filter(s => s.status === 'completed').length}
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
                placeholder="搜索船名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input w-40"
            >
              <option value="">全部类型</option>
              <option value="food">食品</option>
              <option value="fuel">燃油</option>
              <option value="material">物料</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSupplies.map((supply) => (
              <div key={supply.id} className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{supply.ship_name}</h3>
                        <CategoryBadge category={supply.category} />
                        <StatusBadge status={supply.status} />
                      </div>
                      <p className="text-gray-500 mt-1">{supply.items}</p>
                      <div className="flex items-center gap-6 mt-3 text-sm text-gray-500">
                        <span>预估费用: ¥{supply.estimated_cost?.toLocaleString()}</span>
                        <span>交付日期: {supply.delivery_date || '待定'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="新增补给申请">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">补给类型 *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input"
                required
              >
                <option value="food">食品</option>
                <option value="fuel">燃油</option>
                <option value="material">物料</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">预估费用 (元) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.estimated_cost}
                onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                className="input"
                placeholder="请输入预估金额"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">补给明细 *</label>
            <input
              type="text"
              value={formData.items}
              onChange={(e) => setFormData({ ...formData, items: e.target.value })}
              className="input"
              placeholder="用逗号分隔, 如: 蔬菜100kg, 猪肉50kg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">预计交付日期</label>
            <input
              type="date"
              value={formData.delivery_date}
              onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
              className="input"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
              {submitting ? '创建中...' : '创建申请'}
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
