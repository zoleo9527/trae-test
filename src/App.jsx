import React, { useEffect } from 'react'
import { useStore } from './store'
import Workbench from './views/Workbench'
import Inventory from './views/Inventory'
import Transfers from './views/Transfers'
import TransfersModal from './components/TransferModal'
import AlertPanel from './components/AlertPanel'

const App = () => {
  const { 
    currentView, 
    currentRole, 
    setView, 
    setRole, 
    loadAllData,
    showTransferModal,
    showAlertPanel,
    setShowAlertPanel,
    stockAlerts,
    exportData
  } = useStore()

  useEffect(() => {
    loadAllData()
  }, [])

  const navItems = [
    { id: 'workbench', label: '统一工作台', icon: '📋' },
    { id: 'inventory', label: '库存管理', icon: '📦' },
    { id: 'transfers', label: '调拨记录', icon: '🚚' },
  ]

  const unacknowledgedAlerts = stockAlerts.filter(a => !a.acknowledged).length

  const handleExport = async () => {
    try {
      const data = await exportData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lens-inventory-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('导出失败: ' + error)
    }
  }

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>👓 镜片库存系统</h1>
        </div>
        <div className="sidebar-nav">
          {navItems.map(item => (
            <div
              key={item.id}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => setView(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <select 
            className="role-selector"
            value={currentRole}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="manager">店经理</option>
            <option value="optometrist">验光师</option>
            <option value="processor">加工跟单</option>
          </select>
        </div>
      </div>

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h2>
              {currentView === 'workbench' && '统一工作台'}
              {currentView === 'inventory' && '库存管理'}
              {currentView === 'transfers' && '调拨记录'}
            </h2>
          </div>
          <div className="topbar-right">
            <button className="btn btn-secondary btn-sm" onClick={handleExport}>
              📤 导出数据
            </button>
            <div 
              className="alert-badge"
              onClick={() => setShowAlertPanel(!showAlertPanel)}
            >
              🔔
              {unacknowledgedAlerts > 0 && (
                <span className="alert-count">{unacknowledgedAlerts}</span>
              )}
            </div>
          </div>
        </div>

        <div className="content-area">
          {currentView === 'workbench' && <Workbench />}
          {currentView === 'inventory' && <Inventory />}
          {currentView === 'transfers' && <Transfers />}
        </div>
      </div>

      {showTransferModal && <TransfersModal />}
      {showAlertPanel && <AlertPanel />}
    </div>
  )
}

export default App
