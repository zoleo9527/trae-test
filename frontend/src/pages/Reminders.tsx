import { useEffect, useState } from 'react'
import { Plus, Bell, Calendar, DollarSign, User, CheckCircle, Clock, Send } from 'lucide-react'
import { reminderApi, customerApi, paymentApi } from '../services/api'
import type { PaymentReminder, Customer } from '../types'

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待回款', className: 'status-pending' },
  completed: { label: '已完成', className: 'status-completed' },
  overdue: { label: '已逾期', className: 'bg-red-100 text-red-800' },
}

export default function Reminders() {
  const [reminders, setReminders] = useState<PaymentReminder[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [formData, setFormData] = useState({
    customer_id: 0,
    amount_due: 0,
    due_date: '',
    remark: '',
  })

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const loadData = async () => {
    try {
      const [remindersData, customersData] = await Promise.all([
        reminderApi.getAll(statusFilter ? { status: statusFilter } : undefined),
        customerApi.getAll(),
      ])
      setReminders(remindersData)
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
      await reminderApi.create(formData)
      setShowModal(false)
      setFormData({ customer_id: 0, amount_due: 0, due_date: '', remark: '' })
      loadData()
    } catch (error) {
      console.error('创建回款提醒失败:', error)
    }
  }

  const handleMarkCompleted = async (id: number) => {
    try {
      await reminderApi.markPaid(id)
      loadData()
    } catch (error) {
      console.error('标记完成失败:', error)
    }
  }

  const handleSendReminder = async (id: number) => {
    try {
      const reminder = reminders.find(r => r.id === id)
      if (reminder) {
        await reminderApi.update(id, {
          reminder_count: reminder.reminder_count + 1,
          last_reminder_time: new Date().toISOString(),
        })
        loadData()
      }
    } catch (error) {
      console.error('发送提醒失败:', error)
    }
  }

  const getCustomerName = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId)
    return customer?.name || `客户 #${customerId}`
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  const pendingCount = reminders.filter(r => r.status === 'pending').length
  const overdueCount = reminders.filter(r => r.status === 'pending' && isOverdue(r.due_date)).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">回款提醒</h1>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部状态</option>
            <option value="pending">待回款</option>
            <option value="completed">已完成</option>
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            创建提醒
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Bell className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">待回款提醒</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已逾期</p>
              <p className="text-2xl font-bold text-gray-900">{overdueCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">待回款总额</p>
              <p className="text-2xl font-bold text-gray-900">
                ¥{reminders.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount_due, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {reminders.map((reminder) => {
          const overdue = reminder.status === 'pending' && isOverdue(reminder.due_date)
          return (
            <div key={reminder.id} className={`bg-white rounded-xl p-5 shadow-sm border ${overdue ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">
                        {getCustomerName(reminder.customer_id)}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${overdue ? 'bg-red-100 text-red-700' : statusMap[reminder.status]?.className || 'status-pending'}`}>
                        {overdue ? '已逾期' : statusMap[reminder.status]?.label || reminder.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        到期日: {new Date(reminder.due_date).toLocaleDateString('zh-CN')}
                      </span>
                      <span>已提醒 {reminder.reminder_count} 次</span>
                    </div>
                    {reminder.remark && (
                      <p className="text-sm text-gray-500 mt-1">{reminder.remark}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-900">¥{reminder.amount_due}</span>
                  {reminder.status === 'pending' && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleSendReminder(reminder.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                      >
                        <Send className="w-4 h-4" /> 发送提醒
                      </button>
                      <button
                        onClick={() => handleMarkCompleted(reminder.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                      >
                        <CheckCircle className="w-4 h-4" /> 标记已回款
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">创建回款提醒</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择客户</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => {
                    const customerId = Number(e.target.value)
                    const customer = customers.find(c => c.id === customerId)
                    setFormData({ ...formData, customer_id: customerId, amount_due: customer?.current_debt || 0 })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value={0}>请选择客户</option>
                  {customers.filter(c => c.current_debt > 0).map((c) => (
                    <option key={c.id} value={c.id}>{c.name} (欠款: ¥{c.current_debt})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">提醒金额</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                  <input
                    type="number"
                    value={formData.amount_due}
                    onChange={(e) => setFormData({ ...formData, amount_due: Number(e.target.value) })}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">到期日期</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
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
                  创建提醒
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
