import { useEffect, useState } from 'react'
import { MapPin, Calendar, CheckCircle2, XCircle, Clock, Play, Check } from 'lucide-react'
import { useSiteStore } from '@/store/useSiteStore'
import { useAuthStore } from '@/store/useAuthStore'
import type { InspectionTask, InspectionItemStatus } from '@/types'

function InspectionPage() {
  const { user } = useAuthStore()
  const { inspections, fetchInspections, updateInspectionItem, startInspection, completeInspection } = useSiteStore()
  const [activeTask, setActiveTask] = useState<InspectionTask | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')

  useEffect(() => {
    fetchInspections()
  }, [fetchInspections])

  const filteredInspections = inspections.filter((insp) => {
    if (filter === 'all') return true
    return insp.status === filter
  })

  const handleStartInspection = (task: InspectionTask) => {
    startInspection(task.id)
    setActiveTask({ ...task, status: 'in_progress', startedAt: new Date().toISOString() })
  }

  const handleUpdateItem = (itemId: string, status: InspectionItemStatus, remark?: string) => {
    if (!activeTask) return
    updateInspectionItem(activeTask.id, itemId, { status, remark })
    setActiveTask((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((item) =>
              item.id === itemId ? { ...item, status, remark } : item
            ),
          }
        : null
    )
  }

  const handleCompleteInspection = () => {
    if (!activeTask) return
    completeInspection(activeTask.id)
    setActiveTask(null)
  }

  const getItemStatusIcon = (status: InspectionItemStatus) => {
    switch (status) {
      case 'normal':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'abnormal':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'skip':
        return <Clock className="w-5 h-5 text-slate-400" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: InspectionTask['status']) => {
    const styles = {
      pending: 'bg-slate-100 text-slate-700',
      in_progress: 'bg-indigo-100 text-indigo-700',
      completed: 'bg-green-100 text-green-700',
    }
    const labels = {
      pending: '待执行',
      in_progress: '进行中',
      completed: '已完成',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  if (activeTask) {
    const progress = (activeTask.items.filter((i) => i.status !== 'normal').length / activeTask.items.length) * 100
    const allChecked = activeTask.items.every((i) => i.status !== 'normal')

    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setActiveTask(null)}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mb-4"
          >
            ← 返回任务列表
          </button>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{activeTask.siteName}</h2>
                <p className="text-slate-500 text-sm mt-1">
                  巡检日期：{activeTask.scheduledDate}
                </p>
              </div>
              {getStatusBadge(activeTask.status)}
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600">巡检进度</span>
                <span className="font-medium text-slate-900">
                  {activeTask.items.filter((i) => i.status !== 'normal').length}/{activeTask.items.length}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {activeTask.items.map((item, index) => (
                <div
                  key={item.id}
                  className="border border-slate-200 rounded-xl p-4 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-medium flex items-center justify-center mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        {item.remark && (
                          <p className="text-sm text-slate-500 mt-1">备注：{item.remark}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.status !== 'normal' ? (
                        getItemStatusIcon(item.status)
                      ) : (
                        <>
                          <button
                            onClick={() => handleUpdateItem(item.id, 'normal')}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors"
                            title="正常"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              const remark = prompt('请输入异常描述')
                              if (remark !== null) handleUpdateItem(item.id, 'abnormal', remark)
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            title="异常"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleUpdateItem(item.id, 'skip')}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            title="跳过"
                          >
                            <Clock className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {activeTask.status === 'in_progress' && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCompleteInspection}
                  disabled={!allChecked}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Check className="w-4 h-4 mr-2" />
                  完成巡检
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">巡检任务</h1>
          <p className="text-slate-500 mt-1">管理和执行场站巡检任务</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center space-x-2">
          {[
            { key: 'all', label: '全部' },
            { key: 'pending', label: '待执行' },
            { key: 'in_progress', label: '进行中' },
            { key: 'completed', label: '已完成' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="divide-y divide-slate-100">
          {filteredInspections.map((task) => (
            <div key={task.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mr-4">
                    <MapPin className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{task.siteName}</h3>
                    <div className="flex items-center text-sm text-slate-500 mt-1 space-x-4">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {task.scheduledDate}
                      </span>
                      <span>{task.items.length} 项检查</span>
                      <span>执行人：{task.inspectorName}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(task.status)}
                  {task.status === 'pending' && (
                    <button
                      onClick={() => handleStartInspection(task)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      开始巡检
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <button
                      onClick={() => setActiveTask(task)}
                      className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
                    >
                      继续巡检
                    </button>
                  )}
                  {task.status === 'completed' && (
                    <button
                      onClick={() => setActiveTask(task)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      查看详情
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredInspections.length === 0 && (
          <div className="py-16 text-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <p>暂无巡检任务</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default InspectionPage
