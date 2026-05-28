import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { StatusBadge } from '../components/common/StatusBadge'
import { EmptyState } from '../components/common/EmptyState'
import { Timeline } from '../components/common/Timeline'
import { ErrorBanner } from '../components/common/ErrorState'
import { useOrderStore } from '../store/orderStore'
import { useSplitStore } from '../store/splitStore'
import { useReceiptStore } from '../store/receiptStore'
import { useRefundStore } from '../store/refundStore'
import { useRoleStore } from '../store/roleStore'
import { getRolePermissions } from '../data/mockData'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { nanoid } from 'nanoid'
import type { OrderItem } from '../types'

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { getOrderById, addVersion, updateOrderStatus, timeline, markAsReviewed } = useOrderStore()
  const { getSplitsByOrderId, detectMissingItems } = useSplitStore()
  const { getReceiptsByOrderId } = useReceiptStore()
  const { getResponsibilityChainById, getRefundsByOrderId } = useRefundStore()
  const { currentRole } = useRoleStore()
  const permissions = getRolePermissions(currentRole)

  const [showVersionModal, setShowVersionModal] = useState(false)
  const [versionContent, setVersionContent] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [showMissingAlert, setShowMissingAlert] = useState(true)

  const order = id ? getOrderById(id) : undefined
  const splits = id ? getSplitsByOrderId(id) : []
  const receipts = id ? getReceiptsByOrderId(id) : []
  const refunds = id ? getRefundsByOrderId(id) : []
  const orderTimeline = timeline.filter((e) => e.orderId === id)
  const { missing } = id ? detectMissingItems(id) : { missing: [] as OrderItem[] }

  if (!order) {
    return (
      <Layout title="订单详情" subtitle="订单不存在或已被删除">
        <EmptyState
          title="订单不存在"
          description="请检查订单ID是否正确"
          action={<Link to="/orders" className="btn-primary">返回订单列表</Link>}
        />
      </Layout>
    )
  }

  const getTotalAmount = () => {
    return order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }

  const handleAddVersion = () => {
    if (!permissions.canEditOrder) return

    const currentVersion = order.versions.find((v) => v.isCurrent)
    const newVersionNo = currentVersion ? currentVersion.versionNo + 1 : 1

    addVersion(
      order.id,
      {
        orderId: order.id,
        versionNo: newVersionNo,
        content: versionContent,
        confirmedBy: currentRole === 'merchandiser' ? '当前跟单员' : '管理员',
        isCurrent: true,
        needsReview: false,
        items: order.items,
      },
      overrideReason
    )

    if (order.status === 'sampling' || order.status === 'draft') {
      updateOrderStatus(order.id, 'confirmed')
    }

    setShowVersionModal(false)
    setVersionContent('')
    setOverrideReason('')
  }

  const currentVersion = order.versions.find((v) => v.isCurrent)

  return (
    <Layout
      title={`订单详情 - ${order.orderNo}`}
      subtitle={order.customerName}
      action={
        <div className="flex items-center space-x-2">
          {order.needsReview && permissions.canViewReview && (
            <button onClick={() => markAsReviewed(order.id)} className="btn-secondary">
              标记已阅
            </button>
          )}
          {permissions.canSplitOrder && order.status === 'confirmed' && (
            <Link to={`/split/${order.id}`} className="btn-primary">
              拆单发货
            </Link>
          )}
          {permissions.canEditOrder && (
            <button onClick={() => setShowVersionModal(true)} className="btn-secondary">
              确认版本
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {order.needsReview && showMissingAlert && (
          <ErrorBanner
            message={order.reviewReason || '该订单需要回查确认'}
            onClose={() => setShowMissingAlert(false)}
          />
        )}

        {missing.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">拆单漏件提醒</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>以下商品尚未完成拆单分配：</p>
                  <ul className="list-disc list-inside mt-1">
                    {missing.map((item) => (
                      <li key={item.id}>{item.name} ({item.spec}) - 还差 {item.quantity} 件</li>
                    ))}
                  </ul>
                </div>
                {permissions.canSplitOrder && (
                  <div className="mt-3">
                    <Link to={`/split/${order.id}`} className="text-yellow-700 font-medium hover:text-yellow-800 text-sm">
                      前往拆单 →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">基本信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-dark-500">订单号</p>
                  <p className="font-mono font-medium text-dark-900">{order.orderNo}</p>
                </div>
                <div>
                  <p className="text-sm text-dark-500">状态</p>
                  <StatusBadge status={order.status} />
                </div>
                <div>
                  <p className="text-sm text-dark-500">客户名称</p>
                  <p className="font-medium text-dark-900">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-dark-500">联系电话</p>
                  <p className="font-medium text-dark-900">{order.contactPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-dark-500">创建人</p>
                  <p className="font-medium text-dark-900">{order.createdBy}</p>
                </div>
                <div>
                  <p className="text-sm text-dark-500">创建时间</p>
                  <p className="font-medium text-dark-900">
                    {format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-dark-500">订单金额</p>
                  <p className="text-2xl font-bold font-mono text-primary-600">
                    ¥{getTotalAmount().toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">商品明细</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-200">
                      <th className="table-header">商品名称</th>
                      <th className="table-header">规格</th>
                      <th className="table-header">类别</th>
                      <th className="table-header text-right">数量</th>
                      <th className="table-header text-right">单价</th>
                      <th className="table-header text-right">小计</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-100">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="table-cell font-medium">{item.name}</td>
                        <td className="table-cell text-dark-600">{item.spec}</td>
                        <td className="table-cell text-dark-500">{item.category}</td>
                        <td className="table-cell text-right font-mono">{item.quantity}</td>
                        <td className="table-cell text-right font-mono">¥{item.unitPrice}</td>
                        <td className="table-cell text-right font-mono font-semibold">
                          ¥{(item.quantity * item.unitPrice).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {splits.length > 0 && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">拆单记录</h3>
                <div className="space-y-4">
                  {splits.map((split) => {
                    const receipt = receipts.find((r) => r.splitId === split.id)
                    return (
                      <div key={split.id} className="border border-dark-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="font-mono font-semibold">{split.splitNo}</span>
                            <StatusBadge status={split.status} />
                            {split.missingWarning && (
                              <span className="status-badge bg-yellow-100 text-yellow-700">有漏件</span>
                            )}
                          </div>
                          <span className="text-sm text-dark-500">
                            {split.shippedAt ? format(new Date(split.shippedAt), 'yyyy-MM-dd', { locale: zhCN }) : '待发货'}
                          </span>
                        </div>
                        <div className="text-sm text-dark-600 mb-2">
                          {split.items.map((i) => `${i.name} x${i.quantity}`).join('，')}
                        </div>
                        {split.trackingNo && (
                          <div className="text-sm text-dark-500">
                            物流单号：<span className="font-mono">{split.trackingNo}</span>
                          </div>
                        )}
                        {receipt && (
                          <div className="mt-3 pt-3 border-t border-dark-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-dark-500">回执状态：</span>
                                <StatusBadge status={receipt.status} />
                              </div>
                              {receipt.signedBy && (
                                <span className="text-sm text-dark-500">签收人：{receipt.signedBy}</span>
                              )}
                            </div>
                            {receipt.exceptionNote && (
                              <p className="mt-2 text-sm text-danger bg-red-50 p-2 rounded">
                                异常说明：{receipt.exceptionNote}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {refunds.length > 0 && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">退款记录</h3>
                <div className="space-y-3">
                  {refunds.map((refund) => {
                    const responsibility = getResponsibilityChainById(refund.responsibilityChainId)
                    return (
                      <div key={refund.id} className="border border-dark-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl font-bold font-mono text-danger">
                              ¥{refund.amount.toFixed(2)}
                            </span>
                            <StatusBadge status={refund.status} />
                          </div>
                          <span className="text-sm text-dark-500">
                            申请时间：{format(new Date(refund.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                          </span>
                        </div>
                        <p className="text-sm text-dark-600 mb-2">{refund.reason}</p>
                        {responsibility && (
                          <div className="text-sm text-dark-500 bg-dark-50 p-2 rounded">
                            责任链：{responsibility.type === 'merchandiser_miss' ? '跟单遗漏' :
                              responsibility.type === 'warehouse_error' ? '仓管错发' :
                              responsibility.type === 'logistics_damage' ? '物流损坏' :
                              responsibility.type === 'customer_reason' ? '客户原因' : '其他原因'}
                            {' - '}{responsibility.description}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {currentVersion && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-dark-900">当前版本</h3>
                  <span className="status-badge bg-green-100 text-green-700">V{currentVersion.versionNo}</span>
                </div>
                <p className="text-sm text-dark-600 mb-3">{currentVersion.content}</p>
                <div className="text-xs text-dark-500 space-y-1">
                  <p>确认人：{currentVersion.confirmedBy}</p>
                  <p>确认时间：{format(new Date(currentVersion.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</p>
                </div>
                {currentVersion.overrideReason && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-700">
                      <span className="font-medium">覆盖原因：</span>{currentVersion.overrideReason}
                    </p>
                  </div>
                )}
              </div>
            )}

            {order.versions.length > 0 && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">版本历史</h3>
                <div className="space-y-3">
                  {[...order.versions].reverse().map((version) => (
                    <div
                      key={version.id}
                      className={`p-3 border rounded-lg ${
                        version.isCurrent
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-dark-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold ${version.isCurrent ? 'text-primary-700' : 'text-dark-700'}`}>
                          V{version.versionNo}
                        </span>
                        {version.isCurrent && (
                          <span className="status-badge bg-primary-100 text-primary-700 text-xs">当前</span>
                        )}
                        {version.needsReview && !version.isCurrent && (
                          <span className="status-badge bg-yellow-100 text-yellow-700 text-xs">已覆盖</span>
                        )}
                      </div>
                      <p className="text-xs text-dark-600">{version.content}</p>
                      <p className="text-xs text-dark-400 mt-1">
                        {version.confirmedBy} · {format(new Date(version.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">操作时间线</h3>
              {orderTimeline.length > 0 ? (
                <div className="max-h-96 overflow-y-auto scrollbar-thin pr-2">
                  <Timeline events={orderTimeline} />
                </div>
              ) : (
                <p className="text-sm text-dark-500">暂无操作记录</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showVersionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-dark-900 mb-4">
              {currentVersion ? '版本覆盖确认' : '确认打样版本'}
            </h3>
            {currentVersion && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                ⚠️ 此操作将覆盖当前 V{currentVersion.versionNo} 版本，并自动标记为「需回查」
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">版本说明</label>
                <textarea
                  value={versionContent}
                  onChange={(e) => setVersionContent(e.target.value)}
                  rows={3}
                  className="input-field"
                  placeholder="请输入该版本的设计说明、客户要求等信息..."
                />
              </div>
              {currentVersion && (
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">覆盖原因 *</label>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="input-field"
                    placeholder="请说明覆盖旧版本的原因"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowVersionModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleAddVersion}
                disabled={!versionContent || (currentVersion && !overrideReason)}
                className="btn-primary"
              >
                {currentVersion ? '确认覆盖' : '确认版本'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
