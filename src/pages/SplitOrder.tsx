import React, { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { StatusBadge } from '../components/common/StatusBadge'
import { EmptyState } from '../components/common/EmptyState'
import { ErrorBanner } from '../components/common/ErrorState'
import { useOrderStore } from '../store/orderStore'
import { useSplitStore } from '../store/splitStore'
import { useRoleStore } from '../store/roleStore'
import { getRolePermissions } from '../data/mockData'
import type { SplitItem, OrderItem } from '../types'
import { nanoid } from 'nanoid'

export const SplitOrder: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { getOrderById } = useOrderStore()
  const { createSplit, getSplitsByOrderId, confirmShip, detectMissingItems } = useSplitStore()
  const { currentRole } = useRoleStore()
  const permissions = getRolePermissions(currentRole)

  const order = orderId ? getOrderById(orderId) : undefined
  const existingSplits = orderId ? getSplitsByOrderId(orderId) : []
  const { missing, splitItems: existingSplitItems } = orderId ? detectMissingItems(orderId) : { missing: [] as OrderItem[], splitItems: [] as SplitItem[] }

  const [selectedItems, setSelectedItems] = useState<Array<{ orderItemId: string; quantity: number }>>([])
  const [trackingNo, setTrackingNo] = useState('')
  const [showShipModal, setShowShipModal] = useState<string | null>(null)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const remainingItems = useMemo(() => {
    if (!order) return []

    const orderItemTotals = order.items.reduce((acc, item) => {
      acc[item.id] = (acc[item.id] || 0) + item.quantity
      return acc
    }, {} as Record<string, number>)

    const splitItemTotals = existingSplitItems.reduce((acc, item) => {
      acc[item.orderItemId] = (acc[item.orderItemId] || 0) + item.quantity
      return acc
    }, {} as Record<string, number>)

    return order.items.map((item) => ({
      ...item,
      remaining: (orderItemTotals[item.id] || 0) - (splitItemTotals[item.id] || 0),
    })).filter((item) => item.remaining > 0)
  }, [order, existingSplitItems])

  const handleQuantityChange = (orderItemId: string, quantity: number) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.orderItemId === orderItemId)
      if (existing) {
        if (quantity <= 0) {
          return prev.filter((i) => i.orderItemId !== orderItemId)
        }
        return prev.map((i) =>
          i.orderItemId === orderItemId ? { ...i, quantity } : i
        )
      }
      if (quantity > 0) {
        return [...prev, { orderItemId, quantity }]
      }
      return prev
    })
  }

  const handleCreateSplit = () => {
    if (!order || selectedItems.length === 0 || !permissions.canSplitOrder) return

    const splitItems: SplitItem[] = selectedItems.map((si) => {
      const orderItem = order.items.find((i) => i.id === si.orderItemId)!
      return {
        id: nanoid(),
        orderItemId: si.orderItemId,
        name: orderItem.name,
        spec: orderItem.spec,
        quantity: si.quantity,
        category: orderItem.category,
      }
    })

    const hasMissing = remainingItems.some((item) => {
      const selected = selectedItems.find((si) => si.orderItemId === item.id)
      return (selected?.quantity || 0) < item.remaining
    })

    if (hasMissing) {
      setErrorMessage('拆单后仍有未分配的商品，系统将标记为「需回查」')
      setShowError(true)
    }

    createSplit(order.id, splitItems, currentRole === 'warehouse' ? '当前仓管员' : '管理员')
    setSelectedItems([])
  }

  const handleConfirmShip = (splitId: string) => {
    if (!trackingNo.trim() || !permissions.canConfirmShip) return
    confirmShip(splitId, trackingNo.trim(), currentRole === 'warehouse' ? '当前仓管员' : '管理员')
    setShowShipModal(null)
    setTrackingNo('')
  }

  const handleSelectAll = () => {
    setSelectedItems(remainingItems.map((item) => ({
      orderItemId: item.id,
      quantity: item.remaining,
    })))
  }

  const handleClearAll = () => {
    setSelectedItems([])
  }

  if (!order) {
    return (
      <Layout title="拆单发货" subtitle="订单不存在">
        <EmptyState
          title="订单不存在"
          action={<Link to="/orders" className="btn-primary">返回订单列表</Link>}
        />
      </Layout>
    )
  }

  if (!permissions.canSplitOrder) {
    return (
      <Layout title="拆单发货" subtitle="无权限">
        <EmptyState
          title="无操作权限"
          description="当前角色没有拆单发货权限，请切换到仓管员或管理层角色"
        />
      </Layout>
    )
  }

  return (
    <Layout
      title={`拆单发货 - ${order.orderNo}`}
      subtitle={order.customerName}
      action={
        <Link to={`/orders/${order.id}`} className="btn-secondary">
          返回订单详情
        </Link>
      }
    >
      <div className="space-y-6">
        {showError && (
          <ErrorBanner message={errorMessage} onClose={() => setShowError(false)} />
        )}

        {existingSplits.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark-900 mb-4">已创建的子单</h3>
            <div className="space-y-3">
              {existingSplits.map((split) => (
                <div key={split.id} className="border border-dark-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-semibold">{split.splitNo}</span>
                      <StatusBadge status={split.status} />
                      {split.missingWarning && (
                        <span className="status-badge bg-yellow-100 text-yellow-700">有漏件</span>
                      )}
                    </div>
                    {split.status === 'pending' && permissions.canConfirmShip && (
                      <button
                        onClick={() => setShowShipModal(split.id)}
                        className="btn-primary text-sm py-1.5"
                      >
                        确认发货
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-dark-600">
                    {split.items.map((i) => `${i.name} x${i.quantity}`).join('，')}
                  </div>
                  {split.trackingNo && (
                    <div className="mt-2 text-sm text-dark-500">
                      物流单号：<span className="font-mono">{split.trackingNo}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {missing.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">漏件检测警告</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>当前拆单存在以下漏件：</p>
                  <ul className="list-disc list-inside mt-1">
                    {missing.map((item) => (
                      <li key={item.id}>{item.name} ({item.spec}) - 还差 {item.quantity} 件</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-900">原订单商品</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  全选剩余
                </button>
                <span className="text-dark-300">|</span>
                <button
                  onClick={handleClearAll}
                  className="text-sm text-dark-500 hover:text-dark-700"
                >
                  清空
                </button>
              </div>
            </div>
            {remainingItems.length > 0 ? (
              <div className="space-y-3">
                {remainingItems.map((item) => {
                  const selected = selectedItems.find((si) => si.orderItemId === item.id)
                  return (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        selected ? 'border-primary-300 bg-primary-50' : 'border-dark-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-dark-900">{item.name}</p>
                          <p className="text-sm text-dark-500">{item.spec}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-dark-600">剩余</p>
                          <p className="font-mono font-bold text-dark-900">{item.remaining}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-dark-600">分配数量：</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, (selected?.quantity || 0) - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded border border-dark-300 hover:bg-dark-100 transition-colors"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={selected?.quantity || 0}
                          onChange={(e) => handleQuantityChange(item.id, Math.min(Math.max(0, parseInt(e.target.value) || 0), item.remaining))}
                          className="w-20 h-8 text-center border border-dark-300 rounded font-mono"
                          min="0"
                          max={item.remaining}
                        />
                        <button
                          onClick={() => handleQuantityChange(item.id, (selected?.quantity || 0) + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded border border-dark-300 hover:bg-dark-100 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                title="所有商品已拆单"
                description="该订单的所有商品都已分配到子单中"
              />
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark-900 mb-4">本次拆单预览</h3>
            {selectedItems.length > 0 ? (
              <>
                <div className="space-y-3 mb-6">
                  {selectedItems.map((si) => {
                    const orderItem = order.items.find((i) => i.id === si.orderItemId)!
                    return (
                      <div key={si.orderItemId} className="flex items-center justify-between py-2 border-b border-dark-100">
                        <div>
                          <p className="font-medium text-dark-900">{orderItem.name}</p>
                          <p className="text-sm text-dark-500">{orderItem.spec}</p>
                        </div>
                        <span className="font-mono font-bold text-dark-900">x{si.quantity}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between py-3 border-t border-dark-200">
                  <span className="text-dark-600">共 {selectedItems.length} 类商品</span>
                  <span className="font-mono font-bold text-lg text-dark-900">
                    {selectedItems.reduce((sum, si) => sum + si.quantity, 0)} 件
                  </span>
                </div>
                <button
                  onClick={handleCreateSplit}
                  className="btn-primary w-full mt-4"
                >
                  创建子单
                </button>
              </>
            ) : (
              <EmptyState
                title="请选择要拆分的商品"
                description="从左侧选择需要拆分发货的商品和数量"
              />
            )}
          </div>
        </div>
      </div>

      {showShipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-dark-900 mb-4">确认发货</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">物流单号 *</label>
                <input
                  type="text"
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value)}
                  className="input-field"
                  placeholder="请输入物流单号"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowShipModal(null)
                  setTrackingNo('')
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={() => handleConfirmShip(showShipModal)}
                disabled={!trackingNo.trim()}
                className="btn-primary"
              >
                确认发货
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
