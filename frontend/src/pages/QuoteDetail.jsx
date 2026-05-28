import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import Modal from '../components/Modal';

const statusMap = {
  'draft': '草稿',
  'pending_approval': '待审批',
  'approved': '已通过',
  'proofing': '打样中',
  'production': '量产中',
  'partial_shipped': '部分发货',
  'shipped': '已发货',
  'completed': '已完成',
  'rejected': '已拒绝'
};

const proofStatusMap = {
  'pending': '待打样',
  'customer_review': '客户确认中',
  'reproofing': '重新打样',
  'confirmed': '已确认'
};

const currentUser = { id: 1, name: '张三', role: 'business' };
const approverId = 4;
const proofUserId = 2;
const warehouseUserId = 3;

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);

  const [editPriceModal, setEditPriceModal] = useState(false);
  const [editPriceForm, setEditPriceForm] = useState({ quantity: '', unit_price: '', delivery_date: '', modify_reason: '' });

  const [approvalModal, setApprovalModal] = useState(false);
  const [approvalForm, setApprovalForm] = useState({ comments: '', status: 'approved' });

  const [proofModal, setProofModal] = useState(false);
  const [proofModalType, setProofModalType] = useState('upload');
  const [proofForm, setProofForm] = useState({ images: '/images/proof_new.jpg', feedback: '', confirmed: false });

  const [shipmentModal, setShipmentModal] = useState(false);
  const [shipmentForm, setShipmentForm] = useState({ 
    total_quantity: '', warehouse: '深圳仓', logistics_company: '顺丰速运', tracking_no: '',
    product_name: '', batch_no: '', remarks: ''
  });

  const [refundModal, setRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState({ amount: '', reason: '' });

  const fetchData = () => {
    axios.get(`/api/quotes/${id}`).then(res => {
      setData(res.data.data);
    });
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (!data) return <div style={{ padding: 48, textAlign: 'center' }}>加载中...</div>;

  const { quote, versions, approvals, proofs, shipments, refunds, logs } = data;

  const handleSubmitApproval = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/quotes/${id}/submit-approval`, {
        approver_id: approverId,
        submitter_id: currentUser.id
      });
      fetchData();
      alert('提交审批成功！');
    } catch (err) {
      alert('操作失败：' + err.response?.data?.message);
    }
    setLoading(false);
  };

  const handleApprovalProcess = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/quotes/${id}/approve`, {
        approver_id: approverId,
        comments: approvalForm.comments,
        status: approvalForm.status
      });
      setApprovalModal(false);
      fetchData();
      alert(approvalForm.status === 'approved' ? '审批通过！' : '已拒绝');
    } catch (err) {
      alert('操作失败：' + err.response?.data?.message);
    }
    setLoading(false);
  };

  const handleEditPrice = async () => {
    if (!editPriceForm.quantity || !editPriceForm.unit_price || !editPriceForm.modify_reason) {
      alert('请填写完整信息');
      return;
    }
    setLoading(true);
    try {
      await axios.put(`/api/quotes/${id}`, {
        customer_name: quote.customer_name,
        project_name: quote.project_name,
        quantity: parseInt(editPriceForm.quantity),
        unit_price: parseFloat(editPriceForm.unit_price),
        delivery_date: editPriceForm.delivery_date || quote.delivery_date,
        modified_by: currentUser.id,
        modify_reason: editPriceForm.modify_reason
      });
      setEditPriceModal(false);
      setEditPriceForm({ quantity: '', unit_price: '', delivery_date: '', modify_reason: '' });
      fetchData();
      alert('修改成功，已生成新版本！');
    } catch (err) {
      alert('操作失败：' + err.response?.data?.message);
    }
    setLoading(false);
  };

  const handleCreateProof = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/proofs/quote/${id}`, {
        assigned_to: proofUserId,
        created_by: currentUser.id
      });
      fetchData();
      alert('打样任务已创建，已派发给打样部李四');
    } catch (err) {
      alert('操作失败：' + err.response?.data?.message);
    }
    setLoading(false);
  };

  const handleUploadProof = async (proofId) => {
    setLoading(true);
    try {
      await axios.put(`/api/proofs/${proofId}/upload`, {
        images: [proofForm.images],
        operator_id: proofUserId
      });
      setProofModal(false);
      fetchData();
      alert('打样照片上传成功！');
    } catch (err) {
      alert('操作失败：' + err.response?.data?.message);
    }
    setLoading(false);
  };

  const handleSubmitReview = async (proofId) => {
    setLoading(true);
    try {
      await axios.put(`/api/proofs/${proofId}/submit-review`, {
        operator_id: currentUser.id
      });
      setProofModal(false);
      fetchData();
      alert('已提交客户确认！');
    } catch (err) {
      alert('操作失败：' + err.response?.data?.message);
    }
    setLoading(false);
  };

  const handleProofFeedback = async (proofId) => {
    setLoading(true);
    try {
      await axios.put(`/api/proofs/${proofId}/feedback`, {
        feedback: proofForm.feedback,
        confirmed: proofForm.confirmed,
        operator_id: currentUser.id,
        proof_user_id: proofUserId
      });
      setProofModal(false);
      setProofForm({ images: '/images/proof_new.jpg', feedback: '', confirmed: false });
      fetchData();
      alert(proofForm.confirmed ? '打样已确认！' : '已反馈，安排重新打样');
    } catch (err) {
      alert('操作失败：' + err.response?.data?.message);
    }
    setLoading(false);
  };

  const handleCreateShipment = async () => {
    if (!shipmentForm.total_quantity || !shipmentForm.product_name) {
      alert('请填写完整信息');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`/api/shipments/quote/${id}`, {
        total_quantity: parseInt(shipmentForm.total_quantity),
        warehouse: shipmentForm.warehouse,
        items: [{
          product_name: shipmentForm.product_name,
          quantity: parseInt(shipmentForm.total_quantity),
          batch_no: shipmentForm.batch_no,
          remarks: shipmentForm.remarks
        }],
        created_by: currentUser.id
      });
      setShipmentModal(false);
      setShipmentForm({ total_quantity: '', warehouse: '深圳仓', logistics_company: '顺丰速运', tracking_no: '', product_name: '', batch_no: '', remarks: '' });
      fetchData();
      alert('发货单已创建！');
    } catch (err) {
      alert('操作失败：' + err.response?.data?.message);
    }
    setLoading(false);
  };

  const handleCheckShipment = async (shipmentId) => {
    if (!shipmentForm.logistics_company || !shipmentForm.tracking_no) {
      alert('请填写物流信息');
      return;
    }
    setLoading(true);
    try {
      await axios.put(`/api/shipments/${shipmentId}/check`, {
        checked_by: warehouseUserId,
        logistics_company: shipmentForm.logistics_company,
        tracking_no: shipmentForm.tracking_no
      });
      setShipmentModal(false);
      setShipmentForm({ total_quantity: '', warehouse: '深圳仓', logistics_company: '顺丰速运', tracking_no: '', product_name: '', batch_no: '', remarks: '' });
      fetchData();
      alert('发货复核完成！');
    } catch (err) {
      alert('操作失败：' + err.response?.data?.message);
    }
    setLoading(false);
  };

  const handleApplyRefund = async () => {
    if (!refundForm.amount || !refundForm.reason) {
      alert('请填写完整信息');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`/api/refunds/quote/${id}`, {
        amount: parseFloat(refundForm.amount),
        reason: refundForm.reason,
        applicant_id: currentUser.id
      });
      setRefundModal(false);
      setRefundForm({ amount: '', reason: '' });
      fetchData();
      alert('退款申请已提交！');
    } catch (err) {
      alert('操作失败：' + err.response?.data?.message);
    }
    setLoading(false);
  };

  const handleApproveRefund = async (refundId, status) => {
    setLoading(true);
    try {
      await axios.put(`/api/refunds/${refundId}/approve`, {
        approved_by: approverId,
        status
      });
      fetchData();
      alert(status === 'approved' ? '退款已通过！' : '已拒绝退款');
    } catch (err) {
      alert('操作失败：' + err.response?.data?.message);
    }
    setLoading(false);
  };

  const handleComplete = () => {
    if (confirm('确认订单已完成？')) {
      alert('功能演示：订单状态已更新为已完成');
    }
  };

  const canSubmitApproval = quote.status === 'draft' || quote.status === 'rejected';
  const canApprove = quote.status === 'pending_approval';
  const canEditPrice = quote.status === 'draft' || quote.status === 'rejected';
  const canCreateProof = quote.status === 'approved';
  const canCreateShipment = quote.status === 'production';
  const canApplyRefund = ['partial_shipped', 'shipped', 'completed'].includes(quote.status);

  const pendingApproval = approvals.find(a => a.status === 'pending');
  const pendingProof = proofs.find(p => p.status !== 'confirmed');
  const pendingShipment = shipments.find(s => s.status === 'pending');
  const pendingRefund = refunds.find(r => r.status === 'pending');

  return (
    <div>
      <div className="back-btn" onClick={() => navigate('/')}>← 返回列表</div>

      <div className="card">
        <div className="card-body">
          <div className="detail-header">
            <div>
              <div className="detail-title">
                {quote.project_name}
                <span className={`status-badge status-${quote.status}`} style={{ marginLeft: 12 }}>
                  {statusMap[quote.status]}
                </span>
              </div>
              <div className="detail-meta">
                <span>报价单号：{quote.quote_no}</span>
                <span>客户：{quote.customer_name}</span>
                <span>版本：v{quote.version}</span>
                <span>创建人：{quote.creator_name}</span>
                <span>当前处理：{quote.handler_name}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, color: '#f5222d', fontWeight: 600 }}>
                ¥{quote.total_price?.toLocaleString()}
              </div>
              <div style={{ color: '#8c8c8c', fontSize: 13 }}>
                {quote.quantity?.toLocaleString()} 件 × ¥{quote.unit_price}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {canEditPrice && (
              <button className="btn btn-default" onClick={() => {
                setEditPriceForm({ quantity: quote.quantity, unit_price: quote.unit_price, delivery_date: quote.delivery_date, modify_reason: '' });
                setEditPriceModal(true);
              }}>✏️ 修改报价</button>
            )}
            {canSubmitApproval && (
              <button className="btn btn-primary" onClick={handleSubmitApproval} disabled={loading}>
                📋 提交审批
              </button>
            )}
            {canApprove && pendingApproval && (
              <button className="btn btn-primary" onClick={() => setApprovalModal(true)}>
                ⚖️ 处理审批
              </button>
            )}
            {canCreateProof && (
              <button className="btn btn-warning" onClick={handleCreateProof} disabled={loading}>
                🎨 创建打样任务
              </button>
            )}
            {pendingProof && pendingProof.status === 'pending' && (
              <button className="btn btn-warning" onClick={() => {
                setProofModalType('upload');
                setProofModal(true);
              }}>
                📷 上传打样照片
              </button>
            )}
            {pendingProof && pendingProof.status === 'reproofing' && (
              <button className="btn btn-warning" onClick={() => {
                setProofModalType('upload');
                setProofModal(true);
              }}>
                📷 重新打样上传
              </button>
            )}
            {pendingProof && pendingProof.status === 'uploaded' && (
              <button className="btn btn-warning" onClick={() => handleSubmitReview(pendingProof.id)}>
                📤 提交客户确认
              </button>
            )}
            {pendingProof && pendingProof.status === 'customer_review' && (
              <button className="btn btn-warning" onClick={() => {
                setProofModalType('feedback');
                setProofForm({ images: '', feedback: pendingProof.customer_feedback || '', confirmed: false });
                setProofModal(true);
              }}>
                💬 客户确认打样
              </button>
            )}
            {canCreateShipment && (
              <button className="btn btn-default" onClick={() => {
                setShipmentForm({ 
                  total_quantity: quote.quantity, warehouse: '深圳仓', logistics_company: '顺丰速运', 
                  tracking_no: '', product_name: quote.product_type, batch_no: '', remarks: '' 
                });
                setShipmentModal(true);
              }}>
                📦 创建发货单
              </button>
            )}
            {pendingShipment && (
              <button className="btn btn-success" onClick={() => handleCheckShipment(pendingShipment.id)}>
                ✅ 仓配复核发货
              </button>
            )}
            {canApplyRefund && (
              <button className="btn btn-default" onClick={() => setRefundModal(true)}>
                💰 申请退款
              </button>
            )}
            {pendingRefund && (
              <>
                <button className="btn btn-success" onClick={() => handleApproveRefund(pendingRefund.id, 'approved')}>
                  ✅ 通过退款
                </button>
                <button className="btn btn-default" onClick={() => handleApproveRefund(pendingRefund.id, 'rejected')}>
                  ❌ 拒绝退款
                </button>
              </>
            )}
            {quote.status === 'shipped' && (
              <button className="btn btn-success" onClick={handleComplete}>
                🎉 标记完成
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>基本信息</div>
        <div className={`tab ${activeTab === 'versions' ? 'active' : ''}`} onClick={() => setActiveTab('versions')}>版本历史 ({versions.length})</div>
        <div className={`tab ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')}>审批留痕 ({approvals.length})</div>
        <div className={`tab ${activeTab === 'proofs' ? 'active' : ''}`} onClick={() => setActiveTab('proofs')}>打样记录 ({proofs.length})</div>
        <div className={`tab ${activeTab === 'shipments' ? 'active' : ''}`} onClick={() => setActiveTab('shipments')}>发货记录 ({shipments.length})</div>
        <div className={`tab ${activeTab === 'refunds' ? 'active' : ''}`} onClick={() => setActiveTab('refunds')}>退款售后 ({refunds.length})</div>
        <div className={`tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>操作日志 ({logs.length})</div>
      </div>

      <div className="card">
        <div className="card-body">
          {activeTab === 'info' && (
            <div className="grid-2">
              <div>
                <div className="form-item">
                  <label>客户联系人</label>
                  <div>{quote.customer_contact || '-'}</div>
                </div>
                <div className="form-item">
                  <label>产品类型</label>
                  <div>{quote.product_type || '-'}</div>
                </div>
                <div className="form-item">
                  <label>数量</label>
                  <div>{quote.quantity?.toLocaleString()} 件</div>
                </div>
              </div>
              <div>
                <div className="form-item">
                  <label>交货日期</label>
                  <div>{quote.delivery_date || '-'}</div>
                </div>
                <div className="form-item">
                  <label>创建时间</label>
                  <div>{dayjs(quote.created_at).format('YYYY-MM-DD HH:mm')}</div>
                </div>
                <div className="form-item">
                  <label>更新时间</label>
                  <div>{dayjs(quote.updated_at).format('YYYY-MM-DD HH:mm')}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            versions.length ? (
              versions.map(v => (
                <div key={v.id} className="version-compare">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600 }}>版本 v{v.version}</span>
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                      {dayjs(v.created_at).format('YYYY-MM-DD HH:mm')} · {v.modifier_name || '系统'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#595959' }}>
                    修改原因：{v.modify_reason || '-'}
                  </div>
                  <div style={{ display: 'flex', gap: 24, marginTop: 8, fontSize: 13 }}>
                    <span>数量：{v.quantity?.toLocaleString()}</span>
                    <span>单价：¥{v.unit_price}</span>
                    <span>总价：¥{v.total_price?.toLocaleString()}</span>
                    <span>交货期：{v.delivery_date}</span>
                  </div>
                </div>
              ))
            ) : <div className="empty-state">暂无版本记录</div>
          )}

          {activeTab === 'approvals' && (
            approvals.length ? (
              <div className="timeline">
                {approvals.map(a => (
                  <div key={a.id} className="timeline-item">
                    <div className="timeline-time">{dayjs(a.created_at).format('YYYY-MM-DD HH:mm')}</div>
                    <div className="timeline-content">
                      <span className={`status-badge status-${a.status === 'approved' ? 'completed' : a.status}`}>
                        {a.status === 'approved' ? '通过' : a.status === 'rejected' ? '拒绝' : '待审批'}
                      </span>
                      <span className="timeline-operator">审批人：{a.approver_name || '-'}</span>
                      {a.comments && <div style={{ marginTop: 4, color: '#595959' }}>意见：{a.comments}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="empty-state">暂无审批记录</div>
          )}

          {activeTab === 'proofs' && (
            proofs.length ? (
              proofs.map(p => (
                <div key={p.id} className="shipment-item">
                  <div className="shipment-header">
                    <span style={{ fontWeight: 600 }}>打样单号：{p.proof_no}</span>
                    <span className={`status-badge status-${p.status === 'confirmed' ? 'completed' : p.status === 'reproofing' ? 'proofing' : 'pending_approval'}`}>
                      {proofStatusMap[p.status] || p.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#595959', marginBottom: 8 }}>
                    打样员：{p.assignee_name || '-'} · 创建时间：{dayjs(p.created_at).format('MM-DD HH:mm')}
                  </div>
                  {p.customer_feedback && (
                    <div style={{ background: '#f6ffed', padding: 8, borderRadius: 4, fontSize: 13, marginBottom: 8 }}>
                      <strong>客户反馈：</strong>{p.customer_feedback}
                    </div>
                  )}
                  {p.proof_images && (
                    <div>
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>打样照片：</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {JSON.parse(p.proof_images).map((img, i) => (
                          <div key={i} style={{ width: 80, height: 80, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#8c8c8c' }}>
                            📷 打样图{i + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : <div className="empty-state">暂无打样记录</div>
          )}

          {activeTab === 'shipments' && (
            <div>
              {shipments.length ? (
                shipments.map(s => (
                  <div key={s.id} className="shipment-item">
                    <div className="shipment-header">
                      <div>
                        <span style={{ fontWeight: 600 }}>发货单号：{s.shipment_no}</span>
                        {s.parent_shipment_id && <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 8 }}>（拆单发货）</span>}
                      </div>
                      <span className={`status-badge status-${s.status === 'shipped' ? 'shipped' : 'draft'}`}>
                        {s.status === 'shipped' ? '已发货' : '待发货'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#595959', marginBottom: 8 }}>
                      仓库：{s.warehouse || '-'} · 复核人：{s.checker_name || '-'}
                    </div>
                    {s.status === 'shipped' && (
                      <div style={{ fontSize: 13, marginBottom: 8 }}>
                        <span style={{ marginRight: 16 }}>{s.logistics_company}</span>
                        <span>运单号：{s.tracking_no}</span>
                        <span style={{ marginLeft: 16, color: '#8c8c8c' }}>
                          发货时间：{dayjs(s.shipped_at).format('MM-DD HH:mm')}
                        </span>
                      </div>
                    )}
                    <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: 8 }}>
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>发货明细：</div>
                      {s.items?.map((item, idx) => (
                        <div key={idx} style={{ fontSize: 13, display: 'flex', gap: 16 }}>
                          <span>{item.product_name}</span>
                          <span>{item.quantity} 件</span>
                          <span style={{ color: '#8c8c8c' }}>批次：{item.batch_no || '-'}</span>
                          {item.remarks && <span style={{ color: '#8c8c8c' }}>备注：{item.remarks}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : <div className="empty-state">暂无发货记录</div>}
            </div>
          )}

          {activeTab === 'refunds' && (
            refunds.length ? (
              refunds.map(r => (
                <div key={r.id} className="refund-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>退款单号：{r.refund_no}</span>
                      <span style={{ marginLeft: 12, fontSize: 13, color: '#8c8c8c' }}>
                        申请人：{r.applicant_name}
                      </span>
                    </div>
                    <span className={`status-badge status-${r.status === 'approved' ? 'completed' : r.status}`}>
                      {r.status === 'approved' ? '已通过' : r.status === 'rejected' ? '已拒绝' : '待审批'}
                    </span>
                  </div>
                  <div className="refund-amount">- ¥{r.amount?.toLocaleString()}</div>
                  <div style={{ fontSize: 13, color: '#595959', marginTop: 8 }}>
                    退款原因：{r.reason}
                  </div>
                  {r.approved_by && (
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 8 }}>
                      审批人：{r.approver_name} · {dayjs(r.approved_at).format('MM-DD HH:mm')}
                    </div>
                  )}
                </div>
              ))
            ) : <div className="empty-state">暂无退款记录</div>
          )}

          {activeTab === 'logs' && (
            logs.length ? (
              <div className="timeline">
                {logs.map(log => (
                  <div key={log.id} className="timeline-item">
                    <div className="timeline-time">{dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}</div>
                    <div className="timeline-content">
                      <strong>{log.action_detail}</strong>
                      <span className="timeline-operator">— {log.operator_name || '系统'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="empty-state">暂无操作日志</div>
          )}
        </div>
      </div>

      <Modal title="修改报价（生成新版本）" visible={editPriceModal} onClose={() => setEditPriceModal(false)}
        onOk={handleEditPrice} okText={loading ? '保存中...' : '保存'} width={520}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-item">
            <label>数量</label>
            <input type="number" value={editPriceForm.quantity}
              onChange={e => setEditPriceForm(f => ({ ...f, quantity: e.target.value }))} />
          </div>
          <div className="form-item">
            <label>单价(元)</label>
            <input type="number" step="0.01" value={editPriceForm.unit_price}
              onChange={e => setEditPriceForm(f => ({ ...f, unit_price: e.target.value }))} />
          </div>
        </div>
        <div className="form-item">
          <label>交货日期</label>
          <input type="date" value={editPriceForm.delivery_date}
            onChange={e => setEditPriceForm(f => ({ ...f, delivery_date: e.target.value }))} />
        </div>
        <div className="form-item">
          <label>修改原因 <span style={{ color: 'red' }}>*</span></label>
          <textarea rows={3} value={editPriceForm.modify_reason} placeholder="请填写修改原因，将记录到版本历史"
            onChange={e => setEditPriceForm(f => ({ ...f, modify_reason: e.target.value }))} />
        </div>
      </Modal>

      <Modal title="处理审批" visible={approvalModal} onClose={() => setApprovalModal(false)}
        onOk={handleApprovalProcess} okText={loading ? '处理中...' : '确认'} width={460}>
        <div className="form-item">
          <label>审批意见</label>
          <textarea rows={3} value={approvalForm.comments} placeholder="请填写审批意见"
            onChange={e => setApprovalForm(f => ({ ...f, comments: e.target.value }))} />
        </div>
        <div className="form-item">
          <label>审批结果</label>
          <select value={approvalForm.status} onChange={e => setApprovalForm(f => ({ ...f, status: e.target.value }))}>
            <option value="approved">通过</option>
            <option value="rejected">拒绝</option>
          </select>
        </div>
      </Modal>

      <Modal 
        title={proofModalType === 'upload' ? '上传打样照片' : '打样反馈确认'} 
        visible={proofModal} onClose={() => setProofModal(false)}
        onOk={() => {
          if (proofModalType === 'upload') {
            handleUploadProof(pendingProof?.id);
          } else {
            handleProofFeedback(pendingProof?.id);
          }
        }} 
        okText={loading ? '提交中...' : (proofModalType === 'upload' ? '上传' : '确认反馈')} 
        width={480}>
        {proofModalType === 'upload' ? (
          <>
            <div className="form-item">
              <label>打样照片（演示：点击上传</label>
              <div style={{ width: 200, height: 200, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8c8c8c', border: '2px dashed #d9d9d9', cursor: 'pointer' }} onClick={() => alert('演示模式：模拟上传成功')}>
                📷 点击上传打样照片
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
              * 上传后将自动进入客户确认环节
            </div>
          </>
        ) : (
          <>
            <div className="form-item">
              <label>打样预览</label>
              <div style={{ width: 200, height: 200, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8c8c8c' }}>
                📷 打样图片预览
              </div>
            </div>
            <div className="form-item">
              <label>客户反馈</label>
              <textarea rows={3} value={proofForm.feedback} placeholder="请填写客户反馈意见"
                onChange={e => setProofForm(f => ({ ...f, feedback: e.target.value }))} />
            </div>
            <div className="form-item">
              <label>确认结果</label>
              <select value={proofForm.confirmed} onChange={e => setProofForm(f => ({ ...f, confirmed: e.target.value === 'true' }))}>
                <option value="false">确认不合格，重新打样</option>
                <option value="true">确认合格，可以量产</option>
              </select>
            </div>
          </>
        )}
      </Modal>

      <Modal title={pendingShipment ? '仓配复核发货' : '创建发货单'} visible={shipmentModal} onClose={() => setShipmentModal(false)}
        onOk={() => pendingShipment ? handleCheckShipment(pendingShipment.id) : handleCreateShipment()} 
        okText={loading ? '处理中...' : (pendingShipment ? '确认发货' : '创建')} width={520}>
        {!pendingShipment && (
          <>
            <div className="form-item">
              <label>发货数量</label>
              <input type="number" value={shipmentForm.total_quantity}
                onChange={e => setShipmentForm(f => ({ ...f, total_quantity: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-item">
                <label>产品名称</label>
                <input value={shipmentForm.product_name}
                  onChange={e => setShipmentForm(f => ({ ...f, product_name: e.target.value }))} />
              </div>
              <div className="form-item">
                <label>批次号</label>
                <input value={shipmentForm.batch_no} placeholder="可选"
                  onChange={e => setShipmentForm(f => ({ ...f, batch_no: e.target.value }))} />
              </div>
            </div>
            <div className="form-item">
              <label>发货仓库</label>
              <select value={shipmentForm.warehouse} onChange={e => setShipmentForm(f => ({ ...f, warehouse: e.target.value }))}>
                <option value="深圳仓">深圳仓</option>
                <option value="东莞仓">东莞仓</option>
                <option value="义乌仓">义乌仓</option>
              </select>
            </div>
            <div className="form-item">
              <label>备注</label>
              <input value={shipmentForm.remarks} placeholder="如：拆单第一批"
                onChange={e => setShipmentForm(f => ({ ...f, remarks: e.target.value }))} />
            </div>
          </>
        )}
        {(pendingShipment || !pendingShipment) && (
          <>
            <div className="form-item">
              <label>物流公司</label>
              <select value={shipmentForm.logistics_company} onChange={e => setShipmentForm(f => ({ ...f, logistics_company: e.target.value }))}>
                <option value="顺丰速运">顺丰速运</option>
                <option value="中通快递">中通快递</option>
                <option value="圆通速递">圆通速递</option>
                <option value="京东物流">京东物流</option>
              </select>
            </div>
            <div className="form-item">
              <label>运单号</label>
              <input value={shipmentForm.tracking_no} placeholder="SF1234567890"
                onChange={e => setShipmentForm(f => ({ ...f, tracking_no: e.target.value }))} />
            </div>
          </>
        )}
      </Modal>

      <Modal title="申请退款" visible={refundModal} onClose={() => setRefundModal(false)}
        onOk={handleApplyRefund} okText={loading ? '提交中...' : '提交申请'} width={460}>
        <div className="form-item">
          <label>退款金额(元)</label>
          <input type="number" step="0.01" value={refundForm.amount} placeholder="2250.00"
            onChange={e => setRefundForm(f => ({ ...f, amount: e.target.value }))} />
        </div>
        <div className="form-item">
          <label>退款原因</label>
          <textarea rows={4} value={refundForm.reason} placeholder="如：第一批1500个中有30个瑕疵品，按成本退款"
            onChange={e => setRefundForm(f => ({ ...f, reason: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}
