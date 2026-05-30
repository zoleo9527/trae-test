"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Search, Filter, X, Check, ChevronDown } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCategoryLabel } from "@/lib/mockData";
import { useApp } from "@/lib/context/AppContext";
import type { BorrowStatus } from "@/types";

const statusOptions: { value: BorrowStatus | "all"; label: string }[] = [
  { value: "all", label: "全部状态" },
  { value: "pending", label: "待审批" },
  { value: "active", label: "借用中" },
  { value: "overdue", label: "已逾期" },
  { value: "rejected", label: "已驳回" },
  { value: "returned", label: "已归还" },
  { value: "needs_review", label: "待回查" },
];

export default function BorrowPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading, setIsLoading, currentUser, canApprove, canViewAllRecords, borrowRecords, updateBorrowStatus } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<BorrowStatus | "all">(
    (searchParams.get("filter") as BorrowStatus) || "all"
  );
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const filter = searchParams.get("filter") as BorrowStatus;
    if (filter) {
      setStatusFilter(filter);
    }
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [searchParams, setIsLoading]);

  const roleFilteredRecords = canViewAllRecords
    ? borrowRecords
    : currentUser.role === "coach"
    ? borrowRecords.filter((r) => r.applicantId === currentUser.id)
    : borrowRecords;

  const filteredRecords = roleFilteredRecords.filter((record) => {
    const matchesSearch =
      record.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (id: string) => {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    updateBorrowStatus(id, {
      status: "active",
      approvedBy: currentUser.id,
      approvedByName: currentUser.name,
      approvedAt: now,
    });
  };

  const handleReject = (id: string) => {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    updateBorrowStatus(id, {
      status: "rejected",
      rejectedBy: currentUser.id,
      rejectedByName: currentUser.name,
      rejectedAt: now,
      rejectedReason: "经审批驳回",
    });
  };

  if (isLoading) {
    return <LoadingState message="加载借用记录..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">借用管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理器材借用申请与审批</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          新增借用
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索器材、会员、申请单号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              {statusOptions.find((o) => o.value === statusFilter)?.label}
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            {showFilterDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowFilterDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setStatusFilter(option.value);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                        statusFilter === option.value
                          ? "bg-green-50 text-green-700"
                          : "text-gray-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {filteredRecords.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    器材信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    借用人
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    借用时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    押金
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/borrow/${record.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {record.equipmentName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getCategoryLabel(record.equipmentCategory)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.borrowerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {record.borrowerPhone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.borrowDate}
                      </div>
                      <div className="text-sm text-gray-500">
                        预计: {record.expectedReturnDate}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{record.depositAmount}
                      <span
                        className={`ml-2 text-xs ${record.depositPaid ? "text-green-600" : "text-red-600"}`}
                      >
                        {record.depositPaid ? "已付" : "未付"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {record.status === "pending" && canApprove && (
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(record.id);
                            }}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="批准"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(record.id);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="驳回"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      {record.status === "pending" && !canApprove && (
                        <span className="text-xs text-gray-500">待审批中</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          type="no-results"
          title="未找到相关记录"
          description="请尝试调整搜索条件或筛选器"
        />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">新增借用申请</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500">
                借用申请表单功能开发中，您可以在现有记录中查看详情。
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
