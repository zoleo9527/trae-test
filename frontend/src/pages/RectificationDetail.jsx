import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, Calendar, User, Clock, History, 
  CheckCircle2, XCircle, DollarSign, MessageSquare, AlertTriangle, Wrench, AlertOctagon
} from 'lucide-react'
import axios from 'axios'
import { statusConfig, formatDate, formatDateSimple, isOverdue } from '../utils/format'
import StatusTimeline from '../components/StatusTimeline'
import { currentUser } from '../components/Layout'

export default function RectificationDetail() {
  const { id } = useParams()
  const [rectification, setRectification] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [reviewResult, setReviewResult] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [itemResults, setItemResults] = useState({})
  const [nextStatus, setNextStatus] = useState('')
  const [statusComment, setStatusComment] = useState('')
  const [disputeReason, setDisputeReason] = useState('')

  useEffect(() => {
    fetchRectification()
  }, [id])

  const fetchRectification = async () => {
    try {
      const res = await axios.get(`/api/rectifications/${id}`)
      setRectification(res.data)
    } catch (error) {
      console.error('Failed to fetch rectification:', error)
    }
  }

  const handleReview = async () => {
    if (!reviewResult) return
    try {
      await axios.post(`/api/rectifications/${id}/review`, {
        status: reviewResult,
        review_comment: reviewComment,
        dispute_reason: disputeReason,
        operator_id: currentUser.id,
        item_results: itemResults
      })
      setShowReviewModal(false)
      setReviewResult('')
      setReviewComment('')
      setDisputeReason('')
      setItemResults({})
      fetchRectification()
    } catch (error) {
      console.error('Failed to review:', error)
      alert('复查提交失败，请重试')
    }
  }

  const handleConfirmCost = async (itemId, cost) => {
    try {
      await axios.patch(`/api/rectification-items/${itemId}/confirm-cost`, {
        cost: parseFloat(cost),
        operator_id: currentUser.id
      })
      fetchRectification()
    } catch (error) {
      console.error('Failed to confirm cost:', error)
      alert('确认费用失败，请重试')
    }
  }

  const handleUpdateStatus = async () => {
    if (!nextStatus) return
    try {
      await axios.patch(`/api/rectifications/${id}/status`, {
        status: nextStatus,
        comment: statusComment,
        operator_id: currentUser.id
      })
      setShowStatusModal(false)
      setNextStatus('')
      setStatusComment('')
      fetchRectification()
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('更新状态失败，请重试')
    }
  }

  const getNextStatusOptions = () => {
    if (!rectification) return []
    const current = rectification.status
    const options = []
    
    if (current === 'created') {
      options.push({ value: 'in_progress', label: '开始整改' })
    }
    if (current === 'in_progress') {
      options.push({ value: 'rechecking', label: '提交复查' })
    }
    if (current === 'rechecking') {
    }
    if (current === 'failed' || current === 'disputed') {
      options.push({ value: 'in_progress', label: '重新整改' })
    }
    
    return options
  }

  if (!rectification) {
    return <div className="p-8 text-center">加载中...</div>
  }

  const status = statusConfig[rectification.status] || statusConfig.pending
  const overdue = isOverdue(rectification.deadline) && !['passed', 'completed'].includes(rectification.status)

  const itemStatusConfig = {
    pending: { label: '待处理', color: 'bg-gray-100 text-gray-700' },
    in_progress: { label: '处理中', color: 'bg-yellow-100 text-yellow-700' },
    completed: { label: '已完成', color: 'bg-blue-100 text-blue-700' },
    rechecking: { label: '待复查', color: 'bg-purple-100 text-purple-700' },
    passed: { label: '已通过', color: 'bg-green-100 text-green-700' },
    failed: { label: '未通过', color: 'bg-red-100 text-red-700' },
  }

  const totalCost = rectification.items?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0
  const confirmedCost = rectification.items?.reduce((sum, item) => sum + (item.cost_confirmed ? (item.cost || 0) : 0), 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/rectifications" className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
            返回
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{rectification.title}</h1>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${status.color}`}>
            {status.label}
          </span>
          {overdue && (
            <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
              <AlertTriangle size={14} />
              已超期
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {getNextStatusOptions().length > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  setNextStatus(getNextStatusOptions()[0].value)
                  setShowStatusModal(true)
                }}
                className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                <Wrench size={16} />
                {getNextStatusOptions()[0].label}
              </button>
            </div>
          )}
          {rectification.status === 'rechecking' && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <CheckCircle2 size={16} />
              复查确认
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-6 border-b pb-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">截止日期</p>
                  <p className={`text-sm font-medium ${overdue ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDateSimple(rectification.deadline)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">负责人</p>
                  <p className="text-sm font-medium text-gray-900">{rectification.assignee?.name || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">整改费用</p>
                  <p className="text-sm font-medium text-gray-900">
                    ¥{confirmedCost.toFixed(2)} / ¥{totalCost.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">创建时间</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(rectification.created_at)}</p>
                </div>
              </div>
            </div>

            {rectification.description && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">{rectification.description}</p>
              </div>
            )}

            {rectification.review_comment && (
              <div className="mt-4 rounded-lg bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-800">复查意见：{rectification.review_comment}</p>
                <p className="mt-1 text-xs text-blue-600">
                  复查人：{rectification.review_by?.name || '-'} · {formatDate(rectification.review_at)}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">整改项明细</h3>
            <div className="space-y-4">
              {rectification.items?.map((item, index) => {
                const itemStatus = itemStatusConfig[item.status] || itemStatusConfig.pending
                return (
                  <div key={item.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {index + 1}. {item.issue?.title}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${itemStatus.color}`}>
                            {itemStatus.label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{item.issue?.description}</p>
                        {item.rectification_method && (
                          <div className="mt-2 rounded bg-gray-50 p-2">
                            <p className="text-xs text-gray-500">整改方案：</p>
                            <p className="text-sm text-gray-700">{item.rectification_method}</p>
                          </div>
                        )}
                        {item.review_comment && (
                          <div className="mt-2 rounded bg-blue-50 p-2">
                            <p className="text-xs text-blue-600">复查意见：</p>
                            <p className="text-sm text-blue-800">{item.review_comment}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {item.actual_finish_date && (
                          <span>完成时间：{formatDate(item.actual_finish_date)}</span>
                        )}
                        {item.cost_confirmed_at && (
                          <span>费用确认：{formatDate(item.cost_confirmed_at)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {item.cost !== undefined && item.cost !== null && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">¥{item.cost.toFixed(2)}</p>
                            <p className={`text-xs ${item.cost_confirmed ? 'text-green-600' : 'text-orange-600'}`}>
                              {item.cost_confirmed ? '已确认' : '待确认'}
                            </p>
                          </div>
                        )}
                        {!item.cost_confirmed && item.cost !== undefined && item.cost !== null && (
                          <button
                            onClick={() => handleConfirmCost(item.id, item.cost)}
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                          >
                            确认费用
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">关联巡检单</h3>
            <Link
              to={`/inspections/${rectification.inspection_id}`}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-900">{rectification.inspection?.title}</p>
                <p className="mt-1 text-sm text-gray-500">{rectification.inspection?.project?.name}</p>
              </div>
              <ArrowLeft size={16} className="rotate-180 text-gray-400" />
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">状态时间轴</h3>
              <History size={18} className="text-gray-400" />
            </div>
            <StatusTimeline histories={rectification.status_histories} />
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">版本追踪</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">当前版本</span>
                <span className="font-medium">v{rectification.version}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">创建人</span>
                <span>{rectification.creator?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">创建时间</span>
                <span>{formatDate(rectification.created_at)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">更新时间</span>
                <span>{formatDate(rectification.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">复查确认</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  复查结果
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReviewResult('passed')}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-lg border py-2.5 text-xs font-medium ${reviewResult === 'passed' ? 'border-green-500 bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <CheckCircle2 size={16} />
                    通过
                  </button>
                  <button
                    onClick={() => setReviewResult('failed')}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-lg border py-2.5 text-xs font-medium ${reviewResult === 'failed' ? 'border-red-500 bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <XCircle size={16} />
                    不通过
                  </button>
                  <button
                    onClick={() => setReviewResult('disputed')}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-lg border py-2.5 text-xs font-medium ${reviewResult === 'disputed' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <AlertOctagon size={16} />
                    有异议
                  </button>
                </div>
              </div>

              {rectification.items?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分项结果
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {rectification.items.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                        <span className="text-sm text-gray-700">{index + 1}. {item.issue?.title}</span>
                        <select
                          value={itemResults[item.id]?.status || ''}
                          onChange={(e) => setItemResults(prev => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], status: e.target.value }
                          }))}
                          className="rounded border px-2 py-1 text-xs"
                        >
                          <option value="">未设置</option>
                          <option value="passed">通过</option>
                          <option value="failed">不通过</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  复查意见
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={2}
                  placeholder="请输入复查意见..."
                  className="w-full rounded-lg border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {reviewResult === 'disputed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    异议说明 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    rows={3}
                    placeholder="请详细说明异议原因，如业主反馈内容、争议点等..."
                    className="w-full rounded-lg border px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowReviewModal(false)
                  setDisputeReason('')
                }}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleReview}
                disabled={!reviewResult || (reviewResult === 'disputed' && !disputeReason.trim())}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">更新状态</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目标状态
                </label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className="w-full rounded-lg border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {getNextStatusOptions().map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注说明
                </label>
                <textarea
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  rows={3}
                  placeholder="请输入状态变更说明..."
                  className="w-full rounded-lg border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={!nextStatus}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                确认更新
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
