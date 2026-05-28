import { useState } from 'react'
import { Search, Play, MapPin, CheckCircle } from 'lucide-react'
import Modal from '../components/Modal'
import { useApp } from '../store/AppContext'
import { Delivery } from '../types'
import { formatDate, getStatusColor, getDeliveryStatusName, generateReturnNo } from '../utils'

export default function Deliveries() {
  const { deliveries, orders, inventory, currentUser, updateDelivery, updateOrder, addBucketReturn, addInventoryRecord, addTimelineEntry, bucketReturns } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [completeData, setCompleteData] = useState({
    actualWaterDelivered: 0,
    actualBucketsCollected: 0,
    signName: '',
    hasDispute: false,
    disputeNote: '',
  })

  const myDeliveries = currentUser.role === 'driver'
    ? deliveries.filter(d => d.driverId === currentUser.id)
    : deliveries

  const filteredDeliveries = myDeliveries.filter(delivery => {
    const matchesSearch = delivery.customerName.includes(searchTerm) ||
      delivery.deliveryNo.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStartDelivery = (delivery: Delivery) => {
    const now = new Date().toISOString()
    const updated = { ...delivery, status: 'in_transit' as const, startedAt: now }
    updateDelivery(updated)
    
    const relatedOrder = orders.find(o => o.id === delivery.orderId)
    if (relatedOrder) {
      updateOrder({ ...relatedOrder, status: 'delivering' as const })
    }
    
    addTimelineEntry({
      id: `t${Date.now()}`,
      actionType: 'delivery_started',
      relatedId: delivery.id,
      relatedType: 'delivery',
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      timestamp: now,
      description: '开始配送',
      details: {},
    })
  }

  const handleArrive = (delivery: Delivery) => {
    const updated = { ...delivery, status: 'arrived' as const, arrivedAt: new Date().toISOString() }
    updateDelivery(updated)
    addTimelineEntry({
      id: `t${Date.now()}`,
      actionType: 'delivery_arrived',
      relatedId: delivery.id,
      relatedType: 'delivery',
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      timestamp: new Date().toISOString(),
      description: '到达客户地址',
      details: {},
    })
  }

  const handleOpenCompleteModal = (delivery: Delivery) => {
    setSelectedDelivery(delivery)
    setCompleteData({
      actualWaterDelivered: delivery.waterQuantity,
      actualBucketsCollected: delivery.bucketQuantity,
      signName: delivery.customerName,
      hasDispute: false,
      disputeNote: '',
    })
    setIsCompleteModalOpen(true)
  }

  const handleCompleteDelivery = () => {
    if (!selectedDelivery) return

    const now = new Date().toISOString()
    const updatedDelivery = {
      ...selectedDelivery,
      status: 'completed' as const,
      completedAt: now,
      signTime: now,
      ...completeData,
    }
    updateDelivery(updatedDelivery)

    const relatedOrder = orders.find(o => o.id === selectedDelivery.orderId)
    if (relatedOrder) {
      updateOrder({ ...relatedOrder, status: 'completed' as const, completedAt: now })
    }

    const existingReturn = bucketReturns.find(br => br.deliveryId === selectedDelivery.id)
    if (!existingReturn) {
      const newReturn = {
        id: `br${Date.now()}`,
        returnNo: generateReturnNo(),
        deliveryId: selectedDelivery.id,
        orderId: selectedDelivery.orderId,
        orderNo: selectedDelivery.orderNo,
        driverId: selectedDelivery.driverId,
        driverName: selectedDelivery.driverName,
        customerName: selectedDelivery.customerName,
        expectedQuantity: selectedDelivery.bucketQuantity,
        actualQuantity: completeData.actualBucketsCollected,
        status: completeData.hasDispute ? 'disputed' as const : 'collected' as const,
        collectedAt: now,
        photos: ['photo.jpg'],
        bucketLossCount: completeData.hasDispute
          ? selectedDelivery.bucketQuantity - completeData.actualBucketsCollected
          : 0,
        disputeReason: completeData.hasDispute ? completeData.disputeNote : undefined,
      }
      addBucketReturn(newReturn)

      const waterInventory = inventory.find(i => i.itemType === 'water')
      const bucketInventory = inventory.find(i => i.itemType === 'bucket')

      if (completeData.actualWaterDelivered > 0 && waterInventory) {
        addInventoryRecord({
          id: `ir${Date.now()}`,
          recordNo: `INV${Date.now()}`,
          type: 'out',
          itemType: 'water',
          quantity: -completeData.actualWaterDelivered,
          beforeQuantity: waterInventory.totalQuantity,
          afterQuantity: waterInventory.totalQuantity - completeData.actualWaterDelivered,
          relatedOrderId: selectedDelivery.orderId,
          relatedDeliveryId: selectedDelivery.id,
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          operatedAt: now,
          notes: `配送出库-${selectedDelivery.customerName}订单`,
        })
      }

      if (completeData.actualBucketsCollected > 0 && bucketInventory && !completeData.hasDispute) {
        addInventoryRecord({
          id: `ir${Date.now() + 1}`,
          recordNo: `INV${Date.now() + 1}`,
          type: 'in',
          itemType: 'bucket',
          quantity: completeData.actualBucketsCollected,
          beforeQuantity: bucketInventory.totalQuantity,
          afterQuantity: bucketInventory.totalQuantity + completeData.actualBucketsCollected,
          relatedOrderId: selectedDelivery.orderId,
          relatedDeliveryId: selectedDelivery.id,
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          operatedAt: now,
          notes: `空桶回收入库-${selectedDelivery.customerName}订单`,
        })
      }

      if (completeData.hasDispute) {
        addTimelineEntry({
          id: `t${Date.now()}`,
          actionType: 'dispute_raised',
          relatedId: newReturn.id,
          relatedType: 'bucket_return',
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          timestamp: now,
          description: '空桶数量争议',
          details: {
            expected: selectedDelivery.bucketQuantity,
            actual: completeData.actualBucketsCollected,
            reason: completeData.disputeNote,
          },
        })
      } else {
        addTimelineEntry({
          id: `t${Date.now()}`,
          actionType: 'buckets_collected',
          relatedId: newReturn.id,
          relatedType: 'bucket_return',
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          timestamp: now,
          description: `回收空桶${completeData.actualBucketsCollected}个`,
          details: { quantity: completeData.actualBucketsCollected },
        })
      }
    }

    addTimelineEntry({
      id: `t${Date.now()}`,
      actionType: 'delivery_completed',
      relatedId: selectedDelivery.id,
      relatedType: 'delivery',
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      timestamp: now,
      description: '配送完成',
      details: { signName: completeData.signName },
    })

    setIsCompleteModalOpen(false)
    setSelectedDelivery(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索配送..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-64"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-32"
        >
          <option value="all">全部状态</option>
          <option value="pending">待开始</option>
          <option value="in_transit">配送中</option>
          <option value="arrived">已到达</option>
          <option value="completed">已完成</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDeliveries.map(delivery => (
          <div key={delivery.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-gray-800">{delivery.deliveryNo}</span>
              <span className={`badge ${getStatusColor(delivery.status)}`}>
                {getDeliveryStatusName(delivery.status)}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">{delivery.customerName}</p>
                  <p className="text-sm text-gray-500">{delivery.customerPhone}</p>
                  <p className="text-sm text-gray-500 line-clamp-1">{delivery.customerAddress}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">水: {delivery.waterQuantity}桶</span>
                <span className="text-gray-500">桶: {delivery.bucketQuantity}个</span>
              </div>
              <p className="text-xs text-gray-400">配送员: {delivery.driverName}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              {delivery.status === 'pending' && (
                <button
                  onClick={() => handleStartDelivery(delivery)}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  开始配送
                </button>
              )}
              {delivery.status === 'in_transit' && (
                <button
                  onClick={() => handleArrive(delivery)}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  确认到达
                </button>
              )}
              {delivery.status === 'arrived' && (
                <button
                  onClick={() => handleOpenCompleteModal(delivery)}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  完成配送
                </button>
              )}
              {delivery.status === 'completed' && (
                <div className="text-center text-sm text-gray-500">
                  {delivery.signName} 签收于 {formatDate(delivery.signTime || '', 'MM-dd HH:mm')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title="完成配送"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">实际配送水</label>
              <input
                type="number"
                value={completeData.actualWaterDelivered}
                onChange={(e) => setCompleteData({ ...completeData, actualWaterDelivered: parseInt(e.target.value) })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">实际回收桶</label>
              <input
                type="number"
                value={completeData.actualBucketsCollected}
                onChange={(e) => setCompleteData({ ...completeData, actualBucketsCollected: parseInt(e.target.value) })}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">签收人</label>
            <input
              type="text"
              value={completeData.signName}
              onChange={(e) => setCompleteData({ ...completeData, signName: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={completeData.hasDispute}
                onChange={(e) => setCompleteData({ ...completeData, hasDispute: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">有空桶数量争议</span>
            </label>
          </div>
          {completeData.hasDispute && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">争议说明</label>
              <textarea
                value={completeData.disputeNote}
                onChange={(e) => setCompleteData({ ...completeData, disputeNote: e.target.value })}
                className="input"
                rows={3}
                placeholder="请说明争议原因..."
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsCompleteModalOpen(false)} className="btn-secondary">取消</button>
            <button onClick={handleCompleteDelivery} className="btn-primary">确认完成</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
