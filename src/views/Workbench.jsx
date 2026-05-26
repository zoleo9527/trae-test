import React from 'react'
import { useStore } from '../store'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const Workbench = () => {
  const {
    optometryRecords,
    transferOrders,
    processingRecords,
    repairRecords,
    refundRecords,
    selectedCustomer,
    setSelectedCustomer,
    setShowTransferModal,
    currentRole,
    loading,
    approveRefund,
  } = useStore()

  const statusLabels = {
    pending: '待处理',
    processing: '加工中',
    completed: '已完成',
    repair: '返修中',
    refund_pending: '待退款',
  }

  const getStatusClass = (status) => `status-badge status-${status}`

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'MM-dd HH:mm', { locale: zhCN })
    } catch {
      return dateStr
    }
  }

  const getCustomerTimeline = (customer) => {
    const timeline = []
    
    timeline.push({
      type: 'completed',
      title: '验光完成',
      description: `${customer.optometrist} | ${customer.lens_brand} ${customer.lens_type}`,
      time: customer.created_at,
      handler: customer.optometrist,
    })

    const processing = processingRecords.find(p => p.optometry_id === customer.id)
    if (processing) {
      timeline.push({
        type: processing.status === 'completed' ? 'completed' : 'processing',
        title: '加工' + (processing.status === 'completed' ? '完成' : '中'),
        description: `加工师: ${processing.processor}${processing.quality_check ? ` | 质检: ${processing.quality_check}` : ''}`,
        time: processing.started_at || processing.created_at,
        handler: processing.processor,
        progress: processing.status === 'completed' ? '已完成' : '进行中',
      })
    }

    const transfers = transferOrders.filter(t => t.optometry_id === customer.id)
    transfers.forEach(t => {
      const statusMap = {
        pending: { type: 'pending', title: '待调货' },
        shipped: { type: 'processing', title: '调拨运输中' },
        received: { type: 'completed', title: '调拨已签收' },
        lost: { type: 'lost', title: '调拨丢失' },
      }
      const status = statusMap[t.status] || statusMap.pending
      timeline.push({
        type: status.type,
        title: status.title,
        description: `${t.from_store} → ${t.to_store} | ${t.lens_name} x${t.quantity}${t.tracking_no ? ` | 单号: ${t.tracking_no}` : ''}`,
        time: t.status === 'shipped' ? t.shipped_at : 
              t.status === 'received' ? t.received_at : 
              t.status === 'lost' ? t.lost_at : t.created_at,
        handler: t.created_by,
        progress: status.title,
      })
    })

    const repair = repairRecords.find(r => r.optometry_id === customer.id)
    if (repair) {
      timeline.push({
        type: repair.status === 'completed' ? 'completed' : 'processing',
        title: '返修' + (repair.status === 'completed' ? '完成' : '中'),
        description: `${repair.repair_type}: ${repair.reason}${repair.lens_replaced ? ` | 更换镜片: ${repair.lens_replaced}` : ''}${repair.cost ? ` | 费用: ¥${repair.cost}` : ''}`,
        time: repair.status === 'completed' ? repair.completed_at : repair.created_at,
        handler: repair.created_by,
        progress: repair.status === 'completed' ? '已完成' : '处理中',
      })
    }

    const refund = refundRecords.find(r => r.optometry_id === customer.id)
    if (refund) {
      timeline.push({
        type: refund.status === 'approved' ? 'completed' : 'pending',
        title: '退款' + (refund.status === 'approved' ? '已批准' : '待审批'),
        description: `¥${refund.amount} | ${refund.reason}${refund.approved_by ? ` | 审批人: ${refund.approved_by}` : ''}`,
        time: refund.status === 'approved' ? refund.approved_at : refund.created_at,
        handler: refund.created_by,
        progress: refund.status === 'approved' ? '已批准' : '等待店经理审批',
      })
    }

    return timeline.sort((a, b) => new Date(a.time || 0) - new Date(b.time || 0))
  }

  const handleApproveRefund = async (refundId) => {
    if (confirm('确认批准此退款申请？')) {
      try {
        await approveRefund(refundId, '店经理')
        alert('退款已批准')
      } catch (error) {
        alert('审批失败: ' + error)
      }
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="workbench">
      <div className="card full-width">
        <div className="card-header">
          <h3>📊 今日概览</h3>
        </div>
        <div className="card-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{optometryRecords.length}</div>
              <div className="stat-label">验光单总数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{transferOrders.filter(t => t.status === 'pending').length}</div>
              <div className="stat-label">待调拨</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{processingRecords.filter(p => p.status === 'processing').length}</div>
              <div className="stat-label">加工中</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{repairRecords.filter(r => r.status === 'in_progress').length + refundRecords.filter(r => r.status === 'pending').length}</div>
              <div className="stat-label">待处理问题</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>📋 验光单列表</h3>
        </div>
        <div className="card-content">
          {optometryRecords.length === 0 ? (
            <div className="empty-state">暂无验光单</div>
          ) : (
            optometryRecords.map(record => (
              <div
                key={record.id}
                className={`list-item ${selectedCustomer?.id === record.id ? 'selected' : ''}`}
                onClick={() => setSelectedCustomer(record)}
              >
                <div className="item-title">
                  {record.customer_name} - {record.id}
                  <span className={getStatusClass(record.status)} style={{ marginLeft: 8 }}>
                    {statusLabels[record.status]}
                  </span>
                </div>
                <div className="item-meta">
                  <span>{record.store}</span>
                  <span>{record.optometrist}</span>
                  <span>{formatDate(record.created_at)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>🔍 客户详情与全链路追踪</h3>
          {selectedCustomer && currentRole !== 'optometrist' && (
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setShowTransferModal(true)}
            >
              + 创建调拨
            </button>
          )}
        </div>
        <div className="card-content">
          {selectedCustomer ? (
            <div>
              <div className="detail-section">
                <h4>基本信息</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <small style={{ color: '#94a3b8' }}>客户姓名</small>
                    <div style={{ fontWeight: 500 }}>{selectedCustomer.customer_name}</div>
                  </div>
                  <div>
                    <small style={{ color: '#94a3b8' }}>联系电话</small>
                    <div style={{ fontWeight: 500 }}>{selectedCustomer.customer_phone}</div>
                  </div>
                  <div>
                    <small style={{ color: '#94a3b8' }}>门店</small>
                    <div style={{ fontWeight: 500 }}>{selectedCustomer.store}</div>
                  </div>
                  <div>
                    <small style={{ color: '#94a3b8' }}>验光师</small>
                    <div style={{ fontWeight: 500 }}>{selectedCustomer.optometrist}</div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>验光处方</h4>
                <div className="prescription-grid">
                  <div className="prescription-card">
                    <h5>👁️ 左眼 (OS)</h5>
                    <div className="prescription-values">
                      <div className="prescription-value">
                        <label>球镜 SPH</label>
                        {selectedCustomer.left_sph > 0 ? '+' : ''}{selectedCustomer.left_sph}
                      </div>
                      <div className="prescription-value">
                        <label>柱镜 CYL</label>
                        {selectedCustomer.left_cyl !== 0 ? (selectedCustomer.left_cyl > 0 ? '+' : '') + selectedCustomer.left_cyl : '平光'}
                      </div>
                      <div className="prescription-value">
                        <label>轴位 AXIS</label>
                        {selectedCustomer.left_axis}°
                      </div>
                      {selectedCustomer.left_add && (
                        <div className="prescription-value">
                          <label>下加光 ADD</label>
                          +{selectedCustomer.left_add}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="prescription-card">
                    <h5>👁️ 右眼 (OD)</h5>
                    <div className="prescription-values">
                      <div className="prescription-value">
                        <label>球镜 SPH</label>
                        {selectedCustomer.right_sph > 0 ? '+' : ''}{selectedCustomer.right_sph}
                      </div>
                      <div className="prescription-value">
                        <label>柱镜 CYL</label>
                        {selectedCustomer.right_cyl !== 0 ? (selectedCustomer.right_cyl > 0 ? '+' : '') + selectedCustomer.right_cyl : '平光'}
                      </div>
                      <div className="prescription-value">
                        <label>轴位 AXIS</label>
                        {selectedCustomer.right_axis}°
                      </div>
                      {selectedCustomer.right_add && (
                        <div className="prescription-value">
                          <label>下加光 ADD</label>
                          +{selectedCustomer.right_add}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <span style={{ color: '#64748b', fontSize: 13 }}>瞳距 PD: </span>
                  <span style={{ fontWeight: 500 }}>{selectedCustomer.pd} mm</span>
                  <span style={{ marginLeft: 16, color: '#64748b', fontSize: 13 }}>镜片类型: </span>
                  <span style={{ fontWeight: 500 }}>{selectedCustomer.lens_brand} {selectedCustomer.lens_type}</span>
                </div>
              </div>

              <div className="detail-section">
                <h4>📈 全链路时间线</h4>
                <div className="timeline">
                  {getCustomerTimeline(selectedCustomer).map((item, idx) => (
                    <div key={idx} className={`timeline-item ${item.type}`}>
                      <div className="timeline-content">
                        <h5>{item.title}</h5>
                        <p>{item.description}</p>
                        {item.handler && (
                          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                            👤 处理人: {item.handler}{item.progress && ` | 📊 进度: ${item.progress}`}
                          </p>
                        )}
                        <div className="timeline-time">{item.time ? formatDate(item.time) : '-'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {refundRecords.find(r => r.optometry_id === selectedCustomer.id)?.status === 'pending' && currentRole === 'manager' && (
                <div className="detail-section">
                  <div style={{ 
                    background: '#fef3c7', 
                    padding: 16, 
                    borderRadius: 8, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <div>
                      <strong>💰 退款待审批</strong>
                      <p style={{ fontSize: 13, color: '#92400e', marginTop: 4 }}>
                        ¥{refundRecords.find(r => r.optometry_id === selectedCustomer.id)?.amount} - {refundRecords.find(r => r.optometry_id === selectedCustomer.id)?.reason}
                      </p>
                    </div>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleApproveRefund(refundRecords.find(r => r.optometry_id === selectedCustomer.id)?.id)}
                    >
                      批准退款
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">👈 请从左侧选择一个验光单查看详情</div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>🚚 进行中的调拨</h3>
        </div>
        <div className="card-content">
          {transferOrders.filter(t => t.status !== 'received').length === 0 ? (
            <div className="empty-state">暂无进行中的调拨</div>
          ) : (
            transferOrders.filter(t => t.status !== 'received').map(order => (
              <div key={order.id} className="list-item">
                <div className="item-title">
                  {order.id}
                  <span className={getStatusClass(order.status)} style={{ marginLeft: 8 }}>
                    {order.status === 'pending' ? '待发货' : 
                     order.status === 'shipped' ? '运输中' : 
                     order.status === 'lost' ? '已丢失' : order.status}
                  </span>
                </div>
                <div className="item-meta">
                  <span>{order.from_store} → {order.to_store}</span>
                  <span>{order.lens_name}</span>
                  <span>x{order.quantity}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>⚠️ 问题单（返修/退款）</h3>
        </div>
        <div className="card-content">
          {[...repairRecords.map(r => ({ ...r, type: 'repair' })), 
            ...refundRecords.map(r => ({ ...r, type: 'refund' }))].length === 0 ? (
            <div className="empty-state">暂无问题单</div>
          ) : (
            [...repairRecords.map(r => ({ ...r, type: 'repair' })), 
              ...refundRecords.map(r => ({ ...r, type: 'refund' }))].map(record => (
              <div key={record.id} className="list-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div className="item-title">
                      {record.type === 'repair' ? '🔧 返修单' : '💰 退款单'} - {record.id}
                      <span className={`status-badge ${
                        record.status === 'in_progress' || record.status === 'pending' 
                          ? 'status-pending' : 'status-completed'
                      }`} style={{ marginLeft: 8 }}>
                        {record.status === 'in_progress' ? '处理中' : 
                         record.status === 'pending' ? '待审批' : '已完成'}
                      </span>
                    </div>
                    <div className="item-meta">
                      <span>验光单: {record.optometry_id}</span>
                      <span>处理人: {record.created_by}</span>
                      <span>{record.type === 'repair' ? record.reason : record.reason}</span>
                      {record.type === 'refund' && <span>金额: ¥{record.amount}</span>}
                    </div>
                  </div>
                  {record.type === 'refund' && record.status === 'pending' && currentRole === 'manager' && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleApproveRefund(record.id)}
                      style={{ marginLeft: 12 }}
                    >
                      批准
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Workbench
