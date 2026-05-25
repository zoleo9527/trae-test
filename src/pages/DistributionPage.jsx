import { useState, useEffect } from 'react'
import { Plus, Search, Truck, CheckCircle, XCircle, AlertCircle, RefreshCw, DollarSign, MessageSquare } from 'lucide-react'
import TwoPanelLayout from '../components/TwoPanelLayout'
import StatusBadge from '../components/StatusBadge'
import ActionButton from '../components/ActionButton'
import { distributionAPI, returnAPI, paymentAPI, exceptionAPI, feedbackAPI, userAPI, bookAPI, channelAPI } from '../api'

export default function DistributionPage() {
  const [distributions, setDistributions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [users, setUsers] = useState([])
  const [books, setBooks] = useState([])
  const [channels, setChannels] = useState([])

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
      const [distRes, userRes, bookRes, channelRes] = await Promise.all([
        distributionAPI.getDistributions(statusFilter || undefined),
        userAPI.getUsers(),
        bookAPI.getBooks(),
        channelAPI.getChannels(),
      ])
      setDistributions(distRes.data)
      setUsers(userRes.data)
      setBooks(bookRes.data)
      setChannels(channelRes.data)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const loadDetail = async (id) => {
    try {
      const res = await distributionAPI.getDistribution(id)
      setSelectedDetail(res.data)
    } catch (error) {
      console.error('加载详情失败:', error)
    }
  }

  const filteredDistributions = distributions.filter(
    (item) =>
      item.distribution_no.toLowerCase().includes(filter.toLowerCase()) ||
      item.book?.title.toLowerCase().includes(filter.toLowerCase()) ||
      item.channel?.name.toLowerCase().includes(filter.toLowerCase())
  )

  const handleSelect = (item) => {
    setSelectedId(item.id)
  }

  const handleConfirmReceipt = async () => {
    if (!selectedId) return
    try {
      await distributionAPI.updateDistribution(selectedId, {
        receipt_status: 'confirmed',
        receipt_date: new Date().toISOString().split('T')[0],
      })
      loadData()
      loadDetail(selectedId)
    } catch (error) {
      console.error('确认收货失败:', error)
    }
  }

  const handleMarkLost = async () => {
    if (!selectedId) return
    try {
      await distributionAPI.updateDistribution(selectedId, {
        receipt_status: 'lost',
      })
      loadData()
      loadDetail(selectedId)
    } catch (error) {
      console.error('标记失败:', error)
    }
  }

  const ListPanel = (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">铺货单列表</h2>
          <ActionButton>
            <Plus className="w-4 h-4 inline mr-1" /> 新建铺货
          </ActionButton>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索铺货单号、书名、渠道..."
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
            <option value="shipped">已发货</option>
            <option value="completed">已完成</option>
            <option value="returned">已退货</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="divide-y divide-gray-100">
          {filteredDistributions.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedId === item.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800 text-sm">{item.distribution_no}</span>
                <StatusBadge type="status" status={item.status} />
              </div>
              <p className="text-sm text-gray-600 mb-1 truncate">{item.book?.title}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{item.channel?.name}</span>
                <div className="flex items-center gap-2">
                  <span>{item.quantity}册</span>
                  <StatusBadge type="receipt" status={item.receipt_status} />
                </div>
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
            <h2 className="font-semibold text-gray-800">{selectedDetail.distribution_no}</h2>
            <p className="text-sm text-gray-500">{selectedDetail.book?.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge type="status" status={selectedDetail.status} />
            <StatusBadge type="receipt" status={selectedDetail.receipt_status} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4" /> 铺货信息
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">渠道:</span>
              <span className="ml-2 text-gray-800">{selectedDetail.channel?.name}</span>
            </div>
            <div>
              <span className="text-gray-500">铺货数量:</span>
              <span className="ml-2 text-gray-800">{selectedDetail.quantity}册</span>
            </div>
            <div>
              <span className="text-gray-500">样书数量:</span>
              <span className="ml-2 text-gray-800">{selectedDetail.sample_quantity}册</span>
            </div>
            <div>
              <span className="text-gray-500">铺货日期:</span>
              <span className="ml-2 text-gray-800">{selectedDetail.distribution_date}</span>
            </div>
            <div>
              <span className="text-gray-500">快递公司:</span>
              <span className="ml-2 text-gray-800">{selectedDetail.courier_company || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">运单号:</span>
              <span className="ml-2 text-gray-800">{selectedDetail.tracking_no || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">发行专员:</span>
              <span className="ml-2 text-gray-800">{selectedDetail.handler?.name}</span>
            </div>
            <div>
              <span className="text-gray-500">渠道经理:</span>
              <span className="ml-2 text-gray-800">{selectedDetail.channel_manager?.name}</span>
            </div>
          </div>
          {selectedDetail.remarks && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-gray-500 text-sm">备注:</span>
              <span className="ml-2 text-sm text-gray-800">{selectedDetail.remarks}</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium text-gray-700 mb-3">可执行操作</h3>
          <div className="flex flex-wrap gap-2">
            {selectedDetail.receipt_status === 'pending' && (
              <>
                <ActionButton variant="success" onClick={handleConfirmReceipt}>
                  <CheckCircle className="w-4 h-4 inline mr-1" /> 确认收货回执
                </ActionButton>
                <ActionButton variant="warning" onClick={handleMarkLost}>
                  <XCircle className="w-4 h-4 inline mr-1" /> 回执丢失
                </ActionButton>
              </>
            )}
            {selectedDetail.receipt_status === 'confirmed' && (
              <>
                <ActionButton variant="secondary">
                  <RefreshCw className="w-4 h-4 inline mr-1" /> 登记退货
                </ActionButton>
                <ActionButton variant="secondary">
                  <DollarSign className="w-4 h-4 inline mr-1" /> 登记回款
                </ActionButton>
                <ActionButton variant="secondary">
                  <MessageSquare className="w-4 h-4 inline mr-1" /> 记录反馈
                </ActionButton>
              </>
            )}
            {selectedDetail.receipt_status === 'lost' && (
              <ActionButton variant="danger">
                <AlertCircle className="w-4 h-4 inline mr-1" /> 发起异常处理
              </ActionButton>
            )}
          </div>
        </div>

        {selectedDetail.feedbacks && selectedDetail.feedbacks.length > 0 && (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-medium text-gray-700 mb-3">渠道反馈</h3>
            <div className="space-y-2">
              {selectedDetail.feedbacks.map((fb) => (
                <div key={fb.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {fb.feedback_type === 'sales' ? '销售反馈' : fb.feedback_type === 'reorder' ? '补货申请' : '其他'}
                    </span>
                    <span className="text-xs text-gray-500">{fb.feedback_date}</span>
                  </div>
                  {fb.sales_quantity > 0 && (
                    <p className="text-sm text-gray-600 mb-1">已销售: {fb.sales_quantity}册</p>
                  )}
                  <p className="text-sm text-gray-700">{fb.feedback_content}</p>
                  <p className="text-xs text-gray-500 mt-1">反馈人: {fb.feedback_by}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedDetail.returns && selectedDetail.returns.length > 0 && (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-medium text-gray-700 mb-3">退货记录</h3>
            <div className="space-y-2">
              {selectedDetail.returns.map((ret) => (
                <div key={ret.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{ret.return_no}</span>
                    <div className="flex items-center gap-2">
                      <StatusBadge type="return_type" status={ret.return_type} />
                      <StatusBadge type="status" status={ret.status} />
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    <span>退货数量: {ret.quantity}册</span>
                    <span className="ml-3">原因: {ret.return_reason}</span>
                  </div>
                  {ret.quantity_discrepancy && (
                    <p className="text-xs text-red-600 mt-1">⚠️ {ret.discrepancy_note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedDetail.payments && selectedDetail.payments.length > 0 && (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-medium text-gray-700 mb-3">回款记录</h3>
            <div className="space-y-2">
              {selectedDetail.payments.map((pay) => (
                <div key={pay.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{pay.payment_no}</span>
                    <StatusBadge type="status" status={pay.status} />
                  </div>
                  <div className="text-xs text-gray-600">
                    <span>金额: ¥{pay.amount.toLocaleString()}</span>
                    <span className="ml-3">方式: {pay.payment_method}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedDetail.exceptions && selectedDetail.exceptions.length > 0 && (
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <h3 className="font-medium text-red-700 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> 异常记录
            </h3>
            <div className="space-y-2">
              {selectedDetail.exceptions.map((exc) => (
                <div key={exc.id} className="p-3 bg-white rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <StatusBadge type="exception" status={exc.exception_type} />
                    <StatusBadge type="exception_status" status={exc.status} />
                  </div>
                  <p className="text-sm text-gray-700">{exc.description}</p>
                </div>
              ))}
            </div>
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
