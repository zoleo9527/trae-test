import { useState, useEffect } from 'react'
import { Plus, Search, Truck, CheckCircle, XCircle, AlertCircle, RefreshCw, DollarSign, MessageSquare, X } from 'lucide-react'
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

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showExceptionModal, setShowExceptionModal] = useState(false)

  const [createForm, setCreateForm] = useState({
    book_id: '',
    channel_id: '',
    quantity: '',
    sample_quantity: '',
    distribution_date: new Date().toISOString().split('T')[0],
    tracking_no: '',
    courier_company: '',
    remarks: '',
    handler_id: '',
    channel_manager_id: '',
  })

  const [returnForm, setReturnForm] = useState({
    quantity: '',
    return_reason: '',
    return_type: 'normal',
    remarks: '',
  })

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '银行转账',
    remarks: '',
  })

  const [feedbackForm, setFeedbackForm] = useState({
    feedback_type: 'sales',
    feedback_date: new Date().toISOString().split('T')[0],
    sales_quantity: '',
    feedback_content: '',
    feedback_by: '',
  })

  const [exceptionForm, setExceptionForm] = useState({
    exception_type: 'receipt_lost',
    description: '',
  })

  const [submitting, setSubmitting] = useState(false)

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
        status: 'completed',
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

  const handleCreateReturn = async () => {
    if (!selectedId || !selectedDetail || submitting) return
    if (!returnForm.quantity || !returnForm.return_reason) {
      alert('请填写完整退货信息')
      return
    }
    setSubmitting(true)
    try {
      await returnAPI.createReturn({
        distribution_id: selectedId,
        quantity: parseInt(returnForm.quantity),
        return_date: new Date().toISOString().split('T')[0],
        return_reason: returnForm.return_reason,
        return_type: returnForm.return_type,
        remarks: returnForm.remarks,
        handler_id: 3,
      })
      setShowReturnModal(false)
      setReturnForm({ quantity: '', return_reason: '', return_type: 'normal', remarks: '' })
      loadData()
      loadDetail(selectedId)
    } catch (error) {
      console.error('登记退货失败:', error)
      alert('登记退货失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreatePayment = async () => {
    if (!selectedId || !selectedDetail || submitting) return
    if (!paymentForm.amount) {
      alert('请填写回款金额')
      return
    }
    setSubmitting(true)
    try {
      await paymentAPI.createPayment({
        distribution_id: selectedId,
        channel_id: selectedDetail.channel_id,
        amount: parseFloat(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        remarks: paymentForm.remarks,
      })
      if (selectedDetail.status !== 'returned') {
        await distributionAPI.updateDistribution(selectedId, {
          status: 'completed',
        })
      }
      setShowPaymentModal(false)
      setPaymentForm({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: '银行转账',
        remarks: '',
      })
      loadData()
      loadDetail(selectedId)
    } catch (error) {
      console.error('登记回款失败:', error)
      alert('登记回款失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateFeedback = async () => {
    if (!selectedId || !selectedDetail || submitting) return
    if (!feedbackForm.feedback_content) {
      alert('请填写反馈内容')
      return
    }
    setSubmitting(true)
    try {
      await feedbackAPI.createFeedback({
        distribution_id: selectedId,
        feedback_type: feedbackForm.feedback_type,
        feedback_date: feedbackForm.feedback_date,
        sales_quantity: parseInt(feedbackForm.sales_quantity) || 0,
        feedback_content: feedbackForm.feedback_content,
        feedback_by: feedbackForm.feedback_by,
      })
      setShowFeedbackModal(false)
      setFeedbackForm({
        feedback_type: 'sales',
        feedback_date: new Date().toISOString().split('T')[0],
        sales_quantity: '',
        feedback_content: '',
        feedback_by: '',
      })
      loadDetail(selectedId)
    } catch (error) {
      console.error('记录反馈失败:', error)
      alert('记录反馈失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateException = async () => {
    if (!selectedId || !selectedDetail || submitting) return
    if (!exceptionForm.description) {
      alert('请填写异常描述')
      return
    }
    setSubmitting(true)
    try {
      await exceptionAPI.createException({
        related_type: 'distribution',
        related_id: selectedId,
        exception_type: exceptionForm.exception_type,
        description: exceptionForm.description,
        handler_id: 2,
      })
      setShowExceptionModal(false)
      setExceptionForm({ exception_type: 'receipt_lost', description: '' })
      loadData()
      loadDetail(selectedId)
    } catch (error) {
      console.error('发起异常处理失败:', error)
      alert('发起异常处理失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateDistribution = async () => {
    if (submitting) return
    if (!createForm.book_id || !createForm.channel_id || !createForm.quantity || !createForm.handler_id || !createForm.channel_manager_id) {
      alert('请填写完整必填信息（图书、渠道、数量、发行专员、渠道经理）')
      return
    }
    setSubmitting(true)
    try {
      const res = await distributionAPI.createDistribution({
        book_id: parseInt(createForm.book_id),
        channel_id: parseInt(createForm.channel_id),
        quantity: parseInt(createForm.quantity),
        sample_quantity: parseInt(createForm.sample_quantity) || 0,
        distribution_date: createForm.distribution_date,
        tracking_no: createForm.tracking_no || undefined,
        courier_company: createForm.courier_company || undefined,
        remarks: createForm.remarks || undefined,
        handler_id: parseInt(createForm.handler_id),
        channel_manager_id: parseInt(createForm.channel_manager_id),
      })
      const newId = res.data.id
      setShowCreateModal(false)
      setCreateForm({
        book_id: '',
        channel_id: '',
        quantity: '',
        sample_quantity: '',
        distribution_date: new Date().toISOString().split('T')[0],
        tracking_no: '',
        courier_company: '',
        remarks: '',
        handler_id: '',
        channel_manager_id: '',
      })
      loadData()
      setSelectedId(newId)
      loadDetail(newId)
    } catch (error) {
      console.error('新建铺货失败:', error)
      alert('新建铺货失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const ListPanel = (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">铺货单列表</h2>
          <ActionButton onClick={() => setShowCreateModal(true)}>
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
                {selectedDetail.status !== 'returned' && (
                  <ActionButton variant="secondary" onClick={() => setShowReturnModal(true)}>
                    <RefreshCw className="w-4 h-4 inline mr-1" /> 登记退货
                  </ActionButton>
                )}
                <ActionButton variant="secondary" onClick={() => setShowPaymentModal(true)}>
                  <DollarSign className="w-4 h-4 inline mr-1" /> 登记回款
                </ActionButton>
                <ActionButton variant="secondary" onClick={() => setShowFeedbackModal(true)}>
                  <MessageSquare className="w-4 h-4 inline mr-1" /> 记录反馈
                </ActionButton>
              </>
            )}
            {selectedDetail.receipt_status === 'lost' && (
              <ActionButton variant="danger" onClick={() => setShowExceptionModal(true)}>
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

  const Modal = ({ show, title, onClose, children }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">{title}</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <TwoPanelLayout
        listPanel={ListPanel}
        detailPanel={DetailPanel}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <Modal show={showCreateModal} title="新建铺货单" onClose={() => setShowCreateModal(false)}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择图书 <span className="text-red-500">*</span>
              </label>
              <select
                value={createForm.book_id}
                onChange={(e) => setCreateForm({ ...createForm, book_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择图书</option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} ({book.isbn})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择渠道 <span className="text-red-500">*</span>
              </label>
              <select
                value={createForm.channel_id}
                onChange={(e) => setCreateForm({ ...createForm, channel_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择渠道</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                铺货数量（册） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={createForm.quantity}
                onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })}
                placeholder="请输入铺货数量"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">样书数量（册）</label>
              <input
                type="number"
                value={createForm.sample_quantity}
                onChange={(e) => setCreateForm({ ...createForm, sample_quantity: e.target.value })}
                placeholder="选填，默认0"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              铺货日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={createForm.distribution_date}
              onChange={(e) => setCreateForm({ ...createForm, distribution_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">快递公司</label>
              <input
                type="text"
                value={createForm.courier_company}
                onChange={(e) => setCreateForm({ ...createForm, courier_company: e.target.value })}
                placeholder="选填"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">运单号</label>
              <input
                type="text"
                value={createForm.tracking_no}
                onChange={(e) => setCreateForm({ ...createForm, tracking_no: e.target.value })}
                placeholder="选填"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                发行专员 <span className="text-red-500">*</span>
              </label>
              <select
                value={createForm.handler_id}
                onChange={(e) => setCreateForm({ ...createForm, handler_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择</option>
                {users.filter(u => u.role === 'distribution_specialist' || u.role === 'admin').map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                渠道经理 <span className="text-red-500">*</span>
              </label>
              <select
                value={createForm.channel_manager_id}
                onChange={(e) => setCreateForm({ ...createForm, channel_manager_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择</option>
                {users.filter(u => u.role === 'channel_manager' || u.role === 'admin').map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={createForm.remarks}
              onChange={(e) => setCreateForm({ ...createForm, remarks: e.target.value })}
              placeholder="选填"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <ActionButton variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">
              取消
            </ActionButton>
            <ActionButton onClick={handleCreateDistribution} className="flex-1" disabled={submitting}>
              {submitting ? '提交中...' : '确认提交'}
            </ActionButton>
          </div>
        </div>
      </Modal>

      <Modal show={showReturnModal} title="登记退货" onClose={() => setShowReturnModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">退货数量（册）</label>
            <input
              type="number"
              value={returnForm.quantity}
              onChange={(e) => setReturnForm({ ...returnForm, quantity: e.target.value })}
              placeholder="请输入退货数量"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">退货类型</label>
            <select
              value={returnForm.return_type}
              onChange={(e) => setReturnForm({ ...returnForm, return_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">正常退货</option>
              <option value="damaged">破损退货</option>
              <option value="expired">过期退货</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">退货原因</label>
            <textarea
              value={returnForm.return_reason}
              onChange={(e) => setReturnForm({ ...returnForm, return_reason: e.target.value })}
              placeholder="请填写退货原因"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={returnForm.remarks}
              onChange={(e) => setReturnForm({ ...returnForm, remarks: e.target.value })}
              placeholder="选填"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <ActionButton variant="secondary" onClick={() => setShowReturnModal(false)} className="flex-1">
              取消
            </ActionButton>
            <ActionButton onClick={handleCreateReturn} className="flex-1" disabled={submitting}>
              {submitting ? '提交中...' : '确认提交'}
            </ActionButton>
          </div>
        </div>
      </Modal>

      <Modal show={showPaymentModal} title="登记回款" onClose={() => setShowPaymentModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">回款金额（元）</label>
            <input
              type="number"
              step="0.01"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              placeholder="请输入回款金额"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">回款日期</label>
            <input
              type="date"
              value={paymentForm.payment_date}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">支付方式</label>
            <select
              value={paymentForm.payment_method}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="银行转账">银行转账</option>
              <option value="支付宝">支付宝</option>
              <option value="微信支付">微信支付</option>
              <option value="现金">现金</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={paymentForm.remarks}
              onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
              placeholder="选填"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <ActionButton variant="secondary" onClick={() => setShowPaymentModal(false)} className="flex-1">
              取消
            </ActionButton>
            <ActionButton onClick={handleCreatePayment} className="flex-1" disabled={submitting}>
              {submitting ? '提交中...' : '确认提交'}
            </ActionButton>
          </div>
        </div>
      </Modal>

      <Modal show={showFeedbackModal} title="记录渠道反馈" onClose={() => setShowFeedbackModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">反馈类型</label>
            <select
              value={feedbackForm.feedback_type}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sales">销售反馈</option>
              <option value="reorder">补货申请</option>
              <option value="complaint">投诉建议</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">反馈日期</label>
            <input
              type="date"
              value={feedbackForm.feedback_date}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {feedbackForm.feedback_type === 'sales' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">销售数量（册）</label>
              <input
                type="number"
                value={feedbackForm.sales_quantity}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, sales_quantity: e.target.value })}
                placeholder="选填，已销售数量"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">反馈内容</label>
            <textarea
              value={feedbackForm.feedback_content}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback_content: e.target.value })}
              placeholder="请填写反馈内容"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">反馈人</label>
            <input
              type="text"
              value={feedbackForm.feedback_by}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback_by: e.target.value })}
              placeholder="选填，渠道联系人"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <ActionButton variant="secondary" onClick={() => setShowFeedbackModal(false)} className="flex-1">
              取消
            </ActionButton>
            <ActionButton onClick={handleCreateFeedback} className="flex-1" disabled={submitting}>
              {submitting ? '提交中...' : '确认提交'}
            </ActionButton>
          </div>
        </div>
      </Modal>

      <Modal show={showExceptionModal} title="发起异常处理" onClose={() => setShowExceptionModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">异常类型</label>
            <select
              value={exceptionForm.exception_type}
              onChange={(e) => setExceptionForm({ ...exceptionForm, exception_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="receipt_lost">回执丢失</option>
              <option value="quantity_discrepancy">数量差异</option>
              <option value="payment_mismatch">金额不符</option>
            </select>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700">
              关联单据: {selectedDetail?.distribution_no}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">异常描述</label>
            <textarea
              value={exceptionForm.description}
              onChange={(e) => setExceptionForm({ ...exceptionForm, description: e.target.value })}
              placeholder="请详细描述异常情况，便于后续跟踪处理"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <ActionButton variant="secondary" onClick={() => setShowExceptionModal(false)} className="flex-1">
              取消
            </ActionButton>
            <ActionButton variant="danger" onClick={handleCreateException} className="flex-1" disabled={submitting}>
              {submitting ? '提交中...' : '确认提交'}
            </ActionButton>
          </div>
        </div>
      </Modal>
    </div>
  )
}
