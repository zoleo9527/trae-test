import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import axios from 'axios'
import { currentUser } from './Layout'

export default function CreateInspectionModal({ isOpen, onClose, onSuccess }) {
  const [projects, setProjects] = useState([])
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    type: 'routine',
    status: 'created',
    priority: 'normal',
    description: '',
    inspection_date: '',
    assigned_to: 4
  })
  const [issues, setIssues] = useState([
    { title: '', description: '', category: 'other', severity: 'medium', position: '' }
  ])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchProjects()
    }
  }, [isOpen])

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/api/projects')
      setProjects(res.data)
      if (res.data.length > 0) {
        setFormData(prev => ({ ...prev, project_id: res.data[0].id }))
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const validIssues = issues.filter(i => i.title.trim())
      
      const data = {
        ...formData,
        project_id: parseInt(formData.project_id),
        assigned_to: parseInt(formData.assigned_to),
        issues: validIssues,
        operator_id: currentUser.id
      }

      await axios.post('/api/inspections', data)
      onSuccess()
      handleReset()
    } catch (error) {
      console.error('Failed to create inspection:', error)
      alert('创建失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      project_id: projects[0]?.id || '',
      title: '',
      type: 'routine',
      status: 'created',
      priority: 'normal',
      description: '',
      inspection_date: '',
      assigned_to: 4
    })
    setIssues([
      { title: '', description: '', category: 'other', severity: 'medium', position: '' }
    ])
  }

  const handleAddIssue = () => {
    setIssues([
      ...issues,
      { title: '', description: '', category: 'other', severity: 'medium', position: '' }
    ])
  }

  const handleRemoveIssue = (index) => {
    if (issues.length > 1) {
      setIssues(issues.filter((_, i) => i !== index))
    }
  }

  const handleIssueChange = (index, field, value) => {
    const newIssues = [...issues]
    newIssues[index][field] = value
    setIssues(newIssues)
  }

  if (!isOpen) return null

  const typeOptions = [
    { value: 'routine', label: '日常巡检' },
    { value: 'acceptance', label: '验收检查' },
    { value: 'review', label: '复查' },
    { value: 'special', label: '专项检查' }
  ]

  const priorityOptions = [
    { value: 'low', label: '低' },
    { value: 'normal', label: '中' },
    { value: 'high', label: '高' },
    { value: 'urgent', label: '紧急' }
  ]

  const categoryOptions = [
    { value: 'waterproof', label: '防水' },
    { value: 'electric', label: '电气' },
    { value: 'tile', label: '墙砖地砖' },
    { value: 'wall', label: '墙面' },
    { value: 'waterpipe', label: '水管' },
    { value: 'wood', label: '木工' },
    { value: 'other', label: '其他' }
  ]

  const severityOptions = [
    { value: 'low', label: '轻微' },
    { value: 'medium', label: '一般' },
    { value: 'high', label: '严重' },
    { value: 'critical', label: '致命' }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">新建巡检单</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                项目 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="w-full rounded-lg border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                巡检标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入巡检标题"
                className="w-full rounded-lg border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                巡检类型
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {typeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                优先级
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-lg border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {priorityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                巡检日期
              </label>
              <input
                type="date"
                value={formData.inspection_date}
                onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                className="w-full rounded-lg border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                初始状态
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-lg border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="created">已创建</option>
                <option value="pending">待处理</option>
                <option value="in_progress">进行中</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              巡检描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="请输入巡检描述..."
              className="w-full rounded-lg border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">问题点记录</h3>
              <button
                type="button"
                onClick={handleAddIssue}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus size={16} />
                添加问题
              </button>
            </div>

            <div className="space-y-4">
              {issues.map((issue, index) => (
                <div key={index} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">问题 #{index + 1}</span>
                    {issues.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveIssue(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">问题标题</label>
                      <input
                        type="text"
                        value={issue.title}
                        onChange={(e) => handleIssueChange(index, 'title', e.target.value)}
                        placeholder="请输入问题标题"
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">分类</label>
                      <select
                        value={issue.category}
                        onChange={(e) => handleIssueChange(index, 'category', e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {categoryOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">严重程度</label>
                      <select
                        value={issue.severity}
                        onChange={(e) => handleIssueChange(index, 'severity', e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {severityOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">问题描述</label>
                      <textarea
                        value={issue.description}
                        onChange={(e) => handleIssueChange(index, 'description', e.target.value)}
                        rows={2}
                        placeholder="请详细描述问题"
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">位置</label>
                      <input
                        type="text"
                        value={issue.position}
                        onChange={(e) => handleIssueChange(index, 'position', e.target.value)}
                        placeholder="如：客厅东墙、主卫地面"
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '创建中...' : '创建巡检单'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
