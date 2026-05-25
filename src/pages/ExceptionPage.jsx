import { useState, useEffect } from 'react'
import { Search, AlertTriangle, CheckCircle, Clock, User } from 'lucide-react'
import TwoPanelLayout from '../components/TwoPanelLayout'
import StatusBadge from '../components/StatusBadge'
import ActionButton from '../components/ActionButton'
import { exceptionAPI, distributionAPI } from '../api'

export default function ExceptionPage() {
  const [exceptions, setExceptions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [resolution, setResolution] = useState('')

  useEffect(() => {
    loadData()
  }, [statusFilter])

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId)
    }
  }, [selectedId])

  const loadData = async () => {
    try {
      const res = await exceptionAPI.getExceptions(statusFilter || undefined)
      setExceptions(res.data)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const loadDetail = async (id) => {
    try {
      const res = await exceptionAPI.getException(id)
      setSelectedDetail(res.data)
      setResolution('')
    } catch (error) {
      console.error('加载详情失败:', error)
    }
  }

  const filteredExceptions = exceptions.filter(
    (item) => item.description.toLowerCase().includes(filter.toLowerCase())
  )

  const handleMarkProcessing = async () => {
    if (!selectedId) return
    try {
      await exceptionAPI.updateException(selectedId, {
        status: 'processing',
      })
      loadData()
      loadDetail(selectedId)
    } catch (error) {
      console.error('更新状态失败:', error)
    }
  }

  const handleResolve = async () => {
    if (!selectedId || !resolution.trim()) return
    try {
      await exceptionAPI.updateException(selectedId, {
        status: 'resolved',
        resolution: resolution,
      })
      if (selectedDetail.related_type === 'distribution' && selectedDetail.related_id) {
        if (selectedDetail.exception_type === 'receipt_lost') {
          await distributionAPI.updateDistribution(selectedDetail.related_id, {
            status: 'shipped',
            receipt_status: 'pending',
          })
        } else {
          const pendingExceptions = await exceptionAPI.getExceptions('open')
          const relatedPending = pendingExceptions.data.filter(
            e => e.related_type === 'distribution' && 
                 e.related_id === selectedDetail.related_id &&
                 e.id !== selectedId
          )
          if (relatedPending.length === 0) {
            if (selectedDetail.exception_type === 'quantity_discrepancy') {
              await distributionAPI.updateDistribution(selectedDetail.related_id, {
                status: 'returned',
              })
            } else if (selectedDetail.exception_type === 'payment_mismatch') {
              await distributionAPI.updateDistribution(selectedDetail.related_id, {
                status: 'completed',
              })
            }
          }
        }
      }
      loadData()
      loadDetail(selectedId)
    } catch (error) {
      console.error('解决异常失败:', error)
    }
  }

  const ListPanel = (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">异常处理</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-500">
              待处理: {exceptions.filter((e) => e.status === 'open').length}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索异常描述..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部状态</option>
            <option value="open">待处理</option>
            <option value="processing">处理中</option>
            <option value="resolved">已解决</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="divide-y divide-gray-100">
          {filteredExceptions.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedId === item.id ? 'bg-red-50 border-l-4 border-l-red-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <StatusBadge type="exception" status={item.exception_type} />
                <StatusBadge type="exception_status" status={item.status} />
              </div>
              <p className="text-sm text-gray-700 mb-2 line-clamp-2">{item.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {item.handler?.name || '未分配'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const DetailPanel = selectedDetail ? (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <StatusBadge type="exception" status={selectedDetail.exception_type} />
              <h2 className="font-semibold text-gray-800 mt-1">异常处理单 #{selectedDetail.id}</h2>
            </div>
          </div>
          <StatusBadge type="exception_status" status={selectedDetail.status} />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium text-gray-700 mb-3">异常描述</h3>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
            {selectedDetail.description}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">关联类型:</span>
              <span className="ml-2 text-gray-800">
                {selectedDetail.related_type === 'distribution'
                  ? '铺货单'
                  : selectedDetail.related_type === 'return'
                  ? '退货单'
                  : '回款单'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">关联ID:</span>
              <span className="ml-2 text-gray-800">#{selectedDetail.related_id}</span>
            </div>
            <div>
              <span className="text-gray-500">处理人:</span>
              <span className="ml-2 text-gray-800">{selectedDetail.handler?.name}</span>
            </div>
            <div>
              <span className="text-gray-500">创建时间:</span>
              <span className="ml-2 text-gray-800">
                {new Date(selectedDetail.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {selectedDetail.status !== 'resolved' && (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-medium text-gray-700 mb-3">处理操作</h3>
            <div className="space-y-3">
              {selectedDetail.status === 'open' && (
                <ActionButton variant="warning" onClick={handleMarkProcessing}>
                  <Clock className="w-4 h-4 inline mr-1" /> 标记为处理中
                </ActionButton>
              )}
              {selectedDetail.status === 'processing' && (
                <div className="space-y-3">
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="请输入解决方案..."
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                  <ActionButton variant="success" onClick={handleResolve}>
                    <CheckCircle className="w-4 h-4 inline mr-1" /> 标记为已解决
                  </ActionButton>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedDetail.resolution && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="font-medium text-green-700 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> 解决方案
            </h3>
            <p className="text-sm text-green-600">{selectedDetail.resolution}</p>
            <p className="text-xs text-green-500 mt-2">
              解决时间: {new Date(selectedDetail.resolved_at).toLocaleString()}
            </p>
          </div>
        )}

        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <h3 className="font-medium text-yellow-700 mb-2">处理建议</h3>
          <ul className="text-sm text-yellow-600 space-y-1">
            {selectedDetail.exception_type === 'receipt_lost' && (
              <>
                <li>• 联系快递公司核实包裹状态</li>
                <li>• 与渠道沟通是否实际收到货物</li>
                <li>• 如确认丢失，启动补发或赔偿流程</li>
              </>
            )}
            {selectedDetail.exception_type === 'quantity_discrepancy' && (
              <>
                <li>• 核对渠道退货清单与实收数量</li>
                <li>• 检查运输过程是否有破损丢失</li>
                <li>• 确认是否存在库存记录差异</li>
              </>
            )}
            {selectedDetail.exception_type === 'payment_mismatch' && (
              <>
                <li>• 核对合同约定的折扣和账期</li>
                <li>• 确认是否有退货抵扣款项</li>
                <li>• 与渠道财务对接核实明细</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  ) : null

  return (
    <div className="h-full">
      <TwoPanelLayout
        listPanel={ListPanel}
        detailPanel={DetailPanel}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    </div>
  )
}
