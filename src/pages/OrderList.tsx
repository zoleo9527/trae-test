import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../components/common/StatusBadge'
import { EmptyState } from '../components/common/EmptyState'
import { useOrderStore } from '../store/orderStore'
import { useRoleStore } from '../store/roleStore'
import { getRolePermissions } from '../data/mockData'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { OrderStatus } from '../types'

export const OrderList: React.FC = () => {
  const { orders, markAsReviewed } = useOrderStore()
  const { currentRole } = useRoleStore()
  const permissions = getRolePermissions(currentRole)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const statusOptions: Array<{ value: OrderStatus | 'all'; label: string }> = [
    { value: 'all', label: '全部' },
    { value: 'sampling', label: '打样中' },
    { value: 'confirmed', label: '已确认' },
    { value: 'scheduled', label: '排期中' },
    { value: 'split', label: '已拆单' },
    { value: 'shipped', label: '已发货' },
    { value: 'completed', label: '已完成' },
    { value: 'rejected', label: '已驳回' },
  ]

  const filteredOrders = orders.filter((order) => {
    const matchStatus = statusFilter === 'all' || order.status === statusFilter
    const matchSearch = order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchStatus && matchSearch
  })

  const getTotalAmount = (order: typeof orders[0]) => {
    return order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="搜索订单号或客户名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-dark-600">状态筛选：</span>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-3 py-1.5 text-sm rounded-btn transition-colors ${
                    statusFilter === option.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-200">
                  <th className="table-header">订单号</th>
                  <th className="table-header">客户名称</th>
                  <th className="table-header">金额</th>
                  <th className="table-header">状态</th>
                  <th className="table-header">创建人</th>
                  <th className="table-header">创建时间</th>
                  <th className="table-header">标记</th>
                  <th className="table-header text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-dark-50 transition-colors">
                    <td className="table-cell">
                      <div className="font-medium text-dark-900 font-mono">{order.orderNo}</div>
                      <div className="text-xs text-dark-500">{order.items.length}类商品</div>
                    </td>
                    <td className="table-cell">
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-xs text-dark-500">{order.contactPhone}</div>
                    </td>
                    <td className="table-cell">
                      <span className="font-mono font-semibold text-dark-900">
                        ¥{getTotalAmount(order).toLocaleString()}
                      </span>
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="table-cell text-dark-600">{order.createdBy}</td>
                    <td className="table-cell text-dark-500">
                      {format(new Date(order.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                    </td>
                    <td className="table-cell">
                      {order.needsReview && (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          需回查
                        </span>
                      )}
                      {order.rejectionReason && (
                        <div className="text-xs text-danger mt-1">驳回原因：{order.rejectionReason}</div>
                      )}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/orders/${order.id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          查看详情
                        </Link>
                        {order.needsReview && permissions.canViewReview && (
                          <button
                            onClick={() => markAsReviewed(order.id)}
                            className="text-success hover:text-green-700 text-sm"
                          >
                            标记已阅
                          </button>
                        )}
                        {permissions.canSplitOrder && order.status === 'confirmed' && (
                          <Link
                            to={`/split/${order.id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            拆单
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="暂无订单"
            description={searchQuery || statusFilter !== 'all' ? '没有找到符合条件的订单' : '还没有创建任何订单'}
            action={permissions.canCreateOrder && (
              <button className="btn-primary">创建第一个订单</button>
            )}
          />
        )}
      </div>
    </div>
  )
}
