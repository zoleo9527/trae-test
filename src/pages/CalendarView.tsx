import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Film,
} from 'lucide-react'
import { useRollStore, type ActionRecord, type FilmRoll } from '@/stores/rollStore'
import { ACTION_TYPE_LABEL, formatTime, ROLE_LABEL } from '@/lib/status'

interface DayActions {
  date: string
  actions: ActionRecord[]
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
  const { fetchCalendarData, fetchDailyActions, fetchRollDetail } = useRollStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState<Array<{ date: string; action_count: number; roll_ids: string[] }>>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayActions, setDayActions] = useState<DayActions | null>(null)
  const [rollColors, setRollColors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [rollCache, setRollCache] = useState<Record<string, FilmRoll>>({})

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  useEffect(() => {
    loadCalendarData()
  }, [monthStr])

  useEffect(() => {
    if (selectedDate) {
      loadDayActions(selectedDate)
    }
  }, [selectedDate])

  const loadCalendarData = async () => {
    try {
      const data = await fetchCalendarData(monthStr)
      setCalendarData(data)

      const allRollIds = new Set<string>()
      data.forEach(day => {
        day.roll_ids.forEach(id => allRollIds.add(id))
      })

      const colorMap: Record<string, string> = {}
      let colorIndex = 0
      allRollIds.forEach(id => {
        colorMap[id] = ROLL_COLORS[colorIndex % ROLL_COLORS.length]
        colorIndex++
      })
      setRollColors(colorMap)
    } catch (e) {
      console.error('获取日历数据失败:', e)
    }
  }

  const loadDayActions = async (date: string) => {
    setLoading(true)
    try {
      const actions = await fetchDailyActions(date)
      setDayActions({ date, actions })

      const rollIds = [...new Set(actions.map((a) => a.roll_id))]
      const newCache = { ...rollCache }

      for (const rollId of rollIds) {
        if (!newCache[rollId]) {
          const roll = await fetchRollDetail(rollId)
          if (roll) {
            newCache[rollId] = roll
          }
        }
      }
      setRollCache(newCache)
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

  const dayNames = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">日历视图</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-800">
            {year}年{month + 1}月
          </h2>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {dayNames.map((name) => (
            <div
              key={name}
              className="text-center text-sm font-medium text-gray-500 py-2"
            >
              {name}
            </div>
          ))}

          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-20" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayData = getDayData(day)
            const hasActions = dayData && dayData.action_count > 0
            const todayClass = isToday(day) ? 'ring-2 ring-[#C4813D]' : ''
            const selectedClass =
              selectedDate === dayData?.date ? 'bg-[#C4813D]/10' : ''

            return (
              <div
                key={day}
                onClick={() => hasActions && dayData && setSelectedDate(dayData.date)}
                className={`h-20 p-2 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${todayClass} ${selectedClass}`}
              >
                <div className="text-sm font-medium text-gray-700 mb-1">
                  {day}
                </div>
                {hasActions && (
                  <div className="flex flex-wrap gap-0.5">
                    {dayData.roll_ids.slice(0, 4).map((rollId) => (
                      <div
                        key={rollId}
                        className={`w-2 h-2 rounded-full ${rollColors[rollId] || 'bg-gray-400'}`}
                        title={`${rollCache[rollId]?.roll_number || rollId}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
          <span className="font-medium">图例：</span>
          同一颜色的圆点代表同一胶卷的连续处理
          </p>
        </div>
      </div>

      {selectedDate && dayActions && (
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {selectedDate} 动作详情
            </h3>
            <button
              onClick={() => {
                setSelectedDate(null)
                setDayActions(null)
              }}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : dayActions.actions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">当日无动作</div>
          ) : (
            <div className="space-y-3">
              {dayActions.actions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${rollColors[action.roll_id] || 'bg-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">
                          {ACTION_TYPE_LABEL[action.action_type] || action.action_type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {ROLE_LABEL[action.operator_role] || action.operator_role}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatTime(action.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Film className="w-3 h-3 text-gray-400" />
                      <span
                        className="text-xs text-[#C4813D] cursor-pointer hover:underline"
                        onClick={() => navigate(`/rolls/${action.roll_id}`)}
                      >
                        {action.roll_number || action.roll_id}
                      </span>
                      <span className="text-xs text-gray-400">
                        · {action.customer_name || ''}
                      </span>
                    </div>
                    {action.detail && (
                      <p className="text-sm text-gray-600 mt-1">{action.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
