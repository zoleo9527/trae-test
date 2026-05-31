"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  AlertTriangle,
  Package,
  Phone,
  Clock,
  Wrench,
  CheckCircle,
  Truck,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatDateCN } from "@/lib/utils";
import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/AppLayout";
import StatusBadge from "@/components/StatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";

interface RepairOrder {
  id: number;
  order_no: string;
  customer: { name: string };
  watch_brand: string;
  watch_model: string;
  status: string;
  created_at: string;
}

interface Part {
  id: number;
  sku: string;
  name: string;
  quantity: number;
  locked_quantity: number;
  min_quantity: number;
}

interface Callback {
  id: number;
  repair_order_id: number;
  callback_type: string;
  scheduled_at: string;
}

function DashboardContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentOrders, setRecentOrders] = useState<RepairOrder[]>([]);
  const [overdueCallbacks, setOverdueCallbacks] = useState<Callback[]>([]);
  const [lowStockParts, setLowStockParts] = useState<Part[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [repairsRes, callbacksRes, partsRes] = await Promise.all([
          apiFetch<{ data: RepairOrder[]; total: number }>("/repairs?page=1&page_size=5"),
          apiFetch<Callback[]>("/callbacks/overdue"),
          apiFetch<{ data: Part[]; total: number }>("/parts?page_size=100"),
        ]);
        if (cancelled) return;

        setRecentOrders(repairsRes.data || []);
        const callbacks = callbacksRes instanceof Array ? callbacksRes : [];
        setOverdueCallbacks(callbacks);

        const allParts = Array.isArray(partsRes.data) ? partsRes.data : [];
        const lowStock = allParts.filter(
          (p) => p.quantity - p.locked_quantity <= p.min_quantity
        );
        setLowStockParts(lowStock);

        const statusCounts: Record<string, number> = { total: repairsRes.total || 0 };
        const allRes = await apiFetch<{ data: RepairOrder[]; total: number }>(
          `/repairs?page=1&page_size=${repairsRes.total || 100}`
        );
        if (cancelled) return;
        (allRes.data || []).forEach((o) => {
          statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        });
        statusCounts.overdue_callbacks = callbacks.length;
        statusCounts.low_stock = lowStock.length;
        setStats(statusCounts);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <LoadingSpinner />;

  const statCards = [
    { label: "总工单数", value: stats.total || 0, icon: ClipboardList, color: "bg-blue-500" },
    { label: "诊断中", value: stats.diagnosing || 0, icon: Clock, color: "bg-blue-400" },
    { label: "维修中", value: stats.repairing || 0, icon: Wrench, color: "bg-purple-500" },
    { label: "已完工", value: stats.completed || 0, icon: CheckCircle, color: "bg-teal-500" },
    { label: "已取件", value: stats.picked_up || 0, icon: Truck, color: "bg-emerald-500" },
    { label: "逾期回访", value: stats.overdue_callbacks || 0, icon: Phone, color: "bg-red-500" },
    { label: "库存不足", value: stats.low_stock || 0, icon: Package, color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">仪表盘</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className={`${card.color} p-2 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold">最近工单</h3>
          </div>
          <div className="divide-y">
            {recentOrders.length === 0 ? (
              <p className="px-4 py-6 text-center text-gray-400 text-sm">暂无工单</p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/repairs/${order.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium">{order.order_no}</p>
                    <p className="text-xs text-gray-500">
                      {order.customer?.name || "-"} - {order.watch_brand} {order.watch_model}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="text-xs text-gray-400">{formatDateCN(order.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="font-semibold">逾期回访</h3>
            </div>
            <div className="divide-y">
              {overdueCallbacks.length === 0 ? (
                <p className="px-4 py-6 text-center text-gray-400 text-sm">无逾期回访</p>
              ) : (
                overdueCallbacks.slice(0, 5).map((cb) => (
                  <div key={cb.id} className="px-4 py-3">
                    <p className="text-sm">工单 #{cb.repair_order_id}</p>
                    <p className="text-xs text-gray-500">
                      计划时间: {formatDateCN(cb.scheduled_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold">库存不足配件</h3>
            </div>
            <div className="divide-y">
              {lowStockParts.length === 0 ? (
                <p className="px-4 py-6 text-center text-gray-400 text-sm">无库存不足配件</p>
              ) : (
                lowStockParts.slice(0, 5).map((part) => (
                  <div key={part.id} className="px-4 py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{part.name}</p>
                      <p className="text-xs text-gray-500">SKU: {part.sku}</p>
                    </div>
                    <span className="text-sm text-red-600 font-medium">
                      可用: {part.quantity - part.locked_quantity} / 最低: {part.min_quantity}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <DashboardContent />
      </AppLayout>
    </AuthGuard>
  );
}
