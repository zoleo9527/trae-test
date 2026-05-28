import React, { useState } from 'react'
import { format } from 'date-fns'
import type { TimelineEvent } from '../../types'
import { zhCN } from 'date-fns/locale'

interface TimelineProps {
  events: TimelineEvent[]
  onEventClick?: (event: TimelineEvent) => void
  highlightOrderId?: string
}

const eventIcons: Record<TimelineEvent['type'], React.ReactNode> = {
  order_create: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  version_confirm: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  version_override: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  order_schedule: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  split_create: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  split_ship: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  ),
  receipt_sign: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  receipt_exception: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  refund_create: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  refund_approve: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  refund_reject: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

export const Timeline: React.FC<TimelineProps> = ({ events, onEventClick, highlightOrderId }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sortedEvents = [...events].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {sortedEvents.map((event, eventIdx) => {
          const isExpanded = expandedId === event.id
          const isHighlighted = highlightOrderId && event.orderId === highlightOrderId
          const isException = event.isException
          const needsReview = event.needsReview

          return (
            <li key={event.id}>
              <div className={`relative pb-8 ${isHighlighted ? 'bg-primary-50 -mx-4 px-4 rounded-t-lg' : ''}`}>
                {eventIdx !== sortedEvents.length - 1 && (
                  <span
                    className={`absolute left-5 top-5 -ml-px h-full w-0.5 ${
                      isException ? 'bg-danger' : 'bg-dark-200'
                    }`}
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start space-x-4">
                  <div
                    className={`relative flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${
                      isException
                        ? 'bg-red-100 text-danger ring-4 ring-red-50'
                        : needsReview
                        ? 'bg-yellow-100 text-yellow-600 ring-4 ring-yellow-50'
                        : 'bg-dark-100 text-dark-600 ring-4 bg-dark-50'
                    } ${isHighlighted ? 'ring-primary-100 bg-primary-100 text-primary-600' : ''}`}
                  >
                    {eventIcons[event.type]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h4 className={`text-sm font-medium ${isException ? 'text-danger' : 'text-dark-900'}`}>
                            {event.title}
                          </h4>
                          {isException && (
                            <span className="status-badge bg-red-100 text-red-700">异常</span>
                          )}
                          {needsReview && !isException && (
                            <span className="status-badge bg-yellow-100 text-yellow-700">需回查</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-dark-500 font-mono">
                            {format(new Date(event.timestamp), 'MM-dd HH:mm', { locale: zhCN })}
                          </span>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : event.id)}
                            className="p-1 hover:bg-dark-100 rounded transition-colors"
                          >
                            <svg
                              className={`w-4 h-4 text-dark-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-dark-600">{event.description}</p>
                      <div className="mt-1 flex items-center space-x-2 text-xs text-dark-500">
                        <span>操作人：{event.operator}</span>
                        {event.metadata && (
                          <>
                            <span className="text-dark-300">·</span>
                            <span>
                              {Object.entries(event.metadata)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join('，')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <div
                        className="mt-3 p-3 bg-dark-50 rounded-lg text-sm animate-fade-in cursor-pointer hover:bg-dark-100 transition-colors"
                        onClick={() => onEventClick?.(event)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-dark-600">订单ID：{event.orderId}</span>
                          <span className="text-primary-600 flex items-center text-xs">
                            查看详情
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                        {event.splitId && (
                          <div className="mt-1 text-dark-600">拆单ID：{event.splitId}</div>
                        )}
                        {event.refundId && (
                          <div className="mt-1 text-dark-600">退款ID：{event.refundId}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
