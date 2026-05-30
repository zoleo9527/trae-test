import React from "react";
import { Clock, AlertTriangle, User } from "lucide-react";
import type { ReviewCase } from "@/types";

interface ReviewCaseCardProps {
  caseItem: ReviewCase;
  onClick?: () => void;
}

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

export const ReviewCaseCard: React.FC<ReviewCaseCardProps> = ({ caseItem, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
    >
      <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <h4 className="font-semibold text-gray-900">{caseItem.title}</h4>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[caseItem.priority]}`}>
            {priorityLabels[caseItem.priority]}优先级
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
        </div>
      </div>
      <div className="flex flex-col items-end space-y-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[caseItem.status]}`}>
          {statusLabels[caseItem.status]}
        </span>
        <span className="text-xs text-gray-400">{typeLabels[caseItem.type]}</span>
      </div>
    </div>
    </div>
  );
};
