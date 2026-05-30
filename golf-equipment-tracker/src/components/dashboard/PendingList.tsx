import React from "react";
import Link from "next/link";
import { Clock, User, Phone } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { BorrowRecord } from "@/types";
import { getCategoryLabel } from "@/lib/mockData";

interface PendingListProps {
  title: string;
  records: BorrowRecord[];
  viewAllHref: string;
  emptyMessage: string;
}

export const PendingList: React.FC<PendingListProps> = ({
  title,
  records,
  viewAllHref,
  emptyMessage,
}) => {
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <Link
            href={viewAllHref}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            查看全部
          </Link>
        </div>
        <EmptyState
          type="no-data"
          title={emptyMessage}
          description="当前没有需要处理的记录"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <Link
            href={viewAllHref}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            查看全部
          </Link>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {records.slice(0, 5).map((record) => (
        <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="font-medium text-gray-900">{record.equipmentName}</h4>
                <StatusBadge status={record.status} />
              </div>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <span className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {record.borrowerName}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {record.borrowDate}
                </span>
              </div>
              {record.borrowerPhone && (
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Phone className="w-4 h-4 mr-1" />
                  {record.borrowerPhone}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {getCategoryLabel(record.equipmentCategory)}
            </span>
          </div>
        </div>
      ))}
    </div>
    </div>
  );
};
