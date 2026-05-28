import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../components/common/StatusBadge'
import { EmptyState } from '../components/common/EmptyState'
import { useSplitStore } from '../store/splitStore'
import { useReceiptStore } from '../store/receiptStore'
import { useOrderStore } from '../store/orderStore'
import { useRoleStore } from '../store/roleStore'
import { getRolePermissions } from '../data/mockData'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { ReceiptStatus } from '../types'

export const Receipts: React.FC = () => {
  const { splits } = useSplitStore()
  const { receipts, addReceipt } = useReceiptStore()
  const { getOrderById } = useOrderStore()
  const { currentRole } = useRoleStore()
  const permissions = getRolePermissions(currentRole)

  const [statusFilter, setStatusFilter] = useState<ReceiptStatus | 'all'>('all')
  const [showReceiptPanel, setShowReceiptPanel] = useState<string | null>(null)
  const [receiptStatus, setReceiptStatus] = useState<ReceiptStatus>('signed')
  const [signedBy, setSignedBy] = useState('')
  const [exceptionNote, setExceptionNote] = useState('')

  const receiptData = useMemo(() => {
    return splits
      .filter((s) => s.status === 'shipped' || s.status === 'completed')
      .map((split) => {
        const order = getOrderById(split.orderId)
        const receipt = receipts.find((r) => r.splitId === split.id)
        return {
          split,
          order,
          receipt,
        }
      })
      .filter((item) => {
        if (statusFilter === 'all') return true
        const receiptStatus = item.receipt?.status || 'pending'
        return receiptStatus === statusFilter
      })
  }, [splits, receipts, getOrderById, statusFilter])

  const handleOpenReceipt = (splitId: string) => {
    setShowReceiptPanel(splitId)
    setReceiptStatus('signed')
    setSignedBy('')
    setExceptionNote('')
  }

  const handleSubmitReceipt = () => {
    if (!showReceiptPanel || !permissions.canEnterReceipt) return

    addReceipt(
      showReceiptPanel,
      {
        status: receiptStatus,
        signedBy: signedBy.trim() || undefined,
        signedAt: new Date(),
        exceptionNote: receiptStatus === 'exception' ? exceptionNote.trim() : undefined,
      },
      currentRole === 'merchandiser' ? '当前跟单员' : currentRole === 'warehouse' ? '当前仓管员' : '管理员'
    )

    setShowReceiptPanel(null)
  }

  const statusOptions: Array<{ value: ReceiptStatus | 'all'; label: string }> = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待回执' },
    { value: 'signed', label: '已签收' },
    { value: 'exception', label: '异常' },
  ]

  const stats = useMemo(() => {
    const pending = receiptData.filter((r) => !r.receipt || r.receipt.status === 'pending').length
    const signed = receiptData.filter((r) => r.receipt?.status === 'signed').length
    const exception = receiptData.filter((r) => r.receipt?.status === 'exception').length
    return { pending, signed, exception }
  }, [receiptData])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-dark-500">待回执</p>
          <p className="text-3xl font-bold font-mono text-yellow-600 mt-1">{stats.pending}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-dark-500">已签收</p>
          <p className="text-3xl font-bold font-mono text-green-600 mt-1">{stats.signed}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-dark-500">异常</p>
          <p className="text-3xl font-bold font-mono text-danger mt-1">{stats.exception}</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-dark-600">回执状态：</span>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-3 py-1.5 text-sm rounded-btn transition-colors ${
                  statusFilter === option.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {receiptData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-200">
                  <th className="table-header">子单号</th>
                  <th className="table-header">关联订单</th>
                  <th className="table-header">商品</th>
                  <th className="table-header">物流单号</th>
                  <th className="table-header">发货时间</th>
                  <th className="table-header">回执状态</th>
                  <th className="table-header">签收人</th>
                  <th className="table-header text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {receiptData.map(({ split, order, receipt }) => (
                  <tr key={split.id} className="hover:bg-dark-50 transition-colors">
                    <td className="table-cell font-mono font-medium">{split.splitNo}</td>
                    <td className="table-cell">
                      <Link to={`/orders/${order?.id}`} className="text-primary-600 hover:text-primary-700">
                        {order?.orderNo}
                      </Link>
                      <div className="text-xs text-dark-500">{order?.customerName}</div>
                    </td>
                    <td className="table-cell">
                      <div className="max-w-xs truncate text-sm text-dark-600">
                        {split.items.map((i) => `${i.name}x${i.quantity}`).join('，')}
                      </div>
                    </td>
                    <td className="table-cell font-mono">{split.trackingNo}</td>
                    <td className="table-cell text-dark-500">
                      {split.shippedAt ? format(new Date(split.shippedAt), 'yyyy-MM-dd', { locale: zhCN }) : '-'}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={receipt?.status || 'pending'} />
                      {receipt?.exceptionNote && (
                        <div className="mt-1 text-xs text-danger max-w-xs truncate">
                          {receipt.exceptionNote}
                        </div>
                      )}
                    </td>
                    <td className="table-cell text-dark-600">{receipt?.signedBy || '-'}</td>
                    <td className="table-cell text-right">
                      {!receipt && permissions.canEnterReceipt && (
                        <button
                          onClick={() => handleOpenReceipt(split.id)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          录入回执
                        </button>
                      )}
                      {receipt && (
                        <Link
                          to={`/orders/${order?.id}`}
                          className="text-dark-500 hover:text-dark-700 text-sm"
                        >
                          查看详情
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="暂无回执记录"
            description={statusFilter !== 'all' ? '没有找到符合条件的回执' : '还没有已发货的子单需要回执'}
          />
        )}
      </div>

      {showReceiptPanel && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowReceiptPanel(null)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-xl z-50 animate-slide-in-right overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-dark-900">录入回执</h3>
                <button
                  onClick={() => setShowReceiptPanel(null)}
                  className="p-1 hover:bg-dark-100 rounded transition-colors"
                >
                  <svg className="w-5 h-5 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-dark-50 rounded-lg">
                  <p className="font-medium text-dark-900">
                    {splits.find((s) => s.id === showReceiptPanel)?.splitNo}
                  </p>
                  <p className="text-sm text-dark-500 mt-1">
                    物流单号：{splits.find((s) => s.id === showReceiptPanel)?.trackingNo}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">签收状态</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="receiptStatus"
                        value="signed"
                        checked={receiptStatus === 'signed'}
                        onChange={() => setReceiptStatus('signed')}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-dark-700">正常签收</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="receiptStatus"
                        value="exception"
                        checked={receiptStatus === 'exception'}
                        onChange={() => setReceiptStatus('exception')}
                        className="w-4 h-4 text-danger"
                      />
                      <span className="text-dark-700">异常</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">签收人</label>
                  <input
                    type="text"
                    value={signedBy}
                    onChange={(e) => setSignedBy(e.target.value)}
                    className="input-field"
                    placeholder="请输入签收人姓名"
                  />
                </div>

                {receiptStatus === 'exception' && (
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">异常说明 *</label>
                    <textarea
                      value={exceptionNote}
                      onChange={(e) => setExceptionNote(e.target.value)}
                      rows={4}
                      className="input-field"
                      placeholder="请详细描述异常情况..."
                    />
                  </div>
                )}
              </div>

              <div className="mt-8 flex space-x-3">
                <button
                  onClick={() => setShowReceiptPanel(null)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitReceipt}
                  disabled={receiptStatus === 'exception' && !exceptionNote.trim()}
                  className="btn-primary flex-1"
                >
                  确认提交
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
