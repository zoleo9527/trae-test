import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge'
import { EmptyState } from '../components/common/EmptyState'
import { useOrderStore } from '../store/orderStore'
import { useSplitStore } from '../store/splitStore'
import { useReceiptStore } from '../store/receiptStore'
import { useRefundStore } from '../store/refundStore'
import { useRoleStore } from '../store/roleStore'
import { getRolePermissions } from '../data/mockData'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { OrderStatus, SplitStatus, RefundStatus, ReceiptStatus } from '../types'

const statusPriority: Record<string, 'high' | 'medium' | 'low'> = {
  sampling: 'medium',
  confirmed: 'medium',
  scheduled: 'high',
  split: 'high',
  pending: 'high',
  exception: 'high',
}

export const Dashboard: React.FC = () => {
  const { orders } = useOrderStore()
  const { splits } = useSplitStore()
  const { receipts, getReceiptBySplitId } = useReceiptStore()
  const { refunds } = useRefundStore()
  const { currentRole } = useRoleStore()
  const permissions = getRolePermissions(currentRole)
  const navigate = useNavigate()

  const stats = useMemo(() => {
    let pending = 0
    let rejected = 0
    let needsReview = 0
    const pendingItems: Array<{
      id: string
      type: 'order' | 'split' | 'receipt' | 'refund'
      title: string
      subTitle: string
      status: string
      priority: 'high' | 'medium' | 'low'
      orderId?: string
      splitId?: string
    }> = []

    orders.forEach((order) => {
      if (order.status === 'rejected') {
        rejected++
        pendingItems.push({
          id: order.id,
          type: 'order',
          title: order.orderNo,
          subTitle: order.customerName,
          status: order.status as OrderStatus,
          priority: 'high',
          orderId: order.id,
        })
      }
      if (order.needsReview) {
        needsReview++
      }
      if (['sampling', 'confirmed', 'scheduled'].includes(order.status)) {
        pending++
        pendingItems.push({
          id: order.id,
          type: 'order',
          title: order.orderNo,
          subTitle: order.customerName,
          status: order.status as OrderStatus,
          priority: statusPriority[order.status] || 'medium',
          orderId: order.id,
        })
      }
    })

    splits.forEach((split) => {
      const order = orders.find((o) => o.id === split.orderId)
      if (split.status === 'pending') {
        pending++
        pendingItems.push({
          id: split.id,
          type: 'split',
          title: split.splitNo,
          subTitle: `${order?.customerName || ''} · 待发货 ${split.items.length}类商品`,
          status: split.status as SplitStatus,
          priority: split.missingWarning ? 'high' : 'medium',
          orderId: split.orderId,
        })
      }
      if (split.status === 'shipped') {
        const receipt = getReceiptBySplitId(split.id)
        if (!receipt) {
          pending++
          pendingItems.push({
            id: split.id,
            type: 'receipt',
            title: `${split.splitNo} · 待回执`,
            subTitle: order?.customerName || '',
            status: 'pending' as ReceiptStatus,
            priority: 'medium',
            orderId: split.orderId,
            splitId: split.id,
          })
        }
      }
    })

    orders.forEach((order) => {
      if (order.needsReview) {
        pendingItems.push({
          id: order.id,
          type: 'order',
          title: `${order.orderNo} · 需回查`,
          subTitle: order.reviewReason || '需要确认处理',
          status: 'needsReview',
          priority: 'high',
          orderId: order.id,
        })
      }
    })

    refunds.forEach((refund) => {
      if (refund.status === 'pending' || refund.status === 'finance_approved') {
        pending++
        const order = orders.find((o) => o.id === refund.orderId)
        pendingItems.push({
          id: refund.id,
          type: 'refund',
          title: `¥${refund.amount.toFixed(2)} 退款申请`,
          subTitle: order?.customerName || '',
          status: refund.status as RefundStatus,
          priority: 'high',
          orderId: refund.orderId,
        })
      }
      if (refund.status === 'rejected') {
        rejected++
      }
    })

    pendingItems.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    return { pending, rejected, needsReview, pendingItems: pendingItems.slice(0, 8) }
  }, [orders, splits, receipts, refunds, getReceiptBySplitId])

  const statCards = [
    {
      label: '待处理',
      value: stats.pending,
      color: 'bg-primary-500',
      bgColor: 'bg-primary-50',
      textColor: 'text-primary-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: '已驳回',
      value: stats.rejected,
      color: 'bg-danger',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: '需回查',
      value: stats.needsReview,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      ),
    },
  ]

  const handleItemClick = (item: typeof stats.pendingItems[0]) => {
    switch (item.type) {
      case 'order':
        navigate(`/orders/${item.id}`)
        break
      case 'split':
        if (item.orderId) {
          navigate(`/split/${item.orderId}`)
        }
        break
      case 'receipt':
        if (item.splitId) {
          navigate(`/receipts?splitId=${item.splitId}`)
        } else {
          navigate('/receipts')
        }
        break
      case 'refund':
        navigate('/refunds')
        break
    }
  }

  const getItemTypeLabel = (type: string, status?: string) => {
    if (status === 'needsReview') return '需回查'
    const labels: Record<string, string> = {
      order: '订单',
      split: '拆单',
      receipt: '回执',
      refund: '退款',
    }
    return labels[type] || type
  }

  const quickActions = [
    { label: '订单列表', action: () => navigate('/orders'), permission: true, icon: '📋' },
    { label: '拆单发货', action: () => navigate('/orders'), permission: permissions.canSplitOrder, icon: '🚚' },
    { label: '录入回执', action: () => navigate('/receipts'), permission: permissions.canEnterReceipt, icon: '✅' },
    { label: '退款处理', action: () => navigate('/refunds'), permission: true, icon: '💰' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="card p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-500">{card.label}</p>
                <p className={`text-4xl font-bold font-mono mt-2 ${card.textColor}`}>
                  {card.value}
                </p>
              </div>
              <div className={`${card.bgColor} p-3 rounded-lg`}>
                <span className={card.textColor}>{card.icon}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-dark-100">
              <div className="flex items-center space-x-1">
                <div className={`h-1 flex-1 ${card.bgColor} rounded-full`}>
                  <div
                    className={`h-full ${card.color} rounded-full`}
                    style={{ width: `${Math.min(card.value * 10, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="px-6 py-4 border-b border-dark-100">
              <h2 className="text-lg font-semibold text-dark-900">待办事项</h2>
              <p className="text-sm text-dark-500 mt-1">按优先级排列，点击可跳转处理</p>
            </div>
            <div className="divide-y divide-dark-100">
              {stats.pendingItems.length > 0 ? (
                stats.pendingItems.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleItemClick(item)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-dark-50 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        item.status === 'needsReview' ? 'bg-yellow-100 text-yellow-600' : 'bg-dark-100 text-dark-500'
                      }`}>
                        {item.status === 'needsReview' && '⚠️'}
                        {item.status !== 'needsReview' && item.type === 'order' && '📋'}
                        {item.status !== 'needsReview' && item.type === 'split' && '📦'}
                        {item.status !== 'needsReview' && item.type === 'receipt' && '📨'}
                        {item.status !== 'needsReview' && item.type === 'refund' && '💰'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-dark-400">{getItemTypeLabel(item.type, item.status)}</span>
                          <PriorityBadge priority={item.priority} />
                        </div>
                        <p className="font-medium text-dark-800 mt-0.5">{item.title}</p>
                        <p className="text-sm text-dark-500">{item.subTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <StatusBadge status={item.status as OrderStatus} />
                      <svg className="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-8">
                  <EmptyState
                    title="暂无待办事项"
                    description="所有任务已处理完毕，喝杯咖啡休息一下吧"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="px-6 py-4 border-b border-dark-100">
              <h2 className="text-lg font-semibold text-dark-900">快捷操作</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {quickActions.filter((a) => a.permission).map((action) => (
                <button
                  key={action.label}
                  onClick={action.action}
                  className="flex flex-col items-center justify-center p-4 bg-dark-50 hover:bg-primary-50 hover:border-primary-200 border border-transparent rounded-btn transition-all duration-200"
                >
                  <span className="text-2xl mb-2">{action.icon}</span>
                  <span className="text-sm font-medium text-dark-700">{action.label}</span>
                </button>
              ))}
              {quickActions.filter((a) => !a.permission).map((action) => (
                <button
                  key={action.label}
                  disabled
                  className="flex flex-col items-center justify-center p-4 bg-dark-50 border border-dark-100 rounded-btn opacity-50 cursor-not-allowed"
                  title="当前角色无此权限"
                >
                  <span className="text-2xl mb-2 grayscale">{action.icon}</span>
                  <span className="text-sm font-medium text-dark-500">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="px-6 py-4 border-b border-dark-100">
              <h2 className="text-lg font-semibold text-dark-900">数据概览</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-dark-600">订单总数</span>
                <span className="font-mono font-semibold text-dark-900">{orders.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-600">已拆单</span>
                <span className="font-mono font-semibold text-dark-900">{splits.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-600">已回执</span>
                <span className="font-mono font-semibold text-dark-900">{receipts.filter(r => r.status === 'signed').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-600">退款中</span>
                <span className="font-mono font-semibold text-dark-900">{refunds.filter(r => r.status !== 'completed' && r.status !== 'rejected').length}</span>
              </div>
              <div className="pt-3 border-t border-dark-100">
                <p className="text-xs text-dark-400">
                  数据更新于 {format(new Date(), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
