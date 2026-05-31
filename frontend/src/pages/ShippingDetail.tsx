import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Clock,
  Truck,
  FileText,
  Check,
  X,
  Send,
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useRole } from '@/hooks/useRole';
import { useWorkflow } from '@/hooks/useWorkflow';
import { mockUsers } from '@/data/mock';
import { Modal, ModalFooter } from '@/components/shared/Modal';

export function ShippingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useApp();
  const { canApproveShipping, canShip, canCreateShipping } = useRole();
  const {
    submitShippingForApproval,
    approveShipping,
    rejectShipping,
    markAsShipped,
  } = useWorkflow();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNo, setTrackingNo] = useState('');

  const order = state.shippingOrders.find((o) => o.id === id);
  const receipt = state.receipts.find((r) => r.shippingId === id);
  const project = state.projects.find((p) => p.id === order?.projectId);

  if (!order) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">发货单不存在</p>
        </div>
      </div>
    );
  }

  const getUserName = (userId: string) => {
    const user = mockUsers.find((u) => u.id === userId);
    return user?.name || userId;
  };

  const handleApprove = () => {
    approveShipping(order);
  };

  const handleReject = () => {
    if (rejectReason.trim()) {
      rejectShipping(order, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

  const handleSubmit = () => {
    submitShippingForApproval(order);
  };

  const handleShip = () => {
    if (carrier.trim() && trackingNo.trim()) {
      markAsShipped(order, carrier, trackingNo);
      setShowShipModal(false);
      setCarrier('');
      setTrackingNo('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">{order.code}</h1>
            <p className="text-sm text-gray-500">{order.title}</p>
          </div>
        </div>
        <StatusBadge status={order.status} type="shipping" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <span className="font-medium text-gray-800">基本信息</span>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">所属项目</label>
                  <p className="text-sm text-gray-800 mt-1">{project?.name || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">创建时间</label>
                  <p className="text-sm text-gray-800 mt-1">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">创建人</label>
                  <p className="text-sm text-gray-800 mt-1">{getUserName(order.createdBy)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">总金额</label>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    ¥{order.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
              {order.remark && (
                <div>
                  <label className="text-xs text-gray-500">备注</label>
                  <p className="text-sm text-gray-700 mt-1">{order.remark}</p>
                </div>
              )}
              {order.rejectReason && (
                <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                  <label className="text-xs text-danger-600 font-medium">驳回原因</label>
                  <p className="text-sm text-danger-800 mt-1">{order.rejectReason}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="font-medium text-gray-800">材料明细</span>
            </div>
            <div className="card-body">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-xs font-medium text-gray-500">
                      材料名称
                    </th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500">
                      规格
                    </th>
                    <th className="text-right py-3 text-xs font-medium text-gray-500">
                      发货数量
                    </th>
                    <th className="text-right py-3 text-xs font-medium text-gray-500">
                      实收数量
                    </th>
                    <th className="text-right py-3 text-xs font-medium text-gray-500">
                      单价
                    </th>
                    <th className="text-right py-3 text-xs font-medium text-gray-500">
                      金额
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.materialItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 text-sm text-gray-800">{item.name}</td>
                      <td className="py-3 text-sm text-gray-600">{item.spec}</td>
                      <td className="py-3 text-sm text-right text-gray-800">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-3 text-sm text-right">
                        {item.receivedQuantity !== undefined ? (
                          <span
                            className={
                              item.receivedQuantity < item.quantity
                                ? 'text-danger-600'
                                : 'text-success-600'
                            }
                          >
                            {item.receivedQuantity} {item.unit}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 text-sm text-right text-gray-800">
                        ¥{item.unitPrice}
                      </td>
                      <td className="py-3 text-sm text-right font-medium text-gray-800">
                        ¥{(item.quantity * item.unitPrice).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="font-medium text-gray-800">流程时间线</span>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-success-500"></div>
                    <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">创建发货单</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {getUserName(order.createdBy)} ·{' '}
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {order.submittedAt && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-warning-500"></div>
                      <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">提交审核</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {order.approvedAt && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-success-500"></div>
                      <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">审核通过</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {getUserName(order.approvedBy!)} ·{' '}
                        {new Date(order.approvedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {order.shippedAt && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                      <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">已发货</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {order.carrier} · {order.trackingNo}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(order.shippedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {receipt?.signedAt && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-success-500"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">已签收</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {getUserName(receipt.signedBy!)} ·{' '}
                        {new Date(receipt.signedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <span className="font-medium text-gray-800">操作</span>
            </div>
            <div className="card-body space-y-3">
              {order.status === 'draft' && canCreateShipping && (
                <button
                  onClick={handleSubmit}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  提交审核
                </button>
              )}
              {order.status === 'pending_approval' && canApproveShipping && (
                <>
                  <button
                    onClick={handleApprove}
                    className="w-full btn-success flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    审核通过
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="w-full btn-danger flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    驳回
                  </button>
                </>
              )}
              {order.status === 'approved' && canShip && (
                <button
                  onClick={() => setShowShipModal(true)}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  确认发货
                </button>
              )}
              {receipt && (
                <button
                  className="w-full btn-secondary"
                  onClick={() => navigate(`/receipt/${receipt.id}`)}
                >
                  查看回单
                </button>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="font-medium text-gray-800">物流信息</span>
            </div>
            <div className="card-body space-y-3">
              {order.shippedAt ? (
                <>
                  <div className="flex items-start gap-3">
                    <Truck className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-700">{order.carrier}</p>
                      <p className="text-xs text-gray-500">{order.trackingNo}</p>
                    </div>
                  </div>
                  {order.estimatedArrival && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-700">预计到达</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.estimatedArrival).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">尚未发货</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="font-medium text-gray-800">相关单据</span>
            </div>
            <div className="card-body space-y-2">
              {receipt && (
                <button
                  className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded transition-colors text-left"
                  onClick={() => navigate(`/receipt/${receipt.id}`)}
                >
                  <FileText className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-700">对应回单</p>
                    <p className="text-xs text-gray-500">点击查看详情</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="驳回发货单"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">请填写驳回原因，这将退回给创建人修改</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="请详细说明驳回原因..."
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-danger-500 focus:border-danger-500 outline-none transition-all resize-none"
          />
        </div>
        <ModalFooter>
          <button
            onClick={() => setShowRejectModal(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleReject}
            disabled={!rejectReason.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-danger-600 rounded-lg hover:bg-danger-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认驳回
          </button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={showShipModal}
        onClose={() => setShowShipModal(false)}
        title="确认发货"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              承运商
            </label>
            <input
              type="text"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="请输入承运商名称"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              运单号
            </label>
            <input
              type="text"
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value)}
              placeholder="请输入运单号"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>
          <p className="text-xs text-gray-500">
            确认发货后，将通知现场班组准备签收
          </p>
        </div>
        <ModalFooter>
          <button
            onClick={() => setShowShipModal(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleShip}
            disabled={!carrier.trim() || !trackingNo.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认发货
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
