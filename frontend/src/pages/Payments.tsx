import { CreditCard, DollarSign, Plus, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { customerApi, paymentApi } from '../services/api'
import type { Customer, Payment } from '../types'

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    customer_id: 0,
    amount: 0,
    payment_method: '银行转账',
    remark: '',
    operator: '管理员',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [paymentsData, customersData] = await Promise.all([
        paymentApi.getAll(),
        customerApi.getAll(),
      ])
      setPayments(paymentsData)
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
      await paymentApi.create({
        ...formData,
        payment_date: new Date().toISOString(),
      })
      setShowModal(false)
      setFormData({ customer_id: 0, amount: 0, payment_method: '银行转账', remark: '', operator: '管理员' })
      loadData()
    } catch (error) {
      console.error('创建收款记录失败:', error)
    }
  }

  const getCustomerName = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId)
    return customer?.name || `客户 #${customerId}`
  }

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">收款记录</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          登记收款
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">累计收款</p>
              <p className="text-2xl font-bold text-gray-900">¥{totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">收款笔数</p>
              <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">付款客户数</p>
              <p className="text-2xl font-bold text-gray-900">{new Set(payments.map(p => p.customer_id)).size}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">客户</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">金额</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">付款方式</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作人</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">收款时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">备注</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <p className="font-medium text-gray-900">{getCustomerName(payment.customer_id)}</p>
                </td>
                <td className="px-4 py-4">
                  <span className="font-bold text-green-600">+¥{payment.amount}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                    {payment.payment_method}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">{payment.operator || '-'}</td>
                <td className="px-4 py-4 text-sm text-gray-500">
                  {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('zh-CN') : '-'}
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">{payment.remark || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">登记收款</h2>
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
                    <option key={c.id} value={c.id}>{c.name} (欠款: ¥{c.current_debt})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">收款金额</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">付款方式</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="银行转账">银行转账</option>
                  <option value="微信">微信</option>
                  <option value="支付宝">支付宝</option>
                  <option value="现金">现金</option>
                </select>
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
                  确认登记
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
