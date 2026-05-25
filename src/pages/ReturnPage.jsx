import { useState, useEffect } from 'react'
import { Search, Package, CheckCircle, AlertTriangle } from 'lucide-react'
import TwoPanelLayout from '../components/TwoPanelLayout'
import StatusBadge from '../components/StatusBadge'
import ActionButton from '../components/ActionButton'
import { returnAPI } from '../api'

export default function ReturnPage() {
  const [returns, setReturns] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

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
      const res = await returnAPI.getReturns(statusFilter || undefined)
      setReturns(res.data)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const loadDetail = async (id) => {
    try {
      const res = await returnAPI.getReturn(id)
      setSelectedDetail(res.data)
    } catch (error) {
      console.error('加载详情失败:', error)
    }
  }

  const filteredReturns = returns.filter(
    (item) =>
      item.return_no.toLowerCase().includes(filter.toLowerCase()) ||
      item.distribution?.book?.title.toLowerCase().includes(filter.toLowerCase())
  )

  const handleConfirmReceive = async () => {
    if (!selectedId) return
    try {
      await returnAPI.updateReturn(selectedId, {
        receive_status: 'confirmed',
        receive_date: new Date().toISOString().split('T')[0],
        status: 'completed',
      })
      loadData()
      loadDetail(selectedId)
    } catch (error) {
      console.error('确认收货失败:', error)
    }
  }

  const handleMarkDiscrepancy = async () => {
    if (!selectedId) return
    try {
      await returnAPI.updateReturn(selectedId, {
        quantity_discrepancy: true,
        discrepancy_note: '实收数量与渠道申报数量不符，待核实',
      })
      loadData()
      loadDetail(selectedId)
    } catch (error) {
      console.error('标记差异失败:', error)
    }
  }

  const ListPanel = (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">退货单列表</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索退货单号、书名..."
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
            <option value="pending">待处理</option>
            <option value="completed">已完成</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="divide-y divide-gray-100">
          {filteredReturns.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedId === item.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800 text-sm">{item.return_no}</span>
                <StatusBadge type="status" status={item.status} />
              </div>
              <p className="text-sm text-gray-600 mb-1 truncate">
                {item.distribution?.book?.title}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>退货数量: {item.quantity}册</span>
                {item.quantity_discrepancy && (
                  <span className="text-red-500">⚠️ 数量差异</span>
                )}
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
          <div>
            <h2 className="font-semibold text-gray-800">{selectedDetail.return_no}</h2>
            <p className="text-sm text-gray-500">
              关联铺货: {selectedDetail.distribution?.distribution_no}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge type="return_type" status={selectedDetail.return_type} />
            <StatusBadge type="status" status={selectedDetail.status} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" /> 退货详情
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">图书名称:</span>
              <span className="ml-2 text-gray-800">
                {selectedDetail.distribution?.book?.title}
              </span>
            </div>
            <div>
              <span className="text-gray-500">退货渠道:</span>
              <span className="ml-2 text-gray-800">
                {selectedDetail.distribution?.channel?.name}
              </span>
            </div>
            <div>
              <span className="text-gray-500">退货数量:</span>
              <span className="ml-2 text-gray-800">{selectedDetail.quantity}册</span>
            </div>
            <div>
              <span className="text-gray-500">退货日期:</span>
              <span className="ml-2 text-gray-800">{selectedDetail.return_date}</span>
            </div>
            <div>
              <span className="text-gray-500">处理人:</span>
              <span className="ml-2 text-gray-800">{selectedDetail.handler?.name}</span>
            </div>
            <div>
              <span className="text-gray-500">收货状态:</span>
              <span className="ml-2">
                <StatusBadge type="receipt" status={selectedDetail.receive_status} />
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-gray-500 text-sm">退货原因:</span>
            <span className="ml-2 text-sm text-gray-800">{selectedDetail.return_reason}</span>
          </div>
        </div>

        {selectedDetail.quantity_discrepancy && (
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <h3 className="font-medium text-orange-700 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> 数量差异提醒
            </h3>
            <p className="text-sm text-orange-600">{selectedDetail.discrepancy_note}</p>
          </div>
        )}

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium text-gray-700 mb-3">可执行操作</h3>
          <div className="flex flex-wrap gap-2">
            {selectedDetail.receive_status === 'pending' && (
              <>
                <ActionButton variant="success" onClick={handleConfirmReceive}>
                  <CheckCircle className="w-4 h-4 inline mr-1" /> 确认收货
                </ActionButton>
                <ActionButton variant="warning" onClick={handleMarkDiscrepancy}>
                  <AlertTriangle className="w-4 h-4 inline mr-1" /> 标记数量差异
                </ActionButton>
              </>
            )}
          </div>
        </div>

        {selectedDetail.remarks && (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-medium text-gray-700 mb-2">备注</h3>
            <p className="text-sm text-gray-600">{selectedDetail.remarks}</p>
          </div>
        )}
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
