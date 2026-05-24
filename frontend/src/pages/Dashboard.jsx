import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ClipboardCheck, Clock, AlertTriangle, CheckCircle, 
  Wrench, AlertCircle, TrendingUp 
} from 'lucide-react'
import axios from 'axios'
import { statusConfig, formatDate } from '../utils/format'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentInspections, setRecentInspections] = useState([])
  const [recentRectifications, setRecentRectifications] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, inspectionsRes, rectificationsRes] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/inspections'),
        axios.get('/api/rectifications')
      ])
      setStats(statsRes.data)
      setRecentInspections(inspectionsRes.data.slice(0, 5))
      setRecentRectifications(rectificationsRes.data.slice(0, 5))
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    }
  }

  const statCards = stats ? [
    { label: '巡检总数', value: stats.total_inspections, icon: ClipboardCheck, color: 'bg-blue-500' },
    { label: '待处理', value: stats.pending_inspections, icon: Clock, color: 'bg-gray-500' },
    { label: '整改中', value: stats.rectifying, icon: Wrench, color: 'bg-orange-500' },
    { label: '待复查', value: stats.rechecking, icon: AlertCircle, color: 'bg-purple-500' },
    { label: '有异议', value: stats.disputed, icon: AlertTriangle, color: 'bg-red-500' },
    { label: '已完成', value: stats.completed, icon: CheckCircle, color: 'bg-green-500' },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
          <p className="mt-1 text-sm text-gray-500">欢迎回来，查看今日工地巡检情况</p>
        </div>
      </div>

      {stats && stats.overdue_rectifications > 0 && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={24} />
            <div>
              <p className="font-medium text-red-800">超期提醒</p>
              <p className="text-sm text-red-600">有 {stats.overdue_rectifications} 条整改单已超期，请及时处理</p>
            </div>
            <Link
              to="/rectifications?filter=overdue"
              className="ml-auto rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              立即查看
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} className="rounded-xl bg-white p-5 shadow-sm">
              <div className={`${card.color} inline-flex h-10 w-10 items-center justify-center rounded-lg`}>
                <Icon size={20} className="text-white" />
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500">{card.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">最近巡检</h2>
            <Link to="/inspections" className="text-sm text-blue-600 hover:text-blue-700">
              查看全部
            </Link>
          </div>
          <div className="space-y-3">
            {recentInspections.map((inspection) => {
              const status = statusConfig[inspection.status] || statusConfig.pending
              return (
                <Link
                  key={inspection.id}
                  to={`/inspections/${inspection.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{inspection.title}</p>
                    <p className="text-xs text-gray-500">{inspection.project?.name}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    <p className="mt-1 text-xs text-gray-500">{formatDate(inspection.created_at)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">最近整改</h2>
            <Link to="/rectifications" className="text-sm text-blue-600 hover:text-blue-700">
              查看全部
            </Link>
          </div>
          <div className="space-y-3">
            {recentRectifications.map((rectification) => {
              const status = statusConfig[rectification.status] || statusConfig.pending
              return (
                <Link
                  key={rectification.id}
                  to={`/rectifications/${rectification.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{rectification.title}</p>
                    <p className="text-xs text-gray-500">
                      {rectification.items?.length || 0} 项待整改
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    <p className="mt-1 text-xs text-gray-500">{formatDate(rectification.created_at)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
