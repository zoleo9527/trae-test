import { useEffect, useState } from 'react'
import { Search, Filter, LayoutGrid, List, Plus, X, MapPin, Wrench, AlertCircle } from 'lucide-react'
import { useWorkOrderStore } from '@/store/useWorkOrderStore'
import { useSiteStore } from '@/store/useSiteStore'
import { useAuthStore } from '@/store/useAuthStore'
import { WorkOrderCard } from '@/components/WorkOrderCard'
import { WorkPanel } from '@/components/WorkPanel'
import { StatusBadge, PriorityBadge, TypeBadge } from '@/components/Badge'
import { formatDateTime, isOverdue, getOverdueTime } from '@/utils/format'
import type { WorkOrder, WorkOrderStatus, WorkOrderPriority, WorkOrderType } from '@/types'

function WorkOrderPage() {
  const { user } = useAuthStore()
  const { workOrders, fetchWorkOrders, selectedWorkOrder, setSelectedWorkOrder, createWorkOrder } = useWorkOrderStore()
  const { sites, fetchSites } = useSiteStore()
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<WorkOrderPriority | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<WorkOrderType | 'all'>('all')
  const [siteFilter, setSiteFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newType, setNewType] = useState<WorkOrderType>('repair')
  const [newPriority, setNewPriority] = useState<WorkOrderPriority>('medium')
  const [newSiteId, setNewSiteId] = useState('')

  useEffect(() => {
    fetchWorkOrders()
    fetchSites()
  }, [fetchWorkOrders, fetchSites])

  const filteredWorkOrders = workOrders.filter((wo) => {
    if (statusFilter !== 'all' && wo.status !== statusFilter) return false
    if (priorityFilter !== 'all' && wo.priority !== priorityFilter) return false
    if (typeFilter !== 'all' && wo.type !== typeFilter) return false
    if (siteFilter !== 'all' && wo.siteId !== siteFilter) return false
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase()
      if (
        !wo.title.toLowerCase().includes(kw) &&
        !wo.description.toLowerCase().includes(kw) &&
        !wo.siteName.toLowerCase().includes(kw)
      ) {
        return false
      }
    }
    return true
  })

  const handleCardClick = (wo: WorkOrder) => {
    setSelectedWorkOrder(wo)
  }

  const handleClosePanel = () => {
    setSelectedWorkOrder(null)
  }

  const handleCreateOrder = () => {
    if (!user || !newTitle.trim() || !newSiteId) return
    const site = sites.find((s) => s.id === newSiteId)
    createWorkOrder({
      title: newTitle.trim(),
      description: newDesc.trim(),
      type: newType,
      priority: newPriority,
      status: 'pending',
      siteId: newSiteId,
      siteName: site?.name || '',
      reporterId: user.id,
      reporterName: user.name,
    })
    setShowCreateModal(false)
    setNewTitle('')
    setNewDesc('')
    setNewType('repair')
    setNewPriority('medium')
    setNewSiteId('')
  }

  const statusGroups: WorkOrderStatus[] = ['pending', 'assigned', 'processing', 'returned', 'escalated', 'completed', 'closed']

  const groupByStatus = statusGroups.map((status) => ({
    status,
    items: filteredWorkOrders.filter((wo) => wo.status === status),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">工单中心</h1>
          <p className="text-slate-500 mt-1">管理所有工单，跟踪处理进度</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          创建工单
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索工单标题、描述、站点..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center ${
                showFilters ? 'bg-slate-100' : ''
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              筛选
            </button>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'kanban' ? 'bg-white text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">状态：</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as WorkOrderStatus | 'all')}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">全部</option>
                <option value="pending">待分配</option>
                <option value="assigned">已分配</option>
                <option value="processing">处理中</option>
                <option value="returned">已退回</option>
                <option value="escalated">已升级</option>
                <option value="completed">已完成</option>
                <option value="closed">已关闭</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">优先级：</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as WorkOrderPriority | 'all')}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">全部</option>
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="urgent">紧急</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">类型：</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as WorkOrderType | 'all')}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">全部</option>
                <option value="repair">设备维修</option>
                <option value="refund">退款申诉</option>
                <option value="consumable">耗材补货</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">站点：</span>
              <select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">全部</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="p-4">
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                    <th className="pb-3 font-medium">工单</th>
                    <th className="pb-3 font-medium">状态</th>
                    <th className="pb-3 font-medium">优先级</th>
                    <th className="pb-3 font-medium">类型</th>
                    <th className="pb-3 font-medium">站点</th>
                    <th className="pb-3 font-medium">处理人</th>
                    <th className="pb-3 font-medium">创建时间</th>
                    <th className="pb-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkOrders.map((wo) => (
                    <tr
                      key={wo.id}
                      onClick={() => handleCardClick(wo)}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-4">
                        <p className="font-medium text-slate-900">{wo.title}</p>
                      </td>
                      <td className="py-4">
                        <StatusBadge status={wo.status} />
                        {isOverdue(wo.deadline) && (
                          <p className="text-xs text-red-600 mt-1">
                            {getOverdueTime(wo.deadline)}
                          </p>
                        )}
                      </td>
                      <td className="py-4">
                        <PriorityBadge priority={wo.priority} />
                      </td>
                      <td className="py-4">
                        <TypeBadge type={wo.type} />
                      </td>
                      <td className="py-4 text-sm text-slate-600">
                        {wo.siteName}
                      </td>
                      <td className="py-4 text-sm text-slate-600">
                        {wo.assigneeName || '-'}
                      </td>
                      <td className="py-4 text-sm text-slate-500">
                        {formatDateTime(wo.createdAt)}
                      </td>
                      <td className="py-4">
                        <button className="text-indigo-600 text-sm font-medium hover:text-indigo-800">
                          查看
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredWorkOrders.length === 0 && (
                <div className="text-center py-16 text-slate-500">
                  暂无工单
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-4">
              {groupByStatus.map((group) => (
                <div key={group.status} className="min-w-[200px]">
                  <div className="bg-slate-50 rounded-lg p-3 mb-3">
                    <StatusBadge status={group.status} />
                    <span className="ml-2 text-sm text-slate-500">
                      {group.items.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {group.items.map((wo) => (
                      <WorkOrderCard
                        key={wo.id}
                        workOrder={wo}
                        onClick={() => handleCardClick(wo)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedWorkOrder && (
        <WorkPanel workOrder={selectedWorkOrder} onClose={handleClosePanel} />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">创建工单</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  工单标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="简要描述故障或问题"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  详细描述
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="详细描述问题情况、发生时间等"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as WorkOrderType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="repair">设备维修</option>
                    <option value="refund">退款申诉</option>
                    <option value="consumable">耗材补货</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    优先级 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as WorkOrderPriority)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="urgent">紧急</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  站点 <span className="text-red-500">*</span>
                </label>
                <select
                  value={newSiteId}
                  onChange={(e) => setNewSiteId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">请选择站点</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={!newTitle.trim() || !newSiteId}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                提交工单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkOrderPage
