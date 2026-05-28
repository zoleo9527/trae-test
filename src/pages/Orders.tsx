import { useState } from 'react'
import { Plus, Search, User } from 'lucide-react'
import Modal from '../components/Modal'
import { useApp } from '../store/AppContext'
import { Order } from '../types'
import { formatDate, getStatusColor, getOrderStatusName, generateOrderNo, generateDeliveryNo } from '../utils'

export default function Orders() {
  const { orders, users, addOrder, updateOrder, addDelivery, currentUser, addTimelineEntry } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    waterQuantity: 1,
    bucketQuantity: 0,
    scheduledTime: '',
    notes: '',
  })

  const drivers = users.filter(u => u.role === 'driver')

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.includes(searchTerm) ||
      order.orderNo.includes(searchTerm) ||
      order.customerPhone.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateOrder = () => {
    const order: Order = {
      id: `o${Date.now()}`,
      orderNo: generateOrderNo(),
      ...newOrder,
      amount: newOrder.waterQuantity * 20,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    addOrder(order)
    addTimelineEntry({
      id: `t${Date.now()}`,
      actionType: 'order_created',
      relatedId: order.id,
      relatedType: 'order',
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      timestamp: new Date().toISOString(),
      description: '创建订单',
      details: { waterQuantity: order.waterQuantity, bucketQuantity: order.bucketQuantity },
    })
    setIsModalOpen(false)
    setNewOrder({
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      waterQuantity: 1,
      bucketQuantity: 0,
      scheduledTime: '',
      notes: '',
    })
  }

  const handleAssignDriver = (order: Order, driverId: string) => {
    const driver = users.find(u => u.id === driverId)
    const now = new Date().toISOString()
    
    const updatedOrder = {
      ...order,
      status: 'assigned' as const,
      assignedDriverId: driverId,
      assignedDriverName: driver?.name,
    }
    updateOrder(updatedOrder)
    
    const newDelivery = {
      id: `d${Date.now()}`,
      deliveryNo: generateDeliveryNo(),
      orderId: order.id,
      orderNo: order.orderNo,
      driverId: driverId,
      driverName: driver?.name || '',
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      waterQuantity: order.waterQuantity,
      bucketQuantity: order.bucketQuantity,
      status: 'pending' as const,
      hasDispute: false,
    }
    addDelivery(newDelivery)
    
    addTimelineEntry({
      id: `t${Date.now()}`,
      actionType: 'order_assigned',
      relatedId: order.id,
      relatedType: 'order',
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      timestamp: now,
      description: `分配给${driver?.name}`,
      details: { driverId, driverName: driver?.name, deliveryNo: newDelivery.deliveryNo },
    })
    setSelectedOrder(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单..."
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
            <option value="pending">待分配</option>
            <option value="assigned">已分配</option>
            <option value="delivering">配送中</option>
            <option value="completed">已完成</option>
          </select>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新建订单
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">订单号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">客户信息</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">配送地址</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">商品信息</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">配送员</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">创建时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-800">{order.orderNo}</span>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-800">{order.customerName}</p>
                    <p className="text-sm text-gray-500">{order.customerPhone}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600 max-w-xs truncate">
                    {order.customerAddress}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-800">水: {order.waterQuantity}桶</p>
                  <p className="text-sm text-gray-500">桶: {order.bucketQuantity}个</p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {order.assignedDriverName || '-'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`badge ${getStatusColor(order.status)}`}>
                    {getOrderStatusName(order.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      分配
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="新建订单"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">客户姓名</label>
            <input
              type="text"
              value={newOrder.customerName}
              onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
            <input
              type="text"
              value={newOrder.customerPhone}
              onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">配送地址</label>
            <input
              type="text"
              value={newOrder.customerAddress}
              onChange={(e) => setNewOrder({ ...newOrder, customerAddress: e.target.value })}
              className="input"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">桶装水数量</label>
              <input
                type="number"
                min="1"
                value={newOrder.waterQuantity}
                onChange={(e) => setNewOrder({ ...newOrder, waterQuantity: parseInt(e.target.value) })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">空桶回收</label>
              <input
                type="number"
                min="0"
                value={newOrder.bucketQuantity}
                onChange={(e) => setNewOrder({ ...newOrder, bucketQuantity: parseInt(e.target.value) })}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">预约时间</label>
            <input
              type="datetime-local"
              value={newOrder.scheduledTime}
              onChange={(e) => setNewOrder({ ...newOrder, scheduledTime: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={newOrder.notes}
              onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
              className="input"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsModalOpen(false)} className="btn-secondary">取消</button>
            <button onClick={handleCreateOrder} className="btn-primary">创建订单</button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="分配配送员"
        size="sm"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              为订单 {selectedOrder.orderNo} 选择配送员
            </p>
            <div className="space-y-2">
              {drivers.map(driver => (
                <button
                  key={driver.id}
                  onClick={() => handleAssignDriver(selectedOrder, driver.id)}
                  className="w-full p-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">{driver.name}</p>
                    <p className="text-sm text-gray-500">{driver.phone}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
