import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { reconciliationApi, commonApi, returnApi } from '../api';

const STATUS_LABELS = {
  draft: '草稿',
  pending_approval: '待审批',
  approved: '已批准',
  disputed: '有争议',
  finalized: '已最终确认'
};

const Reconciliations = () => {
  const location = useLocation();
  const [reconciliations, setReconciliations] = useState([]);
  const [channels, setChannels] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({ channelId: '', period: '' });
  const [loading, setLoading] = useState(true);
  const [targetReturnInfo, setTargetReturnInfo] = useState(null);
  const [expandedRecon, setExpandedRecon] = useState(null);
  const [reconDetail, setReconDetail] = useState(null);
  const targetRowRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const returnId = params.get('returnId');
    if (returnId && reconciliations.length > 0) {
      loadTargetReturnInfo(returnId);
    }
  }, [location.search, reconciliations]);

  const loadTargetReturnInfo = async (returnId) => {
    try {
      const res = await returnApi.get(returnId);
      const ret = res.data;
      setTargetReturnInfo(ret);
      
      const relatedRecon = reconciliations.find(r => 
        r.ReconciliationItems?.some(item => item.shipmentId === ret.shipmentId)
      );
      
      if (relatedRecon) {
        setExpandedRecon(relatedRecon.id);
        loadReconDetail(relatedRecon.id);
      }
    } catch (error) {
      console.error('Load target return error:', error);
    }
  };

  const loadReconDetail = async (reconId) => {
    try {
      const res = await reconciliationApi.get(reconId);
      setReconDetail(res.data);
      setTimeout(() => {
        targetRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } catch (error) {
      console.error('Load recon detail error:', error);
    }
  };

  const loadData = async () => {
    try {
      const [reconRes, channelRes] = await Promise.all([
        reconciliationApi.list(),
        commonApi.channels()
      ]);
      setReconciliations(reconRes.data.data || []);
      setChannels(channelRes.data.data || []);
    } catch (error) {
      console.error('Load reconciliations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      await reconciliationApi.generate(generateForm);
      setShowGenerateModal(false);
      loadData();
      alert('对账单生成成功');
    } catch (error) {
      alert('生成失败');
    }
  };

  const handleSubmit = async (id) => {
    if (confirm('确定提交审批？')) {
      try {
        await reconciliationApi.submit(id);
        loadData();
      } catch (error) {
        alert('提交失败');
      }
    }
  };

  const handleApprove = async (id) => {
    if (confirm('确定批准？')) {
      try {
        await reconciliationApi.approve(id);
        loadData();
      } catch (error) {
        alert('审批失败');
      }
    }
  };

  const handleFinalize = async (id) => {
    if (confirm('确定最终确认？此操作不可撤销。')) {
      try {
        await reconciliationApi.finalize(id);
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
      <div className="card">
        <div className="card-header">
          <h3>对账管理</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowGenerateModal(true)}>
            + 生成对账单
          </button>
        </div>
        <div className="card-body">
          <table className="table">
            <thead>
              <tr>
                <th>对账单号</th>
                <th>期间</th>
                <th>渠道</th>
                <th>寄送</th>
                <th>确认</th>
                <th>退货</th>
                <th>回执丢失</th>
                <th>口径差异</th>
                <th>结余</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {reconciliations.map(recon => (
                <React.Fragment key={recon.id}>
                  <tr 
                    ref={targetReturnInfo && reconDetail?.id === recon.id ? targetRowRef : null}
                    style={{ 
                      background: reconDetail?.id === recon.id ? '#fef3c7' : 'inherit',
                      transition: 'background 0.3s',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (expandedRecon === recon.id) {
                        setExpandedRecon(null);
                        setReconDetail(null);
                      } else {
                        setExpandedRecon(recon.id);
                        loadReconDetail(recon.id);
                      }
                    }}
                  >
                    <td><code>{recon.reconNo}</code></td>
                    <td>{recon.period}</td>
                    <td>{recon.Channel?.name}</td>
                    <td>{recon.totalShipped}</td>
                    <td>{recon.totalConfirmed}</td>
                    <td>{recon.totalReturned}</td>
                    <td style={{ color: recon.totalReceiptLost > 0 ? '#dc2626' : '' }}>
                      {recon.totalReceiptLost || 0}
                    </td>
                    <td style={{ color: recon.totalCaliberDiscrepancy > 0 ? '#f59e0b' : '' }}>
                      {recon.totalCaliberDiscrepancy || 0}
                    </td>
                    <td style={{ color: recon.balanceQuantity < 0 ? '#dc2626' : '#065f46', fontWeight: '600' }}>
                      {recon.balanceQuantity}
                    </td>
                    <td>
                      <span className={`status-badge status-${recon.status}`}>
                        {STATUS_LABELS[recon.status]}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                        {recon.status === 'draft' && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleSubmit(recon.id)}>
                            提交
                          </button>
                        )}
                        {recon.status === 'pending_approval' && (
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(recon.id)}>
                            批准
                          </button>
                        )}
                        {recon.status === 'approved' && (
                          <button className="btn btn-success btn-sm" onClick={() => handleFinalize(recon.id)}>
                            最终确认
                          </button>
                        )}
                        <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                          {expandedRecon === recon.id ? '▼' : '▶'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {expandedRecon === recon.id && reconDetail && (
                    <tr style={{ background: '#f9fafb' }}>
                      <td colSpan="11" style={{ padding: '20px' }}>
                        {targetReturnInfo && (
                          <div style={{ marginBottom: '20px', padding: '16px', background: '#dbf4ff', borderRadius: '8px' }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#0369a1' }}>📌 关联退货记录</h4>
                            <p style={{ margin: '4px 0' }}>
                              <strong>退货单号：</strong>{targetReturnInfo.returnNo} | 
                              <strong>图书：</strong>{targetReturnInfo.SampleShipment?.Book?.title} | 
                              <strong>申请/批准：</strong>{targetReturnInfo.requestedQuantity} / {targetReturnInfo.approvedQuantity || 0}本
                            </p>
                            <p style={{ margin: '4px 0', color: '#f59e0b' }}>
                              <strong>口径：</strong>{targetReturnInfo.caliberType === 'channel' ? '渠道口径' : targetReturnInfo.caliberType === 'finance' ? '财务口径' : '原始口径'} | 
                              <strong>说明：</strong>{targetReturnInfo.caliberNotes || '-'}
                            </p>
                          </div>
                        )}
                        <h4 style={{ margin: '0 0 12px 0' }}>对账明细</h4>
                        <table className="table" style={{ fontSize: '14px' }}>
                          <thead>
                            <tr>
                              <th>寄送单号</th>
                              <th>图书</th>
                              <th>寄送</th>
                              <th>确认</th>
                              <th>退货</th>
                              <th>差异</th>
                              <th>状态</th>
                              <th>备注</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reconDetail.ReconciliationItems?.map(item => (
                              <tr key={item.id} style={{
                                background: targetReturnInfo && item.shipmentId === targetReturnInfo.shipmentId ? '#fef3c7' : 'inherit'
                              }}>
                                <td><code>{item.SampleShipment?.shipmentNo || '-'}</code></td>
                                <td>{item.Book?.title}</td>
                                <td>{item.shippedQuantity}</td>
                                <td>{item.confirmedQuantity}</td>
                                <td>{item.returnedQuantity}</td>
                                <td style={{ color: item.difference !== 0 ? '#dc2626' : '#065f46' }}>
                                  {item.difference}
                                </td>
                                <td>
                                  <span className={`status-badge status-${item.status}`}>
                                    {item.status === 'matched' ? '匹配' : item.status === 'discrepancy' ? '差异' : '待处理'}
                                  </span>
                                </td>
                                <td>{item.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showGenerateModal && (
        <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>生成对账单</h3>
              <button className="modal-close" onClick={() => setShowGenerateModal(false)}>×</button>
            </div>
            <form onSubmit={handleGenerate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>选择渠道</label>
                  <select
                    value={generateForm.channelId}
                    onChange={(e) => setGenerateForm({ ...generateForm, channelId: e.target.value })}
                    required
                  >
                    <option value="">请选择渠道</option>
                    {channels.map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>对账期间</label>
                  <input
                    type="month"
                    value={generateForm.period}
                    onChange={(e) => setGenerateForm({ ...generateForm, period: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">生成</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reconciliations;
