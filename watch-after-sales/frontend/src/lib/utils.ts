import { format } from "date-fns";

export function formatDateCN(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return format(new Date(dateStr), "yyyy年MM月dd日 HH:mm");
}

export const STATUS_LABELS: Record<string, string> = {
  registered: "已登记",
  diagnosing: "诊断中",
  quoted: "已报价",
  confirmed: "已确认",
  repairing: "维修中",
  completed: "已完工",
  picked_up: "已取件",
};

export const STATUS_COLORS: Record<string, string> = {
  registered: "bg-gray-100 text-gray-700",
  diagnosing: "bg-blue-100 text-blue-700",
  quoted: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-orange-100 text-orange-700",
  repairing: "bg-purple-100 text-purple-700",
  completed: "bg-teal-100 text-teal-700",
  picked_up: "bg-emerald-100 text-emerald-700",
};

export const ROLE_LABELS: Record<string, string> = {
  manager: "售后经理",
  consultant: "接件顾问",
  technician: "维修技师",
};

export const CALLBACK_TYPE_LABELS: Record<string, string> = {
  satisfaction: "满意度回访",
  repair_progress: "维修进度回访",
  pickup_reminder: "取件提醒",
};

export const CALLBACK_RESULT_LABELS: Record<string, string> = {
  satisfied: "满意",
  neutral: "一般",
  unsatisfied: "不满意",
};

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  repair_order: "维修工单",
  part: "配件",
  user: "用户",
  satisfaction_callback: "回访",
};
