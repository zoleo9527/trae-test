import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, Wrench, Clock, MapPin, User, 
  MessageSquare, History, CheckCircle2, Plus
} from 'lucide-react'
import axios from 'axios'
import { statusConfig, priorityConfig, typeConfig, formatDate, formatDateSimple } from '../utils/format'
import StatusTimeline from '../components/StatusTimeline'
import IssueCard from '../components/IssueCard'
import { currentUser } from '../components/Layout'

export default function InspectionDetail() {
  const { id } = useParams()
  const [inspection, setInspection] = useState(null)
  const [activeTab, setActiveTab] = useState('issues')
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusComment, setStatusComment] = useState('')

  useEffect(() => {
    fetchInspection()
  }, [id])

  const fetchInspection = async () => {
    try {
      const res = await axios.get(`/api/inspections/${id}`)
      setInspection(res.data)
    } catch (error) {
      console.error('Failed to fetch inspection:', error)
    }
  }

  const handleUpdateStatus = async () => {
    if (!newStatus) return
    try {
      await axios.patch(`/api/inspections/${id}/status`, {
        status: newStatus,
        comment: statusComment,
        operator_id: currentUser.id
      })
      setShowStatusModal(false)
      setNewStatus('')
      setStatusComment('')
      fetchInspection()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleCreateRectification = async () => {
    if (!inspection) return
    try {
      const items = inspection.issues
        .filter(i => !i.is_rectified)
        .map(i => ({ issue_id: i.id, status: 'pending' }))
      
      await axios.post('/api/rectifications', {
        inspection_id: inspection.id,
        title: `${inspection.title} - 整改单`,
        status: 'created',
        description: inspection.description,
        assigned_to: 4,
        items
      })
      fetchInspection()
    } catch (error) {
      console.error('Failed to create rectification:', error)
    }
  }

  if (!inspection) {
    return <div className="p-8 text-center">加载中...</div>
  }

  const status = statusConfig[inspection.status] || statusConfig.pending
  const priority = priorityConfig[inspection.priority] || priorityConfig.normal

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/inspections" className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
            返回
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{inspection.title}</h1>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStatusModal(true)}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <MessageSquare size={16} />
            更新状态
          </button>
          {inspection.issues.filter(i => !i.is_rectified).length > 0 && inspection.status !== 'rectifying' && (
            <button
              onClick={handleCreateRectification}
              className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              <Wrench size={16} />
              发起整改
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-6 border-b pb-4">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600">{inspection.project?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600">{inspection.creator?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600">{formatDateSimple(inspection.inspection_date)}</span>
              </div>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priority.color}`}>
                {priority.label}优先级
              </span>
              <span className="text-xs text-gray-500">
                {typeConfig[inspection.type] || inspection.type}
              </span>
            </div>

            {inspection.description && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">{inspection.description}</p>
              </div>
            )}

            <div className="mt-6 flex border-b">
              <button
                onClick={() => setActiveTab('issues')}
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'issues' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                问题点 ({inspection.issues?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('rectifications')}
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'rectifications' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                整改记录 ({inspection.rectifications?.length || 0})
              </button>
            </div>

            <div className="mt-6">
              {activeTab === 'issues' && (
                <div className="space-y-3">
                  {inspection.issues?.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                  {inspection.issues?.length === 0 && (
                    <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">
                      暂无问题记录
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'rectifications' && (
                <div className="space-y-3">
                  {inspection.rectifications?.map((rect) => {
                    const rectStatus = statusConfig[rect.status] || statusConfig.pending
                    return (
                      <Link
                        key={rect.id}
                        to={`/rectifications/${rect.id}`}
                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{rect.title}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {rect.items?.length} 项 · v{rect.version} 版本
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${rectStatus.color}`}>
                            {rectStatus.label}
                          </span>
                          <p className="mt-1 text-xs text-gray-500">{formatDate(rect.created_at)}</p>
                        </div>
                      </Link>
                    )
                  })}
                  {inspection.rectifications?.length === 0 && (
                    <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">
                      暂无整改记录
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">状态时间轴</h3>
              <History size={18} className="text-gray-400" />
            </div>
            <StatusTimeline histories={inspection.status_histories} />
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">版本信息</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">当前版本</span>
                <span className="font-medium">v{inspection.version}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">创建时间</span>
                <span>{formatDate(inspection.created_at)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">更新时间</span>
                <span>{formatDate(inspection.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">更新状态</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择状态
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-lg border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">请选择状态</option>
                  <option value="pending">待处理</option>
                  <option value="in_progress">进行中</option>
                  <option value="rectifying">整改中</option>
                  <option value="rechecking">待复查</option>
                  <option value="disputed">有异议</option>
                  <option value="completed">已完成</option>
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
                disabled={!newStatus}
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
