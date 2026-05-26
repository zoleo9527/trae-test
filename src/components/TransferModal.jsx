import React, { useState } from 'react'
import { useStore } from '../store'

const TransferModal = () => {
  const { 
    setShowTransferModal, 
    createTransfer, 
    selectedCustomer,
    lensInventory,
    currentRole
  } = useStore()
  
  const [formData, setFormData] = useState({
    from_store: '总店',
    to_store: '分店A',
    lens_sku: '',
    lens_name: '',
    quantity: 1,
    remarks: '',
  })

  const stores = [...new Set(lensInventory.map(l => l.store))]
  const availableLenses = lensInventory.filter(l => l.store === formData.from_store)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.lens_sku) {
      alert('请选择镜片')
      return
    }
    try {
      await createTransfer({
        optometry_id: selectedCustomer?.id || null,
        from_store: formData.from_store,
        to_store: formData.to_store,
        lens_sku: formData.lens_sku,
        lens_name: formData.lens_name,
        quantity: formData.quantity,
        created_by: currentRole === 'manager' ? '店经理' : currentRole === 'processor' ? '加工跟单' : '验光师',
        remarks: formData.remarks || null,
      })
      setShowTransferModal(false)
    } catch (error) {
      alert('创建调拨失败: ' + error)
    }
  }

  const handleLensChange = (sku) => {
    const lens = lensInventory.find(l => l.sku === sku)
    if (lens) {
      setFormData({ ...formData, lens_sku: sku, lens_name: lens.name })
    }
  }

  return (
    <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📦 创建镜片调拨单</h3>
          <button className="close-btn" onClick={() => setShowTransferModal(false)}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {selectedCustomer && (
              <div style={{ 
                background: '#eff6ff', 
                padding: 12, 
                borderRadius: 8, 
                marginBottom: 16,
                fontSize: 13
              }}>
                <strong>关联验光单:</strong> {selectedCustomer.id} - {selectedCustomer.customer_name}
              </div>
            )}
            <div className="form-group">
              <label>调出门店</label>
              <select 
                value={formData.from_store}
                onChange={(e) => setFormData({ ...formData, from_store: e.target.value, lens_sku: '', lens_name: '' })}
              >
                {stores.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>调入门店</label>
              <select 
                value={formData.to_store}
                onChange={(e) => setFormData({ ...formData, to_store: e.target.value })}
              >
                {stores.filter(s => s !== formData.from_store).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>选择镜片</label>
              <select 
                value={formData.lens_sku}
                onChange={(e) => handleLensChange(e.target.value)}
              >
                <option value="">请选择镜片</option>
                {availableLenses.map(l => (
                  <option key={l.sku} value={l.sku} disabled={l.quantity === 0}>
                    {l.name} (库存: {l.quantity})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>调拨数量</label>
              <input 
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="form-group">
              <label>备注</label>
              <textarea 
                rows="3"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="选填，如客户紧急需求、特殊处理等"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              创建调拨单
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TransferModal
