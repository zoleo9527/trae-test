import { useState, useEffect } from 'react'
import { Search, DollarSign, CheckCircle, AlertCircle } from 'lucide-react'
import TwoPanelLayout from '../components/TwoPanelLayout'
import StatusBadge from '../components/StatusBadge'
import ActionButton from '../components/ActionButton'
import { paymentAPI } from '../api'

export default function PaymentPage() {
  const [payments, setPayments] = useState([])
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
      const res = await paymentAPI.getPayments(statusFilter || undefined)
      setPayments(res.data)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const loadDetail = async (id) => {
    try {
      const res = await paymentAPI.getPayment(id)
      setSelectedDetail(res.data)
    } catch (error) {
      console.error('加载详情失败:', error)
    }
  }

  const filteredPayments = payments.filter(
    (item) =>
      item.payment_no.toLowerCase().includes(filter.toLowerCase()) ||
      item.distribution?.book?.title.toLowerCase().includes(filter.toLowerCase())
  )

  const handleConfirmPayment = async () => {
    if (!selectedId) return
    try {
      await paymentAPI.updatePayment(selectedId, {
        status: 'confirmed',
        finance_confirm_id: 4,
        finance_confirm_date: new Date().toISOString().split('T')[0],
      })
      loadData()
      loadDetail(selectedId)
    } catch (error) {
      console.error('确认回款失败:', error)
    }
  }

  const ListPanel = (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">回款记录</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索回款单号、书名..."
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
            <option value="pending">待确认</option>
            <option value="confirmed">已确认</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="divide-y divide-gray-100">
          {filteredPayments.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedId === item.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800 text-sm">{item.payment_no}</span>
                <StatusBadge type="status" status={item.status} />
              </div>
              <p className="text-sm text-gray-600 mb-1 truncate">
                {item.distribution?.book?.title}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{item.channel?.name}</span>
                <span className="font-medium text-green-600">
                  ¥{item.amount.toLocaleString()}
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
          <div>
            <h2 className="font-semibold text-gray-800">{selectedDetail.payment_no}</h2>
            <p className="text-sm text-gray-500">
              {selectedDetail.channel?.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">
              ¥{selectedDetail.amount.toLocaleString()}
            </p>
            <StatusBadge type="status" status={selectedDetail.status} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> 回款详情
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">关联铺货:</span>
              <span className="ml-2 text-gray-800">
                {selectedDetail.distribution?.distribution_no}
              </span>
            </div>
            <div>
              <span className="text-gray-500">图书名称:</span>
              <span className="ml-2 text-gray-800">
                {selectedDetail.distribution?.book?.title}
              </span>
            </div>
            <div>
              <span className="text-gray-500">回款日期:</span>
              <span className="ml-2 text-gray-800">{selectedDetail.payment_date}</span>
            </div>
            <div>
              <span className="text-gray-500">支付方式:</span>
              <span className="ml-2 text-gray-800">{selectedDetail.payment_method}</span>
            </div>
            {selectedDetail.finance_confirm && (
              <>
                <div>
                  <span className="text-gray-500">财务确认人:</span>
                  <span className="ml-2 text-gray-800">
                    {selectedDetail.finance_confirm?.name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">确认日期:</span>
                  <span className="ml-2 text-gray-800">
                    {selectedDetail.finance_confirm_date}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-medium text-blue-700 mb-2">对账说明</h3>
          <div className="text-sm text-blue-600">
            <p>铺货数量: {selectedDetail.distribution?.quantity}册</p>
            <p>图书单价: ¥{selectedDetail.distribution?.book?.price}</p>
            <p>
              应结金额: ¥
              {(
                selectedDetail.distribution?.quantity *
                selectedDetail.distribution?.book?.price
              ).toLocaleString()}
            </p>
            <p className="font-medium mt-1">
              实结金额: ¥{selectedDetail.amount.toLocaleString()}
            </p>
            {Math.abs(
              selectedDetail.distribution?.quantity *
                selectedDetail.distribution?.book?.price -
                selectedDetail.amount
            ) > 0 && (
              <p className="text-red-500 mt-2">
                ⚠️ 存在金额差异，请核实退货或折扣情况
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium text-gray-700 mb-3">可执行操作</h3>
          <div className="flex flex-wrap gap-2">
            {selectedDetail.status === 'pending' && (
              <ActionButton variant="success" onClick={handleConfirmPayment}>
                <CheckCircle className="w-4 h-4 inline mr-1" /> 财务确认
              </ActionButton>
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
