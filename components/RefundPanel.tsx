"use client";

import { useAppStore } from "@/lib/store";
import type { RefundStatus } from "@/lib/types";
import { cn, formatDate, refundStatusConfig, roleConfig } from "@/lib/utils";
import {
    AlertTriangle,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Clock,
    FileText,
    Phone,
    Search,
    User,
    XCircle
} from "lucide-react";
import { useState } from "react";

export function RefundPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewRemark, setReviewRemark] = useState("");

  const refundRequests = useAppStore((state) => state.refundRequests);
  const workOrders = useAppStore((state) => state.workOrders);
  const users = useAppStore((state) => state.users);
  const currentUser = useAppStore((state) => state.currentUser);
  const stations = useAppStore((state) => state.stations);
  const updateWorkOrder = useAppStore((state) => state.updateWorkOrder);
  const updateWorkOrderStatus = useAppStore((state) => state.updateWorkOrderStatus);

  let filteredRequests = refundRequests;

  if (statusFilter !== "all") {
    filteredRequests = filteredRequests.filter((r) => r.status === statusFilter);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredRequests = filteredRequests.filter(
      (r) =>
        r.customerName.toLowerCase().includes(query) ||
        r.orderId.toLowerCase().includes(query) ||
        r.reason.toLowerCase().includes(query)
    );
  }

  const handleReview = (refundId: string, approved: boolean) => {
    const refund = refundRequests.find((r) => r.id === refundId);
    if (!refund) return;

    const newStatus: RefundStatus = approved ? "approved" : "rejected";

    updateWorkOrder(refund.workOrderId, {
      status: approved ? "completed" : "rejected",
      rejectInfo: approved
        ? undefined
        : {
            reason: reviewRemark || "退款申请被驳回",
            operatorId: currentUser.id,
            timestamp: new Date().toISOString(),
            supplement: "",
          },
    });

    updateWorkOrderStatus(
      refund.workOrderId,
      approved ? "completed" : "rejected",
      currentUser.id,
      approved ? "退款审核通过" : `退款驳回：${reviewRemark}`
    );

    setReviewRemark("");
    setExpandedId(null);
  };

  const pendingCount = refundRequests.filter((r) => r.status === "pending").length;
  const approvedCount = refundRequests.filter((r) => r.status === "approved").length;
  const rejectedCount = refundRequests.filter((r) => r.status === "rejected").length;

  const canReview = currentUser.role === "supervisor";

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">退款申诉</h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-yellow-600">
              <Clock className="w-4 h-4" />
              待审核 {pendingCount}
            </span>
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              已通过 {approvedCount}
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <XCircle className="w-4 h-4" />
              已驳回 {rejectedCount}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索订单号、客户名、退款原因..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">全部状态</option>
            {Object.entries(refundStatusConfig).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {["all", "pending", "reviewing", "approved", "rejected"].map((status) => {
            const count =
              status === "all"
                ? refundRequests.length
                : refundRequests.filter((r) => r.status === status).length;
            const label =
              status === "all"
                ? "全部"
                : refundStatusConfig[status as keyof typeof refundStatusConfig]?.label ||
                  status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors",
                  statusFilter === status
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mb-3" />
            <p>暂无退款申请</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((refund) => {
              const workOrder = workOrders.find((wo) => wo.id === refund.workOrderId);
              const station = stations.find((s) => s.id === workOrder?.stationId);
              const creator = users.find((u) => u.id === refund.createdBy);
              const reviewer = users.find((u) => u.id === refund.reviewedBy);
              const isExpanded = expandedId === refund.id;

              return (
                <div
                  key={refund.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedId(isExpanded ? null : refund.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            refund.status === "approved"
                              ? "bg-green-100"
                              : refund.status === "rejected"
                              ? "bg-red-100"
                              : "bg-yellow-100"
                          )}
                        >
                          {refund.status === "approved" ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : refund.status === "rejected" ? (
                            <XCircle className="w-5 h-5 text-red-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">
                              {refund.customerName}
                            </span>
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                refundStatusConfig[refund.status].className
                              )}
                            >
                              {refundStatusConfig[refund.status].label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            订单号：{refund.orderId} · 申请金额：
                            <span className="font-semibold text-red-600">
                              ¥{refund.amount}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{station?.name}</p>
                          <p className="text-xs text-gray-400">
                            {formatDate(refund.createdAt)}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">客户电话</p>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-800">
                              {refund.customerPhone}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">申请人</p>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-800">
                              {creator?.name || "未知"}
                              {creator && (
                                <span
                                  className={cn(
                                    "text-xs px-1.5 py-0.5 rounded ml-1",
                                    roleConfig[creator.role].className
                                  )}
                                >
                                  {roleConfig[creator.role].label}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        {reviewer && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">审核人</p>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-800">
                                {reviewer.name}
                                <span
                                  className={cn(
                                    "text-xs px-1.5 py-0.5 rounded ml-1",
                                    roleConfig[reviewer.role].className
                                  )}
                                >
                                  {roleConfig[reviewer.role].label}
                                </span>
                              </span>
                            </div>
                          </div>
                        )}
                        {refund.reviewedAt && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">审核时间</p>
                            <p className="text-sm text-gray-800">
                              {formatDate(refund.reviewedAt)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">退款原因</p>
                        <p className="text-sm text-gray-800 bg-white p-3 rounded-lg border border-gray-200">
                          {refund.reason}
                        </p>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">证据说明</p>
                        <p className="text-sm text-gray-800 bg-white p-3 rounded-lg border border-gray-200">
                          {refund.evidence}
                        </p>
                      </div>

                      {workOrder && workOrder.attachments.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-2">证据附件</p>
                          <div className="grid grid-cols-4 gap-2">
                            {workOrder.attachments.map((att) => (
                              <div
                                key={att.id}
                                className="aspect-square bg-gray-200 rounded-lg overflow-hidden"
                              >
                                {att.type === "image" ? (
                                  <img
                                    src={att.url}
                                    alt={att.description}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {workOrder?.rejectInfo && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-700 mb-1">
                            <AlertTriangle className="w-4 h-4 inline mr-1" />
                            驳回原因
                          </p>
                          <p className="text-sm text-red-600">
                            {workOrder.rejectInfo.reason}
                          </p>
                          {workOrder.rejectInfo.supplement && (
                            <p className="text-sm text-red-500 mt-1">
                              补录说明：{workOrder.rejectInfo.supplement}
                            </p>
                          )}
                        </div>
                      )}

                      {canReview && refund.status === "pending" && (
                        <div className="space-y-3">
                          <textarea
                            value={reviewRemark}
                            onChange={(e) => setReviewRemark(e.target.value)}
                            rows={2}
                            placeholder="请输入审核意见（驳回时必填）..."
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleReview(refund.id, false)}
                              className="flex-1 py-2 px-4 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              驳回
                            </button>
                            <button
                              onClick={() => handleReview(refund.id, true)}
                              className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              通过
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
