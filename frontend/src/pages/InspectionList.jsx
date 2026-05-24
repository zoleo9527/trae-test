import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Plus, ChevronRight } from 'lucide-react'
import axios from 'axios'
import { statusConfig, priorityConfig, typeConfig, formatDate } from '../utils/format'
import BatchActionBar from '../components/BatchActionBar'
import CreateInspectionModal from '../components/CreateInspectionModal'
import { currentUser } from '../components/Layout'

export default function InspectionList() {
  const [inspections, setInspections] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [filterStatus, setFilterStatus] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchInspections()
  }, [filterStatus])

  const fetchInspections = async () => {
    try {
      const params = filterStatus ? { status: filterStatus } : {}
      const res = await axios.get('/api/inspections', { params })
      setInspections(res.data)
    } catch (error) {
      console.error('Failed to fetch inspections:', error)
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInspections.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredInspections.map(i => i.id))
    }
  }

  const handleBatchAction = async (action, value) => {
    if (action === 'status') {
      try {
        await axios.post('/api/inspections/batch-status', {
          ids: selectedIds,
          status: value,
          operator_id: currentUser.id,
          comment: '批量更新状态'
        })
        setSelectedIds([])
        fetchInspections()
      } catch (error) {
        console.error('Failed to batch update:', error)
      }
    }
  }

  const filteredInspections = inspections.filter(i => 
    i.title.includes(searchKeyword) || 
    i.project?.name?.includes(searchKeyword)
  )

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">巡检管理</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          新建巡检
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜索巡检单或项目名称..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full rounded-lg border pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="in_progress">进行中</option>
          <option value="rectifying">整改中</option>
          <option value="rechecking">待复查</option>
          <option value="disputed">有异议</option>
          <option value="completed">已完成</option>
        </select>
      </div>

      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredInspections.length && filteredInspections.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">巡检单</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">项目</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">优先级</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredInspections.map((inspection) => {
              const status = statusConfig[inspection.status] || statusConfig.pending
              const priority = priorityConfig[inspection.priority] || priorityConfig.normal
              return (
                <tr key={inspection.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(inspection.id)}
                      onChange={() => toggleSelect(inspection.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{inspection.title}</p>
                      <p className="text-xs text-gray-500">v{inspection.version} 版本</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{inspection.project?.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{typeConfig[inspection.type] || inspection.type}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priority.color}`}>
                      {priority.label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">{formatDate(inspection.created_at)}</td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      to={`/inspections/${inspection.id}`}
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      查看
                      <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredInspections.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            暂无巡检数据
          </div>
        )}
      </div>

      <BatchActionBar
        selectedCount={selectedIds.length}
        onAction={handleBatchAction}
        onClear={() => setSelectedIds([])}
      />

      <CreateInspectionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          fetchInspections()
        }}
      />
    </div>
  )
}
