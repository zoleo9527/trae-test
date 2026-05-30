"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  ChevronDown,
  Calendar,
  Download,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { mockBorrowRecords, getCategoryLabel } from "@/lib/mockData";
import { useApp } from "@/lib/context/AppContext";

const statusOptions = [
  { value: "all", label: "全部状态" },
  { value: "pending", label: "待审批" },
  { value: "active", label: "借用中" },
  { value: "returned", label: "已归还" },
  { value: "rejected", label: "已驳回" },
  { value: "overdue", label: "已逾期" },
  { value: "needs_review", label: "待回查" },
];

export default function RecordsPage() {
  const router = useRouter();
  const { isLoading, setIsLoading, currentUser, canViewAllRecords, error, setError } = useApp();
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setRecords(mockBorrowRecords);
      setIsLoading(false);
    }, 300);
  }, [setIsLoading]);

  const roleFilteredRecords = canViewAllRecords
    ? records
    : currentUser.role === "coach"
    ? records.filter((r) => r.applicantId === currentUser.id)
    : records;

  const filteredRecords = roleFilteredRecords.filter((record) => {
    const matchesSearch =
      record.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <LoadingState message="加载历史记录..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => setError(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">历史记录</h1>
          <p className="text-sm text-gray-500 mt-1">查看所有器材借用与归还记录</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-5 h-5 mr-2" />
          导出数据
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                  className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <span className="flex items-center text-gray-400">至</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    归还日期
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.borrowDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.actualReturnDate || record.expectedReturnDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{record.depositAmount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/borrow/${record.id}`);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        查看详情
                      </button>
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
