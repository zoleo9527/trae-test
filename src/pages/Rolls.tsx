import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Film, ChevronRight } from 'lucide-react'
import { useRollStore, type RollStatus } from '@/stores/rollStore'
import { STATUS_LABEL, STATUS_COLOR, formatDate, isOverdue, getOverdueDays } from '@/lib/status'

const STATUS_OPTIONS: { value: RollStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'registered', label: '已登记' },
  { value: 'developing', label: '冲扫中' },
  { value: 'qc_failed', label: '质检未通过' },
  { value: 'reworking', label: '返工中' },
  { value: 'recheck', label: '待复检' },
  { value: 'confirming', label: '待客户确认' },
  { value: 'compensating', label: '待赔付' },
  { value: 'completed', label: '已完成' },
]

export default function Rolls() {
  const navigate = useNavigate()
  const { rolls, filters, setFilter, fetchRolls, loading } = useRollStore()

  useEffect(() => {
    fetchRolls()
  }, [filters.status])

  const filteredRolls = rolls.filter((roll) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        roll.roll_number.toLowerCase().includes(searchLower) ||
        roll.customer_name.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">胶卷管理</h1>
        <button
          onClick={() => navigate('/rolls/new')}
          className="px-4 py-2 bg-[#C4813D] text-white rounded-lg text-sm font-medium hover:bg-[#B07030] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          登记新胶卷
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索胶卷编号或客户姓名..."
            value={filters.search}
            onChange={(e) => setFilter({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4813D]/20 focus:border-[#C4813D]"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilter({ status: e.target.value as RollStatus | '' })}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4813D]/20 focus:border-[#C4813D] bg-white"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">加载中...</div>
        ) : filteredRolls.length === 0 ? (
          <div className="p-8 text-center text-gray-400">暂无胶卷数据</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  胶卷编号
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  客户
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  胶卷型号
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  冲扫规格
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  状态
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  登记日期
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  交付日期
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRolls.map((roll) => {
                const overdue = roll.status !== 'completed' && isOverdue(roll.due_date)
                return (
                  <tr
                    key={roll.id}
                    onClick={() => navigate(`/rolls/${roll.id}`)}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4 text-gray-400" />
                        <span className="font-mono text-sm font-medium text-gray-800">
                          {roll.roll_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {roll.customer_name}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {roll.film_type}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {roll.scan_spec || '-'}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[roll.status]}`}
                      >
                        {STATUS_LABEL[roll.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {formatDate(roll.registered_at)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {formatDate(roll.due_date)}
                        </span>
                        {overdue && (
                          <span className="text-xs text-red-500 font-medium">
                            逾期{getOverdueDays(roll.due_date)}天
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <ChevronRight className="w-4 h-4 text-gray-400 inline" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
