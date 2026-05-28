import { useEffect, useState } from 'react'
import { Plus, Filter, AlertTriangle, Package, User, MessageSquare, CheckCircle, X, Clock } from 'lucide-react'
import { exceptionApi, orderApi, logApi } from '../services/api'
import type { OrderException, Order, OperationLog } from '../types'

const typeMap: Record<string, { label: string; icon: any; color: string }> = {
  bucket_dispute: { label: '空桶争议', icon: Package, color: 'text-orange-600 bg-orange-100' },
  photo_issue: { label: '照片问题', icon: MessageSquare, color: 'text-purple-600 bg-purple-100' },
  complaint: { label: '客户投诉', icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
  delivery_delay: { label: '配送延迟', icon: Clock, color: 'text-blue-600 bg-blue-100' },
}

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'status-pending' },
  handling: { label: '处理中', className: 'status-review' },
  resolved: { label: '已解决', className: 'status-resolved' },
  rejected: { label: '已驳回', className: 'status-rejected' },
}

export default function Exceptions() {
  const [exceptions, setExceptions] = useState<OrderException[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [showDetailDrawer, setShowDetailDrawer] = useState(false)
  const [selectedException, setSelectedException] = useState<OrderException | null>(null)
  const [exceptionLogs, setExceptionLogs] = useState<OperationLog[]>([])
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [formData, setFormData] = useState({
    order_id: 0,
    type: 'bucket_dispute',
    description: '',
    reported_by: '',
  })
  const [handleForm, setHandleForm] = useState({
    status: 'resolved',
    handled_by: '',
    handle_result: '',
  })

  useEffect(() => {
    loadData()
  }, [typeFilter, statusFilter])

  const loadData = async () => {
    try {
      const [exceptionsData, ordersData] = await Promise.all([
        exceptionApi.getAll({
          ...(statusFilter && { status: statusFilter }),
          ...(typeFilter && { type: typeFilter }),
        }),
        orderApi.getAll(),
      ])
      setExceptions(exceptionsData)
      setOrders(ordersData)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await exceptionApi.create(formData)
      setShowCreateDrawer(false)
      setFormData({ order_id: 0, type: 'bucket_dispute', description: '', reported_by: '' })
      loadData()
    } catch (error) {
      console.error('创建异常失败:', error)
    }
  }

  const handleViewDetail = async (ex: OrderException) => {
    setSelectedException(ex)
    const logs = await logApi.getAll({ order_id: ex.order_id })
    setExceptionLogs(logs)
    setShowDetailDrawer(true)
  }

  const handleResolve = async () => {
    if (!selectedException) return
    try {
      await exceptionApi.update(selectedException.id, {
        status: handleForm.status,
        handled_by: handleForm.handled_by || '管理员',
        handle_result: handleForm.handle_result,
        handled_at: new Date().toISOString(),
      })
      setShowDetailDrawer(false)
      setHandleForm({ status: 'resolved', handled_by: '', handle_result: '' })
      loadData()
    } catch (error) {
      console.error('处理异常失败:', error)
    }
  }

  const getOrderNo = (orderId: number) => {
    const order = orders.find(o => o.id === orderId)
    return order?.order_no || `订单 #${orderId}`
  }

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">异常处理</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部类型</option>
              <option value="bucket_dispute">空桶争议</option>
              <option value="photo_issue">照片问题</option>
              <option value="complaint">客户投诉</option>
              <option value="delivery_delay">配送延迟</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="handling">处理中</option>
              <option value="resolved">已解决</option>
              <option value="rejected">已驳回</option>
            </select>
          </div>
          <button
            onClick={() => setShowCreateDrawer(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            上报异常
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {Object.entries(typeMap).map(([key, value]) => {
          const Icon = value.icon
          const count = exceptions.filter(e => e.type === key).length
          return (
            <div key={key} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`p-3 ${value.color.replace('text-', 'bg-').replace('bg-', 'bg-opacity-20 text-').replace('600', '500')} rounded-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{value.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="space-y-4">
        {exceptions.map((ex) => {
          const typeInfo = typeMap[ex.type] || { label: ex.type, icon: AlertTriangle, color: 'text-gray-600' }
          const TypeIcon = typeInfo.icon
          return (
            <div
              key={ex.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewDetail(ex)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 ${typeInfo.color.split(' ')[1]} rounded-lg`}>
                    <TypeIcon className={`w-6 h-6 ${typeInfo.color.split(' ')[0]}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{typeInfo.label}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusMap[ex.status]?.className}`}>
                        {statusMap[ex.status]?.label || ex.status}
                      </span>
                      <span className="text-sm text-gray-500">{getOrderNo(ex.order_id)}</span>
                    </div>
                    <p className="text-gray-600 mt-2">{ex.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        上报人: {ex.reported_by || '-'}
                      </span>
                      <span>创建时间: {new Date(ex.created_at).toLocaleString('zh-CN')}</span>
                      {ex.handled_at && (
                        <span>处理时间: {new Date(ex.handled_at).toLocaleString('zh-CN')}</span>
                      )}
                    </div>
                    {ex.handle_result && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-700">处理结果:</p>
                        <p className="text-sm text-green-600">{ex.handle_result}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showCreateDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreateDrawer(false)}></div>
          <div className="ml-auto w-full max-w-lg bg-white h-full overflow-auto shadow-xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">上报异常</h2>
              <button onClick={() => setShowCreateDrawer(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择订单</label>
                <select
                  value={formData.order_id}
                  onChange={(e) => setFormData({ ...formData, order_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value={0}>请选择订单</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>{o.order_no} - {o.customer?.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">异常类型</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="bucket_dispute">空桶争议</option>
                  <option value="photo_issue">照片问题</option>
                  <option value="complaint">客户投诉</option>
                  <option value="delivery_delay">配送延迟</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">问题描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="请详细描述问题..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">上报人</label>
                <input
                  type="text"
                  value={formData.reported_by}
                  onChange={(e) => setFormData({ ...formData, reported_by: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入上报人姓名"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateDrawer(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  提交上报
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailDrawer && selectedException && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDetailDrawer(false)}></div>
          <div className="ml-auto w-full max-w-lg bg-white h-full overflow-auto shadow-xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">异常详情</h2>
                <p className="text-sm text-gray-500 mt-1">{getOrderNo(selectedException.order_id)}</p>
              </div>
              <button onClick={() => setShowDetailDrawer(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">异常类型</label>
                  <p className="mt-1 text-gray-900">{typeMap[selectedException.type]?.label || selectedException.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">当前状态</label>
                  <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${statusMap[selectedException.status]?.className}`}>
                    {statusMap[selectedException.status]?.label || selectedException.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">问题描述</label>
                  <p className="mt-1 text-gray-900">{selectedException.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">上报人</label>
                  <p className="mt-1 text-gray-900">{selectedException.reported_by || '-'}</p>
                </div>
                {selectedException.handled_by && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">处理人</label>
                    <p className="mt-1 text-gray-900">{selectedException.handled_by}</p>
                  </div>
                )}
                {selectedException.handle_result && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">处理结果</label>
                    <p className="mt-1 text-gray-900 p-3 bg-green-50 rounded-lg">{selectedException.handle_result}</p>
                  </div>
                )}
              </div>

              {selectedException.status !== 'resolved' && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">处理异常</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">处理状态</label>
                      <select
                        value={handleForm.status}
                        onChange={(e) => setHandleForm({ ...handleForm, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="resolved">已解决</option>
                        <option value="handling">处理中</option>
                        <option value="rejected">已驳回</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">处理人</label>
                      <input
                        type="text"
                        value={handleForm.handled_by}
                        onChange={(e) => setHandleForm({ ...handleForm, handled_by: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="请输入处理人姓名"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">处理结果</label>
                      <textarea
                        value={handleForm.handle_result}
                        onChange={(e) => setHandleForm({ ...handleForm, handle_result: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="请描述处理结果..."
                      />
                    </div>
                    <button
                      onClick={handleResolve}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      确认处理
                    </button>
                  </div>
                </div>
              )}

              {exceptionLogs.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">关联操作记录</h3>
                  <div className="space-y-3">
                    {exceptionLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                        <div className="flex-1">
                          <p className="font-medium">{log.action}</p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            {log.operator} · {new Date(log.created_at).toLocaleString('zh-CN')}
                          </p>
                          {log.old_value && (
                            <p className="text-gray-600 text-xs mt-1">
                              <span className="text-gray-500">变更前:</span> {log.old_value}
                            </p>
                          )}
                          {log.new_value && (
                            <p className="text-gray-600 text-xs mt-0.5">
                              <span className="text-gray-500">变更后:</span> {log.new_value}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
