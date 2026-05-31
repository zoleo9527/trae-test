"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, AppError } from "@/lib/api";
import {
  CALLBACK_TYPE_LABELS,
  CALLBACK_RESULT_LABELS,
  formatDateCN,
} from "@/lib/utils";
import DataTable from "@/components/DataTable";
import FilterBar, { FilterField } from "@/components/FilterBar";
import ErrorAlert from "@/components/ErrorAlert";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Callback {
  id: number;
  repair_order_id: number;
  order_number: string;
  callback_type: string;
  scheduled_at: string;
  completed_at: string | null;
  result: string | null;
  note: string | null;
  operator_name: string;
}

const FILTER_FIELDS: FilterField[] = [
  {
    key: "completed",
    label: "完成状态",
    type: "select",
    options: [
      { value: "false", label: "未完成" },
      { value: "true", label: "已完成" },
    ],
  },
  {
    key: "callback_type",
    label: "回访类型",
    type: "select",
    options: Object.entries(CALLBACK_TYPE_LABELS).map(([value, label]) => ({ value, label })),
  },
];

export default function CallbacksPage() {
  const router = useRouter();
  const [data, setData] = useState<Callback[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [completeId, setCompleteId] = useState<number | null>(null);
  const [result, setResult] = useState("");
  const [note, setNote] = useState("");
  const pageSize = 20;
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          page_size: String(pageSize),
        });
        Object.entries(filters).forEach(([k, v]) => {
          if (v) params.set(k, v);
        });
        const res = await apiFetch<{ data: Callback[]; total: number }>(`/callbacks?${params}`);
        if (!cancelled) {
          setData(res.data || []);
          setTotal(res.total || 0);
        }
      } catch (err) {
        if (!cancelled) setError(err as AppError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [page, filters, refreshKey]);

  const handleComplete = async () => {
    if (!completeId) return;
    try {
      await apiFetch(`/callbacks/${completeId}/complete`, {
        method: "PATCH",
        body: JSON.stringify({ result, note }),
      });
      setCompleteId(null);
      setResult("");
      setNote("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err as AppError);
    }
  };

  const columns = [
    {
      key: "order_number",
      title: "工单号",
      render: (item: Callback) => (
        <button
          onClick={() => router.push(`/repairs/${item.repair_order_id}`)}
          className="text-blue-600 hover:underline"
        >
          {item.order_number || `#${item.repair_order_id}`}
        </button>
      ),
    },
    {
      key: "callback_type",
      title: "回访类型",
      render: (item: Callback) => CALLBACK_TYPE_LABELS[item.callback_type] || item.callback_type,
    },
    {
      key: "scheduled_at",
      title: "计划时间",
      render: (item: Callback) => formatDateCN(item.scheduled_at),
    },
    {
      key: "completed_at",
      title: "完成时间",
      render: (item: Callback) => formatDateCN(item.completed_at),
    },
    {
      key: "result",
      title: "结果",
      render: (item: Callback) =>
        item.result ? (
          <span
            className={`text-sm font-medium ${
              item.result === "satisfied"
                ? "text-green-600"
                : item.result === "unsatisfied"
                ? "text-red-600"
                : "text-gray-600"
            }`}
          >
            {CALLBACK_RESULT_LABELS[item.result] || item.result}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: "action",
      title: "操作",
      render: (item: Callback) =>
        !item.completed_at ? (
          <button
            onClick={() => setCompleteId(item.id)}
            className="text-blue-600 text-sm hover:underline"
          >
            完成
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">回访管理</h2>

      <ErrorAlert error={error} onClose={() => setError(null)} />

      <FilterBar
        fields={FILTER_FIELDS}
        values={filters}
        onChange={(v) => {
          setFilters(v);
          setPage(1);
        }}
        onSearch={() => setRefreshKey((k) => k + 1)}
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow">
          <DataTable
            columns={columns}
            data={data}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            rowKey={(item) => item.id}
          />
        </div>
      )}

      {completeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 space-y-4">
            <h3 className="font-semibold">完成回访</h3>
            <div>
              <label className="block text-sm text-gray-700 mb-1">回访结果 *</label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value)}
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
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setCompleteId(null); setResult(""); setNote(""); }}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleComplete}
                disabled={!result}
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
