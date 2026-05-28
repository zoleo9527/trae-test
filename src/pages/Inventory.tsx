import { useState } from 'react'
import { Search, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Modal from '../components/Modal'
import { useApp } from '../store/AppContext'
import { formatDate } from '../utils'

export default function Inventory() {
  const { inventory, inventoryRecords, currentUser, addInventoryRecord, addTimelineEntry } = useApp()
  const isStationMaster = currentUser.role === 'station_master'
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [adjustData, setAdjustData] = useState({
    itemType: 'water' as 'water' | 'bucket',
    type: 'adjust' as 'in' | 'out' | 'adjust',
    quantity: 0,
    notes: '',
  })

  const filteredRecords = inventoryRecords.filter(record => {
    const matchesSearch = record.recordNo.includes(searchTerm) ||
      record.operatorName.includes(searchTerm) ||
      record.notes?.includes(searchTerm)
    const matchesType = typeFilter === 'all' || record.type === typeFilter
    return matchesSearch && matchesType
  })

  const handleAdjust = () => {
    const item = inventory.find(i => i.itemType === adjustData.itemType)
    const now = new Date().toISOString()
    const record = {
      id: `ir${Date.now()}`,
      recordNo: `INV${Date.now()}`,
      ...adjustData,
      beforeQuantity: item?.totalQuantity || 0,
      afterQuantity: adjustData.type === 'in'
        ? (item?.totalQuantity || 0) + adjustData.quantity
        : (item?.totalQuantity || 0) - adjustData.quantity,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatedAt: now,
    }
    addInventoryRecord(record)
    addTimelineEntry({
      id: `t${Date.now()}`,
      actionType: 'inventory_adjusted',
      relatedId: record.id,
      relatedType: 'inventory',
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      timestamp: now,
      description: `库存调整：${adjustData.itemType === 'water' ? '桶装水' : '空桶'} ${adjustData.type === 'in' ? '+' : '-'}${adjustData.quantity}`,
      details: {
        itemType: adjustData.itemType,
        quantity: adjustData.type === 'in' ? adjustData.quantity : -adjustData.quantity,
        reason: adjustData.notes,
      },
    })
    setIsAdjustModalOpen(false)
    setAdjustData({
      itemType: 'water',
      type: 'adjust',
      quantity: 0,
      notes: '',
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'in': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'out': return <TrendingDown className="w-4 h-4 text-red-600" />
      default: return <Minus className="w-4 h-4 text-yellow-600" />
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case 'in': return '入库'
      case 'out': return '出库'
      default: return '调整'
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {inventory.map(item => (
          <div key={item.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {item.itemType === 'water' ? '桶装水库存' : '空桶库存'}
              </h3>
              <span className="text-xs text-gray-400">
                更新于 {formatDate(item.lastUpdated, 'MM-dd HH:mm')}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">总计</p>
                <p className="text-2xl font-bold text-gray-800">{item.totalQuantity}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-500">可用</p>
                <p className="text-2xl font-bold text-green-600">{item.availableQuantity}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-500">损坏</p>
                <p className="text-2xl font-bold text-red-600">{item.damagedQuantity}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索记录..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-64"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input w-32"
          >
            <option value="all">全部类型</option>
            <option value="in">入库</option>
            <option value="out">出库</option>
            <option value="adjust">调整</option>
          </select>
        </div>
        {isStationMaster && (
          <button
            onClick={() => setIsAdjustModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            库存调整
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">记录编号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">物品</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">数量变动</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">变动前</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">变动后</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">操作人</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">操作时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">备注</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRecords.map(record => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-800">{record.recordNo}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    {getTypeIcon(record.type)}
                    <span className="text-sm">{getTypeName(record.type)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {record.itemType === 'water' ? '桶装水' : '空桶'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={
                    record.type === 'in' ? 'text-green-600' :
                    record.type === 'out' ? 'text-red-600' :
                    record.quantity > 0 ? 'text-green-600' : 'text-red-600'
                  }>
                    {record.type === 'in' ? '+' : record.type === 'out' ? '-' : ''}
                    {record.quantity}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{record.beforeQuantity}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-800">{record.afterQuantity}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{record.operatorName}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">
                    {formatDate(record.operatedAt)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500 max-w-xs truncate block">
                    {record.notes || '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="库存调整"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">物品类型</label>
            <select
              value={adjustData.itemType}
              onChange={(e) => setAdjustData({ ...adjustData, itemType: e.target.value as 'water' | 'bucket' })}
              className="input"
            >
              <option value="water">桶装水</option>
              <option value="bucket">空桶</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">调整类型</label>
            <select
              value={adjustData.type}
              onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value as 'in' | 'out' | 'adjust' })}
              className="input"
            >
              <option value="in">入库</option>
              <option value="out">出库</option>
              <option value="adjust">盘盈/盘亏</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
            <input
              type="number"
              min="0"
              value={adjustData.quantity}
              onChange={(e) => setAdjustData({ ...adjustData, quantity: parseInt(e.target.value) })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">调整原因</label>
            <textarea
              value={adjustData.notes}
              onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
              className="input"
              rows={3}
              placeholder="请说明调整原因..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsAdjustModalOpen(false)} className="btn-secondary">取消</button>
            <button onClick={handleAdjust} className="btn-primary">确认调整</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
