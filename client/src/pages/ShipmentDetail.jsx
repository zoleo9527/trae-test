import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { shipmentApi, feedbackApi, returnApi } from '../api';
import Timeline from '../components/Timeline';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = {
  pending: '待发货',
  shipped: '已发货',
  delivered: '已送达',
  confirmed: '已确认',
  receipt_lost: '回执丢失',
  closed: '已关闭'
};

const ShipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole } = useAuth();
  const [shipment, setShipment] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    receivedQuantity: 0,
    damagedQuantity: 0,
    channelFeedback: '',
    salesExpectation: '',
    displayLocation: '',
    marketingSupport: '',
    followUpDate: ''
  });
  const [returnForm, setReturnForm] = useState({
    returnReason: '',
    returnReasonDetail: '',
    requestedQuantity: 0
  });

  useEffect(() => {
    loadDetail();
  }, [id]);

  useEffect(() => {
    if (shipment && !loading) {
      const params = new URLSearchParams(location.search);
      const action = params.get('action');
      if (action === 'confirm' && (shipment.status === 'delivered' || shipment.status === 'receipt_lost')) {
        setShowConfirmModal(true);
      }
    }
  }, [shipment, loading, location.search]);

  const loadDetail = async () => {
    try {
      const res = await shipmentApi.get(id);
      setShipment(res.data);
      if (res.data) {
        setFeedbackForm(prev => ({ ...prev, receivedQuantity: res.data.quantity }));
        setReturnForm(prev => ({ ...prev, requestedQuantity: res.data.quantity }));
      }
    } catch (error) {
      console.error('Load detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!hasRole('channel_manager')) {
      alert('只有渠道经理可以确认回执');
      return;
    }
    if (!confirm('确认已收到全部样书，回执无误？')) return;
    
    setActionLoading(true);
    try {
      await shipmentApi.confirm(id);
      await loadDetail();
      setShowConfirmModal(false);
      alert('回执确认成功');
    } catch (error) {
      alert('确认失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    try {
      await feedbackApi.create({
        shipmentId: id,
        ...feedbackForm
      });
      setShowFeedbackForm(false);
      loadDetail();
      alert('反馈创建成功');
    } catch (error) {
      alert('创建失败');
    }
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    try {
      await returnApi.create({
        shipmentId: id,
        ...returnForm
      });
      setShowReturnForm(false);
      loadDetail();
      alert('退货申请创建成功');
    } catch (error) {
      alert('创建失败');
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!shipment) {
    return <div className="empty-state">记录不存在</div>;
  }

  return (
    <div>
      <button className="btn btn-secondary btn-sm" style={{ marginBottom: '20px' }} onClick={() => navigate(-1)}>
        ← 返回列表
      </button>

      <div className="card">
        <div className="card-header">
          <h3>寄送详情 - {shipment.shipmentNo}</h3>
          <span className={`status-badge status-${shipment.status}`}>
            {STATUS_LABELS[shipment.status]}
          </span>
        </div>
        <div className="card-body">
          <div className="tabs">
            <button className={`tab ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>
              基本信息
            </button>
            <button className={`tab ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')}>
              渠道反馈
            </button>
            <button className={`tab ${activeTab === 'return' ? 'active' : ''}`} onClick={() => setActiveTab('return')}>
              退货记录
            </button>
            <button className={`tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>
              时间线
            </button>
          </div>

          {activeTab === 'basic' && (
            <div>
              {hasRole('channel_manager') && (shipment.status === 'delivered' || shipment.status === 'receipt_lost') && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#fef3c7', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 12px 0', color: '#92400e' }}>
                    <strong>📌 待处理：</strong>
                    {shipment.status === 'receipt_lost' ? '此单标记为回执丢失，请核实后确认' : '请确认收到样书回执'}
                  </p>
                  <button 
                    className="btn btn-success"
                    onClick={() => setShowConfirmModal(true)}
                  >
                    ✓ 确认回执
                  </button>
                </div>
              )}
              <div className="grid-2">
                <div>
                  <div className="detail-item">
                    <label>图书名称</label>
                    <div className="value">{shipment.Book?.title}</div>
                  </div>
                  <div className="detail-item">
                    <label>ISBN</label>
                    <div className="value">{shipment.Book?.isbn}</div>
                  </div>
                  <div className="detail-item">
                    <label>渠道</label>
                    <div className="value">{shipment.Channel?.name}</div>
                  </div>
                  <div className="detail-item">
                    <label>寄送数量</label>
                    <div className="value">{shipment.quantity}本</div>
                  </div>
                </div>
                <div>
                  <div className="detail-item">
                    <label>单价</label>
                    <div className="value">¥{shipment.unitPrice}</div>
                  </div>
                  <div className="detail-item">
                    <label>总金额</label>
                    <div className="value">¥{shipment.totalAmount}</div>
                  </div>
                  <div className="detail-item">
                    <label>快递公司</label>
                    <div className="value">{shipment.expressCompany || '-'}</div>
                  </div>
                  <div className="detail-item">
                    <label>快递单号</label>
                    <div className="value"><code>{shipment.trackingNo || '-'}</code></div>
                  </div>
                </div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <label>备注</label>
                  <div className="value">{shipment.notes || '-'}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div>
              {hasRole('channel_manager') && !showFeedbackForm && (
                <button 
                  className="btn btn-primary btn-sm" 
                  style={{ marginBottom: '20px' }}
                  onClick={() => setShowFeedbackForm(true)}
                >
                  + 新增反馈
                </button>
              )}

              {showFeedbackForm && (
                <div className="card" style={{ marginBottom: '20px' }}>
                  <div className="card-body">
                    <h4 style={{ marginBottom: '16px' }}>新建渠道反馈</h4>
                    <form onSubmit={handleSubmitFeedback}>
                      <div className="grid-2">
                        <div className="form-group">
                          <label>实收数量</label>
                          <input
                            type="number"
                            value={feedbackForm.receivedQuantity}
                            onChange={(e) => setFeedbackForm({ ...feedbackForm, receivedQuantity: parseInt(e.target.value) })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>破损数量</label>
                          <input
                            type="number"
                            value={feedbackForm.damagedQuantity}
                            onChange={(e) => setFeedbackForm({ ...feedbackForm, damagedQuantity: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>渠道反馈</label>
                        <textarea
                          rows="3"
                          value={feedbackForm.channelFeedback}
                          onChange={(e) => setFeedbackForm({ ...feedbackForm, channelFeedback: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>销售预期</label>
                        <select
                          value={feedbackForm.salesExpectation}
                          onChange={(e) => setFeedbackForm({ ...feedbackForm, salesExpectation: e.target.value })}
                        >
                          <option value="">请选择</option>
                          <option value="high">高</option>
                          <option value="medium">中</option>
                          <option value="low">低</option>
                        </select>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowFeedbackForm(false)}>取消</button>
                        <button type="submit" className="btn btn-primary">提交</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {shipment.Feedbacks?.length > 0 ? (
                shipment.Feedbacks.map(fb => (
                  <div key={fb.id} className="card">
                    <div className="card-header">
                      <h4>反馈单号: {fb.feedbackNo}</h4>
                      <span className={`status-badge status-${fb.status}`}>{fb.status}</span>
                    </div>
                    <div className="card-body">
                      <div className="grid-2">
                        <div className="detail-item">
                          <label>实收数量</label>
                          <div className="value">{fb.receivedQuantity}本</div>
                        </div>
                        <div className="detail-item">
                          <label>破损数量</label>
                          <div className="value">{fb.damagedQuantity}本</div>
                        </div>
                        <div className="detail-item">
                          <label>销售预期</label>
                          <div className="value">{fb.salesExpectation || '-'}</div>
                        </div>
                        <div className="detail-item">
                          <label>陈列位置</label>
                          <div className="value">{fb.displayLocation || '-'}</div>
                        </div>
                      </div>
                      <div className="detail-item">
                        <label>渠道反馈内容</label>
                        <div className="value">{fb.channelFeedback || '-'}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">暂无反馈记录</div>
              )}
            </div>
          )}

          {activeTab === 'return' && (
            <div>
              {hasRole('channel_manager') && !showReturnForm && (
                <button 
                  className="btn btn-warning btn-sm" 
                  style={{ marginBottom: '20px' }}
                  onClick={() => setShowReturnForm(true)}
                >
                  + 申请退货
                </button>
              )}

              {showReturnForm && (
                <div className="card" style={{ marginBottom: '20px' }}>
                  <div className="card-body">
                    <h4 style={{ marginBottom: '16px' }}>申请退货</h4>
                    <form onSubmit={handleSubmitReturn}>
                      <div className="form-group">
                        <label>退货原因</label>
                        <select
                          value={returnForm.returnReason}
                          onChange={(e) => setReturnForm({ ...returnForm, returnReason: e.target.value })}
                          required
                        >
                          <option value="">请选择原因</option>
                          <option value="quality_issue">质量问题</option>
                          <option value="slow_sales">销售缓慢</option>
                          <option value="wrong_shipment">错发</option>
                          <option value="damage">破损</option>
                          <option value="other">其他</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>退货数量</label>
                        <input
                          type="number"
                          min="1"
                          max={shipment.quantity}
                          value={returnForm.requestedQuantity}
                          onChange={(e) => setReturnForm({ ...returnForm, requestedQuantity: parseInt(e.target.value) })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>详细说明</label>
                        <textarea
                          rows="3"
                          value={returnForm.returnReasonDetail}
                          onChange={(e) => setReturnForm({ ...returnForm, returnReasonDetail: e.target.value })}
                        />
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowReturnForm(false)}>取消</button>
                        <button type="submit" className="btn btn-primary">提交申请</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {shipment.Returns?.length > 0 ? (
                shipment.Returns.map(ret => (
                  <div key={ret.id} className="card">
                    <div className="card-header">
                      <h4>退货单号: {ret.returnNo}</h4>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span className={`status-badge status-${ret.caliberType}`}>
                          {ret.caliberType === 'channel' ? '渠道口径' : ret.caliberType === 'finance' ? '财务口径' : '原始口径'}
                        </span>
                        <span className={`status-badge status-${ret.status}`}>{ret.status}</span>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="grid-2">
                        <div className="detail-item">
                          <label>申请数量</label>
                          <div className="value">{ret.requestedQuantity}本</div>
                        </div>
                        <div className="detail-item">
                          <label>批准数量</label>
                          <div className="value">{ret.approvedQuantity || '-'}本</div>
                        </div>
                        <div className="detail-item">
                          <label>实收数量</label>
                          <div className="value">{ret.receivedQuantity || 0}本</div>
                        </div>
                      </div>
                      <div className="detail-item">
                        <label>口径说明</label>
                        <div className="value">{ret.caliberNotes || '-'}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">暂无退货记录</div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <Timeline data={shipment.activityLogs || []} />
          )}
        </div>
      </div>

      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>确认回执</h3>
              <button className="modal-close" onClick={() => setShowConfirmModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>请确认已收到以下样书：</p>
              <div style={{ padding: '12px', background: '#f3f4f6', borderRadius: '8px', margin: '12px 0' }}>
                <p><strong>图书：</strong>{shipment.Book?.title}</p>
                <p><strong>渠道：</strong>{shipment.Channel?.name}</p>
                <p><strong>数量：</strong>{shipment.quantity}本</p>
                <p><strong>快递单号：</strong>{shipment.trackingNo || '-'}</p>
              </div>
              {shipment.status === 'receipt_lost' && (
                <p style={{ color: '#dc2626' }}>
                  ⚠️ 此单此前标记为回执丢失，确认后将变更为已确认状态。
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowConfirmModal(false)}
              >
                取消
              </button>
              <button 
                type="button" 
                className="btn btn-success" 
                onClick={handleConfirmReceipt}
                disabled={actionLoading}
              >
                {actionLoading ? '处理中...' : '确认回执无误'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentDetail;
