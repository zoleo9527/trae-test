"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  AlertTriangle,
  Clock,
  User,
  MessageSquare,
} from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { mockReviewCases } from "@/lib/mockData";
import { useApp } from "@/lib/context/AppContext";
import type { ReviewCase } from "@/types";

const statusOptions = [
  { value: "all", label: "全部状态" },
  { value: "open", label: "待处理" },
  { value: "investigating", label: "调查中" },
  { value: "resolved", label: "已解决" },
  { value: "closed", label: "已关闭" },
];

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

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

const priorityLabels = {
  low: "低",
  medium: "中",
  high: "高",
};

const typeLabels = {
  complaint: "客户投诉",
  dispute: "争议纠纷",
  audit: "审计核查",
  damaged_equipment: "器材损坏",
};

export default function CasesPage() {
  const router = useRouter();
  const { isLoading, setIsLoading, currentUser, canHandleDisputes, canViewAllRecords, borrowRecords } = useApp();
  const [cases, setCases] = useState<ReviewCase[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setCases(mockReviewCases);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [setIsLoading]);

  const roleFilteredCases = canViewAllRecords
    ? cases
    : currentUser.role === "coach"
    ? cases.filter((c) => c.assigneeId === currentUser.id)
    : cases;

  const filteredCases = roleFilteredCases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.relatedMemberName && c.relatedMemberName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <LoadingState message="加载投诉回查记录..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">投诉回查</h1>
          <p className="text-sm text-gray-500 mt-1">管理客户投诉与争议处理</p>
        </div>
        {canHandleDisputes && (
          <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-5 h-5 mr-2" />
            新建案件
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">待处理</p>
              <p className="text-2xl font-bold text-blue-600">
                {roleFilteredCases.filter((c) => c.status === "open").length}
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
              <p className="text-sm font-medium text-gray-500">调查中</p>
              <p className="text-2xl font-bold text-yellow-600">
                {roleFilteredCases.filter((c) => c.status === "investigating").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">高优先级</p>
              <p className="text-2xl font-bold text-red-600">
                {roleFilteredCases.filter((c) => c.priority === "high").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">本月已解决</p>
              <p className="text-2xl font-bold text-green-600">
                {roleFilteredCases.filter((c) => c.status === "resolved").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600" />
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
              placeholder="搜索案件标题、描述、会员..."
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

      {filteredCases.length > 0 ? (
        <div className="space-y-4">
          {filteredCases.map((caseItem) => (
            <div
              key={caseItem.id}
              onClick={() => router.push(`/cases/${caseItem.id}`)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {caseItem.title}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[caseItem.priority]}`}
                    >
                      {priorityLabels[caseItem.priority]}优先级
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[caseItem.status]}`}
                    >
                      {statusLabels[caseItem.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {caseItem.description}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {caseItem.assigneeName || "未分配"}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {caseItem.updatedAt}
                    </span>
                    <span className="text-xs text-gray-400">
                      {typeLabels[caseItem.type]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          type="no-results"
          title="未找到相关案件"
          description="请尝试调整搜索条件或筛选器"
        />
      )}
    </div>
  );
}
