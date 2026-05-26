import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatNumber,
  LOSS_STATUS,
  LOSS_TYPES,
  RESPONSIBILITY_TYPES
} from '../utils/format';

export default function LossReports({ user }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    warehouse_id: '',
    title: '',
    loss_type: 'damage',
    loss_reason: '',
    remark: '',
    items: []
  });
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [newItem, setNewItem] = useState({
    product_id: '',
    batch_id: '',
    quantity: 1,
    unit_price: 0,
    amount: 0,
    responsibility: 'company',
    responsible_person_id: '',
    remark: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
    
    const pendingData = localStorage.getItem('pendingLossReport');
    if (pendingData && searchParams.get('createFromStockTake')) {
      const parsed = JSON.parse(pendingData);
      setCreateForm(parsed);
      setShowCreateModal(true);
      localStorage.removeItem('pendingLossReport');
    }
  }, [statusFilter, typeFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.loss_type = typeFilter;
      
      const [reportsData, warehousesData, productsData, batchesData, usersData] = await Promise.all([
        api.lossReports.list(params),
        api.warehouses.list(),
        api.products.list(),
        api.inventory.batches(),
        user.role === 'manager' ? api.users.list() : Promise.resolve([])
      ]);
      
      setReports(reportsData);
      setWarehouses(warehousesData);
      setProducts(productsData);
      setBatches(batchesData);
      setUsers(usersData);
    } catch (err) {
      console.error('加载损耗报告失败:', err);
    } finally {
      setLoading(false);
    }
  }

  const canCreate = true;
  const canReview = user.role === 'manager' || user.role === 'warehouse';
  const canApprove = user.role === 'manager';

  function addItem() {
    if (!newItem.product_id || newItem.quantity <= 0) {
      alert('请选择产品并输入数量');
      return;
    }
    
    const product = products.find(p => p.id == newItem.product_id);
    const price = newItem.unit_price || product?.base_price || 0;
    const amount = newItem.quantity * price;
    
    setCreateForm({
      ...createForm,
      items: [...createForm.items, {
        ...newItem,
        unit_price: price,
        amount
      }]
    });
    
    setNewItem({
      product_id: '',
      batch_id: '',
      quantity: 1,
      unit_price: 0,
      amount: 0,
      responsibility: 'company',
      responsible_person_id: '',
      remark: ''
    });
  }

  function removeItem(index) {
    setCreateForm({
      ...createForm,
      items: createForm.items.filter((_, i) => i !== index)
    });
  }

  async function handleCreate() {
    if (!createForm.warehouse_id || !createForm.title) {
      alert('请填写仓库和标题');
      return;
    }
    if (createForm.items.length === 0) {
      alert('请添加损耗明细');
      return;
    }

    setCreating(true);
    try {
      const result = await api.lossReports.create(createForm);
      setShowCreateModal(false);
      setCreateForm({
        warehouse_id: '',
        title: '',
        loss_type: 'damage',
        loss_reason: '',
        remark: '',
        items: []
      });
      navigate(`/loss-reports/${result.id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleReview(report) {
    if (!confirm(`确定要审核通过「${report.title}」吗？`)) return;
    try {
      await api.lossReports.review(report.id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleApprove(report) {
    if (!confirm(`确定要审批通过「${report.title}」吗？审批后将自动扣减库存。`)) return;
    try {
      await api.lossReports.approve(report.id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  const totalQuantity = createForm.items.reduce((s, i) => s + i.quantity, 0);
  const totalAmount = createForm.items.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {[
            { value: '', label: '全部' },
            { value: 'pending', label: '待审核' },
            { value: 'reviewed', label: '已审核' },
            { value: 'approved', label: '已审批' }
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

        <div className="flex gap-3 items-center">
          <select
            className="input input-sm w-40"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="">全部类型</option>
            {Object.entries(LOSS_TYPES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              + 新建损耗报告
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>报告编号</th>
                <th>标题</th>
                <th>类型</th>
                <th>仓库</th>
                <th>状态</th>
                <th className="text-right">损耗数量</th>
                <th className="text-right">损耗金额</th>
                <th>上报人</th>
                <th>上报时间</th>
                <th>关联盘点</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-400">加载中...</td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-400">暂无损耗报告</td>
                </tr>
              ) : (
                reports.map((report, idx) => {
                  const status = LOSS_STATUS[report.status];
                  return (
                    <tr key={idx}>
                      <td className="font-mono text-sm text-tea-600">{report.report_no}</td>
                      <td className="font-medium text-gray-800">{report.title}</td>
                      <td>
                        <span className="badge badge-danger">{LOSS_TYPES[report.loss_type]}</span>
                      </td>
                      <td className="text-gray-600">{report.warehouse_name}</td>
                      <td>
                        <span className={`badge ${status.class}`}>{status.label}</span>
                      </td>
                      <td className="text-right font-medium text-red-600">
                        {formatNumber(report.total_quantity)} 件
                      </td>
                      <td className="text-right font-medium text-red-600">
                        {formatCurrency(report.total_amount)}
                      </td>
                      <td className="text-gray-600">{report.reporter_name}</td>
                      <td className="text-gray-600">{formatDateTime(report.reported_at)}</td>
                      <td>
                        {report.related_plan_no ? (
                          <Link to={`/stock-take/${report.related_stock_take_id}`} className="text-tea-600 hover:text-tea-700 text-sm">
                            {report.related_plan_no}
                          </Link>
                        ) : '-'}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Link
                            to={`/loss-reports/${report.id}`}
                            className="text-tea-600 hover:text-tea-700 text-sm"
                          >
                            查看
                          </Link>
                          {canReview && report.status === 'pending' && (
                            <button
                              onClick={() => handleReview(report)}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              审核
                            </button>
                          )}
                          {canApprove && report.status === 'reviewed' && (
                            <button
                              onClick={() => handleApprove(report)}
                              className="text-green-600 hover:text-green-700 text-sm"
                            >
                              审批
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
          <div className="modal-content max-w-4xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold">新建损耗报告</h3>
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
                    onChange={e => setCreateForm({ ...createForm, warehouse_id: e.target.value })}
                  >
                    <option value="">请选择仓库</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">损耗类型 *</label>
                  <select
                    className="input"
                    value={createForm.loss_type}
                    onChange={e => setCreateForm({ ...createForm, loss_type: e.target.value })}
                  >
                    {Object.entries(LOSS_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">报告标题 *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="例如：5月仓储破损处理"
                  value={createForm.title}
                  onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                />
              </div>

              <div>
                <label className="label">损耗原因</label>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="详细描述损耗原因..."
                  value={createForm.loss_reason}
                  onChange={e => setCreateForm({ ...createForm, loss_reason: e.target.value })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="label mb-0">损耗明细 *</label>
                  <div className="text-sm text-gray-500">
                    共 <span className="font-medium text-red-600">{totalQuantity}</span> 件，
                    金额 <span className="font-medium text-red-600">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {createForm.items.length > 0 && (
                  <div className="border border-gray-200 rounded-lg mb-4 overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>产品</th>
                          <th>批次</th>
                          <th className="text-right">数量</th>
                          <th className="text-right">单价</th>
                          <th className="text-right">金额</th>
                          <th>责任</th>
                          <th>责任人</th>
                          <th>备注</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {createForm.items.map((item, idx) => {
                          const product = products.find(p => p.id == item.product_id);
                          const batch = batches.find(b => b.id == item.batch_id);
                          const respType = RESPONSIBILITY_TYPES[item.responsibility];
                          const respUser = users.find(u => u.id == item.responsible_person_id);
                          return (
                            <tr key={idx}>
                              <td className="text-sm">{product?.name || '-'}</td>
                              <td className="text-sm font-mono">{batch?.batch_no || '-'}</td>
                              <td className="text-right text-sm">{item.quantity}</td>
                              <td className="text-right text-sm">{formatCurrency(item.unit_price)}</td>
                              <td className="text-right text-sm font-medium">{formatCurrency(item.amount)}</td>
                              <td>
                                <span className={`badge ${respType?.class || 'badge-gray'}`}>
                                  {respType?.label || item.responsibility}
                                </span>
                              </td>
                              <td className="text-sm">{respUser?.name || '-'}</td>
                              <td className="text-sm text-gray-500 max-w-[120px] truncate">{item.remark || '-'}</td>
                              <td>
                                <button
                                  onClick={() => removeItem(idx)}
                                  className="text-red-500 hover:text-red-700 text-sm"
                                >
                                  删除
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="label">产品</label>
                    <select
                      className="input input-sm"
                      value={newItem.product_id}
                      onChange={e => {
                        const product = products.find(p => p.id == e.target.value);
                        setNewItem({
                          ...newItem,
                          product_id: e.target.value,
                          unit_price: product?.base_price || 0,
                          amount: newItem.quantity * (product?.base_price || 0)
                        });
                      }}
                    >
                      <option value="">选择产品</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">批次</label>
                    <select
                      className="input input-sm"
                      value={newItem.batch_id}
                      onChange={e => setNewItem({ ...newItem, batch_id: e.target.value })}
                    >
                      <option value="">选择批次(可选)</option>
                      {batches
                        .filter(b => !newItem.product_id || b.product_id == newItem.product_id)
                        .map(b => (
                          <option key={b.id} value={b.id}>{b.batch_no} (剩{b.available_quantity})</option>
                        ))
                      }
                    </select>
                  </div>
                  <div>
                    <label className="label">数量</label>
                    <input
                      type="number"
                      className="input input-sm"
                      min="1"
                      value={newItem.quantity}
                      onChange={e => {
                        const qty = parseInt(e.target.value) || 0;
                        setNewItem({
                          ...newItem,
                          quantity: qty,
                          amount: qty * newItem.unit_price
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="label">单价</label>
                    <input
                      type="number"
                      className="input input-sm"
                      min="0"
                      step="0.01"
                      value={newItem.unit_price}
                      onChange={e => {
                        const price = parseFloat(e.target.value) || 0;
                        setNewItem({
                          ...newItem,
                          unit_price: price,
                          amount: newItem.quantity * price
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="label">责任归属</label>
                    <select
                      className="input input-sm"
                      value={newItem.responsibility}
                      onChange={e => setNewItem({ ...newItem, responsibility: e.target.value })}
                    >
                      {Object.entries(RESPONSIBILITY_TYPES).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">责任人</label>
                    <select
                      className="input input-sm"
                      value={newItem.responsible_person_id}
                      onChange={e => setNewItem({ ...newItem, responsible_person_id: e.target.value })}
                    >
                      <option value="">选择责任人(可选)</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="label">备注</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input input-sm flex-1"
                        placeholder="损耗说明"
                        value={newItem.remark}
                        onChange={e => setNewItem({ ...newItem, remark: e.target.value })}
                      />
                      <button onClick={addItem} className="btn btn-primary btn-sm">
                        添加
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="label">备注</label>
                <textarea
                  className="input min-h-[60px]"
                  placeholder="其他说明..."
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
                {creating ? '提交中...' : '提交损耗报告'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
