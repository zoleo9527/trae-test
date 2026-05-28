import { AlertTriangle, Camera, CheckCircle, Clock, Eye, Filter, Plus, Upload, X, ZoomIn } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { customerApi, exceptionApi, logApi, orderApi } from '../services/api'
import type { Customer, OperationLog, Order, OrderException } from '../types'

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'status-pending' },
  completed: { label: '已完成', className: 'status-completed' },
  rejected: { label: '已驳回', className: 'status-rejected' },
  review: { label: '需回查', className: 'status-review' },
}

const exceptionTypeMap: Record<string, string> = {
  bucket_dispute: '空桶争议',
  photo_issue: '照片问题',
  complaint: '客户投诉',
  delivery_delay: '配送延迟',
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderLogs, setOrderLogs] = useState<OperationLog[]>([])
  const [orderExceptions, setOrderExceptions] = useState<OrderException[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showPhotoPreview, setShowPhotoPreview] = useState<string | null>(null)
  const [signBy, setSignBy] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    customer_id: 0,
    buckets_delivered: 0,
    buckets_returned: 0,
    delivery_route: '',
    delivery_person: '',
    remark: '',
  })

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const loadData = async () => {
    try {
      const [ordersData, customersData] = await Promise.all([
        orderApi.getAll(statusFilter ? { status: statusFilter } : undefined),
        customerApi.getAll(),
      ])
      setOrders(ordersData)
      setCustomers(customersData)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await orderApi.create(formData)
      setShowModal(false)
      setFormData({ customer_id: 0, buckets_delivered: 0, buckets_returned: 0, delivery_route: '', delivery_person: '', remark: '' })
      loadData()
    } catch (error) {
      console.error('创建订单失败:', error)
    }
  }

  const handleViewDetail = async (order: Order) => {
    setSelectedOrder(order)
    const [logs, exceptions] = await Promise.all([
      logApi.getAll({ order_id: order.id }),
      exceptionApi.getAll(),
    ])
    setOrderLogs(logs)
    setOrderExceptions(exceptions.filter(e => e.order_id === order.id))
    setShowDetail(true)
  }

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      await orderApi.update(orderId, { status })
      loadData()
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status })
      }
    } catch (error) {
      console.error('更新状态失败:', error)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedOrder) return

    setUploadingPhoto(true)
    try {
      const result = await orderApi.uploadPhoto(selectedOrder.id, file, signBy || undefined)
      setSelectedOrder(result.order)
      setSignBy('')
      loadData()
    } catch (error) {
      console.error('上传照片失败:', error)
    } finally {
      setUploadingPhoto(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">配送订单</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="completed">已完成</option>
              <option value="rejected">已驳回</option>
              <option value="review">需回查</option>
            </select>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            新增订单
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">订单号</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">客户</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">送水/回桶</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">配送员/路线</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">创建时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <span className="font-mono text-sm text-blue-600">{order.order_no}</span>
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium text-gray-900">{order.customer?.name || `客户 #${order.customer_id}`}</p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">+{order.buckets_delivered}</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-orange-600">-{order.buckets_returned}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-gray-900">{order.delivery_person || '-'}</p>
                  <p className="text-xs text-gray-500">{order.delivery_route || '-'}</p>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusMap[order.status]?.className || 'status-pending'}`}>
                    {statusMap[order.status]?.label || order.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString('zh-CN')}
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => handleViewDetail(order)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">新增配送订单</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择客户</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value={0}>请选择客户</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">送水桶数</label>
                  <input
                    type="number"
                    value={formData.buckets_delivered}
                    onChange={(e) => setFormData({ ...formData, buckets_delivered: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">回桶数量</label>
                  <input
                    type="number"
                    value={formData.buckets_returned}
                    onChange={(e) => setFormData({ ...formData, buckets_returned: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">配送路线</label>
                  <input
                    type="text"
                    value={formData.delivery_route}
                    onChange={(e) => setFormData({ ...formData, delivery_route: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="如: A线"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">配送员</label>
                  <input
                    type="text"
                    value={formData.delivery_person}
                    onChange={(e) => setFormData({ ...formData, delivery_person: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="如: 陈师傅"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  创建订单
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">订单详情</h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedOrder.order_no}</p>
                </div>
                <button onClick={() => setShowDetail(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">订单信息</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">客户:</span> {selectedOrder.customer?.name || `客户 #${selectedOrder.customer_id}`}</p>
                    <p><span className="text-gray-500">送水:</span> {selectedOrder.buckets_delivered} 桶</p>
                    <p><span className="text-gray-500">回桶:</span> {selectedOrder.buckets_returned} 桶</p>
                    <p><span className="text-gray-500">配送员:</span> {selectedOrder.delivery_person || '-'}</p>
                    <p><span className="text-gray-500">路线:</span> {selectedOrder.delivery_route || '-'}</p>
                    <p><span className="text-gray-500">备注:</span> {selectedOrder.remark || '-'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">状态操作</h3>
                  <div className="space-y-2">
                    <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium ${statusMap[selectedOrder.status]?.className}`}>
                      {statusMap[selectedOrder.status]?.label}
                    </span>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                      >
                        <CheckCircle className="w-4 h-4" /> 标记完成
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'review')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm hover:bg-orange-200"
                      >
                        <AlertTriangle className="w-4 h-4" /> 需回查
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'rejected')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                      >
                        <Clock className="w-4 h-4" /> 驳回
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Camera className="w-5 h-5" /> 签收照片
                  </h3>
                  {selectedOrder.sign_photo_url ? (
                    <div className="space-y-3">
                      <div className="relative inline-block">
                        <img
                          src={selectedOrder.sign_photo_url}
                          alt="签收照片"
                          className="w-48 h-36 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setShowPhotoPreview(selectedOrder.sign_photo_url!)}
                        />
                        <button
                          onClick={() => setShowPhotoPreview(selectedOrder.sign_photo_url!)}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-sm space-y-1">
                        <p className="text-gray-600">
                          <span className="text-gray-500">签收人:</span> {selectedOrder.sign_by || '-'}
                        </p>
                        {selectedOrder.sign_time && (
                          <p className="text-gray-600">
                            <span className="text-gray-500">签收时间:</span> {new Date(selectedOrder.sign_time).toLocaleString('zh-CN')}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">签收人</label>
                        <input
                          type="text"
                          value={signBy}
                          onChange={(e) => setSignBy(e.target.value)}
                          placeholder="请输入签收人姓名"
                          className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="w-48 h-36 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          className="flex flex-col items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                        >
                          {uploadingPhoto ? (
                            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-8 h-8" />
                              <span className="text-sm">点击上传照片</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              {orderExceptions.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">关联异常</h3>
                  <div className="space-y-2">
                    {orderExceptions.map((ex) => (
                      <div key={ex.id} className="p-3 bg-red-50 rounded-lg text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-red-700">
                            {exceptionTypeMap[ex.type] || ex.type}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            ex.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {ex.status === 'pending' ? '待处理' : '已处理'}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1">{ex.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">操作记录</h3>
                {orderLogs.length > 0 ? (
                  <div className="space-y-2">
                    {orderLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                        <div className="flex-1">
                          <p className="font-medium">{log.action}</p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            {log.operator} · {new Date(log.created_at).toLocaleString('zh-CN')}
                          </p>
                          {log.new_value && <p className="text-gray-600 text-xs mt-1">{log.new_value}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">暂无操作记录</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showPhotoPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]" onClick={() => setShowPhotoPreview(null)}>
          <button
            onClick={() => setShowPhotoPreview(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={showPhotoPreview}
            alt="签收照片预览"
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
