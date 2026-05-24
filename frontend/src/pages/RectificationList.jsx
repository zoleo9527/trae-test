import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, AlertTriangle, ChevronRight, Calendar } from 'lucide-react'
import axios from 'axios'
import { statusConfig, formatDate, formatDateSimple, isOverdue } from '../utils/format'

export default function RectificationList() {
  const [rectifications, setRectifications] = useState([])
  const [filterStatus, setFilterStatus] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  useEffect(() => {
    fetchRectifications()
  }, [filterStatus])

  const fetchRectifications = async () => {
    try {
      const params = filterStatus ? { status: filterStatus } : {}
      const res = await axios.get('/api/rectifications', { params })
      setRectifications(res.data)
    } catch (error) {
      console.error('Failed to fetch rectifications:', error)
    }
  }

  const filteredRectifications = rectifications.filter(r => 
    r.title.includes(searchKeyword) || 
    r.inspection?.project?.name?.includes(searchKeyword)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">整改管理</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜索整改单或项目名称..."
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
          <option value="created">已创建</option>
          <option value="in_progress">整改中</option>
          <option value="rechecking">待复查</option>
          <option value="disputed">有异议</option>
          <option value="passed">已通过</option>
          <option value="failed">未通过</option>
        </select>
      </div>

      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">整改单</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">关联巡检</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">整改项数</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">截止日期</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">版本</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredRectifications.map((rectification) => {
              const status = statusConfig[rectification.status] || statusConfig.pending
              const overdue = isOverdue(rectification.deadline) && !['passed', 'completed'].includes(rectification.status)
              return (
                <tr key={rectification.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{rectification.title}</p>
                      {overdue && (
                        <span className="flex items-center gap-1 text-xs text-red-600">
                          <AlertTriangle size={12} />
                          已超期
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {rectification.inspection?.title}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {rectification.items?.length || 0} 项
                  </td>
                  <td className="px-4 py-4">
                    <div className={`flex items-center gap-1 text-sm ${overdue ? 'text-red-600' : 'text-gray-600'}`}>
                      <Calendar size={14} />
                      {formatDateSimple(rectification.deadline)}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    v{rectification.version}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      to={`/rectifications/${rectification.id}`}
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
        {filteredRectifications.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            暂无整改数据
          </div>
        )}
      </div>
    </div>
  )
}
