import React, { useState } from 'react';
import {
  X, MessageSquare, Send, Edit3, DollarSign, Clock, User, Calendar,
  History, ChevronRight,
} from 'lucide-react';
import { useOrderStore } from '../../store/useOrderStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useCommunicationStore } from '../../store/useCommunicationStore';
import { StatusBadge } from '../common/StatusBadge';
import { Avatar } from '../common/Avatar';
import { formatDateTime } from '../../utils/dateUtils';
import { cn } from '../../lib/utils';
import type { OrderStatus } from '../../types';
import { ChangeOrderForm } from '../order/ChangeOrderForm';
import { RefundForm } from '../order/RefundForm';
import { OrderTimeline } from '../order/OrderTimeline';

interface ProcessingPanelProps {
  onClose: () => void;
}

export const ProcessingPanel: React.FC<ProcessingPanelProps> = ({ onClose }) => {
  const { selectedOrder, updateOrderStatus, approveChange, rejectChange, approveRefund, rejectRefund } = useOrderStore();
  const { user } = useAuthStore();
  const { getCommunicationsByOrder, addCommunication } = useCommunicationStore();
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'actions' | 'communication' | 'history'>('actions');
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);

  if (!selectedOrder) return null;

  const communications = getCommunicationsByOrder(selectedOrder.id);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;
    addCommunication({
      orderId: selectedOrder.id,
      sender: user.name,
      senderRole: user.role,
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'internal',
    });
    setNewMessage('');
  };

  const handleStatusUpdate = (newStatus: OrderStatus, remarks: string) => {
    if (!user) return;
    updateOrderStatus(selectedOrder.id, newStatus, remarks, user.name, user.role);
  };

  const canEdit = user?.role === 'manager' || user?.role === 'chef';
  const canRefund = user?.role === 'manager' || user?.role === 'customer_service';
  const canApprove = user?.role === 'manager';

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full animate-slide-in">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-800">订单处理</h3>
          <StatusBadge status={selectedOrder.status} />
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('actions')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'actions'
              ? 'text-bakery-brown-600 border-b-2 border-bakery-brown-500'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          快速操作
        </button>
        <button
          onClick={() => setActiveTab('communication')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'communication'
              ? 'text-bakery-brown-600 border-b-2 border-bakery-brown-500'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          沟通记录
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'history'
              ? 'text-bakery-brown-600 border-b-2 border-bakery-brown-500'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          操作历史
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'actions' ? (
          <div className="p-4 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 w-16">订单号</span>
                <span className="font-medium text-gray-800">
                  {selectedOrder.orderNo}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 w-12">客户</span>
                <span className="font-medium text-gray-800">
                  {selectedOrder.customerName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 w-12">取货</span>
                <span className="font-medium text-gray-800">
                  {selectedOrder.pickupTime}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 w-12">金额</span>
                <span className="font-medium text-gray-800">
                  ¥{selectedOrder.totalAmount}
                </span>
              </div>
            </div>

            {selectedOrder.isOverdue && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-medium">
                  ⚠️ 此订单已逾期，请尽快处理！
                </p>
              </div>
            )}

            {selectedOrder.changeRequest?.status === 'pending' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm font-medium text-orange-800 mb-2">
                  改单申请待处理
                </p>
                <p className="text-xs text-orange-600 mb-3">
                  {selectedOrder.changeRequest.reason}
                </p>
                {selectedOrder.changeRequest.changes.map((change, i) => (
                  <div key={i} className="text-xs text-orange-700 mb-1">
                    <span className="line-through">{change.oldValue}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{change.newValue}</span>
                  </div>
                ))}
                {canApprove && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => approveChange(selectedOrder.id, '同意改单', user!.name)}
                      className="flex-1 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                    >
                      同意
                    </button>
                    <button
                      onClick={() => rejectChange(selectedOrder.id, '改单申请被拒绝', user!.name)}
                      className="flex-1 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      拒绝
                    </button>
                  </div>
                )}
              </div>
            )}

            {selectedOrder.refundRequest?.status === 'pending' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-medium text-red-800 mb-2">
                  退款申请待处理
                </p>
                <p className="text-xs text-red-600 mb-2">
                  {selectedOrder.refundRequest.reason}
                </p>
                <p className="text-xs text-red-700 font-medium">
                  退款金额：¥{selectedOrder.refundRequest.refundAmount}
                </p>
                {canApprove && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => approveRefund(selectedOrder.id, '同意退款', user!.name)}
                      className="flex-1 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                    >
                      同意退款
                    </button>
                    <button
                      onClick={() => rejectRefund(selectedOrder.id, '退款申请被拒绝', user!.name)}
                      className="flex-1 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      拒绝
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">状态操作</p>
              <div className="grid grid-cols-2 gap-2">
                {selectedOrder.status === 'pending_review' && canApprove && (
                  <button
                    onClick={() => handleStatusUpdate('reviewed', '订单审核通过')}
                    className="py-2 bg-bakery-brown-500 text-white text-sm rounded-lg hover:bg-bakery-brown-600 transition-colors"
                  >
                    审核通过
                  </button>
                )}
                {selectedOrder.status === 'reviewed' && canEdit && (
                  <button
                    onClick={() => handleStatusUpdate('scheduled', '已安排生产排期')}
                    className="py-2 bg-bakery-brown-500 text-white text-sm rounded-lg hover:bg-bakery-brown-600 transition-colors"
                  >
                    安排排期
                  </button>
                )}
                {selectedOrder.status === 'scheduled' && canEdit && (
                  <button
                    onClick={() => handleStatusUpdate('in_production', '开始生产')}
                    className="py-2 bg-bakery-matcha text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
                  >
                    开始生产
                  </button>
                )}
                {selectedOrder.status === 'in_production' && canEdit && (
                  <button
                    onClick={() => handleStatusUpdate('completed', '生产完成')}
                    className="py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                  >
                    生产完成
                  </button>
                )}
              </div>
            </div>

            {!['refunded', 'completed', 'cancelled'].includes(selectedOrder.status) && (
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700">异常处理</p>
                <div className="space-y-2">
                  {canRefund && (
                    <button
                      onClick={() => setShowChangeForm(true)}
                      className="w-full flex items-center justify-between p-3 border border-orange-200 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4" />
                        <span className="text-sm">申请改单</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  {canRefund && (
                    <button
                      onClick={() => setShowRefundForm(true)}
                      className="w-full flex items-center justify-between p-3 border border-red-200 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">申请退款</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">商品明细</p>
              <div className="space-y-2">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.specifications}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-800">
                        x{item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'communication' ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {communications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无沟通记录</p>
                </div>
              ) : (
                communications.map((comm) => (
                  <div
                    key={comm.id}
                    className="flex gap-3"
                  >
                    <Avatar
                      name={comm.sender}
                      role={comm.senderRole}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-800">
                          {comm.sender}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDateTime(comm.timestamp)}
                        </span>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{comm.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="输入消息..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bakery-brown-500/20 focus:border-bakery-brown-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="p-2 bg-bakery-brown-500 text-white rounded-lg hover:bg-bakery-brown-600 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <OrderTimeline history={selectedOrder.history} />
          </div>
        )}
      </div>

      {showChangeForm && (
        <ChangeOrderForm
          isOpen={showChangeForm}
          onClose={() => setShowChangeForm(false)}
          order={selectedOrder}
        />
      )}
      {showRefundForm && (
        <RefundForm
          isOpen={showRefundForm}
          onClose={() => setShowRefundForm(false)}
          order={selectedOrder}
        />
      )}
    </div>
  );
};
