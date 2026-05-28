import { useState } from 'react'
import { Search, Camera, AlertCircle, Eye, Shield, ShieldCheck } from 'lucide-react'
import { useApp } from '@/store/AppContext'
import Modal from '@/components/Modal'
import { formatDate, getStatusColor, getBucketReturnStatusName } from '@/utils'
import type { BucketReturn, PhotoInfo } from '@/types'

export default function BucketReturns() {
  const { bucketReturns, deliveries, complaints, currentUser, updateBucketReturn, addTimelineEntry, addInventoryRecord, inventory } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedReturn, setSelectedReturn] = useState<BucketReturn | null>(null)
  const [resolveData, setResolveData] = useState({
    resolution: '',
    bucketLossCount: 0,
  })

  const isStationMaster = currentUser.role === 'station_master'
  const isDriver = currentUser.role === 'driver'
  const isCustomerService = currentUser.role === 'customer_service'

  const visibleReturns = bucketReturns.filter(br => {
    if (isDriver) return br.driverId === currentUser.id
    return true
  })

  const filteredReturns = visibleReturns.filter(br => {
    const matchesSearch = br.customerName.includes(searchTerm) ||
      br.returnNo.includes(searchTerm) ||
      br.orderNo.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || br.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleResolve = () => {
    if (!selectedReturn) return
    if (!isStationMaster) return

    const now = new Date().toISOString()
    const bucketInventory = inventory.find(i => i.itemType === 'bucket')
    const currentTotal = bucketInventory?.totalQuantity || 0

    const updated: BucketReturn = {
      ...selectedReturn,
      status: 'resolved',
      resolvedAt: now,
      resolvedBy: currentUser.name,
      resolution: resolveData.resolution,
      bucketLossCount: resolveData.bucketLossCount,
    }
    updateBucketReturn(updated)

    let runningTotal = currentTotal

    if (selectedReturn.actualQuantity > 0) {
      addInventoryRecord({
        id: `ir${Date.now()}`,
        recordNo: `INV${Date.now()}`,
        type: 'in',
        itemType: 'bucket',
        quantity: selectedReturn.actualQuantity,
        beforeQuantity: runningTotal,
        afterQuantity: runningTotal + selectedReturn.actualQuantity,
        relatedOrderId: selectedReturn.orderId,
        relatedDeliveryId: selectedReturn.deliveryId,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatedAt: now,
        notes: `空桶回收入库（争议解决）-${selectedReturn.customerName}订单，实收${selectedReturn.actualQuantity}个`,
      })
      runningTotal += selectedReturn.actualQuantity

      addTimelineEntry({
        id: `t${Date.now()}`,
        actionType: 'buckets_collected',
        relatedId: selectedReturn.id,
        relatedType: 'bucket_return',
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        timestamp: now,
        description: `争议解决：补记空桶入库${selectedReturn.actualQuantity}个`,
        details: { 
          expectedQuantity: selectedReturn.expectedQuantity,
          actualQuantity: selectedReturn.actualQuantity,
          quantity: selectedReturn.actualQuantity,
        },
      })
    }

    if (resolveData.bucketLossCount > 0) {
      addInventoryRecord({
        id: `ir${Date.now() + 1}`,
        recordNo: `INV${Date.now() + 1}`,
        type: 'adjust',
        itemType: 'bucket',
        quantity: -resolveData.bucketLossCount,
        beforeQuantity: runningTotal,
        afterQuantity: runningTotal - resolveData.bucketLossCount,
        relatedOrderId: selectedReturn.orderId,
        relatedDeliveryId: selectedReturn.deliveryId,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatedAt: now,
        notes: `空桶遗失调整-${selectedReturn.customerName}订单，遗失${resolveData.bucketLossCount}个`,
      })

      addTimelineEntry({
        id: `t${Date.now() + 1}`,
        actionType: 'inventory_adjusted',
        relatedId: selectedReturn.id,
        relatedType: 'bucket_return',
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        timestamp: now,
        description: `库存调整：空桶遗失${resolveData.bucketLossCount}个`,
        details: { 
          itemType: 'bucket', 
          quantity: -resolveData.bucketLossCount,
          expectedQuantity: selectedReturn.expectedQuantity,
          actualQuantity: selectedReturn.actualQuantity,
          lossQuantity: resolveData.bucketLossCount,
        },
      })
    }

    addTimelineEntry({
      id: `t${Date.now() + 2}`,
      actionType: 'complaint_resolved',
      relatedId: selectedReturn.id,
      relatedType: 'bucket_return',
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      timestamp: now,
      description: '争议已解决',
      details: { 
        resolution: resolveData.resolution,
        expectedQuantity: selectedReturn.expectedQuantity,
        actualQuantity: selectedReturn.actualQuantity,
        lossQuantity: resolveData.bucketLossCount,
      },
    })

    setSelectedReturn(null)
  }

  const getRelatedDeliveryPhotos = (br: BucketReturn): PhotoInfo[] => {
    const delivery = deliveries.find(d => d.id === br.deliveryId)
    if (!delivery) return []
    return [...delivery.signPhotos, ...delivery.disputePhotos]
  }

  const getRelatedComplaintPhotos = (br: BucketReturn): PhotoInfo[] => {
    const complaint = complaints.find(c => c.orderId === br.orderId)
    if (!complaint) return []
    return complaint.photos
  }

  const stats = {
    total: visibleReturns.length,
    collected: visibleReturns.filter(br => br.status === 'collected').length,
    disputed: visibleReturns.filter(br => br.status === 'disputed').length,
    resolved: visibleReturns.filter(br => br.status === 'resolved').length,
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">{isDriver ? '我的回收' : '总回收'}</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">正常回收</p>
          <p className="text-2xl font-bold text-green-600">{stats.collected}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">待处理争议</p>
          <p className="text-2xl font-bold text-red-600">{stats.disputed}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">已解决</p>
          <p className="text-2xl font-bold text-blue-600">{stats.resolved}</p>
        </div>
      </div>

      {isDriver && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-700">当前以司机角色查看，仅展示您本人负责的回收记录</span>
        </div>
      )}
      {isCustomerService && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700">当前以客服角色查看，可复核所有记录但不可处理争议</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索回收记录..."
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
          <option value="collected">已回收</option>
          <option value="disputed">有争议</option>
          <option value="resolved">已解决</option>
          <option value="lost">已遗失</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">回收单号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">关联订单</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">客户</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">配送员</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">数量对比</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">照片</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">回收时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredReturns.map(br => {
              const deliveryPhotos = getRelatedDeliveryPhotos(br)
              const complaintPhotos = getRelatedComplaintPhotos(br)
              const totalPhotos = br.photos.length + deliveryPhotos.length + complaintPhotos.length

              return (
                <tr key={br.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-800">{br.returnNo}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{br.orderNo}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-800">{br.customerName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{br.driverName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={br.expectedQuantity === br.actualQuantity ? 'text-green-600' : 'text-red-600'}>
                        {br.actualQuantity}
                      </span>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-600">{br.expectedQuantity}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {totalPhotos > 0 ? (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Camera className="w-4 h-4" />
                        <span className="text-sm">{totalPhotos}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">无</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${getStatusColor(br.status)}`}>
                      {getBucketReturnStatusName(br.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {br.collectedAt ? formatDate(br.collectedAt) : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedReturn(br)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        查看
                      </button>
                      {br.status === 'disputed' && isStationMaster && (
                        <button
                          onClick={() => {
                            setSelectedReturn(br)
                            setResolveData({
                              resolution: '',
                              bucketLossCount: br.expectedQuantity - br.actualQuantity,
                            })
                          }}
                          className="text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                          处理
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={!!selectedReturn}
        onClose={() => setSelectedReturn(null)}
        title={selectedReturn?.status === 'disputed' && isStationMaster ? '处理空桶争议' : '回收记录详情'}
        size="lg"
      >
        {selectedReturn && (
          <div className="space-y-6">
            {selectedReturn.status === 'disputed' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">争议详情</p>
                    <p className="text-sm text-yellow-700">{selectedReturn.disputeReason}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">回收单号</p>
                <p className="font-medium">{selectedReturn.returnNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">状态</p>
                <span className={`badge ${getStatusColor(selectedReturn.status)}`}>
                  {getBucketReturnStatusName(selectedReturn.status)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">客户</p>
                <p className="font-medium">{selectedReturn.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">配送员</p>
                <p className="font-medium">{selectedReturn.driverName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">预期回收</p>
                <p className="font-medium">{selectedReturn.expectedQuantity} 个</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">实际回收</p>
                <p className="font-medium">{selectedReturn.actualQuantity} 个</p>
              </div>
              {selectedReturn.bucketLossCount > 0 && (
                <div>
                  <p className="text-sm text-gray-500">遗失数量</p>
                  <p className="font-medium text-red-600">{selectedReturn.bucketLossCount} 个</p>
                </div>
              )}
            </div>

            {selectedReturn.photos.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">回收现场照片</p>
                <div className="flex flex-wrap gap-2">
                  {selectedReturn.photos.map(photo => (
                    <div key={photo.id} className="text-center">
                      <img src={photo.url} alt={photo.label} className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                      <p className="text-xs text-gray-400 mt-1">{photo.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(() => {
              const deliveryPhotos = getRelatedDeliveryPhotos(selectedReturn)
              if (deliveryPhotos.length === 0) return null
              return (
                <div>
                  <p className="text-sm text-gray-500 mb-2">关联配送照片（签收/争议现场）</p>
                  <div className="flex flex-wrap gap-2">
                    {deliveryPhotos.map(photo => (
                      <div key={photo.id} className="text-center">
                        <img src={photo.url} alt={photo.label} className="w-24 h-24 object-cover rounded-lg border border-blue-200" />
                        <p className="text-xs text-gray-400 mt-1">{photo.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {(() => {
              const complaintPhotos = getRelatedComplaintPhotos(selectedReturn)
              if (complaintPhotos.length === 0) return null
              return (
                <div>
                  <p className="text-sm text-gray-500 mb-2">关联投诉照片</p>
                  <div className="flex flex-wrap gap-2">
                    {complaintPhotos.map(photo => (
                      <div key={photo.id} className="text-center">
                        <img src={photo.url} alt={photo.label} className="w-24 h-24 object-cover rounded-lg border border-orange-200" />
                        <p className="text-xs text-gray-400 mt-1">{photo.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {selectedReturn.resolution && (
              <div>
                <p className="text-sm text-gray-500 mb-2">解决方案</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-800">{selectedReturn.resolution}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    处理人: {selectedReturn.resolvedBy} | 时间: {selectedReturn.resolvedAt ? formatDate(selectedReturn.resolvedAt) : '-'}
                  </p>
                </div>
              </div>
            )}

            {selectedReturn.status === 'disputed' && isStationMaster && (
              <>
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">站长处理</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">解决方案</label>
                      <textarea
                        value={resolveData.resolution}
                        onChange={(e) => setResolveData({ ...resolveData, resolution: e.target.value })}
                        className="input"
                        rows={3}
                        placeholder="请描述解决方案..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        空桶遗失数量（将从库存中扣除）
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={resolveData.bucketLossCount}
                        onChange={(e) => setResolveData({ ...resolveData, bucketLossCount: parseInt(e.target.value) || 0 })}
                        className="input"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        当前差异: {selectedReturn.expectedQuantity - selectedReturn.actualQuantity} 个
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setSelectedReturn(null)} className="btn-secondary">
                    取消
                  </button>
                  <button onClick={handleResolve} className="btn-primary">
                    确认解决
                  </button>
                </div>
              </>
            )}

            {selectedReturn.status === 'disputed' && !isStationMaster && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500">
                {isCustomerService ? '客服仅可复核，争议处理需由站长操作' : '争议处理需由站长操作'}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
