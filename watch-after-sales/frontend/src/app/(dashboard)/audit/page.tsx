"use client";

import { useEffect, useState } from "react";
import { apiFetch, AppError } from "@/lib/api";
import { ENTITY_TYPE_LABELS, formatDateCN } from "@/lib/utils";
import DataTable from "@/components/DataTable";
import FilterBar, { FilterField } from "@/components/FilterBar";
import ErrorAlert from "@/components/ErrorAlert";
import LoadingSpinner from "@/components/LoadingSpinner";

interface AuditLog {
  id: number;
  operator_name: string;
  entity_type: string;
  entity_id: number;
  action: string;
  old_value: string;
  new_value: string;
  created_at: string;
}

const FILTER_FIELDS: FilterField[] = [
  {
    key: "entity_type",
    label: "实体类型",
    type: "select",
    options: Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => ({ value, label })),
  },
  { key: "date_from", label: "开始日期", type: "date" },
  { key: "date_to", label: "结束日期", type: "date" },
];

export default function AuditPage() {
  const [data, setData] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const pageSize = 20;

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
        const res = await apiFetch<{ data: AuditLog[]; total: number }>(`/audit-logs?${params}`);
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
  }, [page, filters]);

  const columns = [
    {
      key: "created_at",
      title: "时间",
      render: (item: AuditLog) => formatDateCN(item.created_at),
    },
    { key: "operator_name", title: "操作人" },
    {
      key: "entity_type",
      title: "实体类型",
      render: (item: AuditLog) => ENTITY_TYPE_LABELS[item.entity_type] || item.entity_type,
    },
    { key: "entity_id", title: "实体ID" },
    { key: "action", title: "操作" },
    {
      key: "old_value",
      title: "变更前",
      render: (item: AuditLog) => (
        <span className="text-gray-500 text-xs max-w-[200px] truncate block">{item.old_value || "-"}</span>
      ),
    },
    {
      key: "new_value",
      title: "变更后",
      render: (item: AuditLog) => (
        <span className="text-xs max-w-[200px] truncate block">{item.new_value || "-"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">审计日志</h2>

      <ErrorAlert error={error} onClose={() => setError(null)} />

      <FilterBar
        fields={FILTER_FIELDS}
        values={filters}
        onChange={(v) => {
          setFilters(v);
          setPage(1);
        }}
        onSearch={() => setFilters((prev) => ({ ...prev }))}
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
    </div>
  );
}
