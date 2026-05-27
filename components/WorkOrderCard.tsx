"use client";

import { useAppStore } from "@/lib/store";
import { WorkOrder } from "@/lib/types";
import { cn, formatRelativeTime, priorityConfig, statusConfig, typeConfig } from "@/lib/utils";
import { AlertTriangle, Clock, MapPin, MessageSquare, Paperclip, User } from "lucide-react";

interface WorkOrderCardProps {
  workOrder: WorkOrder;
  onClick?: () => void;
  selected?: boolean;
}

export function WorkOrderCard({ workOrder, onClick, selected }: WorkOrderCardProps) {
  const stations = useAppStore((state) => state.stations);
  const users = useAppStore((state) => state.users);
  const historyRemarks = useAppStore((state) => state.historyRemarks);

  const station = stations.find((s) => s.id === workOrder.stationId);
  const assignee = users.find((u) => u.id === workOrder.assigneeId);
  const creator = users.find((u) => u.id === workOrder.creatorId);
  const remarks = historyRemarks.filter((r) => r.workOrderId === workOrder.id);

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md",
        selected ? "border-primary-500 ring-2 ring-primary-100" : "border-gray-200"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              typeConfig[workOrder.type].className
            )}
          >
            {typeConfig[workOrder.type].label}
          </span>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              priorityConfig[workOrder.priority].className
            )}
          >
            {priorityConfig[workOrder.priority].label}
          </span>
        </div>
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            statusConfig[workOrder.status].className
          )}
        >
          {statusConfig[workOrder.status].label}
        </span>
      </div>

      <h3 className="font-medium text-gray-800 mb-2 line-clamp-2">{workOrder.title}</h3>

      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{workOrder.description}</p>

      <div className="space-y-2">
        {station && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{station.name}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <User className="w-3.5 h-3.5" />
          <span>
            创建：{creator?.name || "未知"}
            {assignee && ` · 处理：${assignee.name}`}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatRelativeTime(workOrder.createdAt)}
          </div>
          {workOrder.attachments.length > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5" />
              {workOrder.attachments.length}
            </div>
          )}
          {remarks.length > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              {remarks.length}
            </div>
          )}
        </div>
      </div>

      {workOrder.rejectInfo && (
        <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
          <p className="text-xs text-red-600 font-medium mb-1">
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
            已驳回
          </p>
          <p className="text-xs text-red-500 line-clamp-2">{workOrder.rejectInfo.reason}</p>
        </div>
      )}
    </div>
  );
}
