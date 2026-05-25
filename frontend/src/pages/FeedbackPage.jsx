import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Plus, User, Phone, MessageSquare, ChevronRight, Filter, ArrowLeft, Calendar } from 'lucide-react'
import { feedbackAPI, scheduleAPI } from '../utils/api'

export default function FeedbackPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [feedbacks, setFeedbacks] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '')
  const [preSelectedSchedule, setPreSelectedSchedule] = useState(null)
  const [formData, setFormData] = useState({
    visitor_name: '',
    visitor_contact: '',
    feedback_type: 'complaint',
    title: '',
    content: '',
    schedule_id: '',
  })

  useEffect(() => {
    const scheduleId = searchParams.get('schedule_id')
    if (scheduleId) {
      setFormData({ ...formData, schedule_id: scheduleId })
      fetchScheduleInfo(scheduleId)
      setShowModal(true)
    }
    fetchFeedbacks()
  }, [filterStatus])

  const fetchScheduleInfo = async (scheduleId) => {
    try {
      const res = await scheduleAPI.get(scheduleId)
      setPreSelectedSchedule(res.data)
    } catch (error) {
      console.error('Failed to fetch schedule info:', error)
    }
  }

  const fetchFeedbacks = async () => {
    try {
      const params = filterStatus ? { status: filterStatus } : {}
      const res = await feedbackAPI.getAll(params)
      setFeedbacks(res.data)
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await feedbackAPI.create({
        ...formData,
        schedule_id: formData.schedule_id ? parseInt(formData.schedule_id) : null,
      })
      setShowModal(false)
      setPreSelectedSchedule(null)
      setSearchParams({})
      fetchFeedbacks()
      setFormData({
        visitor_name: '',
        visitor_contact: '',
        feedback_type: 'complaint',
        title: '',
        content: '',
        schedule_id: '',
      })
    } catch (error) {
      console.error('Failed to create feedback:', error)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setPreSelectedSchedule(null)
    setSearchParams({})
    setFormData({
      visitor_name: '',
      visitor_contact: '',
      feedback_type: 'complaint',
      title: '',
      content: '',
      schedule_id: '',
    })
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { class: 'status-pending', label: '待处理' },
      processing: { class: 'status-processing', label: '处理中' },
      resolved: { class: 'status-resolved', label: '已解决' },
      rejected: { class: 'status-rejected', label: '已驳回' },
      needs_review: { class: 'bg-orange-100 text-orange-800', label: '需回查' },
    }
    const info = statusMap[status] || statusMap.pending
    return <span className={`status-badge ${info.class}`}>{info.label}</span>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">观众反馈</h1>
          <p className="text-gray-500 mt-1">处理观众反馈和投诉</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select
              className="input !w-32"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                if (e.target.value) {
                  setSearchParams({ status: e.target.value })
                } else {
                  setSearchParams({})
                }
              }}
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="resolved">已解决</option>
              <option value="rejected">已驳回</option>
            </select>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            新增反馈
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {feedbacks.map((feedback) => (
          <Link
            key={feedback.id}
            to={'/feedbacks/' + feedback.id}
            className="card hover:shadow-md transition-shadow"
          >
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold">{feedback.title}</h3>
                    <span className={'px-2 py-1 rounded-full text-xs font-medium ' + getTypeColor(feedback.feedback_type)}>
                      {getTypeLabel(feedback.feedback_type)}
                    </span>
                    {feedback.needs_review && (
                      <span className="status-badge bg-orange-100 text-orange-800">需回查</span>
                    )}
                    {getStatusBadge(feedback.status)}
                    {feedback.schedule_id && (
                      <span className="flex items-center gap-1 text-xs text-museum-600 bg-museum-50 px-2 py-1 rounded">
                        <Calendar size={12} />
                        关联排班 #{feedback.schedule_id}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-2 line-clamp-2">{feedback.content}</p>
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{feedback.visitor_name || '匿名'}</span>
                    </div>
                    {feedback.visitor_contact && (
                      <div className="flex items-center gap-1">
                        <Phone size={14} />
                        <span>{feedback.visitor_contact}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <MessageSquare size={14} />
                      <span>{formatDate(feedback.created_at)}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-gray-400" size={20} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              {preSelectedSchedule && (
                <button
                  onClick={() => navigate('/schedules')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <h2 className="text-xl font-bold">新增反馈</h2>
            </div>

            {preSelectedSchedule && (
              <div className="mb-4 p-3 bg-museum-50 rounded-lg border border-museum-200">
                <p className="text-sm text-museum-800 font-medium">
                  已关联排班 #{preSelectedSchedule.id}
                </p>
                <p className="text-xs text-museum-600 mt-1">
                  {new Date(preSelectedSchedule.date).toLocaleDateString('zh-CN')}
                  {' '}{preSelectedSchedule.location || ''}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">反馈类型</label>
                <select
                  className="input"
                  value={formData.feedback_type}
                  onChange={(e) => setFormData({ ...formData, feedback_type: e.target.value })}
                  required
                >
                  <option value="complaint">投诉</option>
                  <option value="suggestion">建议</option>
                  <option value="praise">表扬</option>
                  <option value="question">咨询</option>
                </select>
              </div>
              <div>
                <label className="label">标题</label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="简要描述反馈内容"
                />
              </div>
              <div>
                <label className="label">详细内容</label>
                <textarea
                  className="input"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows="4"
                  required
                  placeholder="详细描述反馈内容"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">访客姓名</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.visitor_name}
                    onChange={(e) => setFormData({ ...formData, visitor_name: e.target.value })}
                    placeholder="可选"
                  />
                </div>
                <div>
                  <label className="label">联系方式</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.visitor_contact}
                    onChange={(e) => setFormData({ ...formData, visitor_contact: e.target.value })}
                    placeholder="可选"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
