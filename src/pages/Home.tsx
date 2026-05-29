import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Clock,
  Activity,
  ChevronRight,
  Film,
} from 'lucide-react'
import { useRollStore, type FilmRoll, type ActionRecord } from '@/stores/rollStore'
import { useAuthStore } from '@/stores/authStore'
import {
  STATUS_LABEL,
  STATUS_COLOR,
  ACTION_TYPE_LABEL,
  formatDate,
  formatDateTime,
  isOverdue,
  getOverdueDays,
  ROLE_LABEL,
} from '@/lib/status'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || '请求失败')
  return json.data as T
}

export default function Home() {
  const navigate = useNavigate()
  const { rolls, fetchRolls } = useRollStore()
  const { currentUser } = useAuthStore()
  const [recentActions, setRecentActions] = useState<ActionRecord[]>([])

  useEffect(() => {
    fetchRolls()
    fetchRecentActions()
  }, [])

  const fetchRecentActions = async () => {
    try {
      const data = await apiFetch<ActionRecord[]>('/api/actions')
      setRecentActions(data.slice(0, 10))
    } catch (e) {
      console.error('获取最近动态失败:', e)
    }
  }

  const overdueRolls = rolls.filter(
    (roll) => roll.status !== 'completed' && isOverdue(roll.due_date)
  )

  const getTodoItems = (): { title: string; rolls: FilmRoll[] }[] => {
    const role = currentUser?.role
    if (role === 'owner') {
      return [
        {
          title: '待返工决策',
          rolls: rolls.filter((r) => r.status === 'qc_failed'),
        },
        {
          title: '待赔付审批',
          rolls: rolls.filter((r) => r.status === 'compensating'),
        },
      ]
    }
    if (role === 'developer') {
      return [
        {
          title: '待冲扫',
          rolls: rolls.filter((r) => r.status === 'registered'),
        },
        {
          title: '待质检',
          rolls: rolls.filter((r) => r.status === 'developing'),
        },
        {
          title: '待返工执行',
          rolls: rolls.filter((r) => r.status === 'reworking'),
        },
        {
          title: '待复检',
          rolls: rolls.filter((r) => r.status === 'recheck'),
        },
      ]
    }
    return [
      {
        title: '待客户确认',
        rolls: rolls.filter((r) => r.status === 'confirming' || r.status === 'qc_passed' || r.status === 'recheck'),
      },
    ]
  }

  const todoItems = getTodoItems()
  const totalTodo = todoItems.reduce((sum, item) => sum + item.rolls.length, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">工作台</h1>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(new Date().toISOString())} · {ROLE_LABEL[currentUser?.role || 'owner']}视角
          </p>
        </div>
        <button
          onClick={() => navigate('/rolls/new')}
          className="px-4 py-2 bg-[#C4813D] text-white rounded-lg text-sm font-medium hover:bg-[#B07030] transition-colors flex items-center gap-2"
        >
          <Film className="w-4 h-4" />
          登记新胶卷
        </button>
      </div>

      {overdueRolls.length > 0 && (
        <div className="bg-white rounded-xl p-5 border-l-4 border-red-500 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">逾期预警</h2>
              <p className="text-sm text-gray-500">
                共有 {overdueRolls.length} 个胶卷已超过承诺交付时间
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {overdueRolls.map((roll) => (
              <div
                key={roll.id}
                onClick={() => navigate(`/rolls/${roll.id}`)}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-medium text-gray-800">
                    {roll.roll_number}
                  </span>
                  <span className="text-sm text-gray-600">{roll.customer_name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[roll.status]}`}
                  >
                    {STATUS_LABEL[roll.status]}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <Clock className="w-4 h-4" />
                  逾期 {getOverdueDays(roll.due_date)} 天
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">今日待办</h2>
                <p className="text-sm text-gray-500">共 {totalTodo} 项待处理</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {todoItems.map(
              (group) =>
                group.rolls.length > 0 && (
                  <div key={group.title}>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">
                      {group.title} ({group.rolls.length})
                    </h3>
                    <div className="space-y-2">
                      {group.rolls.map((roll) => (
                        <div
                          key={roll.id}
                          onClick={() => navigate(`/rolls/${roll.id}`)}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Film className="w-4 h-4 text-gray-400" />
                            <span className="font-mono text-sm font-medium text-gray-800">
                              {roll.roll_number}
                            </span>
                            <span className="text-sm text-gray-600">
                              {roll.customer_name}
                            </span>
                            <span className="text-sm text-gray-400">
                              {roll.film_type}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )
            )}
            {totalTodo === 0 && (
              <div className="text-center py-8 text-gray-400">
                太棒了！今日没有待办事项
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">最近动态</h2>
              <p className="text-sm text-gray-500">全店操作记录</p>
            </div>
          </div>
          <div className="space-y-3">
            {recentActions.map((action) => (
              <div
                key={action.id}
                onClick={() => navigate(`/rolls/${action.roll_id}`)}
                className="flex items-start gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-[#C4813D] mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">
                    {ACTION_TYPE_LABEL[action.action_type] || action.action_type}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {ROLE_LABEL[action.operator_role] || action.operator_role} ·{' '}
                    {formatDateTime(action.created_at)}
                  </p>
                </div>
              </div>
            ))}
            {recentActions.length === 0 && (
              <div className="text-center py-4 text-gray-400 text-sm">
                暂无操作记录
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
