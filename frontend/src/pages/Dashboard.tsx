import { useEffect, useState } from 'react'
import {
  Clock,
  XCircle,
  Search,
  AlertTriangle,
  Bell,
  Users,
  Truck,
  DollarSign,
  ArrowRight
} from 'lucide-react'
import { dashboardApi, orderApi, exceptionApi, reminderApi } from '../services/api'
import type { DashboardStats, Order, OrderException, PaymentReminder } from '../types'
import { Link } from 'react-router-dom'

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'status-pending' },
  completed: { label: '已完成', className: 'status-completed' },
  rejected: { label: '已驳回', className: 'status-rejected' },
  review: { label: '需回查', className: 'status-review' },
  resolved: { label: '已解决', className: 'status-resolved' },
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [pendingExceptions, setPendingExceptions] = useState<OrderException[]>([])
  const [pendingReminders, setPendingReminders] = useState<PaymentReminder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsData, ordersData, exceptionsData, remindersData] = await Promise.all([
        dashboardApi.getStats(),
        orderApi.getAll({ status: 'pending' }),
        exceptionApi.getAll({ status: 'pending' }),
        reminderApi.getAll({ status: 'pending' }),
      ])
      setStats(statsData)
      setPendingOrders(ordersData.slice(0, 5))
      setPendingExceptions(exceptionsData.slice(0, 5))
      setPendingReminders(remindersData.slice(0, 5))
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: '待处理订单', value: stats?.pending_orders || 0, icon: Clock, color: 'bg-yellow-500', link: '/orders?status=pending' },
    { label: '已驳回订单', value: stats?.rejected_orders || 0, icon: XCircle, color: 'bg-red-500', link: '/orders?status=rejected' },
    { label: '需回查订单', value: stats?.review_needed || 0, icon: Search, color: 'bg-orange-500', link: '/orders?status=review' },
    { label: '待处理异常', value: stats?.pending_exceptions || 0, icon: AlertTriangle, color: 'bg-rose-500', link: '/exceptions?status=pending' },
    { label: '待回款提醒', value: stats?.pending_reminders || 0, icon: Bell, color: 'bg-blue-500', link: '/reminders?status=pending' },
    { label: '月结客户数', value: stats?.total_customers || 0, icon: Users, color: 'bg-green-500', link: '/customers' },
    { label: '今日配送', value: stats?.today_deliveries || 0, icon: Truck, color: 'bg-cyan-500', link: '/orders' },
    { label: '本月营收', value: `¥${stats?.monthly_revenue || 0}`, icon: DollarSign, color: 'bg-emerald-500', link: '/payments' },
  ]

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        <p className="text-gray-500">
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Link
              key={index}
              to={card.link}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`${card.color} p-2.5 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">待处理订单</h2>
            <Link to="/orders?status=pending" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              查看全部 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingOrders.length > 0 ? (
              pendingOrders.map((order) => (
                <div key={order.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{order.order_no}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        送水 {order.buckets_delivered} 桶 · 回桶 {order.buckets_returned} 桶
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusMap[order.status]?.className || 'status-pending'}`}>
                      {statusMap[order.status]?.label || order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">暂无待处理订单</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">待处理异常</h2>
            <Link to="/exceptions?status=pending" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              查看全部 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingExceptions.length > 0 ? (
              pendingExceptions.map((ex) => (
                <div key={ex.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-gray-900">
                          {ex.type === 'bucket_dispute' ? '空桶争议' :
                           ex.type === 'photo_issue' ? '照片问题' :
                           ex.type === 'complaint' ? '客户投诉' : ex.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ex.description}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">暂无待处理异常</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">回款提醒</h2>
            <Link to="/reminders?status=pending" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              查看全部 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingReminders.length > 0 ? (
              pendingReminders.map((reminder) => (
                <div key={reminder.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{reminder.customer?.name || `客户 #${reminder.customer_id}`}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        到期日: {new Date(reminder.due_date).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">¥{reminder.amount_due}</p>
                      <p className="text-xs text-gray-500">已提醒 {reminder.reminder_count} 次</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">暂无回款提醒</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
