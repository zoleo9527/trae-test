import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { StatusBadge } from '../components/common/StatusBadge'
import { EmptyState } from '../components/common/EmptyState'
import { useRefundStore } from '../store/refundStore'
import { useOrderStore } from '../store/orderStore'
import { useSplitStore } from '../store/splitStore'
import { useRoleStore } from '../store/roleStore'
import { getRolePermissions } from '../data/mockData'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ResponsibilityTypeLabels, ResponsibilityType } from '../types'
import type { RefundStatus } from '../types'
import { nanoid } from 'nanoid'

export const Refunds: React.FC = () => {
  const { refunds, createRefund, createResponsibilityChain, approveRefund, rejectRefund, getResponsibilityChainById } = useRefundStore()
  const { orders } = useOrderStore()
  const { splits } = useSplitStore()
  const { currentRole } = useRoleStore()
  const permissions = getRolePermissions(currentRole)

  const [statusFilter, setStatusFilter] = useState<RefundStatus | 'all'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState<{ id: string; level: 'finance' | 'manager' } | null>(null)
  const [opinion, setOpinion] = useState('')

  const [newRefund, setNewRefund] = useState({
    orderId: '',
    splitId: '',
    amount: '',
    reason: '',
    responsibilityType: '' as ResponsibilityType | '',
    responsibilityDesc: '',
    responsiblePerson: '',
  })

  const filteredRefunds = useMemo(() => {
    return refunds.filter((r) => {
      if (statusFilter === 'all') return true
      return r.status === statusFilter
    })
  }, [refunds, statusFilter])

  const handleCreateRefund = () => {
    if (!permissions.canCreateRefund) return
    if (!newRefund.orderId || !newRefund.amount || !newRefund.reason || !newRefund.responsibilityType || !newRefund.responsibilityDesc || !newRefund.responsiblePerson) {
      return
    }

    const responsibility = createResponsibilityChain({
      type: newRefund.responsibilityType,
      description: newRefund.responsibilityDesc,
      responsiblePerson: newRefund.responsiblePerson,
      relatedRecordId: newRefund.splitId || newRefund.orderId,
      relatedRecordType: newRefund.splitId ? 'split' : 'order',
    })

    createRefund({
      orderId: newRefund.orderId,
      splitId: newRefund.splitId || undefined,
      amount: parseFloat(newRefund.amount),
      reason: newRefund.reason,
      responsibilityChainId: responsibility.id,
      createdBy: currentRole === 'merchandiser' ? '当前跟单员' : '管理员',
    })

    setShowCreateModal(false)
    setNewRefund({
      orderId: '',
      splitId: '',
      amount: '',
      reason: '',
      responsibilityType: '',
      responsibilityDesc: '',
      responsiblePerson: '',
    })
  }

  const handleApprove = () => {
    if (!showApproveModal) return

    const approver = showApproveModal.level === 'finance'
      ? (currentRole === 'finance' ? '当前财务' : '管理员')
      : (currentRole === 'manager' ? '管理层' : '管理员')

    approveRefund(showApproveModal.id, showApproveModal.level, opinion, approver)
    setShowApproveModal(null)
    setOpinion('')
  }

  const handleReject = () => {
    if (!showApproveModal) return

    const approver = showApproveModal.level === 'finance'
      ? (currentRole === 'finance' ? '当前财务' : '管理员')
      : (currentRole === 'manager' ? '管理层' : '管理员')

    rejectRefund(showApproveModal.id, showApproveModal.level, opinion, approver)
    setShowApproveModal(null)
    setOpinion('')
  }

  const orderOptions = orders.filter((o) => o.status === 'shipped' || o.status === 'split' || o.status === 'completed')
  const splitOptions = splits.filter((s) => s.orderId === newRefund.orderId && (s.status === 'shipped' || s.status === 'completed'))

  const statusOptions: Array<{ value: RefundStatus | 'all'; label: string }> = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待财务审核' },
    { value: 'finance_approved', label: '待管理层确认' },
    { value: 'completed', label: '退款完成' },
    { value: 'rejected', label: '已驳回' },
  ]

  const getApprovalLevel = (refund: typeof refunds[0]) => {
    if (refund.status === 'pending') return 'finance' as const
    if (refund.status === 'finance_approved') return 'manager' as const
    return null
  }

  return (
    <Layout
      title="退款处理"
      subtitle="退款申请、责任链绑定与审批流程"
      action={permissions.canCreateRefund && (
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>新建退款</span>
        </button>
      )}
    >
      <div className="space-y-6">
        <div className="card p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-dark-600">审批状态：</span>
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
          {filteredRefunds.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-200">
                    <th className="table-header">退款金额</th>
                    <th className="table-header">关联订单</th>
                    <th className="table-header">责任类型</th>
                    <th className="table-header">责任人</th>
                    <th className="table-header">状态</th>
                    <th className="table-header">申请时间</th>
                    <th className="table-header text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-100">
                  {filteredRefunds.map((refund) => {
                    const order = orders.find((o) => o.id === refund.orderId)
                    const responsibility = getResponsibilityChainById(refund.responsibilityChainId)
                    const approvalLevel = getApprovalLevel(refund)
                    const canApprove = approvalLevel === 'finance' && permissions.canApproveRefundFinance
                      || approvalLevel === 'manager' && permissions.canApproveRefundManager

                    return (
                      <tr key={refund.id} className="hover:bg-dark-50 transition-colors">
                        <td className="table-cell">
                          <span className="text-xl font-bold font-mono text-danger">
                            ¥{refund.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="table-cell">
                          <Link to={`/orders/${order?.id}`} className="text-primary-600 hover:text-primary-700 font-medium">
                            {order?.orderNo}
                          </Link>
                          <div className="text-xs text-dark-500">{order?.customerName}</div>
                        </td>
                        <td className="table-cell">
                          {responsibility && (
                            <div>
                              <div className="font-medium text-dark-900">
                                {ResponsibilityTypeLabels[responsibility.type]}
                              </div>
                              <div className="text-xs text-dark-500">{responsibility.description}</div>
                            </div>
                          )}
                        </td>
                        <td className="table-cell text-dark-600">
                          {responsibility?.responsiblePerson}
                        </td>
                        <td className="table-cell">
                          <StatusBadge status={refund.status} />
                        </td>
                        <td className="table-cell text-dark-500">
                          {format(new Date(refund.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                        </td>
                        <td className="table-cell text-right">
                          {canApprove && (
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setShowApproveModal({ id: refund.id, level: approvalLevel! })
                                  setOpinion('同意退款')
                                }}
                                className="text-success hover:text-green-700 text-sm font-medium"
                              >
                                通过
                              </button>
                              <button
                                onClick={() => {
                                  setShowApproveModal({ id: refund.id, level: approvalLevel! })
                                  setOpinion('')
                                }}
                                className="text-danger hover:text-red-700 text-sm font-medium"
                              >
                                驳回
                              </button>
                            </div>
                          )}
                          {!canApprove && refund.status !== 'completed' && refund.status !== 'rejected' && (
                            <span className="text-xs text-dark-400">
                              {approvalLevel === 'finance' ? '待财务审核' : '待管理层确认'}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="暂无退款记录"
              description={statusFilter !== 'all' ? '没有找到符合条件的退款申请' : '还没有任何退款申请'}
              action={permissions.canCreateRefund && (
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                  创建第一笔退款
                </button>
              )}
            />
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-dark-900 mb-4">新建退款申请</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">关联订单 *</label>
                <select
                  value={newRefund.orderId}
                  onChange={(e) => setNewRefund({ ...newRefund, orderId: e.target.value, splitId: '' })}
                  className="input-field"
                >
                  <option value="">请选择订单</option>
                  {orderOptions.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.orderNo} - {order.customerName}
                    </option>
                  ))}
                </select>
              </div>

              {newRefund.orderId && splitOptions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">关联子单（可选）</label>
                  <select
                    value={newRefund.splitId}
                    onChange={(e) => setNewRefund({ ...newRefund, splitId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">不指定具体子单</option>
                    {splitOptions.map((split) => (
                      <option key={split.id} value={split.id}>
                        {split.splitNo} - {split.items.map((i) => i.name).join('，')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">退款金额 *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500">¥</span>
                  <input
                    type="number"
                    value={newRefund.amount}
                    onChange={(e) => setNewRefund({ ...newRefund, amount: e.target.value })}
                    className="input-field pl-8"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">退款原因 *</label>
                <textarea
                  value={newRefund.reason}
                  onChange={(e) => setNewRefund({ ...newRefund, reason: e.target.value })}
                  rows={3}
                  className="input-field"
                  placeholder="请详细说明退款原因..."
                />
              </div>

              <div className="pt-2 border-t border-dark-200">
                <h4 className="text-sm font-semibold text-dark-900 mb-3">责任链绑定 *</h4>
                <div className="space-y-3 p-3 bg-dark-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">责任类型 *</label>
                    <select
                      value={newRefund.responsibilityType}
                      onChange={(e) => setNewRefund({ ...newRefund, responsibilityType: e.target.value as ResponsibilityType })}
                      className="input-field"
                    >
                      <option value="">请选择责任类型</option>
                      {Object.entries(ResponsibilityTypeLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">责任描述 *</label>
                    <input
                      type="text"
                      value={newRefund.responsibilityDesc}
                      onChange={(e) => setNewRefund({ ...newRefund, responsibilityDesc: e.target.value })}
                      className="input-field"
                      placeholder="请描述具体责任情况"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">责任人/方 *</label>
                    <input
                      type="text"
                      value={newRefund.responsiblePerson}
                      onChange={(e) => setNewRefund({ ...newRefund, responsiblePerson: e.target.value })}
                      className="input-field"
                      placeholder="请输入责任人或责任方名称"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleCreateRefund}
                disabled={!newRefund.orderId || !newRefund.amount || !newRefund.reason || !newRefund.responsibilityType || !newRefund.responsibilityDesc || !newRefund.responsiblePerson}
                className="btn-primary"
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}

      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-dark-900 mb-4">
              {showApproveModal.level === 'finance' ? '财务审核' : '管理层确认'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">审批意见</label>
                <textarea
                  value={opinion}
                  onChange={(e) => setOpinion(e.target.value)}
                  rows={3}
                  className="input-field"
                  placeholder="请输入审批意见..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowApproveModal(null)
                  setOpinion('')
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={!opinion.trim()}
                className="btn-danger"
              >
                驳回
              </button>
              <button
                onClick={handleApprove}
                disabled={!opinion.trim()}
                className="btn-primary"
              >
                通过
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
