"use client";

import { useAppStore } from "@/lib/store";
import { cn, priorityConfig, statusConfig } from "@/lib/utils";
import { AlertTriangle, Plus, Search } from "lucide-react";
import { useState } from "react";
import { WorkOrderCard } from "./WorkOrderCard";
import { WorkOrderDetail } from "./WorkOrderDetail";

interface WorkOrderPanelProps {
  type?: "all" | "repair" | "restock" | "inspection" | "complaint";
}

export function WorkOrderPanel({ type = "all" }: WorkOrderPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const workOrders = useAppStore((state) => state.workOrders);
  const currentUser = useAppStore((state) => state.currentUser);

  let filteredOrders = workOrders;

  if (type !== "all") {
    filteredOrders = filteredOrders.filter((wo) => wo.type === type);
  }

  if (currentUser.role === "inspector") {
    filteredOrders = filteredOrders.filter(
      (wo) => wo.assigneeId === currentUser.id || wo.status === "pending"
    );
  } else if (currentUser.role === "customer_service") {
    filteredOrders = filteredOrders.filter(
      (wo) => wo.creatorId === currentUser.id || wo.type === "complaint"
    );
  }

  if (statusFilter !== "all") {
    filteredOrders = filteredOrders.filter((wo) => wo.status === statusFilter);
  }

  if (priorityFilter !== "all") {
    filteredOrders = filteredOrders.filter((wo) => wo.priority === priorityFilter);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredOrders = filteredOrders.filter(
      (wo) =>
        wo.title.toLowerCase().includes(query) ||
        wo.description.toLowerCase().includes(query)
    );
  }

  const selectedOrder = workOrders.find((wo) => wo.id === selectedId);

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">工单管理</h2>
            <button className="flex items-center gap-2 px-3 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors">
              <Plus className="w-4 h-4" />
              新建工单
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索工单..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">全部状态</option>
              {Object.entries(statusConfig).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">全部优先级</option>
              {Object.entries(priorityConfig).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors",
                statusFilter === "all"
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              全部 ({workOrders.length})
            </button>
            {Object.entries(statusConfig).map(([key, value]) => {
              const count = workOrders.filter((wo) => wo.status === key).length;
              if (count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors",
                    statusFilter === key
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {value.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <AlertTriangle className="w-12 h-12 mb-3" />
              <p>暂无符合条件的工单</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOrders.map((order) => (
                <WorkOrderCard
                  key={order.id}
                  workOrder={order}
                  selected={selectedId === order.id}
                  onClick={() => setSelectedId(order.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div className="w-[480px] border-l border-gray-200">
          <WorkOrderDetail
            workOrder={selectedOrder}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}
    </div>
  );
}
