import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatNumber,
  STOCK_TAKE_STATUS,
  STOCK_TAKE_TYPES,
  CHECK_RESULTS,
  formatRelativeTime
} from '../utils/format';

export default function StockTakeDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editRemark, setEditRemark] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const result = await api.stockTake.get(id);
      setData(result);
    } catch (err) {
      console.error('加载盘点详情失败:', err);
    } finally {
      setLoading(false);
    }
  }

  const canEdit = user.role === 'manager' || user.role === 'warehouse';
  const isInProgress = data?.plan?.status === 'in_progress';

  function handleEditItem(item) {
    setEditingItem(item);
    setEditValue(item.actual_quantity !== null ? String(item.actual_quantity) : '');
    setEditRemark(item.remark || '');
  }

  async function saveEditItem() {
    if (!editingItem) return;
    const actualQty = parseInt(editValue);
    if (isNaN(actualQty) || actualQty < 0) {
      alert('请输入有效的数量');
      return;
    }

    try {
      await api.stockTake.updateItem(id, editingItem.id, {
        actual_quantity: actualQty,
        remark: editRemark
      });
      setEditingItem(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleStart() {
    if (!confirm('确定要开始盘点吗？')) return;
    try {
      await api.stockTake.start(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleComplete() {
    if (!confirm('确定要完成盘点吗？完成后将无法修改盘点数据。')) return;
    try {
      await api.stockTake.complete(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  function createLossReport() {
    const shortageItems = data.items.filter(i => i.check_result === 'shortage');
    if (shortageItems.length === 0) {
      alert('没有盘亏项目，无需创建损耗报告');
      return;
    }
    
    const lossItems = shortageItems.map(item => ({
      product_id: item.product_id,
      quantity: Math.abs(item.difference),
      unit_price: item.unit_price,
      amount: Math.abs(item.difference_amount),
      responsibility: 'company',
      remark: `盘点盘亏: ${item.product_name}`
    }));

    const lossData = {
      warehouse_id: data.plan.warehouse_id,
      title: `${data.plan.title} - 盘亏处理`,
      loss_type: 'inventory_shortage',
      loss_reason: `盘点计划 ${data.plan.plan_no} 盘亏处理`,
      related_stock_take_id: parseInt(id),
      remark: `来自盘点计划: ${data.plan.title}`,
      items: lossItems
    };

    localStorage.setItem('pendingLossReport', JSON.stringify(lossData));
    navigate('/loss-reports?createFromStockTake=1');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-400">
        盘点计划不存在
      </div>
    );
  }

  const { plan, items, relatedLosses, logs } = data;
  const status = STOCK_TAKE_STATUS[plan.status];
  const totalDiff = items.reduce((sum, i) => sum + (i.difference || 0), 0);
  const totalDiffAmount = items.reduce((sum, i) => sum + (i.difference_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/stock-take')}
          className="text-gray-500 hover:text-gray-700"
        >
          ← 返回列表
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-800">{plan.title}</h1>
            <span className={`badge ${status.class}`}>{status.label}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">盘点单号: {plan.plan_no}</p>
        </div>
        <div className="flex gap-2">
          {canEdit && plan.status === 'pending' && (
            <button onClick={handleStart} className="btn btn-primary">
              开始盘点
            </button>
          )}
          {canEdit && plan.status === 'in_progress' && (
            <button onClick={handleComplete} className="btn btn-success">
              完成盘点
            </button>
          )}
          {canEdit && plan.status === 'completed' && totalDiff < 0 && relatedLosses.length === 0 && (
            <button onClick={createLossReport} className="btn btn-primary">
              创建损耗报告
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">仓库</p>
          <p className="text-lg font-semibold text-gray-800">{plan.warehouse_name}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">盘点类型</p>
          <p className="text-lg font-semibold text-gray-800">{STOCK_TAKE_TYPES[plan.type]}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">计划日期</p>
          <p className="text-lg font-semibold text-gray-800">{formatDate(plan.planned_date)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">执行人</p>
          <p className="text-lg font-semibold text-gray-800">{plan.executor_name || '-'}</p>
        </div>
      </div>

      {plan.status !== 'pending' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="text-sm text-gray-500 mb-1">盘点品数</p>
            <p className="text-2xl font-bold text-gray-800">{items.length}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-gray-500 mb-1">账实相符</p>
            <p className="text-2xl font-bold text-green-600">
              {items.filter(i => i.check_result === 'normal').length}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-gray-500 mb-1">盘亏数量</p>
            <p className="text-2xl font-bold text-red-600">
              {totalDiff < 0 ? formatNumber(Math.abs(totalDiff)) : 0}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-gray-500 mb-1">盘亏金额</p>
            <p className="text-2xl font-bold text-red-600">
              {totalDiffAmount < 0 ? formatCurrency(Math.abs(totalDiffAmount)) : formatCurrency(0)}
            </p>
          </div>
        </div>
      )}

      {plan.remark && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-800">盘点说明</h3>
          </div>
          <div className="card-body">
            <p className="text-gray-600">{plan.remark}</p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-800">盘点明细</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>系统库存合计: {formatNumber(items.reduce((s, i) => s + i.system_quantity, 0))}</span>
            <span>|</span>
            <span>实际库存合计: {formatNumber(items.reduce((s, i) => s + (i.actual_quantity || 0), 0))}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>产品信息</th>
                <th>分类</th>
                <th className="text-right">系统库存</th>
                <th className="text-right">实际库存</th>
                <th className="text-right">差异</th>
                <th className="text-right">差异金额</th>
                <th>结果</th>
                <th>备注</th>
                {isInProgress && <th>操作</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const result = item.check_result ? CHECK_RESULTS[item.check_result] : null;
                return (
                  <tr key={idx}>
                    <td>
                      <div className="font-medium text-gray-800">{item.product_name}</div>
                      <div className="text-xs text-gray-500">{item.sku} · {item.spec}</div>
                    </td>
                    <td>
                      <span className="badge badge-info">{item.category}</span>
                    </td>
                    <td className="text-right font-medium text-gray-800">
                      {formatNumber(item.system_quantity)} {item.unit}
                    </td>
                    <td className="text-right">
                      {editingItem?.id === item.id ? (
                        <input
                          type="number"
                          className="input input-sm w-24 text-right"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <span className={`font-medium ${item.actual_quantity !== null ? 'text-gray-800' : 'text-gray-400'}`}>
                          {item.actual_quantity !== null ? `${formatNumber(item.actual_quantity)} ${item.unit}` : '待盘点'}
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      {item.difference !== null ? (
                        <span className={item.difference < 0 ? 'text-red-600 font-medium' : item.difference > 0 ? 'text-yellow-600 font-medium' : 'text-gray-600'}>
                          {item.difference > 0 ? '+' : ''}{formatNumber(item.difference)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="text-right">
                      {item.difference_amount !== null ? (
                        <span className={item.difference_amount < 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {formatCurrency(item.difference_amount)}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      {result && <span className={`badge ${result.class}`}>{result.label}</span>}
                    </td>
                    <td className="max-w-[200px]">
                      {editingItem?.id === item.id ? (
                        <input
                          type="text"
                          className="input input-sm"
                          value={editRemark}
                          onChange={e => setEditRemark(e.target.value)}
                          placeholder="备注"
                        />
                      ) : (
                        <span className="text-sm text-gray-500">{item.remark || '-'}</span>
                      )}
                    </td>
                    {isInProgress && (
                      <td>
                        {editingItem?.id === item.id ? (
                          <div className="flex gap-2">
                            <button onClick={saveEditItem} className="text-green-600 hover:text-green-700 text-sm">
                              保存
                            </button>
                            <button onClick={() => setEditingItem(null)} className="text-gray-500 hover:text-gray-700 text-sm">
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditItem(item)}
                            className="text-tea-600 hover:text-tea-700 text-sm"
                          >
                            录入
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {relatedLosses.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-800">关联损耗报告</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {relatedLosses.map((loss, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Link to={`/loss-reports/${loss.id}`} className="font-medium text-tea-600 hover:text-tea-700">
                      {loss.report_no} - {loss.title}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">
                      上报人: {loss.reporter_name} · {formatDateTime(loss.reported_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">{formatCurrency(loss.total_amount)}</p>
                    <p className="text-sm text-gray-500">{formatNumber(loss.total_quantity)} 件</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-800">操作记录</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-8 h-8 bg-tea-100 rounded-full flex items-center justify-center shrink-0 text-sm">
                    {log.operator_name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">{log.operator_name}</span>
                      <span className="text-gray-500"> {log.content}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(log.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
