"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Filter, ChevronDown, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCategoryLabel } from "@/lib/mockData";
import { useApp } from "@/lib/context/AppContext";
import type { BorrowStatus } from "@/types";

const statusOptions: { value: BorrowStatus | "all"; label: string }[] = [
  { value: "all", label: "全部状态" },
  { value: "active", label: "借用中" },
  { value: "needs_review", label: "待回查" },
  { value: "returned", label: "已完成" },
];

export default function ReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading, setIsLoading, currentUser, canProcessReturns, canViewAllRecords, borrowRecords } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<BorrowStatus | "all">(
    (searchParams.get("filter") as BorrowStatus) || "all"
  );
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const filter = searchParams.get("filter") as BorrowStatus;
    if (filter) {
      setStatusFilter(filter);
    }
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [searchParams, setIsLoading]);

  const allReturnableRecords = borrowRecords.filter(
    (r) => r.status === "active" || r.status === "needs_review" || r.status === "returned"
  );

  const roleFilteredRecords = canViewAllRecords
    ? allReturnableRecords
    : currentUser.role === "coach"
    ? allReturnableRecords.filter((r) => r.applicantId === currentUser.id)
    : allReturnableRecords;

  const filteredRecords = roleFilteredRecords.filter((record) => {
    const matchesSearch =
      record.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <LoadingState message="加载归还记录..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">归还验收</h1>
          <p className="text-sm text-gray-500 mt-1">管理器材归还与质量验收</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">待归还</p>
              <p className="text-2xl font-bold text-blue-600">
                {roleFilteredRecords.filter((r) => r.status === "active").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">待回查</p>
              <p className="text-2xl font-bold text-purple-600">
                {roleFilteredRecords.filter((r) => r.status === "needs_review").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">今日已归还</p>
              <p className="text-2xl font-bold text-green-600">
                {roleFilteredRecords.filter((r) => r.status === "returned").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索器材、会员..."
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
                    借用日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    预计归还
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
                    onClick={() => router.push(`/return/${record.id}`)}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.borrowDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.expectedReturnDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {record.status === "active" && canProcessReturns && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/return/${record.id}`);
                          }}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                        >
                          归还验收
                        </button>
                      )}
                      {record.status === "active" && !canProcessReturns && (
                        <span className="text-xs text-gray-500">借用中</span>
                      )}
                      {record.status === "needs_review" && canProcessReturns && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/return/${record.id}`);
                          }}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                        >
                          回查处理
                        </button>
                      )}
                      {record.status === "needs_review" && !canProcessReturns && (
                        <span className="text-xs text-purple-600">待回查</span>
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
    </div>
  );
}
