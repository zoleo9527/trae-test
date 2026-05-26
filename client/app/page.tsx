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
              onClick={() => { /* TODO: create order modal */ }}
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