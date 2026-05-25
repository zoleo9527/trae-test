import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api';

const Issues = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState({ receiptLost: [], caliberDisputes: [], pendingReturns: [] });
  const [loading, setLoading] = useState(true);

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
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/shipments/${item.id}`)}
                >
                  查看详情
                </button>
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
                <button className="btn btn-warning btn-sm">处理口径</button>
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
                  <button className="btn btn-success btn-sm">批准</button>
                  <button className="btn btn-danger btn-sm">拒绝</button>
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
