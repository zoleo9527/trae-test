import React, { useState } from 'react'
import { useStore } from '../store'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const Inventory = () => {
  const { lensInventory, loading, setShowTransferModal } = useStore()
  const [filterStore, setFilterStore] = useState('all')
  const [filterBrand, setFilterBrand] = useState('all')

  const stores = [...new Set(lensInventory.map(l => l.store))]
  const brands = [...new Set(lensInventory.map(l => l.brand))]

  const filteredInventory = lensInventory.filter(l => {
    if (filterStore !== 'all' && l.store !== filterStore) return false
    if (filterBrand !== 'all' && l.brand !== filterBrand) return false
    return true
  })

  const getStockStatus = (quantity, minStock) => {
    if (quantity === 0) return { class: 'stock-out', text: '缺货' }
    if (quantity <= minStock) return { class: 'stock-low', text: '预警' }
    return { class: '', text: '正常' }
  }

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd HH:mm', { locale: zhCN })
    } catch {
      return dateStr
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
    <div>
      <div className="card">
        <div className="card-header">
          <h3>📦 库存列表</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <select 
              value={filterStore}
              onChange={(e) => setFilterStore(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}
            >
              <option value="all">全部门店</option>
              {stores.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select 
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}
            >
              <option value="all">全部品牌</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={() => setShowTransferModal(true)}>
              + 新建调拨
            </button>
          </div>
        </div>
        <div className="card-content" style={{ maxHeight: 'none', padding: 0 }}>
          <table className="inventory-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>镜片名称</th>
                <th>品牌</th>
                <th>度数</th>
                <th>门店</th>
                <th>库位</th>
                <th>库存</th>
                <th>最低库存</th>
                <th>状态</th>
                <th>更新时间</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(item => {
                const status = getStockStatus(item.quantity, item.min_stock)
                return (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'monospace' }}>{item.sku}</td>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td>{item.brand}</td>
                    <td>
                      SPH {item.sph > 0 ? '+' : ''}{item.sph}
                      {item.cyl !== 0 && ` / CYL ${item.cyl > 0 ? '+' : ''}${item.cyl} x ${item.axis}°`}
                    </td>
                    <td>{item.store}</td>
                    <td>{item.location}</td>
                    <td className={status.class}>{item.quantity}</td>
                    <td>{item.min_stock}</td>
                    <td>
                      <span className={`status-badge ${
                        status.text === '缺货' ? 'status-lost' : 
                        status.text === '预警' ? 'status-pending' : 'status-completed'
                      }`}>
                        {status.text}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{formatDate(item.last_updated)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h3>📊 库存统计</h3>
        </div>
        <div className="card-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{lensInventory.length}</div>
              <div className="stat-label">SKU 总数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#ef4444' }}>
                {lensInventory.filter(l => l.quantity === 0).length}
              </div>
              <div className="stat-label">缺货 SKU</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#f59e0b' }}>
                {lensInventory.filter(l => l.quantity > 0 && l.quantity <= l.min_stock).length}
              </div>
              <div className="stat-label">库存预警</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#22c55e' }}>
                {lensInventory.filter(l => l.quantity > l.min_stock).length}
              </div>
              <div className="stat-label">库存正常</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Inventory
