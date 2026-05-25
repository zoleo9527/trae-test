import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  Package,
  Ticket,
  MessageSquare,
  ChevronRight,
} from 'lucide-react'
import { dashboardAPI } from '../utils/api'
import {
  getFeedbackStatusBadge,
  getFeedbackTypeLabel,
  getFeedbackTypeColor,
  getReviewNotesDisplay,
} from '../utils/feedbackUtils'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [pendingItems, setPendingItems] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, itemsRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getPendingItems(),
      ])
      setStats(statsRes.data)
      setPendingItems(itemsRes.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = stats ? [
    { label: '待处理反馈', value: stats.pending_feedbacks, color: 'yellow', icon: MessageSquare, link: '/feedbacks?status=pending' },
    { label: '已驳回反馈', value: stats.rejected_feedbacks, color: 'red', icon: XCircle, link: '/feedbacks?status=rejected' },
    { label: '待确认排班', value: stats.pending_schedules, color: 'blue', icon: Calendar, link: '/schedules?status=pending' },
    { label: '待确认流转', value: stats.pending_transfers, color: 'purple', icon: Package, link: '/exhibits' },
    { label: '待核销门票', value: stats.pending_tickets, color: 'green', icon: Ticket, link: '/activities' },
    { label: '需回查事项', value: stats.needs_review_count, color: 'orange', icon: AlertCircle, link: '/review' },
  ] : []

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderFeedbackStatusBadge = (status) => {
    const { className, label } = getFeedbackStatusBadge(status)
    return <span className={className}>{label}</span>
  }

  const renderFeedbackTypeBadge = (type) => {
    return (
      <span className={'px-2 py-0.5 rounded-full text-xs font-medium ' + getFeedbackTypeColor(type)}>
        {getFeedbackTypeLabel(type)}
      </span>
    )
  }

  const renderScheduleBadge = (scheduleId) => {
    if (!scheduleId) return null
    return (
      <span className="flex items-center gap-1 text-xs text-museum-600 bg-museum-50 px-2 py-0.5 rounded">
        <Calendar size={12} />
        #{scheduleId}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">运营仪表盘</h1>
        <p className="text-gray-500 mt-1">查看今日待处理事项和运营概览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Link
              key={index}
              to={card.link}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-3xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div className={'p-3 rounded-lg bg-' + card.color + '-100'}>
                    <Icon className={'text-' + card.color + '-600'} size={24} />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="text-yellow-500" size={20} />
              待处理反馈
            </h2>
            <Link to="/feedbacks" className="text-museum-600 text-sm flex items-center hover:underline">
              查看全部 <ChevronRight size={16} />
            </Link>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {pendingItems?.pending_feedbacks?.length > 0 ? (
                pendingItems.pending_feedbacks.slice(0, 5).map((feedback) => (
                  <Link
                    key={feedback.id}
                    to={'/feedbacks/' + feedback.id}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900">{feedback.title}</p>
                          {renderFeedbackTypeBadge(feedback.feedback_type)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{feedback.visitor_name || '匿名'}</p>
                      </div>
                      {renderFeedbackStatusBadge(feedback.status)}
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">暂无待处理反馈</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <XCircle className="text-red-500" size={20} />
              已驳回反馈
            </h2>
            <Link to="/feedbacks?status=rejected" className="text-museum-600 text-sm flex items-center hover:underline">
              查看全部 <ChevronRight size={16} />
            </Link>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {pendingItems?.rejected_feedbacks?.length > 0 ? (
                pendingItems.rejected_feedbacks.slice(0, 5).map((feedback) => (
                  <Link
                    key={feedback.id}
                    to={'/feedbacks/' + feedback.id}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900">{feedback.title}</p>
                          {renderFeedbackTypeBadge(feedback.feedback_type)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{formatDate(feedback.created_at)}</p>
                      </div>
                      <span className="status-badge status-rejected">已驳回</span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">暂无已驳回反馈</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="text-orange-500" size={20} />
              需回查事项
            </h2>
            <Link to="/review" className="text-museum-600 text-sm flex items-center hover:underline">
              查看全部 <ChevronRight size={16} />
            </Link>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {pendingItems?.needs_review?.length > 0 ? (
                pendingItems.needs_review.slice(0, 5).map((feedback) => (
                  <Link
                    key={feedback.id}
                    to={'/feedbacks/' + feedback.id}
                    className="block p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-medium text-gray-900">{feedback.title}</p>
                          <span className="status-badge bg-orange-100 text-orange-800">需回查</span>
                          {renderFeedbackStatusBadge(feedback.status)}
                          {renderScheduleBadge(feedback.schedule_id)}
                        </div>
                        <div className="mt-2 p-2 bg-orange-100 bg-opacity-50 rounded">
                          <p className="text-sm text-orange-700">
                            <span className="font-medium">回查说明：</span>
                            {getReviewNotesDisplay(feedback.review_notes)}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="text-orange-500 mt-2" size={18} />
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">暂无需回查事项</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="text-purple-500" size={20} />
              待确认展品流转
            </h2>
            <Link to="/exhibits" className="text-museum-600 text-sm flex items-center hover:underline">
              查看全部 <ChevronRight size={16} />
            </Link>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {pendingItems?.pending_transfers?.length > 0 ? (
                pendingItems.pending_transfers.slice(0, 5).map((transfer) => (
                  <div
                    key={transfer.id}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{transfer.from_location} → {transfer.to_location}</p>
                        <p className="text-sm text-gray-500 mt-1">{transfer.transfer_type || '流转'}</p>
                      </div>
                      <span className="status-badge status-pending">待确认</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">暂无待确认流转</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
