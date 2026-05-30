"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Clock,
  MessageSquare,
  Send,
  Package,
  Search,
} from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { mockReviewCases, mockBorrowRecords } from "@/lib/mockData";
import { useApp } from "@/lib/context/AppContext";

const statusColors = {
  open: "bg-blue-100 text-blue-700",
  investigating: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

const statusLabels = {
  open: "待处理",
  investigating: "调查中",
  resolved: "已解决",
  closed: "已关闭",
};

const typeLabels = {
  complaint: "客户投诉",
  dispute: "争议纠纷",
  audit: "审计核查",
  damaged_equipment: "器材损坏",
};

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading, setIsLoading, currentUser, canHandleDisputes, error, setError } = useApp();
  const [caseItem, setCaseItem] = useState<any>(null);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const found = mockReviewCases.find((c) => c.id === params.id);
      setCaseItem(found || null);
      setIsLoading(false);
    }, 300);
  }, [params.id, setIsLoading]);

  if (isLoading) {
    return <LoadingState message="加载案件详情..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => setError(null)}
      />
    );
  }

  if (!caseItem) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">案件不存在</h2>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          返回列表
        </button>
      </div>
    );
  }

  const relatedBorrows = mockBorrowRecords.filter((b) =>
    caseItem.relatedBorrowIds?.includes(b.id)
  );

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const newTimelineItem = {
      id: `t_${Date.now()}`,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      userId: currentUser.id,
      userName: currentUser.name,
      action: "添加备注",
      details: newComment,
    };

    setCaseItem({
      ...caseItem,
      timeline: [...caseItem.timeline, newTimelineItem],
    });
    setNewComment("");
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
          <h1 className="text-2xl font-bold text-gray-900">{caseItem.title}</h1>
          <p className="text-sm text-gray-500">案件编号: {caseItem.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[caseItem.status as keyof typeof statusColors]}`}
                >
                  {statusLabels[caseItem.status as keyof typeof statusLabels]}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                  {typeLabels[caseItem.type as keyof typeof typeLabels]}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">案件描述</h3>
              <p className="text-gray-700">{caseItem.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">负责人</p>
                  <p className="text-gray-900">{caseItem.assigneeName || "未分配"}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">更新时间</p>
                  <p className="text-gray-900">{caseItem.updatedAt}</p>
                </div>
              </div>
              {caseItem.relatedMemberName && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">关联会员</p>
                    <p className="text-gray-900">{caseItem.relatedMemberName}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">创建时间</p>
                  <p className="text-gray-900">{caseItem.createdAt}</p>
                </div>
              </div>
            </div>
          </div>

          {relatedBorrows.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">关联借用记录</h3>
                <button
                  onClick={() => router.push(`/trace?member=${caseItem.relatedMemberName}`)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                >
                  <Search className="w-4 h-4 mr-1" />
                  完整回查
                </button>
              </div>
              <div className="space-y-3">
                {relatedBorrows.map((borrow) => (
                  <div
                    key={borrow.id}
                    onClick={() => router.push(`/borrow/${borrow.id}`)}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Package className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {borrow.equipmentName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {borrow.borrowDate} · {borrow.borrowerName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">处理时间线</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-6">
                {caseItem.timeline.map((item: any) => (
                  <div key={item.id} className="relative pl-10">
                    <div className="absolute left-0 w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {item.userName}
                        </span>
                        <span className="text-sm text-gray-500">{item.timestamp}</span>
                      </div>
                      <p className="text-gray-700 font-medium">{item.action}</p>
                      {item.details && (
                        <p className="text-gray-600 mt-1">{item.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="添加处理备注..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/trace?member=${caseItem.relatedMemberName || ""}`)}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Search className="w-5 h-5 mr-2" />
                连续回查
              </button>
              <button className="w-full flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <MessageSquare className="w-5 h-5 mr-2" />
                联系客户
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">案件状态</h3>
            {canHandleDisputes ? (
              <div className="space-y-2">
                {Object.entries(statusLabels).map(([value, label]) => (
                  <button
                    key={value}
                    className={`w-full px-4 py-2 rounded-lg text-left text-sm transition-colors ${
                      caseItem.status === value
                        ? "bg-green-100 text-green-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">
                  {statusLabels[caseItem.status as keyof typeof statusLabels]}
                </p>
                <p className="text-xs text-gray-400 mt-1">仅经理可更改状态</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
