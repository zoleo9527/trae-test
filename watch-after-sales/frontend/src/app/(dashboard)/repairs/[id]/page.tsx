"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRightCircle,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { apiFetch, AppError } from "@/lib/api";
import {
  STATUS_LABELS,
  CALLBACK_TYPE_LABELS,
  CALLBACK_RESULT_LABELS,
  formatDateCN,
} from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import StatusBadge from "@/components/StatusBadge";
import ErrorAlert from "@/components/ErrorAlert";
import ConfirmDialog from "@/components/ConfirmDialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import RoleGuard from "@/components/RoleGuard";

interface ProgressLog {
  id: number;
  status_from: string;
  status_to: string;
  note: string;
  operator_name: string;
  created_at: string;
}

interface PartLock {
  id: number;
  part_id: number;
  part_name: string;
  quantity: number;
}

interface Callback {
  id: number;
  callback_type: string;
  scheduled_at: string;
  completed_at: string | null;
  result: string | null;
  note: string | null;
  is_overdue: boolean;
}

interface AuditLogEntry {
  id: number;
  operator_name: string;
  action: string;
  old_value: Record<string, unknown>;
  new_value: Record<string, unknown>;
  created_at: string;
}

interface Part {
  id: number;
  sku: string;
  name: string;
  quantity: number;
  locked_quantity: number;
  min_quantity: number;
  unit_price: number;
  available_quantity: number;
}

interface RepairOrder {
  id: number;
  order_no: string;
  customer: { name: string; phone: string };
  watch_brand: string;
  watch_model: string;
  watch_serial: string;
  issue_description: string;
  status: string;
  assigned_technician?: { display_name: string };
  quotation_price?: number;
  quotation_note?: string;
  created_at: string;
  progress_logs: ProgressLog[];
  part_locks: PartLock[];
  callbacks: Callback[];
  audit_logs: AuditLogEntry[];
}

const STATUS_TRANSITIONS: Record<string, { next: string[]; roles: string[] }[]> = {
  registered: [{ next: ["diagnosing"], roles: ["manager", "consultant", "technician"] }],
  diagnosing: [{ next: ["quoted"], roles: ["manager", "technician"] }],
  quoted: [{ next: ["confirmed", "registered"], roles: ["manager", "consultant"] }],
  confirmed: [{ next: ["repairing"], roles: ["manager", "technician"] }],
  repairing: [{ next: ["completed"], roles: ["manager", "technician"] }],
  completed: [{ next: ["picked_up"], roles: ["manager", "consultant"] }],
  picked_up: [],
};

export default function RepairDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuthStore();

  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [nextStatus, setNextStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [parts, setParts] = useState<Part[]>([]);
  const [lockPartId, setLockPartId] = useState("");
  const [lockQuantity, setLockQuantity] = useState("1");
  const [showLockForm, setShowLockForm] = useState(false);
  const [unlockDialog, setUnlockDialog] = useState<number | null>(null);
  const [completeCallbackId, setCompleteCallbackId] = useState<number | null>(null);
  const [callbackResult, setCallbackResult] = useState("");
  const [callbackNote, setCallbackNote] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiFetch<RepairOrder>(`/repairs/${id}`);
        if (!cancelled) setOrder(res);
      } catch (err) {
        if (!cancelled) setError(err as AppError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id, refreshKey]);

  const loadParts = async () => {
    try {
      const params = new URLSearchParams({ page_size: "100" });
      const res = await apiFetch<{ data: Part[]; total: number }>(`/parts?${params}`);
      setParts(Array.isArray(res.data) ? res.data : []);
    } catch {}
  };

  const handleStatusChange = async () => {
    try {
      await apiFetch(`/repairs/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status: nextStatus, note: statusNote }),
      });
      setStatusDialog(false);
      setNextStatus("");
      setStatusNote("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err as AppError);
    }
  };

  const handleLockPart = async () => {
    try {
      await apiFetch(`/repairs/${id}/lock-part`, {
        method: "POST",
        body: JSON.stringify({
          part_id: parseInt(lockPartId),
          quantity: parseInt(lockQuantity),
        }),
      });
      setShowLockForm(false);
      setLockPartId("");
      setLockQuantity("1");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err as AppError);
    }
  };

  const handleUnlockPart = async (lockId: number) => {
    try {
      await apiFetch(`/repairs/${id}/lock-part/${lockId}`, { method: "DELETE" });
      setUnlockDialog(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err as AppError);
    }
  };

  const handleCompleteCallback = async () => {
    if (!completeCallbackId) return;
    try {
      await apiFetch(`/callbacks/${completeCallbackId}/complete`, {
        method: "PATCH",
        body: JSON.stringify({ result: callbackResult, note: callbackNote }),
      });
      setCompleteCallbackId(null);
      setCallbackResult("");
      setCallbackNote("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err as AppError);
    }
  };

  const getAvailableTransitions = () => {
    if (!order || !user) return [];
    const transitions = STATUS_TRANSITIONS[order.status] || [];
    return transitions.filter((t) => t.roles.includes(user.role)).flatMap((t) => t.next);
  };

  if (loading) return <LoadingSpinner />;
  if (!order) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>工单不存在</p>
        <button onClick={() => router.push("/repairs")} className="mt-2 text-blue-600 hover:underline">
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/repairs")} className="p-2 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">工单 {order.order_no}</h2>
        <StatusBadge status={order.status} />
      </div>

      <ErrorAlert error={error} onClose={() => setError(null)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">工单信息</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">客户姓名：</span>{order.customer?.name || "-"}</div>
              <div><span className="text-gray-500">联系电话：</span>{order.customer?.phone || "-"}</div>
              <div><span className="text-gray-500">品牌：</span>{order.watch_brand}</div>
              <div><span className="text-gray-500">型号：</span>{order.watch_model}</div>
              <div><span className="text-gray-500">序列号：</span>{order.watch_serial || "-"}</div>
              <div><span className="text-gray-500">技师：</span>{order.assigned_technician?.display_name || "-"}</div>
              <div><span className="text-gray-500">创建时间：</span>{formatDateCN(order.created_at)}</div>
            </div>
            <div className="mt-4 text-sm">
              <span className="text-gray-500">问题描述：</span>
              <p className="mt-1">{order.issue_description}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">报价信息</h3>
            {order.quotation_price ? (
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-500">报价金额：</span>¥{order.quotation_price}</div>
                <div><span className="text-gray-500">报价备注：</span>{order.quotation_note || "-"}</div>
                {order.status === "quoted" && (
                  <RoleGuard allowed={["manager", "consultant"]}>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => { setNextStatus("confirmed"); setStatusDialog(true); }}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        确认报价
                      </button>
                      <button
                        onClick={() => { setNextStatus("registered"); setStatusDialog(true); }}
                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        拒绝报价
                      </button>
                    </div>
                  </RoleGuard>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">尚未报价</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">配件使用</h3>
            {order.part_locks?.length > 0 ? (
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left text-gray-500">配件</th>
                    <th className="py-2 text-left text-gray-500">数量</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {order.part_locks.map((lock) => (
                    <tr key={lock.id} className="border-b">
                      <td className="py-2">{lock.part_name}</td>
                      <td className="py-2">{lock.quantity}</td>
                      <td className="py-2">
                        <RoleGuard allowed={["manager", "technician"]}>
                          <button
                            onClick={() => setUnlockDialog(lock.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </RoleGuard>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-400 mb-4">暂无锁定配件</p>
            )}
            <RoleGuard allowed={["manager", "technician"]}>
              {!showLockForm ? (
                <button
                  onClick={() => { setShowLockForm(true); loadParts(); }}
                  className="px-3 py-1.5 border text-sm rounded hover:bg-gray-50 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  锁定配件
                </button>
              ) : (
                <div className="flex gap-2 items-end">
                  <div>
                    <label className="text-xs text-gray-500">配件</label>
                    <select
                      value={lockPartId}
                      onChange={(e) => setLockPartId(e.target.value)}
                      className="block border rounded px-2 py-1.5 text-sm"
                    >
                      <option value="">选择配件</option>
                      {parts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (可用: {p.available_quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">数量</label>
                    <input
                      type="number"
                      min="1"
                      value={lockQuantity}
                      onChange={(e) => setLockQuantity(e.target.value)}
                      className="border rounded px-2 py-1.5 text-sm w-20"
                    />
                  </div>
                  <button
                    onClick={handleLockPart}
                    disabled={!lockPartId}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    确认
                  </button>
                  <button
                    onClick={() => setShowLockForm(false)}
                    className="px-3 py-1.5 border text-sm rounded hover:bg-gray-50"
                  >
                    取消
                  </button>
                </div>
              )}
            </RoleGuard>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">回访记录</h3>
            {!order.callbacks?.length ? (
              <p className="text-sm text-gray-400">暂无回访记录</p>
            ) : (
              <div className="space-y-3">
                {order.callbacks.map((cb) => (
                  <div key={cb.id} className="border rounded p-3 text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">
                          {CALLBACK_TYPE_LABELS[cb.callback_type] || cb.callback_type}
                        </span>
                        <span className="ml-2 text-gray-500">计划: {formatDateCN(cb.scheduled_at)}</span>
                        {cb.is_overdue && !cb.completed_at && (
                          <span className="ml-2 text-red-500 text-xs">已逾期</span>
                        )}
                      </div>
                      {cb.completed_at ? (
                        <span className="text-green-600 text-xs">已完成</span>
                      ) : (
                        <button
                          onClick={() => setCompleteCallbackId(cb.id)}
                          className="text-blue-600 text-xs hover:underline"
                        >
                          完成
                        </button>
                      )}
                    </div>
                    {cb.completed_at && (
                      <div className="mt-1 text-gray-500">
                        <span>完成: {formatDateCN(cb.completed_at)}</span>
                        {cb.result && (
                          <span className="ml-2">
                            结果: {CALLBACK_RESULT_LABELS[cb.result] || cb.result}
                          </span>
                        )}
                        {cb.note && <span className="ml-2">备注: {cb.note}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">状态操作</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">当前状态</p>
              <StatusBadge status={order.status} />
            </div>
            {getAvailableTransitions().length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">可执行操作</p>
                {getAvailableTransitions().map((s) => (
                  <button
                    key={s}
                    onClick={() => { setNextStatus(s); setStatusDialog(true); }}
                    className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center gap-1"
                  >
                    <ArrowRightCircle className="w-4 h-4" />
                    转为{STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">状态时间线</h3>
            <div className="space-y-4">
              {[...(order.progress_logs || [])].reverse().map((log) => (
                <div key={log.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-full mt-1" />
                    <div className="w-0.5 flex-1 bg-gray-200" />
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium">
                      {STATUS_LABELS[log.status_from] || log.status_from} → {STATUS_LABELS[log.status_to] || log.status_to}
                    </p>
                    <p className="text-xs text-gray-500">
                      {log.operator_name} · {formatDateCN(log.created_at)}
                    </p>
                    {log.note && <p className="text-xs text-gray-600 mt-1">{log.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">审计日志</h3>
            {!order.audit_logs?.length ? (
              <p className="text-sm text-gray-400">暂无日志</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {order.audit_logs.map((log) => (
                  <div key={log.id} className="text-xs border-b pb-2">
                    <p className="text-gray-700">{log.operator_name} - {log.action}</p>
                    <p className="text-gray-400">{formatDateCN(log.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={statusDialog}
        title="变更状态"
        message={`确认将工单状态变更为「${STATUS_LABELS[nextStatus] || nextStatus}」？`}
        onConfirm={handleStatusChange}
        onCancel={() => { setStatusDialog(false); setNextStatus(""); setStatusNote(""); }}
      />

      <ConfirmDialog
        open={unlockDialog !== null}
        title="解锁配件"
        message="确认解锁此配件？库存将恢复。"
        onConfirm={() => unlockDialog && handleUnlockPart(unlockDialog)}
        onCancel={() => setUnlockDialog(null)}
      />

      {completeCallbackId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 space-y-4">
            <h3 className="font-semibold">完成回访</h3>
            <div>
              <label className="block text-sm text-gray-700 mb-1">回访结果 *</label>
              <select
                value={callbackResult}
                onChange={(e) => setCallbackResult(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">请选择</option>
                <option value="satisfied">满意</option>
                <option value="neutral">一般</option>
                <option value="unsatisfied">不满意</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">备注</label>
              <textarea
                value={callbackNote}
                onChange={(e) => setCallbackNote(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setCompleteCallbackId(null); setCallbackResult(""); setCallbackNote(""); }}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCompleteCallback}
                disabled={!callbackResult}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
