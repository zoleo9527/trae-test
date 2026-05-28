import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

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

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    axios.get(`/api/quotes/${id}`).then(res => setData(res.data.data));
  }, [id]);

  if (!data) return <div>加载中...</div>;

  const { quote, versions, approvals, proofs, shipments, refunds, logs } = data;

  return (
    <div>
      <div className="back-btn" onClick={() => navigate('/')}>
        ← 返回列表
      </div>

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
                      <span className={`status-badge status-${a.status}`}>
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
                    <span className={`status-badge status-${p.status === 'confirmed' ? 'completed' : p.status}`}>
                      {p.status === 'pending' ? '待打样' : p.status === 'customer_review' ? '客户确认中' : 
                       p.status === 'reproofing' ? '重新打样' : p.status === 'confirmed' ? '已确认' : p.status}
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
            shipments.length ? (
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
            ) : <div className="empty-state">暂无发货记录</div>
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
    </div>
  );
}
