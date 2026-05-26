import React from 'react'
import { useStore } from '../store'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const AlertPanel = () => {
  const { stockAlerts, acknowledgeAlert, setShowAlertPanel } = useStore()

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'MM-dd HH:mm', { locale: zhCN })
    } catch {
      return dateStr
    }
  }

  const unacknowledgedAlerts = stockAlerts.filter(a => !a.acknowledged)

  return (
    <div className="alert-panel">
      <div className="alert-panel-header">
        <h3>🔔 库存预警</h3>
        <button className="close-btn" onClick={() => setShowAlertPanel(false)}>&times;</button>
      </div>
      <div className="alert-panel-content">
        {unacknowledgedAlerts.length === 0 ? (
          <div className="empty-state">暂无预警</div>
        ) : (
          unacknowledgedAlerts.map(alert => (
            <div 
              key={alert.id} 
              className={`alert-item ${alert.alert_type === 'low_stock' ? 'warning' : ''}`}
            >
              <h5>
                {alert.alert_type === 'out_of_stock' ? '🚨 缺货预警' : '⚠️ 库存预警'}
              </h5>
              <p>
                <strong>{alert.lens_name}</strong><br/>
                {alert.store} | 当前库存: {alert.current_quantity} / 最低库存: {alert.min_stock}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{formatDate(alert.created_at)}</span>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => acknowledgeAlert(alert.id)}
                >
                  已知晓
                </button>
              </div>
            </div>
          ))
        )}
        
        {stockAlerts.filter(a => a.acknowledged).length > 0 && (
          <>
            <h4 style={{ margin: '16px 0 8px', color: '#64748b', fontSize: 13 }}>已处理预警</h4>
            {stockAlerts.filter(a => a.acknowledged).map(alert => (
              <div 
                key={alert.id} 
                className={`alert-item ${alert.alert_type === 'low_stock' ? 'warning' : ''}`}
                style={{ opacity: 0.6 }}
              >
                <h5>
                  {alert.alert_type === 'out_of_stock' ? '🚨 缺货预警' : '⚠️ 库存预警'}
                </h5>
                <p>
                  <strong>{alert.lens_name}</strong><br/>
                  {alert.store} | 当前库存: {alert.current_quantity}
                </p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

export default AlertPanel
