"use client";

import { useAppStore } from "@/lib/store";
import { cn, formatRelativeTime, stationStatusConfig } from "@/lib/utils";
import {
    AlertOctagon,
    AlertTriangle,
    ArrowUpRight,
    CheckCircle,
    Clock,
    MapPin,
    Package,
    TrendingUp
} from "lucide-react";

export function Dashboard() {
  const workOrders = useAppStore((state) => state.workOrders);
  const stations = useAppStore((state) => state.stations);
  const materials = useAppStore((state) => state.materials);
  const stationMaterials = useAppStore((state) => state.stationMaterials);
  const currentUser = useAppStore((state) => state.currentUser);

  const pendingCount = workOrders.filter((wo) => wo.status === "pending").length;
  const processingCount = workOrders.filter((wo) => wo.status === "processing").length;
  const completedCount = workOrders.filter((wo) => wo.status === "completed").length;
  const urgentCount = workOrders.filter((wo) => wo.priority === "urgent").length;
  const escalatedCount = workOrders.filter((wo) => wo.status === "escalated").length;

  const lowStockMaterials = stationMaterials.filter((sm) => {
    const material = materials.find((m) => m.id === sm.materialId);
    return material && sm.currentStock < material.minStock;
  });

  const faultStations = stations.filter((s) => s.status === "fault" || s.status === "warning");

  const myWorkOrders = workOrders.filter(
    (wo) =>
      (currentUser.role === "inspector" && wo.assigneeId === currentUser.id) ||
      (currentUser.role === "customer_service" && wo.creatorId === currentUser.id)
  );

  const myPending = myWorkOrders.filter((wo) => wo.status !== "completed").length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">运营总览</h1>
        <p className="text-gray-500 mt-1">
          {currentUser.role === "supervisor"
            ? "全局工单状态、站点健康度、耗材库存一览"
            : currentUser.role === "inspector"
            ? `您有 ${myPending} 个待处理工单`
            : "客户投诉与退款申请处理进度"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待处理工单</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">处理中</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{processingCount}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">今日已完成</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{completedCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">紧急/升级</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {urgentCount + escalatedCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertOctagon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">最新工单</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {workOrders.slice(0, 5).map((wo) => (
              <div
                key={wo.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        {
                          repair: "bg-red-100 text-red-800",
                          restock: "bg-green-100 text-green-800",
                          inspection: "bg-blue-100 text-blue-800",
                          complaint: "bg-purple-100 text-purple-800",
                        }[wo.type]
                      )}
                    >
                      {{
                        repair: "设备维修",
                        restock: "耗材补货",
                        inspection: "例行巡检",
                        complaint: "投诉退款",
                      }[wo.type]}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        wo.priority === "urgent"
                          ? "bg-red-100 text-red-800"
                          : wo.priority === "high"
                          ? "bg-orange-100 text-orange-800"
                          : wo.priority === "medium"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      )}
                    >
                      {{ low: "低", medium: "中", high: "高", urgent: "紧急" }[wo.priority]}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatRelativeTime(wo.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-800 font-medium">{wo.title}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {stations.find((s) => s.id === wo.stationId)?.name}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full",
                      wo.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : wo.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : wo.status === "processing"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-blue-100 text-blue-800"
                    )}
                  >
                    {{
                      pending: "待处理",
                      assigned: "已派单",
                      processing: "处理中",
                      reviewing: "审核中",
                      completed: "已完成",
                      rejected: "已驳回",
                      escalated: "已升级",
                    }[wo.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">站点状态</h2>
              <AlertTriangle
                className={cn(
                  "w-5 h-5",
                  faultStations.length > 0 ? "text-red-500" : "text-green-500"
                )}
              />
            </div>
            <div className="divide-y divide-gray-100">
              {stations.map((station) => (
                <div key={station.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {station.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{station.address}</p>
                    </div>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium ml-2",
                        stationStatusConfig[station.status].className
                      )}
                    >
                      {stationStatusConfig[station.status].label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">库存预警</h2>
              <Package
                className={cn(
                  "w-5 h-5",
                  lowStockMaterials.length > 0 ? "text-orange-500" : "text-green-500"
                )}
              />
            </div>
            <div className="divide-y divide-gray-100">
              {lowStockMaterials.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  所有耗材库存正常
                </div>
              ) : (
                lowStockMaterials.map((sm) => {
                  const material = materials.find((m) => m.id === sm.materialId);
                  const station = stations.find((s) => s.id === sm.stationId);
                  if (!material) return null;
                  const ratio = (sm.currentStock / material.minStock) * 100;
                  return (
                    <div key={sm.materialId + sm.stationId} className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-800">
                          {material.name}
                        </p>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            sm.currentStock === 0
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          )}
                        >
                          {sm.currentStock === 0 ? "缺货" : "库存低"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        {station?.name} · 当前 {sm.currentStock} {material.unit} / 最低{" "}
                        {material.minStock} {material.unit}
                      </p>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            ratio < 30 ? "bg-red-500" : "bg-yellow-500"
                          )}
                          style={{ width: `${Math.min(100, ratio)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {escalatedCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <ArrowUpRight className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800">升级告警</h3>
                  <p className="text-sm text-red-600 mt-1">
                    有 {escalatedCount} 个工单已升级，需要您的关注
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
