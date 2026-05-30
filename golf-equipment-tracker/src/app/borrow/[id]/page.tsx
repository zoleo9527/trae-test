"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  X,
  Calendar,
  User,
  Phone,
  Package,
  DollarSign,
  Clock,
  FileText,
  Flag,
  Wallet,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  mockBookings,
  mockStoredValueRecords,
  mockEquipment,
  getCategoryLabel,
} from "@/lib/mockData";
import { useApp } from "@/lib/context/AppContext";
import type { BorrowStatus } from "@/types";

export default function BorrowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading, setIsLoading, canApprove, error, setError, currentUser, borrowRecords, updateBorrowStatus } = useApp();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const record = borrowRecords.find((r) => r.id === params.id) || null;

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [setIsLoading]);

  if (isLoading) {
    return <LoadingState message="加载借用详情..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => setError(null)}
      />
    );
  }

  if (!record) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">记录不存在</h2>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          返回列表
        </button>
      </div>
    );
  }

  const relatedBooking = mockBookings.find((b) => b.id === record.bookingId);
  const relatedEquipment = mockEquipment.find((e) => e.id === record.equipmentId);
  const relatedStoredValue = mockStoredValueRecords.find(
    (sv) => sv.relatedId === record.id
  );

  const handleApprove = () => {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    updateBorrowStatus(record.id, {
      status: "active",
      approvedBy: currentUser.id,
      approvedByName: currentUser.name,
      approvedAt: now,
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    updateBorrowStatus(record.id, {
      status: "rejected",
      rejectedBy: currentUser.id,
      rejectedByName: currentUser.name,
      rejectedAt: now,
      rejectedReason: rejectReason.trim(),
    });
    setShowRejectModal(false);
    setRejectReason("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">借用详情</h1>
          <p className="text-sm text-gray-500">申请单号: {record.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {record.equipmentName}
                </h3>
                <p className="text-sm text-gray-500">
                  {getCategoryLabel(record.equipmentCategory)}
                </p>
              </div>
              <StatusBadge status={record.status} />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">借用人</p>
                  <p className="text-gray-900">{record.borrowerName}</p>
                  {record.memberName && (
                    <p className="text-sm text-gray-500">会员: {record.memberName}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">联系电话</p>
                  <p className="text-gray-900">{record.borrowerPhone || "-"}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">借用日期</p>
                  <p className="text-gray-900">{record.borrowDate}</p>
                  <p className="text-sm text-gray-500">至 {record.expectedReturnDate}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">押金</p>
                  <p className="text-gray-900">¥{record.depositAmount}</p>
                  <p className="text-sm text-gray-500">
                    {record.depositPaid ? "已支付" : "未支付"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {relatedBooking && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <Flag className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">关联球道预约</h3>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">球道</p>
                    <p className="text-gray-900">{relatedBooking.laneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">日期</p>
                    <p className="text-gray-900">{relatedBooking.date}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">时间</p>
                    <p className="text-gray-900">
                      {relatedBooking.startTime} - {relatedBooking.endTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">教练</p>
                    <p className="text-gray-900">{relatedBooking.coachName || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {relatedStoredValue && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <Wallet className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">储值扣减记录</h3>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">类型</p>
                    <p className="text-gray-900">
                      {relatedStoredValue.type === "consume" ? "消费" : relatedStoredValue.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">金额</p>
                    <p className="text-red-600 font-medium">-¥{relatedStoredValue.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">扣减前余额</p>
                    <p className="text-gray-900">¥{relatedStoredValue.balanceBefore}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">扣减后余额</p>
                    <p className="text-gray-900">¥{relatedStoredValue.balanceAfter}</p>
                  </div>
                </div>
                {relatedStoredValue.relatedNote && (
                  <p className="text-sm text-gray-500 mt-2">
                    备注: {relatedStoredValue.relatedNote}
                  </p>
                )}
              </div>
            </div>
          )}

          {record.status === "rejected" && record.rejectedReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <X className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">驳回原因</h4>
                  <p className="text-red-700 mt-1">{record.rejectedReason}</p>
                  {record.rejectedByName && (
                    <p className="text-sm text-red-600 mt-2">
                      驳回人: {record.rejectedByName} · {record.rejectedAt}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {record.status === "pending" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">审批操作</h3>
              {canApprove ? (
                <div className="space-y-3">
                  <button
                    onClick={handleApprove}
                    className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    批准借用
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="w-full flex items-center justify-center px-4 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <X className="w-5 h-5 mr-2" />
                    驳回申请
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">您没有权限进行审批操作</p>
                  <p className="text-xs text-gray-400 mt-1">请联系前台或经理处理</p>
                </div>
              )}
            </div>
          )}

          {relatedEquipment && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">器材信息</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">品牌</span>
                  <span className="text-gray-900">{relatedEquipment.brand || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">型号</span>
                  <span className="text-gray-900">{relatedEquipment.model || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">序列号</span>
                  <span className="text-gray-900 font-mono text-sm">
                    {relatedEquipment.serialNumber || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">日租金</span>
                  <span className="text-gray-900">¥{relatedEquipment.dailyRate}/天</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">成色</span>
                  <span className="text-gray-900">
                    {relatedEquipment.condition === "excellent"
                      ? "优秀"
                      : relatedEquipment.condition === "good"
                      ? "良好"
                      : relatedEquipment.condition === "fair"
                      ? "一般"
                      : "较差"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">操作记录</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <div>
                  <p className="text-sm text-gray-900">创建申请</p>
                  <p className="text-xs text-gray-500">
                    {record.applicantName} · {record.createdAt}
                  </p>
                </div>
              </div>
              {record.approvedAt && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <div>
                    <p className="text-sm text-gray-900">批准申请</p>
                    <p className="text-xs text-gray-500">
                      {record.approvedByName} · {record.approvedAt}
                    </p>
                  </div>
                </div>
              )}
              {record.rejectedAt && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
                  <div>
                    <p className="text-sm text-gray-900">驳回申请</p>
                    <p className="text-xs text-gray-500">
                      {record.rejectedByName} · {record.rejectedAt}
                    </p>
                  </div>
                </div>
              )}
              {record.actualReturnDate && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
                  <div>
                    <p className="text-sm text-gray-900">归还器材</p>
                    <p className="text-xs text-gray-500">{record.actualReturnDate}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">驳回申请</h3>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                驳回原因
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="请输入驳回原因..."
              />
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(""); }}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
