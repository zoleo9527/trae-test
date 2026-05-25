import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, User, Phone, Clock, Send, History, Calendar, Save } from 'lucide-react'
import { feedbackAPI } from '../utils/api'
import {
  getFeedbackStatusBadge,
  getFeedbackTypeLabel,
  getFeedbackTypeColor,
  getReviewNotesDisplay,
} from '../utils/feedbackUtils'

export default function FeedbackDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState(null)
  const [traces, setTraces] = useState([])
  const [loading, setLoading] = useState(true)
  const [response, setResponse] = useState('')
  const [traceRemark, setTraceRemark] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [isEditingReviewNotes, setIsEditingReviewNotes] = useState(false)

  useEffect(() => {
    fetchFeedbackDetail()
  }, [id])

  const fetchFeedbackDetail = async () => {
    try {
      const [feedbackRes, tracesRes] = await Promise.all([
        feedbackAPI.get(id),
        feedbackAPI.getTraces(id),
      ])
      setFeedback(feedbackRes.data)
      setTraces(tracesRes.data)
      setResponse(feedbackRes.data.response || '')
      setReviewNotes(feedbackRes.data.review_notes || '')
    } catch (error) {
      console.error('Failed to fetch feedback detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (status) => {
    try {
      await feedbackAPI.update(id, { status })
      fetchFeedbackDetail()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleResponse = async () => {
    if (!response.trim()) return
    try {
      await feedbackAPI.update(id, { response, status: 'resolved' })
      fetchFeedbackDetail()
    } catch (error) {
      console.error('Failed to submit response:', error)
    }
  }

  const handleAddTrace = async () => {
    if (!traceRemark.trim()) return
    try {
      await feedbackAPI.addTrace({
        feedback_id: parseInt(id),
        operator_name: '管理员',
        action: '添加回查记录',
        remarks: traceRemark,
      })
      setTraceRemark('')
      fetchFeedbackDetail()
    } catch (error) {
      console.error('Failed to add trace:', error)
    }
  }

  const handleMarkForReview = async () => {
    try {
      await feedbackAPI.update(id, { needs_review: !feedback.needs_review })
      fetchFeedbackDetail()
    } catch (error) {
      console.error('Failed to mark for review:', error)
    }
  }

  const handleSaveReviewNotes = async () => {
    try {
      await feedbackAPI.update(id, { review_notes: reviewNotes })
      setIsEditingReviewNotes(false)
      fetchFeedbackDetail()
    } catch (error) {
      console.error('Failed to save review notes:', error)
    }
  }

  const renderFeedbackStatusBadge = (status) => {
    const { className, label } = getFeedbackStatusBadge(status)
    return <span className={className}>{label}</span>
  }

  const renderFeedbackTypeBadge = (type) => {
    return (
      <span className={'px-2 py-1 rounded-full text-xs font-medium ' + getFeedbackTypeColor(type)}>
        {getFeedbackTypeLabel(type)}
      </span>
    )
  }

  const renderScheduleBadge = (scheduleId) => {
    if (!scheduleId) return null
    return (
      <span className="flex items-center gap-1 text-xs text-museum-600 bg-museum-50 px-2 py-1 rounded">
        <Calendar size={12} />
        <Link to="/schedules" className="hover:underline">
          关联排班 #{scheduleId}
        </Link>
      </span>
    )
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
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

  if (!feedback) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">反馈记录不存在</p>
        <Link to="/feedbacks" className="text-museum-600 hover:underline mt-2 inline-block">
          返回列表
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{feedback.title}</h1>
          <p className="text-gray-500 mt-1">反馈详情</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-semibold">反馈内容</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {renderFeedbackTypeBadge(feedback.feedback_type)}
                  {feedback.needs_review && (
                    <span className="status-badge bg-orange-100 text-orange-800">需回查</span>
                  )}
                  {renderFeedbackStatusBadge(feedback.status)}
                  {renderScheduleBadge(feedback.schedule_id)}
                </div>
              </div>
            </div>
            <div className="card-body">
              <p className="text-gray-700 whitespace-pre-wrap">{feedback.content}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 flex-wrap">
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
                  <Clock size={14} />
                  <span>{formatDate(feedback.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {feedback.response && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">处理回复</h2>
              </div>
              <div className="card-body">
                <p className="text-gray-700 whitespace-pre-wrap">{feedback.response}</p>
                {feedback.response_at && (
                  <p className="text-sm text-gray-500 mt-2">
                    回复时间: {formatDate(feedback.response_at)}
                  </p>
                )}
              </div>
            </div>
          )}

          {feedback.status !== 'resolved' && feedback.status !== 'rejected' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">提交回复</h2>
              </div>
              <div className="card-body">
                <textarea
                  className="input"
                  rows="4"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="输入处理回复..."
                />
                <div className="mt-3 flex justify-end">
                  <button onClick={handleResponse} className="btn btn-primary flex items-center gap-2">
                    <Send size={16} />
                    提交回复并标记解决
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History size={18} />
                回查记录
              </h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {traces.length > 0 ? (
                  traces.map((trace) => (
                    <div key={trace.id} className="border-l-2 border-gray-200 pl-4 py-2">
                      <div className="flex items-center gap-2 text-sm flex-wrap">
                        <span className="font-medium">{trace.operator_name}</span>
                        <span className="text-gray-500">{trace.action}</span>
                        <span className="text-gray-400">{formatDate(trace.created_at)}</span>
                      </div>
                      {trace.remarks && (
                        <p className="text-gray-600 mt-1 text-sm">{trace.remarks}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">暂无回查记录</p>
                )}
              </div>
              <div className="mt-4">
                <textarea
                  className="input"
                  rows="2"
                  value={traceRemark}
                  onChange={(e) => setTraceRemark(e.target.value)}
                  placeholder="添加回查备注..."
                />
                <div className="mt-2 flex justify-end">
                  <button onClick={handleAddTrace} className="btn btn-secondary text-sm">
                    添加记录
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">操作</h2>
            </div>
            <div className="card-body space-y-3">
              {feedback.status === 'pending' && (
                <button
                  onClick={() => handleStatusUpdate('processing')}
                  className="btn btn-primary w-full"
                >
                  开始处理
                </button>
              )}
              {feedback.status === 'processing' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate('resolved')}
                    className="btn btn-primary w-full"
                  >
                    标记为已解决
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('rejected')}
                    className="btn btn-danger w-full"
                  >
                    驳回
                  </button>
                </>
              )}
              {(feedback.status === 'resolved' || feedback.status === 'rejected') && (
                <button
                  onClick={() => handleStatusUpdate('processing')}
                  className="btn btn-secondary w-full"
                >
                  重新打开
                </button>
              )}
              <button
                onClick={handleMarkForReview}
                className={'btn w-full ' + (feedback.needs_review ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'btn-secondary')}
              >
                {feedback.needs_review ? '取消回查标记' : '标记为需回查'}
              </button>
            </div>
          </div>

          <div className={'card ' + (feedback.needs_review ? 'bg-orange-50 border-orange-200' : '')}>
            <div className="card-header">
              <h2 className="text-lg font-semibold">回查说明</h2>
            </div>
            <div className="card-body">
              {isEditingReviewNotes ? (
                <div>
                  <textarea
                    className="input"
                    rows="3"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="输入回查说明..."
                  />
                  <div className="mt-2 flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setIsEditingReviewNotes(false)
                        setReviewNotes(feedback.review_notes || '')
                      }}
                      className="btn btn-secondary text-sm"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveReviewNotes}
                      className="btn btn-primary text-sm flex items-center gap-1"
                    >
                      <Save size={14} />
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingReviewNotes(true)}
                  className="cursor-pointer"
                >
                  <p className="text-gray-700">
                    {getReviewNotesDisplay(feedback.review_notes)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
