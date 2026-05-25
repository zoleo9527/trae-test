import { useState, useEffect } from 'react'
import { Package, RefreshCw, DollarSign, AlertTriangle, TrendingUp, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { dashboardAPI, distributionAPI, exceptionAPI } from '../api'
import StatusBadge from '../components/StatusBadge'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentDistributions, setRecentDistributions] = useState([])
  const [openExceptions, setOpenExceptions] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, distRes, excRes] = await Promise.all([
        dashboardAPI.getStats(),
        distributionAPI.getDistributions(),
        exceptionAPI.getExceptions('open'),
      ])
      setStats(statsRes.data)
      setRecentDistributions(distRes.data.slice(0, 5))
      setOpenExceptions(excRes.data.slice(0, 5))
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const statCards = stats ? [
    { label: '铺货总数', value: stats.total_distributions, icon: Package, color: 'bg-blue-500' },
    { label: '待回执确认', value: stats.pending_receipt, icon: ArrowDownToLine, color: 'bg-yellow-500' },
    { label: '待处理退货', value: stats.pending_return, icon: RefreshCw, color: 'bg-orange-500' },
    { label: '待确认回款', value: stats.pending_payment, icon: DollarSign, color: 'bg-green-500' },
    { label: '待处理异常', value: stats.exception_count, icon: AlertTriangle, color: 'bg-red-500' },
  ] : []

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-5 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="font-medium text-gray-700">销售总额</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">¥{(stats?.total_sales_amount || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ArrowDownToLine className="w-5 h-5 text-orange-500" />
            <span className="font-medium text-gray-700">退货总额</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">¥{(stats?.total_return_amount || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpFromLine className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-gray-700">已回款总额</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">¥{(stats?.total_payment_amount || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">最近铺货</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentDistributions.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{item.distribution_no}</span>
                  <StatusBadge type="status" status={item.status} />
                </div>
                <p className="text-sm text-gray-600 mb-1">{item.book?.title}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{item.channel?.name}</span>
                  <span>铺货数量: {item.quantity}册</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">待处理异常</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {openExceptions.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <StatusBadge type="exception" status={item.exception_type} />
                  <StatusBadge type="exception_status" status={item.status} />
                </div>
                <p className="text-sm text-gray-700 mb-1">{item.description}</p>
                <p className="text-xs text-gray-500">处理人: {item.handler?.name || '未分配'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
