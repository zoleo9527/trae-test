import { useState } from 'react'
import {
  Truck,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import StatsCard from '../components/StatsCard'
import Timeline from '../components/Timeline'
import Modal from '../components/Modal'
import { useApp } from '../store/AppContext'
import { formatDate, getStatusColor, getOrderStatusName, getBucketReturnStatusName } from '../utils'
import { Order } from '../types'

export default function Dashboard() {
  const {
    orders,
    deliveries,
    bucketReturns,
    inventory,
    complaints,
    timeline,
    dailyStats,
  } = useApp()

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const todayDeliveries = deliveries.filter(d => d.status !== 'completed').length
  const todayCompleted = deliveries.filter(d => d.status === 'completed').length
  const pendingComplaints = complaints.filter(c => c.status === 'pending' || c.status === 'processing').length
  const disputedReturns = bucketReturns.filter(br => br.status === 'disputed').length

  const chartData = dailyStats.map(s => ({
    ...s,
    date: s.date.slice(5),
    completionRate: s.deliveries > 0 ? Math.round((s.completed / s.deliveries) * 100) : 0,
  }))

  const recentOrders = orders.slice(0, 5)
  const recentReturns = bucketReturns.slice(0, 5)
  const recentComplaints = complaints.slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="今日配送"
          value={todayDeliveries}
          icon={Truck}
          color="blue"
        />
        <StatsCard
          title="已完成"
          value={todayCompleted}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="待处理投诉"
          value={pendingComplaints}
          icon={AlertTriangle}
          color="yellow"
        />
        <StatsCard
          title="空桶争议"
          value={disputedReturns}
          icon={RotateCcw}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">库存概览</h3>
          <div className="grid grid-cols-2 gap-4">
            {inventory.map(item => (
              <div
                key={item.id}
                className={item.itemType === 'water' ? 'bg-blue-50 rounded-xl p-4' : 'bg-green-50 rounded-xl p-4'}
              >
                <p className="text-sm text-gray-500">{item.itemType === 'water' ? '桶装水' : '空桶'}</p>
                <p className="text-2xl font-bold text-gray-800">{item.availableQuantity} / {item.totalQuantity}</p>
                <p className="text-xs text-gray-400">可用 / 总计</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">配送趋势</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="deliveries" fill="#3b82f6" name="配送量" />
              <Bar dataKey="completed" fill="#22c55e" name="完成量" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">最近订单</h3>
          <div className="space-y-3">
            {recentOrders.map(order => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-800">{order.customerName}</span>
                  <span className={`badge ${getStatusColor(order.status)}`}>
                    {getOrderStatusName(order.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{order.orderNo}</p>
                <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">空桶回收</h3>
          <div className="space-y-3">
            {recentReturns.map(br => (
              <div
                key={br.id}
                className="p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-800">{br.customerName}</span>
                  <span className={`badge ${getStatusColor(br.status)}`}>
                    {getBucketReturnStatusName(br.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  回收: {br.actualQuantity} / {br.expectedQuantity} 个
                </p>
                <p className="text-xs text-gray-400">{br.returnNo}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">客诉处理</h3>
          <div className="space-y-3">
            {recentComplaints.map(complaint => (
              <div
                key={complaint.id}
                className="p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-800">{complaint.customerName}</span>
                  <span className={`badge ${getStatusColor(complaint.status)}`}>
                    {complaint.status === 'pending' ? '待处理' : complaint.status === 'processing' ? '处理中' : '已解决'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-1">{complaint.description}</p>
                <p className="text-xs text-gray-400">{formatDate(complaint.reportedAt)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">操作时间线</h3>
        <Timeline entries={timeline} maxItems={10} />
      </div>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="订单详情"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">订单号</p>
                <p className="font-medium">{selectedOrder.orderNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">状态</p>
                <span className={`badge ${getStatusColor(selectedOrder.status)}`}>
                  {getOrderStatusName(selectedOrder.status)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">客户姓名</p>
                <p className="font-medium">{selectedOrder.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">联系电话</p>
                <p className="font-medium">{selectedOrder.customerPhone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">配送地址</p>
                <p className="font-medium">{selectedOrder.customerAddress}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">桶装水数量</p>
                <p className="font-medium">{selectedOrder.waterQuantity} 桶</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">空桶回收</p>
                <p className="font-medium">{selectedOrder.bucketQuantity} 个</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">金额</p>
                <p className="font-medium">¥{selectedOrder.amount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">配送员</p>
                <p className="font-medium">{selectedOrder.assignedDriverName || '未分配'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
