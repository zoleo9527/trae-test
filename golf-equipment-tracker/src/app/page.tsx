"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Search,
  MessageSquare,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PendingList } from "@/components/dashboard/PendingList";
import { ReviewCaseCard } from "@/components/dashboard/ReviewCaseCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { mockReviewCases } from "@/lib/mockData";
import { useApp } from "@/lib/context/AppContext";

export default function DashboardPage() {
  const router = useRouter();
  const { isLoading, setIsLoading, borrowRecords } = useApp();

  const stats = {
    pendingBorrows: borrowRecords.filter(r => r.status === "pending").length,
    activeBorrows: borrowRecords.filter(r => r.status === "active").length,
    overdueBorrows: borrowRecords.filter(r => r.status === "overdue").length,
    rejectedToday: borrowRecords.filter(r => r.status === "rejected").length,
    needsReview: borrowRecords.filter(r => r.status === "needs_review").length,
    openCases: mockReviewCases.filter(c => c.status === "open" || c.status === "investigating").length,
  };

  const pendingRecords = borrowRecords.filter(r => r.status === "pending");
  const overdueRecords = borrowRecords.filter(r => r.status === "overdue");
  const needsReviewRecords = borrowRecords.filter(r => r.status === "needs_review");
  const rejectedRecords = borrowRecords.filter(r => r.status === "rejected");

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [setIsLoading]);

  if (isLoading) {
    return <LoadingState message="加载仪表盘数据..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作仪表盘</h1>
          <p className="text-sm text-gray-500 mt-1">
            今日待办事项概览
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索会员、器材..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="待审批借用"
          value={stats.pendingBorrows}
          icon={Package}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
          onClick={() => router.push("/borrow?filter=pending")}
          trend={{ value: 12, isUp: true }}
        />
        <StatCard
          title="借用中"
          value={stats.activeBorrows}
          icon={Clock}
          color="text-blue-600"
          bgColor="bg-blue-100"
          onClick={() => router.push("/borrow?filter=active")}
        />
        <StatCard
          title="已逾期"
          value={stats.overdueBorrows}
          icon={AlertTriangle}
          color="text-orange-600"
          bgColor="bg-orange-100"
          onClick={() => router.push("/borrow?filter=overdue")}
          trend={{ value: 5, isUp: true }}
        />
        <StatCard
          title="今日驳回"
          value={stats.rejectedToday}
          icon={XCircle}
          color="text-red-600"
          bgColor="bg-red-100"
          onClick={() => router.push("/borrow?filter=rejected")}
        />
        <StatCard
          title="待回查"
          value={stats.needsReview}
          icon={Eye}
          color="text-purple-600"
          bgColor="bg-purple-100"
          onClick={() => router.push("/return?filter=needs_review")}
        />
        <StatCard
          title="待处理投诉"
          value={stats.openCases}
          icon={MessageSquare}
          color="text-rose-600"
          bgColor="bg-rose-100"
          onClick={() => router.push("/cases")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingList
          title="待审批借用申请"
          records={pendingRecords}
          viewAllHref="/borrow?filter=pending"
          emptyMessage="暂无待审批的借用申请"
        />
        <PendingList
          title="已逾期借用"
          records={overdueRecords}
          viewAllHref="/borrow?filter=overdue"
          emptyMessage="暂无逾期借用记录"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingList
          title="需回查记录"
          records={needsReviewRecords}
          viewAllHref="/return?filter=needs_review"
          emptyMessage="暂无需要回查的记录"
        />
        <PendingList
          title="今日已驳回"
          records={rejectedRecords}
          viewAllHref="/borrow?filter=rejected"
          emptyMessage="今日暂无驳回记录"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">待处理投诉与争议</h2>
          <button
            onClick={() => router.push("/cases")}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            查看全部
          </button>
        </div>
        {mockReviewCases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockReviewCases.map((caseItem) => (
              <ReviewCaseCard
                key={caseItem.id}
                caseItem={caseItem}
                onClick={() => router.push(`/cases/${caseItem.id}`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            type="no-data"
            title="暂无待处理投诉"
            description="所有投诉和争议已处理完毕"
          />
        )}
      </div>
    </div>
  );
}
