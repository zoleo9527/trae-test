import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, AlertCircle, Clock, User, ChevronRight, Filter, Calendar } from 'lucide-react'
import { feedbackAPI } from '../utils/api'

export default function ReviewPage() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')

  useEffect(() => {
    fetchFeedbacks()
  }, [])

  const fetchFeedbacks = async () => {
    try {
      const res = await feedbackAPI.getAll({ needs_review: true })
      setFeedbacks(res.data)
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const matchesSearch = feedback.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !filterType || feedback.feedback_type === filterType
    return matchesSearch && matchesType
  })

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { class: 'status-pending', label: '待处理' },
      processing: { class: 'status-processing', label: '处理中' },
      resolved: { class: 'status-resolved', label: '已解决' },
      rejected: { class: 'status-rejected', label: '已驳回' },
      needs_review: { class: 'bg-orange-100 text-orange-800', label: '需回查' },
    }
    const info = statusMap[status] || statusMap.pending
    return <span className={'status-badge ' + info.class}>{info.label}</span>
  }

  const getTypeLabel = (type) => {
    const typeMap = {
      complaint: '投诉',
      suggestion: '建议',
      praise: '表扬',
      question: '咨询',
    }
    return typeMap[type] || type
  }

  const getTypeColor = (type) => {
    const colorMap = {
      complaint: 'text-red-600 bg-red-100',
      suggestion: 'text-blue-600 bg-blue-100',
      praise: 'text-green-600 bg-green-100',
      question: 'text-purple-600 bg-purple-100',
    }
    return colorMap[type] || 'text-gray-600 bg-gray-100'
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
        <h1 className="text-2xl font-bold text-gray-900">连续回查面板</h1>
        <p className="text-gray-500 mt-1">追踪和复查需要关注的反馈事项</p>
      </div>

      <div className="card bg-orange-50 border-orange-200">
        <div className="card-body">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-orange-500" size={24} />
            <div>
              <h3 className="font-semibold text-orange-800">待回查事项</h3>
              <p className="text-sm text-orange-600">共有 {feedbacks.length} 项需要回查的反馈记录</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            className="input pl-10"
            placeholder="搜索反馈标题或内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <select
            className="input !w-32"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">全部类型</option>
            <option value="complaint">投诉</option>
            <option value="suggestion">建议</option>
            <option value="praise">表扬</option>
            <option value="question">咨询</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredFeedbacks.length > 0 ? (
          filteredFeedbacks.map((feedback) => (
            <Link
              key={feedback.id}
              to={'/feedbacks/' + feedback.id}
              className="card hover:shadow-md transition-shadow block"
            >
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-semibold">{feedback.title}</h3>
                      <span className={'px-2 py-1 rounded-full text-xs font-medium ' + getTypeColor(feedback.feedback_type)}>
                        {getTypeLabel(feedback.feedback_type)}
                      </span>
                      <span className="status-badge bg-orange-100 text-orange-800">需回查</span>
                      {getStatusBadge(feedback.status)}
                      {feedback.schedule_id && (
                        <span className="flex items-center gap-1 text-xs text-museum-600 bg-museum-50 px-2 py-1 rounded">
                          <Calendar size={12} />
                          关联排班 #{feedback.schedule_id}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-2 line-clamp-2">{feedback.content}</p>
                    {feedback.review_notes && (
                      <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-sm text-orange-700">
                          <span className="font-medium">回查说明：</span>
                          {feedback.review_notes}
                        </p>
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>{feedback.visitor_name || '匿名'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{formatDate(feedback.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-400 mt-2" size={20} />
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="card">
            <div className="card-body text-center py-12">
              <AlertCircle className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">暂无需回查的事项</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
