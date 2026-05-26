'use client'

import { api, type Order, type OrderStats, type User as UserType } from '@/lib/api'
import { cn, STATUS_MAP } from '@/lib/utils'
import {
    AlertTriangle,
    ChevronRight,
    Clock,
    Filter,
    LayoutDashboard,
    Package,
    Plus,
    Search,
    Truck,
    User
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    total_amount: '',
    deposit_amount: '',
    sales_consultant_id: '',
    showroom_manager_id: '',
    expected_delivery_date: '',
    remarks: '',
    items: [] as { product_name: string; product_code: string; quantity: number; unit_price: number; remarks?: string }[]
  })
  const [newItem, setNewItem] = useState({ product_name: '', product_code: '', quantity: 1, unit_price: 0 })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [statusFilter, keyword, page])

  async function loadData() {
    setLoading(true)
    try {
      const [ordersRes, statsRes, usersRes] = await Promise.all([
        api.getOrders({ page, page_size: 10, status: statusFilter || undefined, keyword: keyword || undefined }),
        api.getOrderStats(),
        api.getUsers(),
      ])
      setOrders(ordersRes.orders)
      setTotal(ordersRes.total)
      setStats(statsRes)
      setUsers(usersRes)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleCreateOrder = async () => {
    if (!createForm.customer_name || !createForm.customer_phone || !createForm.customer_address) {
      alert('请填写客户基本信息')
      return
    }
    if (createForm.items.length === 0) {
      alert('请至少添加一件商品')
      return
    }
    setSubmitting(true)
    try {
      const order = await api.createOrder({
        ...createForm,
        total_amount: createForm.items.reduce((s, i) => s + i.quantity * i.unit_price, 0),
        deposit_amount: Number(createForm.deposit_amount || 0),
        sales_consultant_id: createForm.sales_consultant_id ? Number(createForm.sales_consultant_id) : null,
        showroom_manager_id: createForm.showroom_manager_id ? Number(createForm.showroom_manager_id) : null,
        expected_delivery_date: createForm.expected_delivery_date ? new Date(createForm.expected_delivery_date).toISOString() : null,
      })
      setShowCreateModal(false)
      setCreateForm({
        customer_name: '', customer_phone: '', customer_address: '',
        total_amount: '', deposit_amount: '', sales_consultant_id: '',
        showroom_manager_id: '', expected_delivery_date: '', remarks: '', items: []
      })
      setNewItem({ product_name: '', product_code: '', quantity: 1, unit_price: 0 })
      loadData()
      window.location.href = `/orders/${order.id}`
    } catch (e: any) {
      alert(e.message)
    }
    setSubmitting(false)
  }

  const addItem = () => {
    if (!newItem.product_name || !newItem.product_code || newItem.quantity <= 0 || newItem.unit_price <= 0) {
      alert('请填写完整商品信息')
      return
    }
    setCreateForm({ ...createForm, items: [...createForm.items, { ...newItem }] })
    setNewItem({ product_name: '', product_code: '', quantity: 1, unit_price: 0 })
  }

  const removeItem = (idx: number) => {
    setCreateForm({ ...createForm, items: createForm.items.filter((_, i) => i !== idx) })
  }

  const userName = (id: number | null) =>
    users.find(u => u.id === id)?.display_name || '-'

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">家具展厅管理台</h1>
              <p className="text-xs text-slate-500">订单配置 · 到货跟踪 · 安装预约</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span>展厅经理 / 李娜</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Package className="w-5 h-5" />}
            label="订单总数"
            value={stats?.total || 0}
            sub={`总额 ¥${(stats?.total_amount || 0).toLocaleString()}`}
            color="bg-brand-600"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="进行中"
            value={stats?.pending || 0}
            sub="待确认/生产中"
            color="bg-amber-500"
          />
          <StatCard
            icon={<Truck className="w-5 h-5" />}
            label="已到货"
            value={stats?.arrived || 0}
            sub="待安装"
            color="bg-teal-500"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="售后中"
            value={stats?.after_sales || 0}
            sub="需处理"
            color="bg-red-500"
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索订单号/客户/电话"
                  value={keyword}
                  onChange={e => { setKeyword(e.target.value); setPage(1) }}
                  className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-1">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">全部状态</option>
                  {Object.entries(STATUS_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition"
            >
              <Plus className="w-4 h-4" />
              新建订单
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400">加载中...</div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-slate-400">暂无订单</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-left">
                    <th className="px-5 py-3 font-medium">订单号</th>
                    <th className="px-5 py-3 font-medium">客户</th>
                    <th className="px-5 py-3 font-medium">电话</th>
                    <th className="px-5 py-3 font-medium">金额</th>
                    <th className="px-5 py-3 font-medium">状态</th>
                    <th className="px-5 py-3 font-medium">销售</th>
                    <th className="px-5 py-3 font-medium">预计交付</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3 font-mono text-xs text-slate-700">{order.order_no}</td>
                      <td className="px-5 py-3 text-slate-900">{order.customer_name}</td>
                      <td className="px-5 py-3 text-slate-600">{order.customer_phone}</td>
                      <td className="px-5 py-3 text-slate-900 font-medium">
                        ¥{order.total_amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn(
                          'inline-flex px-2.5 py-1 text-xs font-medium rounded-md border',
                          STATUS_MAP[order.status]?.color || 'bg-gray-100 text-gray-700'
                        )}>
                          {STATUS_MAP[order.status]?.label || order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{userName(order.sales_consultant_id)}</td>
                      <td className="px-5 py-3 text-slate-600 text-xs">
                        {order.expected_delivery_date
                          ? new Date(order.expected_delivery_date).toLocaleDateString('zh-CN')
                          : '-'}
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-brand-600 hover:text-brand-700 flex items-center gap-1 text-sm"
                        >
                          查看 <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > 10 && (
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                共 {total} 条 · 第 {page} 页
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40"
                >
                  上一页
                </button>
                <button
                  disabled={page * 10 >= total}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">新建订单</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto scrollbar-thin flex-1 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-900 mb-3">客户信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">客户姓名 *</label>
                    <input
                      value={createForm.customer_name}
                      onChange={e => setCreateForm({ ...createForm, customer_name: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="请输入客户姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">联系电话 *</label>
                    <input
                      value={createForm.customer_phone}
                      onChange={e => setCreateForm({ ...createForm, customer_phone: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="请输入联系电话"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">收货地址 *</label>
                    <input
                      value={createForm.customer_address}
                      onChange={e => setCreateForm({ ...createForm, customer_address: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="请输入完整地址"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-900 mb-3">订单信息</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">定金</label>
                    <input
                      type="number"
                      value={createForm.deposit_amount}
                      onChange={e => setCreateForm({ ...createForm, deposit_amount: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">销售顾问</label>
                    <select
                      value={createForm.sales_consultant_id}
                      onChange={e => setCreateForm({ ...createForm, sales_consultant_id: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">请选择</option>
                      {users.filter(u => u.role === 'sales').map(u => (
                        <option key={u.id} value={u.id}>{u.display_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">展厅经理</label>
                    <select
                      value={createForm.showroom_manager_id}
                      onChange={e => setCreateForm({ ...createForm, showroom_manager_id: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">请选择</option>
                      {users.filter(u => u.role === 'manager').map(u => (
                        <option key={u.id} value={u.id}>{u.display_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">预计交付</label>
                    <input
                      type="date"
                      value={createForm.expected_delivery_date}
                      onChange={e => setCreateForm({ ...createForm, expected_delivery_date: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-slate-500 mb-1">备注</label>
                  <textarea
                    value={createForm.remarks}
                    onChange={e => setCreateForm({ ...createForm, remarks: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="订单备注"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-900 mb-3">商品清单</h3>
                <div className="bg-slate-50 rounded-lg p-4 mb-3 space-y-2">
                  <div className="grid grid-cols-12 gap-2">
                    <input
                      value={newItem.product_name}
                      onChange={e => setNewItem({ ...newItem, product_name: e.target.value })}
                      className="col-span-4 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="商品名称"
                    />
                    <input
                      value={newItem.product_code}
                      onChange={e => setNewItem({ ...newItem, product_code: e.target.value })}
                      className="col-span-3 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="商品编码"
                    />
                    <input
                      type="number"
                      value={newItem.quantity}
                      onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                      className="col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="数量"
                      min={1}
                    />
                    <input
                      type="number"
                      value={newItem.unit_price}
                      onChange={e => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                      className="col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="单价"
                      min={0}
                    />
                    <button
                      onClick={addItem}
                      className="col-span-1 px-3 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {createForm.items.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">暂未添加商品</p>
                ) : (
                  <div className="space-y-2">
                    {createForm.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.product_name}</p>
                          <p className="text-xs text-slate-500 font-mono">{item.product_code} · {item.quantity} × ¥{item.unit_price.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-900">¥{(item.quantity * item.unit_price).toLocaleString()}</span>
                          <button onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {createForm.items.length > 0 && (
                  <div className="mt-3 flex justify-end text-sm">
                    <span className="text-slate-500 mr-3">合计:</span>
                    <span className="font-bold text-slate-900">¥{createForm.items.reduce((s, i) => s + i.quantity * i.unit_price, 0).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                disabled={submitting}
              >
                取消
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={submitting}
                className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {submitting ? '保存中...' : '创建订单'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  sub: string
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          <p className="text-xs text-slate-400 mt-1">{sub}</p>
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white', color)}>
          {icon}
        </div>
      </div>
    </div>
  )
}