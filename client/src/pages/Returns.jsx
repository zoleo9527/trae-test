import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { returnApi } from '../api';

const STATUS_LABELS = {
  pending: '待审批',
  approved: '已批准',
  shipped: '已退货',
  received: '已收货',
  reconciled: '已对账',
  rejected: '已拒绝'
};

const RETURN_REASONS = {
  quality_issue: '质量问题',
  slow_sales: '销售缓慢',
  wrong_shipment: '错发',
  damage: '破损',
  other: '其他'
};

const Returns = () => {
  const { hasRole } = useAuth();
  const [returns, setReturns] = useState([]);
  const [filters, setFilters] = useState({ status: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const res = await returnApi.list(filters);
      setReturns(res.data.data || []);
    } catch (error) {
      console.error('Load returns error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    const qty = prompt('请输入批准数量:');
    const caliber = prompt('请选择口径 (original/channel/finance):', 'channel');
    const notes = prompt('请输入口径说明:');
    
    if (qty && caliber) {
      try {
        await returnApi.approve(id, {
          approvedQuantity: parseInt(qty),
          caliberType: caliber,
          caliberNotes: notes
        });
        loadData();
      } catch (error) {
        alert('审批失败');
      }
    }
  };

  const handleReject = async (id) => {
    if (confirm('确定拒绝该退货申请？')) {
      try {
        await returnApi.reject(id);
        loadData();
      } catch (error) {
        alert('操作失败');
      }
    }
  };

  const handleReceive = async (id) => {
    const qty = prompt('请输入实收数量:');
    if (qty) {
      try {
        await returnApi.receive(id, { receivedQuantity: parseInt(qty) });
        loadData();
      } catch (error) {
        alert('操作失败');
      }
    }
  };

  const handleReconcile = async (id) => {
    if (confirm('确定对账完成？')) {
      try {
        await returnApi.reconcile(id);
        loadData();
      } catch (error) {
        alert('操作失败');
      }
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="alert alert-info">
        <strong>退货口径说明：</strong>
        <br />• 原始口径：按原始申请数量处理
        <br />• 渠道口径：按渠道实际可销售数量处理
        <br />• 财务口径：按财务可入账数量处理
      </div>

      <div className="card">
        <div className="card-header">
          <h3>退货管理列表</h3>
        </div>
        <div className="card-body">
          <div className="filter-bar">
            <select 
              value={filters.status} 
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">全部状态</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>退货单号</th>
                <th>图书</th>
                <th>渠道</th>
                <th>原因</th>
                <th>申请/批准/实收</th>
                <th>口径</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {returns.map(ret => (
                <tr key={ret.id}>
                  <td><code>{ret.returnNo}</code></td>
                  <td>{ret.SampleShipment?.Book?.title}</td>
                  <td>{ret.SampleShipment?.Channel?.name}</td>
                  <td>{RETURN_REASONS[ret.returnReason]}</td>
                  <td>
                    {ret.requestedQuantity} / {ret.approvedQuantity || '-'} / {ret.receivedQuantity || 0}
                  </td>
                  <td>
                    <span className={`status-badge status-${ret.caliberType}`}>
                      {ret.caliberType === 'channel' ? '渠道口径' : ret.caliberType === 'finance' ? '财务口径' : '原始口径'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${ret.status}`}>
                      {STATUS_LABELS[ret.status]}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {hasRole('distribution_specialist') && ret.status === 'pending' && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(ret.id)}>
                            批准
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleReject(ret.id)}>
                            拒绝
                          </button>
                        </>
                      )}
                      {hasRole('distribution_specialist') && ret.status === 'approved' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleReceive(ret.id)}>
                          确认收货
                        </button>
                      )}
                      {hasRole('finance') && ret.status === 'received' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleReconcile(ret.id)}>
                          对账
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Returns;
