"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Download, ArrowRightCircle } from "lucide-react";
import { apiFetch, downloadCSV, AppError } from "@/lib/api";
import { STATUS_LABELS, formatDateCN } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import DataTable from "@/components/DataTable";
import FilterBar, { FilterField } from "@/components/FilterBar";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import ErrorAlert from "@/components/ErrorAlert";
import LoadingSpinner from "@/components/LoadingSpinner";

interface RepairOrder {
  id: number;
  order_number: string;
  customer_name: string;
  watch_brand: string;
  watch_model: string;
  status: string;
  assigned_technician_name: string;
  created_at: string;
}

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));

const FILTER_FIELDS: FilterField[] = [
  { key: "status", label: "状态", type: "select", options: STATUS_OPTIONS },
  { key: "watch_brand", label: "品牌", type: "text", placeholder: "搜索品牌" },
  { key: "date_from", label: "开始日期", type: "date" },
  { key: "date_to", label: "结束日期", type: "date" },
  { key: "keyword", label: "关键词", type: "text", placeholder: "工单号/客户名" },
];

export default function RepairsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<RepairOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [error, setError] = useState<AppError | null>(null);
  const [batchDialog, setBatchDialog] = useState(false);
  const [batchStatus, setBatchStatus] = useState("");
  const [batchNote, setBatchNote] = useState("");

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
        const res = await apiFetch<{ data: RepairOrder[]; total: number }>(`/repairs?${params}`);
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

  const handleBatchStatus = async () => {
    try {
      await apiFetch("/repairs/batch-status", {
        method: "POST",
        body: JSON.stringify({
          order_ids: selectedIds,
          status: batchStatus,
          note: batchNote,
        }),
      });
      setBatchDialog(false);
      setBatchStatus("");
      setBatchNote("");
      setSelectedIds([]);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err as AppError);
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    downloadCSV(`/exports/repairs/csv?${params}`, "repairs.csv");
  };

  const columns = [
    { key: "order_number", title: "工单号" },
    { key: "customer_name", title: "客户" },
    {
      key: "watch_brand",
      title: "品牌/型号",
      render: (item: RepairOrder) => `${item.watch_brand} ${item.watch_model}`,
    },
    {
      key: "status",
      title: "状态",
      render: (item: RepairOrder) => <StatusBadge status={item.status} />,
    },
    { key: "assigned_technician_name", title: "技师" },
    {
      key: "created_at",
      title: "创建时间",
      render: (item: RepairOrder) => formatDateCN(item.created_at),
    },
  ];

  const getNextStatuses = (currentStatus: string): string[] => {
    const flow: Record<string, string[]> = {
      registered: ["diagnosing"],
      diagnosing: ["quoted"],
      quoted: ["confirmed"],
      confirmed: ["repairing"],
      repairing: ["completed"],
      completed: ["picked_up"],
      picked_up: [],
    };
    return flow[currentStatus] || [];
  };

  const allNextStatuses = Array.from(
    new Set(selectedIds.flatMap((id) => {
      const order = data.find((o) => o.id === id);
      return order ? getNextStatuses(order.status) : [];
    }))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">寄修登记</h2>
        <div className="flex gap-2">
          {(user?.role === "manager" || user?.role === "consultant") && (
            <button
              onClick={() => router.push("/repairs/new")}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              新建工单
            </button>
          )}
          <button
            onClick={handleExport}
            className="px-4 py-2 border text-sm rounded hover:bg-gray-50 flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            导出CSV
          </button>
        </div>
      </div>

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

      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-blue-700">已选择 {selectedIds.length} 项</span>
          <div className="flex gap-2">
            <select
              value={batchStatus}
              onChange={(e) => setBatchStatus(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">选择目标状态</option>
              {allNextStatuses.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s] || s}
                </option>
              ))}
            </select>
            <button
              onClick={() => setBatchDialog(true)}
              disabled={!batchStatus}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            >
              <ArrowRightCircle className="w-4 h-4" />
              批量变更
            </button>
          </div>
        </div>
      )}

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
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            rowKey={(item) => item.id}
            onRowClick={(item) => router.push(`/repairs/${item.id}`)}
          />
        </div>
      )}

      <ConfirmDialog
        open={batchDialog}
        title="批量变更状态"
        message={`确认将 ${selectedIds.length} 个工单的状态变更为「${STATUS_LABELS[batchStatus] || batchStatus}」？`}
        onConfirm={handleBatchStatus}
        onCancel={() => setBatchDialog(false)}
      />
    </div>
  );
}
