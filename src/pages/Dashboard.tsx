import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, CheckCircle, Wrench, Droplets, ArrowRight, TrendingUp } from 'lucide-react'
import { useWorkOrderStore } from '@/store/useWorkOrderStore'
import { useSiteStore } from '@/store/useSiteStore'
import { useAuthStore } from '@/store/useAuthStore'
import { WorkOrderCard } from '@/components/WorkOrderCard'
import { WorkPanel } from '@/components/WorkPanel'
import { isOverdue } from '@/utils/format'
import type { WorkOrder } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function DashboardPage() {
  const { user } = useAuthStore()
  const { workOrders, fetchWorkOrders, selectedWorkOrder, setSelectedWorkOrder } = useWorkOrderStore()
  const { sites, fetchSites, inspections, fetchInspections } = useSiteStore()
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'overdue'>('all')

  useEffect(() => {
    fetchWorkOrders()
    fetchSites()
    fetchInspections()
  }, [fetchWorkOrders, fetchSites, fetchInspections])

  const myWorkOrders = user
    ? workOrders.filter((wo) => wo.assigneeId === user.id && wo.status !== 'completed' && wo.status !== 'closed')
    : []

  const overdueWorkOrders = workOrders.filter(
    (wo) => isOverdue(wo.deadline) && wo.status !== 'completed' && wo.status !== 'closed'
  )

  const pendingWorkOrders = workOrders.filter((wo) => wo.status === 'pending')

  const consumableWarnings = workOrders.filter((wo) => wo.type === 'consumable')

  const displayedWorkOrders = (() => {
    let list = workOrders.filter((wo) => wo.status !== 'completed' && wo.status !== 'closed')
    if (activeTab === 'my' && user) {
      list = list.filter((wo) => wo.assigneeId === user.id)
    } else if (activeTab === 'overdue') {
      list = list.filter((wo) => isOverdue(wo.deadline))
    }
    return list.slice(0, 6)
  })()

  const handleCardClick = (wo: WorkOrder) => {
    setSelectedWorkOrder(wo)
  }

  const handleClosePanel = () => {
    setSelectedWorkOrder(null)
  }

  const chartData = [
    { name: '周一', 工单: 8, 完成: 6 },
    { name: '周二', 工单: 12, 完成: 10 },
    { name: '周三', 工单: 6, 完成: 6 },
    { name: '周四', 工单: 15, 完成: 12 },
    { name: '周五', 工单: 10, 完成: 8 },
    { name: '周六', 工单: 5, 完成: 5 },
    { name: '周日', 工单: 3, 完成: 3 },
  ]

  const stats = [
    {
      label: '待处理工单',
      value: pendingWorkOrders.length,
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
      trend: '+2 今日',
    },
    {
      label: '超时工单',
      value: overdueWorkOrders.length,
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-600',
      trend: overdueWorkOrders.length > 0 ? '需要关注' : '全部正常',
    },
    {
      label: '今日已完成',
      value: 3,
      icon: CheckCircle,
      color: 'bg-green-50 text-green-600',
      trend: '目标 8 单',
    },
    {
      label: '耗材预警',
      value: consumableWarnings.length,
      icon: Droplets,
      color: 'bg-teal-50 text-teal-600',
      trend: consumableWarnings.length > 0 ? '待补货' : '库存充足',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">工作台</h1>
          <p className="text-slate-500 mt-1">
            欢迎回来，{user?.name}，今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-500">当前角色：</span>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
            {user?.role === 'admin' ? '运营主管' : user?.role === 'inspector' ? '巡检员' : '客服'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-2">{stat.trend}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">待处理工单</h2>
              <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
                {[
                  { key: 'all', label: '全部' },
                  { key: 'my', label: '我的' },
                  { key: 'overdue', label: '超时' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.key
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5">
              {displayedWorkOrders.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {displayedWorkOrders.map((wo) => (
                    <WorkOrderCard key={wo.id} workOrder={wo} onClick={() => handleCardClick(wo)} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <p>暂无待处理工单</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">本周工单趋势</h2>
            </div>
            <div className="p-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Bar dataKey="工单" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="完成" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">站点状态</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {sites.slice(0, 4).map((site) => (
                <div key={site.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center">
                    <div
                      className={`w-2.5 h-2.5 rounded-full mr-3 ${
                        site.status === 'normal'
                          ? 'bg-green-500'
                          : site.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{site.name}</p>
                      <p className="text-xs text-slate-500">{site.deviceCount} 台设备</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    上次巡检：{site.lastInspection}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">今日巡检任务</h2>
              <span className="text-xs text-indigo-600 font-medium">
                {inspections.filter((i) => i.status === 'pending').length} 项待执行
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {inspections
                .filter((i) => i.status === 'pending' || i.status === 'in_progress')
                .slice(0, 3)
                .map((task) => (
                  <div key={task.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                          task.status === 'in_progress'
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{task.siteName}</p>
                        <p className="text-xs text-slate-500">{task.items.length} 项检查</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {selectedWorkOrder && <WorkPanel workOrder={selectedWorkOrder} onClose={handleClosePanel} />}
    </div>
  )
}

export default DashboardPage
