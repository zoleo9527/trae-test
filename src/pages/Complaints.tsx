import { useState } from 'react'
import { Search, CheckCircle, RefreshCw, Plus } from 'lucide-react'
import { useApp } from '@/store/AppContext'
import Modal from '@/components/Modal'
import { formatDate, generateComplaintNo, getComplaintTypeName, getPriorityName, getPriorityColor, getStatusColor } from '@/utils'
import type { Complaint } from '@/types'

export default function Complaints() {
  const { complaints, orders, users, currentUser, addComplaint, updateComplaint, addTimelineEntry, addReDelivery } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [isReDeliveryModalOpen, setIsReDeliveryModalOpen] = useState(false)
  const [newComplaint, setNewComplaint] = useState({
    customerName: '',
    customerPhone: '',
    type: 'other' as Complaint['type'],
    orderId: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  })
  const [resolveData, setResolveData] = useState({
    resolution: '',
    status: 'resolved' as 'resolved' | 'closed',
  })
  const [reDeliveryData, setReDeliveryData] = useState({
    waterQuantity: 1,
    driverId: '',
    scheduledTime: '',
  })

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.customerName.includes(searchTerm) ||
      c.complaintNo.includes(searchTerm) ||
      c.description.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const drivers = users.filter(u => u.role === 'driver')

  const handleCreateComplaint = () => {
    const order = orders.find(o => o.id === newComplaint.orderId)
    const complaint: Complaint = {
      id: `c${Date.now()}`,
      complaintNo: generateComplaintNo(),
      ...newComplaint,
      orderNo: order?.orderNo,
      status: 'pending',
      reportedBy: currentUser.name,
      reportedAt: new Date().toISOString(),
      hasReDelivery: false,
    }
    addComplaint(complaint)
    addTimelineEntry({
      id: `t${Date.now()}`,
      actionType: 'complaint_created',
      relatedId: complaint.id,
      relatedType: 'complaint',
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      timestamp: new Date().toISOString(),
      description: '客户投诉登记',
      details: { type: getComplaintTypeName(complaint.type), priority: getPriorityName(complaint.priority) },
    })
    setIsCreateModalOpen(false)
    setNewComplaint({
      customerName: '',
      customerPhone: '',
      type: 'other',
      orderId: '',
      description: '',
      priority: 'medium',
    })
  }

  const handleResolve = () => {
    if (!selectedComplaint) return

    const updated: Complaint = {
      ...selectedComplaint,
      status: resolveData.status,
      resolution: resolveData.resolution,
      resolvedAt: new Date().toISOString(),
      resolvedBy: currentUser.name,
    }
    updateComplaint(updated)
    addTimelineEntry({
      id: `t${Date.now()}`,
      actionType: 'complaint_resolved',
      relatedId: selectedComplaint.id,
      relatedType: 'complaint',
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      timestamp: new Date().toISOString(),
      description: '投诉已解决',
      details: { resolution: resolveData.resolution },
    })
    setSelectedComplaint(null)
  }

  const handleReDelivery = () => {
    if (!selectedComplaint) return

    const driver = users.find(u => u.id === reDeliveryData.driverId)
    addReDelivery({
      id: `rd${Date.now()}`,
      reDeliveryNo: `RED${Date.now()}`,
      originalOrderId: selectedComplaint.orderId || '',
      complaintId: selectedComplaint.id,
      driverId: reDeliveryData.driverId,
      driverName: driver?.name,
      waterQuantity: reDeliveryData.waterQuantity,
      status: 'assigned',
      scheduledTime: reDeliveryData.scheduledTime,
      createdAt: new Date().toISOString(),
    })
    updateComplaint({
      ...selectedComplaint,
      hasReDelivery: true,
      reDeliveryOrderId: `rd${Date.now()}`,
    })
    addTimelineEntry({
      id: `t${Date.now()}`,
      actionType: 'redelivery_created',
      relatedId: selectedComplaint.id,
      relatedType: 'complaint',
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      timestamp: new Date().toISOString(),
      description: '安排补送',
      details: { waterQuantity: reDeliveryData.waterQuantity, driver: driver?.name },
    })
    setIsReDeliveryModalOpen(false)
    setSelectedComplaint(null)
  }

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    processing: complaints.filter(c => c.status === 'processing').length,
    resolved: complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length,
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">总投诉</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">待处理</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">处理中</p>
          <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">已解决</p>
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索投诉..."
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
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="resolved">已解决</option>
            <option value="closed">已关闭</option>
          </select>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          登记投诉
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">投诉编号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">客户</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">优先级</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">关联订单</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">登记时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredComplaints.map(complaint => (
              <tr key={complaint.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-800">{complaint.complaintNo}</span>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-800">{complaint.customerName}</p>
                    <p className="text-sm text-gray-500">{complaint.customerPhone}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{getComplaintTypeName(complaint.type)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`badge ${getPriorityColor(complaint.priority)}`}>
                    {getPriorityName(complaint.priority)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">{complaint.orderNo || '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`badge ${getStatusColor(complaint.status)}`}>
                    {complaint.status === 'pending' ? '待处理' : complaint.status === 'processing' ? '处理中' : complaint.status === 'resolved' ? '已解决' : '已关闭'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">
                    {formatDate(complaint.reportedAt)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {(complaint.status === 'pending' || complaint.status === 'processing') && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedComplaint(complaint)
                            setResolveData({ resolution: '', status: 'resolved' })
                          }}
                          className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          解决
                        </button>
                        {!complaint.hasReDelivery && (
                          <button
                            onClick={() => {
                              setSelectedComplaint(complaint)
                              setIsReDeliveryModalOpen(true)
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            补送
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="登记投诉"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">客户姓名</label>
              <input
                type="text"
                value={newComplaint.customerName}
                onChange={(e) => setNewComplaint({ ...newComplaint, customerName: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
              <input
                type="text"
                value={newComplaint.customerPhone}
                onChange={(e) => setNewComplaint({ ...newComplaint, customerPhone: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关联订单</label>
            <select
              value={newComplaint.orderId}
              onChange={(e) => setNewComplaint({ ...newComplaint, orderId: e.target.value })}
              className="input"
            >
              <option value="">无关联订单</option>
              {orders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.orderNo} - {order.customerName}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">投诉类型</label>
              <select
                value={newComplaint.type}
                onChange={(e) => setNewComplaint({ ...newComplaint, type: e.target.value as Complaint['type'] })}
                className="input"
              >
                <option value="delivery_delay">配送延迟</option>
                <option value="bucket_dispute">空桶争议</option>
                <option value="water_quality">水质问题</option>
                <option value="service_attitude">服务态度</option>
                <option value="other">其他问题</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
              <select
                value={newComplaint.priority}
                onChange={(e) => setNewComplaint({ ...newComplaint, priority: e.target.value as 'low' | 'medium' | 'high' })}
                className="input"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">问题描述</label>
            <textarea
              value={newComplaint.description}
              onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
              className="input"
              rows={4}
              placeholder="请详细描述客户投诉内容..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsCreateModalOpen(false)} className="btn-secondary">取消</button>
            <button onClick={handleCreateComplaint} className="btn-primary">登记</button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedComplaint && !isReDeliveryModalOpen}
        onClose={() => setSelectedComplaint(null)}
        title="处理投诉"
      >
        {selectedComplaint && !isReDeliveryModalOpen && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-sm text-gray-500">投诉编号</p>
                  <p className="font-medium">{selectedComplaint.complaintNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">投诉类型</p>
                  <p className="font-medium">{getComplaintTypeName(selectedComplaint.type)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">客户</p>
                  <p className="font-medium">{selectedComplaint.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">联系电话</p>
                  <p className="font-medium">{selectedComplaint.customerPhone}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">问题描述</p>
                <p className="text-gray-800">{selectedComplaint.description}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">处理结果</label>
              <textarea
                value={resolveData.resolution}
                onChange={(e) => setResolveData({ ...resolveData, resolution: e.target.value })}
                className="input"
                rows={4}
                placeholder="请描述处理方案和结果..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={resolveData.status}
                onChange={(e) => setResolveData({ ...resolveData, status: e.target.value as 'resolved' | 'closed' })}
                className="input"
              >
                <option value="resolved">已解决</option>
                <option value="closed">已关闭</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setSelectedComplaint(null)} className="btn-secondary">取消</button>
              <button onClick={handleResolve} className="btn-primary">确认处理</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isReDeliveryModalOpen}
        onClose={() => {
          setIsReDeliveryModalOpen(false)
          setSelectedComplaint(null)
        }}
        title="安排补送"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            为投诉 {selectedComplaint?.complaintNo} 安排补送
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">补送数量</label>
            <input
              type="number"
              min="1"
              value={reDeliveryData.waterQuantity}
              onChange={(e) => setReDeliveryData({ ...reDeliveryData, waterQuantity: parseInt(e.target.value) })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">配送员</label>
            <select
              value={reDeliveryData.driverId}
              onChange={(e) => setReDeliveryData({ ...reDeliveryData, driverId: e.target.value })}
              className="input"
            >
              <option value="">请选择配送员</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.id}>{driver.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">预约时间</label>
            <input
              type="datetime-local"
              value={reDeliveryData.scheduledTime}
              onChange={(e) => setReDeliveryData({ ...reDeliveryData, scheduledTime: e.target.value })}
              className="input"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => {
              setIsReDeliveryModalOpen(false)
              setSelectedComplaint(null)
            }} className="btn-secondary">取消</button>
            <button onClick={handleReDelivery} className="btn-primary">安排补送</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
