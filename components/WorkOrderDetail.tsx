"use client";

import { useAppStore } from "@/lib/store";
import { WorkOrder, WorkOrderStatus } from "@/lib/types";
import {
    cn,
    formatDate,
    priorityConfig,
    roleConfig,
    statusConfig,
    typeConfig,
} from "@/lib/utils";
import {
    AlertTriangle,
    ArrowUpRight,
    CheckCircle,
    Clock,
    FileText,
    MapPin,
    MessageSquare,
    Paperclip,
    RotateCcw,
    Send,
    User,
    X
} from "lucide-react";
import { useState } from "react";

interface WorkOrderDetailProps {
  workOrder: WorkOrder;
  onClose: () => void;
}

const statusActions: Record<WorkOrderStatus, { label: string; nextStatus: WorkOrderStatus; className: string }[]> = {
  pending: [
    { label: "派单", nextStatus: "assigned", className: "bg-primary-500 hover:bg-primary-600" },
    { label: "升级", nextStatus: "escalated", className: "bg-rose-500 hover:bg-rose-600" },
  ],
  assigned: [
    { label: "开始处理", nextStatus: "processing", className: "bg-orange-500 hover:bg-orange-600" },
    { label: "转派", nextStatus: "assigned", className: "bg-gray-500 hover:bg-gray-600" },
  ],
  processing: [
    { label: "申请审核", nextStatus: "reviewing", className: "bg-purple-500 hover:bg-purple-600" },
    { label: "升级", nextStatus: "escalated", className: "bg-rose-500 hover:bg-rose-600" },
  ],
  reviewing: [
    { label: "审核通过", nextStatus: "completed", className: "bg-green-500 hover:bg-green-600" },
    { label: "驳回", nextStatus: "rejected", className: "bg-red-500 hover:bg-red-600" },
  ],
  completed: [],
  rejected: [
    { label: "重新处理", nextStatus: "processing", className: "bg-orange-500 hover:bg-orange-600" },
  ],
  escalated: [
    { label: "开始处理", nextStatus: "processing", className: "bg-orange-500 hover:bg-orange-600" },
  ],
};

export function WorkOrderDetail({ workOrder, onClose }: WorkOrderDetailProps) {
  const [remark, setRemark] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSupplement, setRejectSupplement] = useState("");

  const stations = useAppStore((state) => state.stations);
  const users = useAppStore((state) => state.users);
  const currentUser = useAppStore((state) => state.currentUser);
  const historyRemarks = useAppStore((state) => state.historyRemarks);
  const refundRequests = useAppStore((state) => state.refundRequests);
  const updateWorkOrderStatus = useAppStore((state) => state.updateWorkOrderStatus);
  const updateWorkOrder = useAppStore((state) => state.updateWorkOrder);
  const addHistoryRemark = useAppStore((state) => state.addHistoryRemark);

  const station = stations.find((s) => s.id === workOrder.stationId);
  const assignee = users.find((u) => u.id === workOrder.assigneeId);
  const creator = users.find((u) => u.id === workOrder.creatorId);
  const remarks = historyRemarks.filter((r) => r.workOrderId === workOrder.id);
  const refund = refundRequests.find((r) => r.workOrderId === workOrder.id);

  const handleStatusChange = (nextStatus: WorkOrderStatus, actionLabel: string) => {
    if (nextStatus === "rejected") {
      setShowRejectModal(true);
      return;
    }
    updateWorkOrderStatus(
      workOrder.id,
      nextStatus,
      currentUser.id,
      `${currentUser.name}${actionLabel}`
    );
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;

    updateWorkOrder(workOrder.id, {
      status: "rejected",
      rejectInfo: {
        reason: rejectReason,
        operatorId: currentUser.id,
        timestamp: new Date().toISOString(),
        supplement: rejectSupplement,
      },
      history: [
        ...workOrder.history,
        {
          status: "rejected",
          operatorId: currentUser.id,
          timestamp: new Date().toISOString(),
          remark: rejectReason,
        },
      ],
    });
    setShowRejectModal(false);
    setRejectReason("");
    setRejectSupplement("");
  };

  const handleAddRemark = () => {
    if (!remark.trim()) return;
    addHistoryRemark({
      workOrderId: workOrder.id,
      content: remark,
      authorId: currentUser.id,
      type: "manual",
    });
    setRemark("");
  };

  const actions = statusActions[workOrder.status];
  const canAct = currentUser.role === "supervisor" || currentUser.id === workOrder.assigneeId;

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800">工单详情</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                typeConfig[workOrder.type].className
              )}
            >
              {typeConfig[workOrder.type].label}
            </span>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                priorityConfig[workOrder.priority].className
              )}
            >
              {priorityConfig[workOrder.priority].label}
            </span>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                statusConfig[workOrder.status].className
              )}
            >
              {statusConfig[workOrder.status].label}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mb-2">{workOrder.title}</h3>
          <p className="text-gray-600 text-sm">{workOrder.description}</p>
        </div>

        <div className="p-4 border-b border-gray-100 space-y-3">
          <h4 className="font-medium text-gray-700 text-sm">基本信息</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin className="w-4 h-4" />
              <span>{station?.name || "未知站点"}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <User className="w-4 h-4" />
              <span>创建人：{creator?.name || "未知"}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <User className="w-4 h-4" />
              <span>处理人：{assignee?.name || "未分配"}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{formatDate(workOrder.createdAt)}</span>
            </div>
          </div>
        </div>

        {workOrder.rejectInfo && (
          <div className="p-4 border-b border-gray-100">
            <h4 className="font-medium text-gray-700 text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              驳回信息
            </h4>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 mb-2">
                <span className="font-medium">驳回原因：</span>
                {workOrder.rejectInfo.reason}
              </p>
              {workOrder.rejectInfo.supplement && (
                <p className="text-sm text-red-600">
                  <span className="font-medium">补录说明：</span>
                  {workOrder.rejectInfo.supplement}
                </p>
              )}
              <p className="text-xs text-red-500 mt-2">
                驳回人：{users.find((u) => u.id === workOrder.rejectInfo?.operatorId)?.name} ·{" "}
                {formatDate(workOrder.rejectInfo.timestamp)}
              </p>
            </div>
          </div>
        )}

        {refund && (
          <div className="p-4 border-b border-gray-100">
            <h4 className="font-medium text-gray-700 text-sm mb-2">退款信息</h4>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-purple-500">订单号：</span>
                  <span className="text-purple-800">{refund.orderId}</span>
                </div>
                <div>
                  <span className="text-purple-500">退款金额：</span>
                  <span className="text-purple-800 font-semibold">¥{refund.amount}</span>
                </div>
                <div>
                  <span className="text-purple-500">客户：</span>
                  <span className="text-purple-800">{refund.customerName}</span>
                </div>
                <div>
                  <span className="text-purple-500">电话：</span>
                  <span className="text-purple-800">{refund.customerPhone}</span>
                </div>
              </div>
              <p className="text-sm text-purple-700 mt-2">
                <span className="font-medium">退款原因：</span>
                {refund.reason}
              </p>
            </div>
          </div>
        )}

        {workOrder.attachments.length > 0 && (
          <div className="p-4 border-b border-gray-100">
            <h4 className="font-medium text-gray-700 text-sm mb-3 flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              证据附件 ({workOrder.attachments.length})
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {workOrder.attachments.map((att) => (
                <div key={att.id} className="bg-gray-50 rounded-lg p-2">
                  {att.type === "image" ? (
                    <div className="aspect-video bg-gray-200 rounded overflow-hidden mb-2">
                      <img
                        src={att.url}
                        alt={att.description}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-200 rounded flex items-center justify-center mb-2">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <p className="text-xs text-gray-600 truncate">{att.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {users.find((u) => u.id === att.uploadedBy)?.name} ·{" "}
                    {formatDate(att.uploadedAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-b border-gray-100">
          <h4 className="font-medium text-gray-700 text-sm mb-3 flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            状态流转记录
          </h4>
          <div className="space-y-3">
            {workOrder.history.map((item, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      index === workOrder.history.length - 1
                        ? "bg-primary-100 text-primary-600"
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {item.status === "completed" ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : item.status === "rejected" ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : item.status === "escalated" ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  {index < workOrder.history.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        statusConfig[item.status].className
                      )}
                    >
                      {statusConfig[item.status].label}
                    </span>
                    <span className="text-sm text-gray-800">
                      {users.find((u) => u.id === item.operatorId)?.name || "未知"}
                    </span>
                  </div>
                  {item.remark && (
                    <p className="text-sm text-gray-600 mt-1">{item.remark}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(item.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4">
          <h4 className="font-medium text-gray-700 text-sm mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            历史备注 ({remarks.length})
          </h4>
          {remarks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无备注</p>
          ) : (
            <div className="space-y-3">
              {remarks.map((r) => {
                const author = users.find((u) => u.id === r.authorId);
                return (
                  <div key={r.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800">
                        {author?.name || "未知"}
                      </span>
                      {author && (
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            roleConfig[author.role].className
                          )}
                        >
                          {roleConfig[author.role].label}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {formatDate(r.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{r.content}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="添加备注信息..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              onKeyDown={(e) => e.key === "Enter" && handleAddRemark()}
            />
            <button
              onClick={handleAddRemark}
              disabled={!remark.trim()}
              className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {canAct && actions.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            {actions.map((action) => (
              <button
                key={action.nextStatus + action.label}
                onClick={() => handleStatusChange(action.nextStatus, action.label)}
                className={cn(
                  "flex-1 py-2 px-4 text-sm font-medium text-white rounded-lg transition-colors",
                  action.className
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-semibold text-lg mb-4">驳回工单</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  驳回原因 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入驳回原因..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  补录说明（选填）
                </label>
                <textarea
                  value={rejectSupplement}
                  onChange={(e) => setRejectSupplement(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入补录说明..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2 px-4 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
