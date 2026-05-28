import { useState, useRef } from 'react'
import { Search, Play, MapPin, CheckCircle, Upload, Image } from 'lucide-react'
import Modal from '../components/Modal'
import { useApp } from '../store/AppContext'
import { Delivery, PhotoInfo } from '../types'
import { formatDate, getStatusColor, getDeliveryStatusName, generateReturnNo } from '../utils'

export default function Deliveries() {
  const { deliveries, orders, inventory, currentUser, updateDelivery, updateOrder, addBucketReturn, addInventoryRecord, addTimelineEntry, bucketReturns } = useApp()
  const isDriver = currentUser.role === 'driver'
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [completeData, setCompleteData] = useState({
    actualWaterDelivered: 0,
    actualBucketsCollected: 0,
    signName: '',
    hasDispute: false,
    disputeNote: '',
  })
  const [signPhotos, setSignPhotos] = useState<PhotoInfo[]>([])
  const [disputePhotos, setDisputePhotos] = useState<PhotoInfo[]>([])
  const signFileRef = useRef<HTMLInputElement>(null)
  const disputeFileRef = useRef<HTMLInputElement>(null)

  const myDeliveries = currentUser.role === 'driver'
    ? deliveries.filter(d => d.driverId === currentUser.id)
    : deliveries

  const filteredDeliveries = myDeliveries.filter(delivery => {
    const matchesSearch = delivery.customerName.includes(searchTerm) ||
      delivery.deliveryNo.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handlePhotoUpload = (
    files: FileList | null,
    label: string,
    setter: React.Dispatch<React.SetStateAction<PhotoInfo[]>>
  ) => {
    if (!files) return
    const newPhotos: PhotoInfo[] = Array.from(files).map((file, i) => ({
      id: `ph_${Date.now()}_${i}`,
      url: URL.createObjectURL(file),
      label,
      uploadedBy: currentUser.id,
      uploadedAt: new Date().toISOString(),
    }))
    setter(prev => [...prev, ...newPhotos])
  }

  const handleRemovePhoto = (photoId: string, setter: React.Dispatch<React.SetStateAction<PhotoInfo[]>>) => {
    setter(prev => prev.filter(p => p.id !== photoId))
  }

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
    setSignPhotos([])
    setDisputePhotos([])
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
      signPhotos,
      disputePhotos: completeData.hasDispute ? disputePhotos : [],
      ...completeData,
    }
    updateDelivery(updatedDelivery)

    const relatedOrder = orders.find(o => o.id === selectedDelivery.orderId)
    if (relatedOrder) {
      updateOrder({ ...relatedOrder, status: 'completed' as const, completedAt: now })
    }

    const existingReturn = bucketReturns.find(br => br.deliveryId === selectedDelivery.id)
    if (!existingReturn) {
      const returnPhotos = completeData.hasDispute ? disputePhotos : signPhotos
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
        photos: returnPhotos,
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
            expectedQuantity: selectedDelivery.bucketQuantity,
            actualQuantity: completeData.actualBucketsCollected,
            lossQuantity: selectedDelivery.bucketQuantity - completeData.actualBucketsCollected,
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
          details: { 
            expectedQuantity: selectedDelivery.bucketQuantity,
            actualQuantity: completeData.actualBucketsCollected,
            quantity: completeData.actualBucketsCollected,
          },
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
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-400">配送员: {delivery.driverName}</p>
                {(delivery.signPhotos.length > 0 || delivery.disputePhotos.length > 0) && (
                  <div className="flex items-center gap-1 text-xs text-blue-500">
                    <Image className="w-3 h-3" />
                    <span>{delivery.signPhotos.length + delivery.disputePhotos.length}张照片</span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              {delivery.status === 'pending' && isDriver && (
                <button
                  onClick={() => handleStartDelivery(delivery)}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  开始配送
                </button>
              )}
              {delivery.status === 'pending' && !isDriver && (
                <p className="text-xs text-gray-400 text-center">待司机开始配送</p>
              )}
              {delivery.status === 'in_transit' && isDriver && (
                <button
                  onClick={() => handleArrive(delivery)}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  确认到达
                </button>
              )}
              {delivery.status === 'in_transit' && !isDriver && (
                <p className="text-xs text-blue-500 text-center">配送中</p>
              )}
              {delivery.status === 'arrived' && isDriver && (
                <button
                  onClick={() => handleOpenCompleteModal(delivery)}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  完成配送
                </button>
              )}
              {delivery.status === 'arrived' && !isDriver && (
                <p className="text-xs text-orange-500 text-center">已到达，待司机完成签收</p>
              )}
              {delivery.status === 'completed' && (
                <button
                  onClick={() => { setSelectedDelivery(delivery); setIsDetailModalOpen(true) }}
                  className="w-full text-sm text-blue-600 hover:text-blue-700"
                >
                  {delivery.signName} 签收于 {formatDate(delivery.signTime || '', 'MM-dd HH:mm')} · 查看详情
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title="完成配送"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">实际配送水</label>
              <input
                type="number"
                value={completeData.actualWaterDelivered}
                onChange={(e) => setCompleteData({ ...completeData, actualWaterDelivered: parseInt(e.target.value) || 0 })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">实际回收桶</label>
              <input
                type="number"
                value={completeData.actualBucketsCollected}
                onChange={(e) => setCompleteData({ ...completeData, actualBucketsCollected: parseInt(e.target.value) || 0 })}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">签收照片</label>
            <div className="flex items-start gap-3">
              <div className="flex flex-wrap gap-2">
                {signPhotos.map(photo => (
                  <div key={photo.id} className="relative group">
                    <img src={photo.url} alt={photo.label} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                    <button
                      onClick={() => handleRemovePhoto(photo.id, setSignPhotos)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => signFileRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-400 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs mt-1">上传</span>
                </button>
              </div>
              <input
                ref={signFileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handlePhotoUpload(e.target.files, '签收照片', setSignPhotos)}
              />
            </div>
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
            <>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">争议现场照片</label>
                <div className="flex items-start gap-3">
                  <div className="flex flex-wrap gap-2">
                    {disputePhotos.map(photo => (
                      <div key={photo.id} className="relative group">
                        <img src={photo.url} alt={photo.label} className="w-20 h-20 object-cover rounded-lg border border-red-200" />
                        <button
                          onClick={() => handleRemovePhoto(photo.id, setDisputePhotos)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => disputeFileRef.current?.click()}
                      className="w-20 h-20 border-2 border-dashed border-red-300 rounded-lg flex flex-col items-center justify-center text-red-400 hover:text-red-500 hover:border-red-400 transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      <span className="text-xs mt-1">上传</span>
                    </button>
                  </div>
                  <input
                    ref={disputeFileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e.target.files, '争议现场照片', setDisputePhotos)}
                  />
                </div>
              </div>
            </>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsCompleteModalOpen(false)} className="btn-secondary">取消</button>
            <button onClick={handleCompleteDelivery} className="btn-primary">确认完成</button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setSelectedDelivery(null) }}
        title="配送详情"
        size="lg"
      >
        {selectedDelivery && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">配送单号</p>
                <p className="font-medium">{selectedDelivery.deliveryNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">状态</p>
                <span className={`badge ${getStatusColor(selectedDelivery.status)}`}>
                  {getDeliveryStatusName(selectedDelivery.status)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">客户</p>
                <p className="font-medium">{selectedDelivery.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">配送员</p>
                <p className="font-medium">{selectedDelivery.driverName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">签收人</p>
                <p className="font-medium">{selectedDelivery.signName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">签收时间</p>
                <p className="font-medium">{selectedDelivery.signTime ? formatDate(selectedDelivery.signTime) : '-'}</p>
              </div>
            </div>

            {selectedDelivery.signPhotos.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">签收照片</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDelivery.signPhotos.map(photo => (
                    <img key={photo.id} src={photo.url} alt={photo.label} className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                  ))}
                </div>
              </div>
            )}

            {selectedDelivery.disputePhotos.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">争议现场照片</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDelivery.disputePhotos.map(photo => (
                    <img key={photo.id} src={photo.url} alt={photo.label} className="w-24 h-24 object-cover rounded-lg border border-red-200" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
