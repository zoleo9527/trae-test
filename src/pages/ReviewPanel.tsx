import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Timeline } from '../components/common/Timeline'
import { EmptyState } from '../components/common/EmptyState'
import { useOrderStore } from '../store/orderStore'
import type { TimelineEvent } from '../types'
import { ReviewSourceLabels } from '../types'

export const ReviewPanel: React.FC = () => {
  const { orders, timeline, markAsReviewed } = useOrderStore()
  const navigate = useNavigate()

  const [filter, setFilter] = useState<'all' | 'exception' | 'review'>('all')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const needsReviewOrderIds = useMemo(() => {
    return new Set(orders.filter((o) => o.needsReview).map((o) => o.id))
  }, [orders])

  const filteredTimeline = useMemo(() => {
    let events = [...timeline]

    if (filter === 'exception') {
      events = events.filter((e) => e.isException)
    } else if (filter === 'review') {
      events = events.filter((e) => needsReviewOrderIds.has(e.orderId))
    }

    return events.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [timeline, filter, needsReviewOrderIds])

  const needsReviewOrders = useMemo(() => {
    return orders.filter((o) => o.needsReview)
  }, [orders])

  const handleEventClick = (event: TimelineEvent) => {
    if (event.type.startsWith('order_')) {
      navigate(`/orders/${event.orderId}`)
    } else if (event.type.startsWith('split_')) {
      navigate(`/orders/${event.orderId}`)
    } else if (event.type.startsWith('refund_')) {
      navigate('/refunds')
    }
  }

  const exceptionStats = useMemo(() => {
    const exceptions = timeline.filter((e) => e.isException).length
    const needsReview = orders.filter((o) => o.needsReview).length
    return { exceptions, needsReview }
  }, [timeline, orders])

  const filterOptions = [
    { value: 'all', label: '全部事件' },
    { value: 'exception', label: '仅异常' },
    { value: 'review', label: '待回查' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-500">异常事件</p>
              <p className="text-3xl font-bold font-mono text-danger mt-1">{exceptionStats.exceptions}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-500">待回查</p>
              <p className="text-3xl font-bold font-mono text-yellow-600 mt-1">{exceptionStats.needsReview}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {needsReviewOrders.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">需回查订单</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {needsReviewOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => {
                      setSelectedOrderId(order.id)
                      navigate(`/orders/${order.id}`)
                    }}
                    className="inline-flex flex-col items-start px-3 py-2 bg-white border border-yellow-300 rounded hover:bg-yellow-100 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-medium">{order.orderNo}</span>
                      <span
                        className="text-xs text-success hover:text-green-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsReviewed(order.id)
                        }}
                      >
                        [标记已阅]
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {order.reviewSources.map((source, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded"
                        >
                          {ReviewSourceLabels[source.type]}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-yellow-600 mt-1 text-left">{order.reviewReason}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-dark-700 mb-3">事件筛选</h3>
            <div className="space-y-1">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value as typeof filter)}
                  className={`w-full text-left px-3 py-2 rounded-btn text-sm transition-colors ${
                    filter === option.value
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-dark-600 hover:bg-dark-50'
                  }`}
                >
                  {option.label}
                  <span className="float-right text-xs text-dark-400">
                    {option.value === 'all'
                      ? timeline.length
                      : option.value === 'exception'
                      ? exceptionStats.exceptions
                      : exceptionStats.needsReview}
                  </span>
                </button>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-dark-700 mb-3 mt-6">关联订单</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedOrderId(null)}
                className={`w-full text-left px-3 py-2 rounded-btn text-sm transition-colors ${
                  !selectedOrderId
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-dark-600 hover:bg-dark-50'
                }`}
              >
                全部订单
              </button>
              {orders.map((order) => {
                const hasException = order.needsReview || timeline.some(
                  (e) => e.orderId === order.id && e.isException
                )
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full text-left px-3 py-2 rounded-btn text-sm transition-colors flex items-center justify-between ${
                      selectedOrderId === order.id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-dark-600 hover:bg-dark-50'
                    }`}
                  >
                    <span className="truncate">{order.orderNo}</span>
                    {order.needsReview && (
                      <span className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0" title="待回查" />
                    )}
                    {!order.needsReview && hasException && (
                      <span className="w-2 h-2 bg-danger rounded-full flex-shrink-0" title="有异常" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-dark-900">
                {selectedOrderId ? '订单时间线' : '全局时间线'}
              </h3>
              {selectedOrderId && (
                <button
                  onClick={() => setSelectedOrderId(null)}
                  className="text-sm text-dark-500 hover:text-dark-700"
                >
                  查看全部
                </button>
              )}
            </div>
            {filteredTimeline.length > 0 ? (
              <div className="max-h-[600px] overflow-y-auto scrollbar-thin pr-2">
                <Timeline
                  events={selectedOrderId
                    ? filteredTimeline.filter((e) => e.orderId === selectedOrderId)
                    : filteredTimeline
                  }
                  onEventClick={handleEventClick}
                  highlightOrderId={selectedOrderId || undefined}
                />
              </div>
            ) : (
              <EmptyState
                title="暂无事件记录"
                description={filter !== 'all' ? '没有找到符合筛选条件的事件' : '还没有任何操作记录'}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
