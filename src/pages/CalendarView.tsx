import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Film,
} from 'lucide-react'
import type { ActionRecord, FilmRoll } from '@/stores/rollStore'
import { ACTION_TYPE_LABEL, formatDate, formatTime, ROLE_LABEL } from '@/lib/status'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || '请求失败')
  return json.data as T
}

interface CalendarDay {
  date: string
  actions: number
  roll_ids: string[]
}

interface DayActions {
  date: string
  actions: ActionRecord[]
  rolls: Record<string, FilmRoll>
}

const ROLL_COLORS = [
  'bg-blue-400',
  'bg-green-400',
  'bg-purple-400',
  'bg-pink-400',
  'bg-teal-400',
  'bg-orange-400',
  'bg-cyan-400',
  'bg-rose-400',
]

export default function CalendarView() {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayActions, setDayActions] = useState<DayActions | null>(null)
  const [rollColors, setRollColors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  useEffect(() => {
    fetchCalendarData()
  }, [year, month])

  useEffect(() => {
    if (selectedDate) {
      fetchDayActions(selectedDate)
    }
  }, [selectedDate])

  const fetchCalendarData = async () => {
    try {
      const data = await apiFetch<CalendarDay[]>(
        `/api/calendar?year=${year}&month=${month + 1}`
      )
      setCalendarData(data)

      const allRollIds = new Set<string>()
      for (let i = 0; i < data.length; i++) {
        const day = data[i]
        for (let j = 0; j < day.roll_ids.length; j++) {
          allRollIds.add(day.roll_ids[j])
        }
      }

      const colorMap: Record<string, string> = {}
      let colorIndex = 0
      allRollIds.forEach((id) => {
        colorMap[id] = ROLL_COLORS[colorIndex % ROLL_COLORS.length]
        colorIndex++
      })
      setRollColors(colorMap)
    } catch (e) {
      console.error('获取日历数据失败:', e)
    }
  }

  const fetchDayActions = async (date: string) => {
    setLoading(true)
    try {
      const actions = await apiFetch<ActionRecord[]>(`/api/actions?date=${date}`)

      const rollIds = [...new Set(actions.map((a) => a.roll_id))]
      const rolls: Record<string, FilmRoll> = {}

      for (const rollId of rollIds) {
        try {
          const roll = await apiFetch<FilmRoll>(`/api/rolls/${rollId}`)
          rolls[rollId] = roll
        } catch (e) {
          // ignore
        }
      }

      setDayActions({ date, actions, rolls })
    } catch (e) {
      console.error('获取当日动作失败:', e)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = () => {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()
    return { daysInMonth, firstDay }
  }

  const { daysInMonth, firstDay } = getDaysInMonth()

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDate(null)
    setDayActions(null)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDate(null)
    setDayActions(null)
  }

  const getDayData = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return calendarData.find((d) => d.date === dateStr)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    const date = new Date(selectedDate)
    return (
      day === date.getDate() &&
      month === date.getMonth() &&
      year === date.getFullYear()
    )
  }

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateStr)
  }

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月',
  ]

  const rollColorKeys = Object.keys(rollColors).slice(0, 6)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">日历视图</h1>

      <div className="flex gap-6">
        <div className="flex-1 bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {year}年 {monthNames[month]}
            </h2>
            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-400 py-2"
              >
                {day}
              </div>
            ))}

            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayData = getDayData(day)
              const selected = isSelected(day)
              const today = isToday(day)

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square rounded-lg p-1 text-left flex flex-col relative transition-colors ${
                    selected
                      ? 'bg-[#C4813D] text-white'
                      : today
                      ? 'bg-orange-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      selected ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {day}
                  </span>
                  {dayData && dayData.actions > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {dayData.roll_ids.slice(0, 3).map((rollId) => (
                        <div
                          key={rollId}
                          className={`w-2 h-2 rounded-full ${rollColors[rollId] || 'bg-gray-400'}`}
                        />
                      ))}
                      {dayData.roll_ids.length > 3 && (
                        <span className="text-xs text-gray-400">+{dayData.roll_ids.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              点击日期查看当日处理动作
            </p>
          </div>
        </div>

        <div className="w-96 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          {selectedDate ? (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {formatDate(selectedDate)}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {dayActions?.actions.length || 0} 个动作
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedDate(null)
                    setDayActions(null)
                  }}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="text-center text-gray-400 py-8">加载中...</div>
                ) : dayActions && dayActions.actions.length > 0 ? (
                  <div className="space-y-3">
                    {dayActions.actions.map((action) => {
                      const roll = dayActions.rolls[action.roll_id]
                      return (
                        <div
                          key={action.id}
                          onClick={() => navigate(`/rolls/${action.roll_id}`)}
                          className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-2 h-2 rounded-full mt-1.5 ${
                                rollColors[action.roll_id] || 'bg-gray-400'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Film className="w-3 h-3 text-gray-400" />
                                <span className="text-xs font-mono text-gray-500">
                                  {roll?.roll_number || action.roll_id}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-800 mt-1">
                                {ACTION_TYPE_LABEL[action.action_type] ||
                                  action.action_type}
                              </p>
                              {action.detail && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {action.detail}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="w-3 h-3 text-gray-300" />
                                <span className="text-xs text-gray-400">
                                  {formatTime(action.created_at)}
                                </span>
                                <span className="text-gray-200">·</span>
                                <span className="text-xs text-gray-400">
                                  {ROLE_LABEL[action.operator_role] ||
                                    action.operator_role}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    当日暂无处理动作
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>选择左侧日历中选择日期</p>
              <p className="text-sm mt-1">查看当日的胶卷处理动作</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">图例说明</h3>
        <div className="flex flex-wrap gap-4">
          {rollColorKeys.map((rollId) => (
            <div key={rollId} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${rollColors[rollId]}`} />
              <span className="text-sm text-gray-600">{rollId}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          同色圆点代表同一胶卷的连续处理动作，可追踪完整处理链
        </p>
      </div>
    </div>
  )
}
