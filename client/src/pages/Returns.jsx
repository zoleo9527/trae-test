import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [returns, setReturns] = useState([]);
  const [filters, setFilters] = useState({ status: '' });
  const [loading, setLoading] = useState(true);
  const [showCaliberModal, setShowCaliberModal] = useState(false);
  const [targetReturn, setTargetReturn] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [caliberForm, setCaliberForm] = useState({
    approvedQuantity: 0,
    caliberType: 'channel',
    caliberNotes: ''
  });
  const [actionLoading, setActionLoading] = useState(false);
  const targetRowRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [filters]);

  useEffect(() => {
    if (returns.length > 0 && !loading) {
      const params = new URLSearchParams(location.search);
      const returnId = params.get('returnId');
      const action = params.get('action');
      
      if (returnId) {
        const target = returns.find(r => r.id === returnId);
        if (target) {
          setTargetReturn(target);
          setExpandedRow(returnId);
          setCaliberForm(prev => ({
            ...prev,
            approvedQuantity: target.approvedQuantity || target.requestedQuantity,
            caliberType: target.caliberType || 'channel',
            caliberNotes: target.caliberNotes || ''
          }));
          if (action === 'caliber') {
            setShowCaliberModal(true);
          }
          setTimeout(() => {
            targetRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }
    }
  }, [returns, loading, location.search]);

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

  const handleUpdateCaliber = async (e) => {
    e.preventDefault();
    if (!targetReturn) return;
    
    setActionLoading(true);
    try {
      await returnApi.updateCaliber(targetReturn.id, {
        approvedQuantity: parseInt(caliberForm.approvedQuantity),
        caliberType: caliberForm.caliberType,
        caliberNotes: caliberForm.caliberNotes
      });
      setShowCaliberModal(false);
      loadData();
      alert('口径更新成功');
    } catch (error) {
      alert('更新失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setActionLoading(false);
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
                <React.Fragment key={ret.id}>
                  <tr 
                    ref={targetReturn?.id === ret.id ? targetRowRef : null}
                    style={{ 
                      background: targetReturn?.id === ret.id ? '#fef3c7' : 'inherit',
                      transition: 'background 0.3s',
                      cursor: 'pointer'
                    }}
                    onClick={() => setExpandedRow(expandedRow === ret.id ? null : ret.id)}
                  >
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
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        {expandedRow === ret.id ? '▼ 收起' : '▶ 展开'}
                      </span>
                    </td>
                  </tr>
                  {expandedRow === ret.id && (
                    <tr style={{ background: '#f9fafb' }}>
                      <td colSpan="8" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                          <div>
                            <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>退货详情</h4>
                            <div className="detail-item">
                              <label>申请日期</label>
                              <div className="value">{new Date(ret.requestDate).toLocaleDateString()}</div>
                            </div>
                            <div className="detail-item">
                              <label>退货原因</label>
                              <div className="value">{RETURN_REASONS[ret.returnReason]}</div>
                            </div>
                            <div className="detail-item">
                              <label>详细说明</label>
                              <div className="value">{ret.returnReasonDetail || '-'}</div>
                            </div>
                            <div className="detail-item">
                              <label>口径说明</label>
                              <div className="value" style={{ color: ret.caliberType !== 'original' ? '#f59e0b' : 'inherit' }}>
                                {ret.caliberNotes || '-'}
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>操作面板</h4>
                            <div className="action-buttons" style={{ flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                              {(hasRole('distribution_specialist') || hasRole('finance')) && ret.status === 'pending' && (
                                <>
                                  <button className="btn btn-success btn-sm" onClick={(e) => { e.stopPropagation(); handleApprove(ret.id); }}>
                                    批准退货
                                  </button>
                                  <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); handleReject(ret.id); }}>
                                    拒绝退货
                                  </button>
                                </>
                              )}
                              {(hasRole('distribution_specialist') || hasRole('finance')) && ret.status !== 'rejected' && ret.status !== 'reconciled' && (
                                <button 
                                  className="btn btn-warning btn-sm" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTargetReturn(ret);
                                    setCaliberForm(prev => ({
                                      ...prev,
                                      approvedQuantity: ret.approvedQuantity || ret.requestedQuantity,
                                      caliberType: ret.caliberType,
                                      caliberNotes: ret.caliberNotes || ''
                                    }));
                                    setShowCaliberModal(true);
                                  }}
                                >
                                  {ret.caliberType === 'original' ? '设置口径' : '调整口径'}
                                </button>
                              )}
                              {hasRole('distribution_specialist') && ret.status === 'approved' && (
                                <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); handleReceive(ret.id); }}>
                                  确认收货
                                </button>
                              )}
                              {hasRole('finance') && ret.status === 'received' && (
                                <button className="btn btn-success btn-sm" onClick={(e) => { e.stopPropagation(); handleReconcile(ret.id); }}>
                                  完成对账
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCaliberModal && targetReturn && (
        <div className="modal-overlay" onClick={() => setShowCaliberModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>调整退货口径</h3>
              <button className="modal-close" onClick={() => setShowCaliberModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateCaliber}>
              <div className="modal-body">
                <div style={{ padding: '12px', background: '#f3f4f6', borderRadius: '8px', marginBottom: '16px' }}>
                  <p><strong>退货单号：</strong>{targetReturn.returnNo}</p>
                  <p><strong>图书：</strong>{targetReturn.SampleShipment?.Book?.title}</p>
                  <p><strong>申请数量：</strong>{targetReturn.requestedQuantity}本</p>
                  <p><strong>当前口径：</strong>
                    {targetReturn.caliberType === 'channel' ? '渠道口径' : 
                     targetReturn.caliberType === 'finance' ? '财务口径' : '原始口径'}
                  </p>
                </div>
                <div className="form-group">
                  <label>批准数量</label>
                  <input
                    type="number"
                    min="0"
                    max={targetReturn.requestedQuantity}
                    value={caliberForm.approvedQuantity}
                    onChange={(e) => setCaliberForm({ ...caliberForm, approvedQuantity: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>口径类型</label>
                  <select
                    value={caliberForm.caliberType}
                    onChange={(e) => setCaliberForm({ ...caliberForm, caliberType: e.target.value })}
                    required
                  >
                    <option value="original">原始口径</option>
                    <option value="channel">渠道口径</option>
                    <option value="finance">财务口径</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>口径说明</label>
                  <textarea
                    rows="3"
                    value={caliberForm.caliberNotes}
                    onChange={(e) => setCaliberForm({ ...caliberForm, caliberNotes: e.target.value })}
                    required
                    placeholder="请说明选择此口径的原因..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowCaliberModal(false)}
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? '处理中...' : '确认调整'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Returns;
