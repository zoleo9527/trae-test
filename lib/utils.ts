import { type ClassValue, clsx } from "clsx";
import { format, formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return format(new Date(date), "yyyy-MM-dd HH:mm", { locale: zhCN });
}

export function formatRelativeTime(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN });
}

export const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "待处理", className: "bg-yellow-100 text-yellow-800" },
  assigned: { label: "已派单", className: "bg-blue-100 text-blue-800" },
  processing: { label: "处理中", className: "bg-orange-100 text-orange-800" },
  reviewing: { label: "审核中", className: "bg-purple-100 text-purple-800" },
  completed: { label: "已完成", className: "bg-green-100 text-green-800" },
  rejected: { label: "已驳回", className: "bg-red-100 text-red-800" },
  escalated: { label: "已升级", className: "bg-rose-100 text-rose-800" },
};

export const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: "低", className: "bg-gray-100 text-gray-800" },
  medium: { label: "中", className: "bg-blue-100 text-blue-800" },
  high: { label: "高", className: "bg-orange-100 text-orange-800" },
  urgent: { label: "紧急", className: "bg-red-100 text-red-800" },
};

export const typeConfig: Record<string, { label: string; className: string }> = {
  repair: { label: "设备维修", className: "bg-red-100 text-red-800" },
  restock: { label: "耗材补货", className: "bg-green-100 text-green-800" },
  inspection: { label: "例行巡检", className: "bg-blue-100 text-blue-800" },
  complaint: { label: "投诉退款", className: "bg-purple-100 text-purple-800" },
};

export const roleConfig: Record<string, { label: string; className: string }> = {
  supervisor: { label: "运营主管", className: "bg-indigo-100 text-indigo-800" },
  inspector: { label: "巡检员", className: "bg-green-100 text-green-800" },
  customer_service: { label: "客服", className: "bg-purple-100 text-purple-800" },
};

export const stationStatusConfig: Record<string, { label: string; className: string }> = {
  normal: { label: "正常", className: "bg-green-100 text-green-800" },
  warning: { label: "预警", className: "bg-yellow-100 text-yellow-800" },
  fault: { label: "故障", className: "bg-red-100 text-red-800" },
  maintenance: { label: "维护中", className: "bg-blue-100 text-blue-800" },
};

export const materialStatusConfig: Record<string, { label: string; className: string }> = {
  normal: { label: "正常", className: "bg-green-100 text-green-800" },
  low: { label: "库存低", className: "bg-yellow-100 text-yellow-800" },
  out_of_stock: { label: "缺货", className: "bg-red-100 text-red-800" },
};

export const refundStatusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "待审核", className: "bg-yellow-100 text-yellow-800" },
  reviewing: { label: "审核中", className: "bg-blue-100 text-blue-800" },
  approved: { label: "已通过", className: "bg-green-100 text-green-800" },
  rejected: { label: "已驳回", className: "bg-red-100 text-red-800" },
  transferred: { label: "已转账", className: "bg-emerald-100 text-emerald-800" },
};
