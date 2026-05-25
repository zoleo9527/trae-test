import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, returnApi } from '../api';

const Issues = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issues, setIssues] = useState({ receiptLost: [], caliberDisputes: [], pendingReturns: [] });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      const res = await dashboardApi.issues();
      setIssues(res.data);
    } catch (error) {
      console.error('Load issues error:', error);
    } finally {
      setLoading(false);
    }
  };

  const canApproveReturn = user?.role === 'distribution_specialist' || user?.role === 'finance';
  const canHandleCaliber = user?.role === 'distribution_specialist' || user?.role === 'finance';

  const handleApproveReturn = async (returnId) => {
    if (!canApproveReturn) {
      alert('您没有权限进行此操作');
      return;
    }
    if (!confirm('确定批准此退货申请吗？')) return;
    
    setActionLoading(returnId);
    try {
      await returnApi.approve(returnId, { 
        approvedQuantity: issues.pendingReturns.find(r => r.id === returnId)?.requestedQuantity,
        caliberType: 'original',
        caliberNotes: '问题追踪页快速审批'
      });
      await loadIssues();
      alert('退货已批准');
    } catch (error) {
      alert('审批失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectReturn = async (returnId) => {
    if (!canApproveReturn) {
      alert('您没有权限进行此操作');
      return;
    }
    if (!confirm('确定拒绝此退货申请吗？')) return;
    
    setActionLoading(returnId);
    try {
      await returnApi.reject(returnId);
      await loadIssues();
      alert('退货已拒绝');
    } catch (error) {
      alert('操作失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="alert alert-warning">
        <strong>⚠️ 问题追踪中心</strong>
        <br />以下是需要重点关注和处理的业务异常，请及时跟进解决以减少月底对账压力。
      </div>

      <div className="card">
        <div className="card-header">
          <h3>回执丢失 ({issues.receiptLost?.length || 0})</h3>
        </div>
        <div className="card-body">
          {issues.receiptLost?.length > 0 ? (
            issues.receiptLost.map(item => (
              <div key={item.id} className="issue-item warning">
                <div className="issue-info">
                  <h4>{item.shipmentNo} - {item.Book?.title}</h4>
                  <p>
                    渠道: {item.Channel?.name} | 
                    数量: {item.quantity}本 | 
                    发货日期: {new Date(item.shipmentDate).toLocaleDateString()}
                  </p>
                  <p style={{ color: '#dc2626' }}>{item.notes}</p>
                </div>
                <div className="action-buttons">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/shipments/${item.id}`)}
                  >
                    查看详情
                  </button>
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => navigate(`/shipments/${item.id}?action=confirm`)}
                  >
                    确认回执
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">暂无回执丢失问题</div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>退货口径差异 ({issues.caliberDisputes?.length || 0})</h3>
        </div>
        <div className="card-body">
          {issues.caliberDisputes?.length > 0 ? (
            issues.caliberDisputes.map(item => (
              <div key={item.id} className="issue-item danger">
                <div className="issue-info">
                  <h4>{item.returnNo} - {item.SampleShipment?.Book?.title}</h4>
                  <p>
                    渠道: {item.SampleShipment?.Channel?.name} | 
                    申请: {item.requestedQuantity}本 → 
                    批准: {item.approvedQuantity}本
                  </p>
                  <p style={{ color: '#dc2626' }}>
                    口径: {item.caliberType === 'channel' ? '渠道口径' : item.caliberType === 'finance' ? '财务口径' : '原始口径'}
                    <br />{item.caliberNotes}
                  </p>
                </div>
                <div className="action-buttons">
                  {canHandleCaliber ? (
                    <>
                      <button 
                        className="btn btn-warning btn-sm"
                        onClick={() => navigate(`/returns?returnId=${item.id}&action=caliber`)}
                      >
                        调整口径
                      </button>
                      {user?.role === 'finance' && (
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => navigate(`/reconciliations?returnId=${item.id}`)}
                        >
                          对账处置
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="text-muted">待发行专员/财务处理</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">暂无口径差异问题</div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>待审批退货 ({issues.pendingReturns?.length || 0})</h3>
        </div>
        <div className="card-body">
          {issues.pendingReturns?.length > 0 ? (
            issues.pendingReturns.map(item => (
              <div key={item.id} className="issue-item warning">
                <div className="issue-info">
                  <h4>{item.returnNo} - {item.SampleShipment?.Book?.title}</h4>
                  <p>
                    渠道: {item.SampleShipment?.Channel?.name} | 
                    原因: {item.returnReason} | 
                    申请数量: {item.requestedQuantity}本
                  </p>
                  <p>{item.returnReasonDetail}</p>
                </div>
                <div className="action-buttons">
                  {canApproveReturn ? (
                    <>
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => handleApproveReturn(item.id)}
                        disabled={actionLoading === item.id}
                      >
                        {actionLoading === item.id ? '处理中...' : '批准'}
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRejectReturn(item.id)}
                        disabled={actionLoading === item.id}
                      >
                        {actionLoading === item.id ? '处理中...' : '拒绝'}
                      </button>
                    </>
                  ) : (
                    <span className="text-muted">待发行专员审批</span>
                  )}
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate(`/shipments/${item.SampleShipment?.id}`)}
                  >
                    查看详情
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">暂无待审批退货</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Issues;
