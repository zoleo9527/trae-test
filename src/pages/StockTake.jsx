import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  formatDate,
  formatDateTime,
  STOCK_TAKE_STATUS,
  STOCK_TAKE_TYPES,
  CHECK_RESULTS
} from '../utils/format';

export default function StockTake({ user }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    warehouse_id: '',
    title: '',
    type: 'periodic',
    planned_date: new Date().toISOString().slice(0, 10),
    executor_id: '',
    remark: '',
    product_ids: []
  });
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      
      const [plansData, warehousesData, productsData, usersData] = await Promise.all([
        api.stockTake.list(params),
        api.warehouses.list(),
        api.products.list(),
        user.role === 'manager' ? api.users.list() : Promise.resolve([])
      ]);
      
      setPlans(plansData);
      setWarehouses(warehousesData);
      setProducts(productsData);
      setUsers(usersData);
    } catch (err) {
      console.error('加载盘点数据失败:', err);
    } finally {
      setLoading(false);
    }
  }

  const canCreate = user.role === 'manager';
  const canExecute = user.role === 'manager' || user.role === 'warehouse';

  async function handleCreate() {
    if (!createForm.warehouse_id || !createForm.title) {
      alert('请填写仓库和标题');
      return;
    }
    if (createForm.product_ids.length === 0) {
      alert('请选择要盘点的产品');
      return;
    }

    setCreating(true);
    try {
      const result = await api.stockTake.create(createForm);
      setShowCreateModal(false);
      setCreateForm({
        warehouse_id: '',
        title: '',
        type: 'periodic',
        planned_date: new Date().toISOString().slice(0, 10),
        executor_id: '',
        remark: '',
        product_ids: []
      });
      navigate(`/stock-take/${result.id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleStart(plan) {
    if (!confirm(`确定要开始盘点「${plan.title}」吗？`)) return;
    try {
      await api.stockTake.start(plan.id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleComplete(plan) {
    if (!confirm(`确定要完成盘点「${plan.title}」吗？完成后将无法修改盘点数据。`)) return;
    try {
      await api.stockTake.complete(plan.id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {[
            { value: '', label: '全部' },
            { value: 'pending', label: '待执行' },
            { value: 'in_progress', label: '进行中' },
            { value: 'completed', label: '已完成' }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-tea-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + 新建盘点计划
          </button>
        )}
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>盘点单号</th>
                <th>标题</th>
                <th>类型</th>
                <th>仓库</th>
                <th>状态</th>
                <th>计划日期</th>
                <th>执行时间</th>
                <th>执行人</th>
                <th>盘点品数</th>
                <th>差异数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-400">加载中...</td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-400">暂无盘点计划</td>
                </tr>
              ) : (
                plans.map((plan, idx) => {
                  const status = STOCK_TAKE_STATUS[plan.status];
                  return (
                    <tr key={idx}>
                      <td className="font-mono text-sm text-tea-600">{plan.plan_no}</td>
                      <td className="font-medium text-gray-800">{plan.title}</td>
                      <td>
                        <span className="badge badge-info">{STOCK_TAKE_TYPES[plan.type]}</span>
                      </td>
                      <td className="text-gray-600">{plan.warehouse_name}</td>
                      <td>
                        <span className={`badge ${status.class}`}>{status.label}</span>
                      </td>
                      <td className="text-gray-600">{formatDate(plan.planned_date)}</td>
                      <td className="text-gray-600">
                        {plan.start_time ? formatDateTime(plan.start_time) : '-'}
                      </td>
                      <td className="text-gray-600">{plan.executor_name || '-'}</td>
                      <td className="text-center">{plan.item_count || 0}</td>
                      <td>
                        {plan.shortage_count > 0 ? (
                          <span className="text-red-600 font-medium">{plan.shortage_count} 项差异</span>
                        ) : plan.status === 'completed' ? (
                          <span className="text-green-600">账实相符</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Link
                            to={`/stock-take/${plan.id}`}
                            className="text-tea-600 hover:text-tea-700 text-sm"
                          >
                            查看
                          </Link>
                          {canExecute && plan.status === 'pending' && (
                            <button
                              onClick={() => handleStart(plan)}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              开始
                            </button>
                          )}
                          {canExecute && plan.status === 'in_progress' && (
                            <button
                              onClick={() => handleComplete(plan)}
                              className="text-green-600 hover:text-green-700 text-sm"
                            >
                              完成
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content max-w-3xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold">新建盘点计划</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">仓库 *</label>
                  <select
                    className="input"
                    value={createForm.warehouse_id}
                    onChange={e => setCreateForm({ ...createForm, warehouse_id: e.target.value, product_ids: [] })}
                  >
                    <option value="">请选择仓库</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">盘点类型 *</label>
                  <select
                    className="input"
                    value={createForm.type}
                    onChange={e => setCreateForm({ ...createForm, type: e.target.value })}
                  >
                    <option value="periodic">定期盘点</option>
                    <option value="special">专项盘点</option>
                    <option value="spot_check">抽样盘点</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">盘点标题 *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="例如：2024年5月月末盘点"
                  value={createForm.title}
                  onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">计划日期</label>
                  <input
                    type="date"
                    className="input"
                    value={createForm.planned_date}
                    onChange={e => setCreateForm({ ...createForm, planned_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">执行人</label>
                  <select
                    className="input"
                    value={createForm.executor_id}
                    onChange={e => setCreateForm({ ...createForm, executor_id: e.target.value })}
                  >
                    <option value="">请选择执行人</option>
                    {users.filter(u => u.role === 'warehouse').map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">选择盘点产品 *</label>
                {createForm.warehouse_id ? (
                  <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                    {products.map(p => (
                      <label
                        key={p.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                      >
                        <input
                          type="checkbox"
                          checked={createForm.product_ids.includes(p.id)}
                          onChange={e => {
                            const newIds = e.target.checked
                              ? [...createForm.product_ids, p.id]
                              : createForm.product_ids.filter(id => id !== p.id);
                            setCreateForm({ ...createForm, product_ids: newIds });
                          }}
                          className="rounded text-tea-600 focus:ring-tea-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.sku} · {p.spec}</p>
                        </div>
                        <span className="badge badge-info">{p.category}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">请先选择仓库</p>
                )}
              </div>

              <div>
                <label className="label">备注</label>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="填写盘点说明..."
                  value={createForm.remark}
                  onChange={e => setCreateForm({ ...createForm, remark: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="btn btn-primary"
                disabled={creating}
              >
                {creating ? '创建中...' : '创建盘点计划'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
