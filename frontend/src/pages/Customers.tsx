import { DollarSign, Edit2, Eye, History, MapPin, Package, Phone, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { customerApi, logApi, reminderApi } from '../services/api'
import type { Customer, OperationLog, PaymentReminder } from '../types'

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerLogs, setCustomerLogs] = useState<OperationLog[]>([])
  const [customerReminders, setCustomerReminders] = useState<PaymentReminder[]>([])
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    price_per_bucket: 20,
    balance_buckets: 0,
    credit_limit: 0,
    current_debt: 0,
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      const data = await customerApi.getAll()
      setCustomers(data)
    } catch (error) {
      console.error('加载客户失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await customerApi.create(formData)
      setShowModal(false)
      setFormData({ name: '', phone: '', address: '', price_per_bucket: 20, balance_buckets: 0, credit_limit: 0, current_debt: 0 })
      loadCustomers()
    } catch (error) {
      console.error('创建客户失败:', error)
    }
  }

  const handleViewDetail = async (customer: Customer) => {
    setSelectedCustomer(customer)
    const [logs, reminders] = await Promise.all([
      logApi.getAll({ customer_id: customer.id }),
      reminderApi.getAll({ customer_id: customer.id }),
    ])
    setCustomerLogs(logs)
    setCustomerReminders(reminders)
    setShowDetail(true)
  }

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">月结客户</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          新增客户
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {customers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <Phone className="w-4 h-4" />
                  {customer.phone}
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                customer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {customer.status === 'active' ? '正常' : '停用'}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="truncate">{customer.address || '未填写地址'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span>单价: ¥{customer.price_per_bucket}/桶</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Package className="w-4 h-4 text-gray-400" />
                <span>结余空桶: {customer.balance_buckets} 个</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">当前欠款</p>
                  <p className={`text-lg font-bold ${customer.current_debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ¥{customer.current_debt}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetail(customer)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="查看详情"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="操作记录"
                  >
                    <History className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">新增月结客户</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">客户名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">配送地址</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">单价(元/桶)</label>
                  <input
                    type="number"
                    value={formData.price_per_bucket}
                    onChange={(e) => setFormData({ ...formData, price_per_bucket: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">初始空桶</label>
                  <input
                    type="number"
                    value={formData.balance_buckets}
                    onChange={(e) => setFormData({ ...formData, balance_buckets: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">信用额度</label>
                  <input
                    type="number"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">初始欠款</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                    <input
                      type="number"
                      value={formData.current_debt}
                      onChange={(e) => setFormData({ ...formData, current_debt: Number(e.target.value) })}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>
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
                  创建客户
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">客户详情</h2>
                <button
                  onClick={() => setShowDetail(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">基本信息</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">客户名称:</span> {selectedCustomer.name}</p>
                    <p><span className="text-gray-500">联系电话:</span> {selectedCustomer.phone}</p>
                    <p><span className="text-gray-500">配送地址:</span> {selectedCustomer.address}</p>
                    <p><span className="text-gray-500">单价:</span> ¥{selectedCustomer.price_per_bucket}/桶</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">账务信息</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">当前欠款:</span> <span className="text-red-600 font-medium">¥{selectedCustomer.current_debt}</span></p>
                    <p><span className="text-gray-500">结余空桶:</span> {selectedCustomer.balance_buckets} 个</p>
                    <p><span className="text-gray-500">信用额度:</span> ¥{selectedCustomer.credit_limit}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">回款提醒</h3>
                {customerReminders.length > 0 ? (
                  <div className="space-y-2">
                    {customerReminders.map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                        <div>
                          <p>金额: ¥{r.amount_due}</p>
                          <p className="text-gray-500">到期日: {new Date(r.due_date).toLocaleDateString('zh-CN')}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {r.status === 'pending' ? '待回款' : '已完成'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">暂无回款提醒</p>
                )}
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">操作记录</h3>
                {customerLogs.length > 0 ? (
                  <div className="space-y-2">
                    {customerLogs.map((log) => (
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
    </div>
  )
}
