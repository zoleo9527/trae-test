"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit2 } from "lucide-react";
import { apiFetch, AppError } from "@/lib/api";
import RoleGuard from "@/components/RoleGuard";
import ErrorAlert from "@/components/ErrorAlert";
import LoadingSpinner from "@/components/LoadingSpinner";
import DataTable from "@/components/DataTable";

interface Part {
  id: number;
  sku: string;
  name: string;
  quantity: number;
  locked_quantity: number;
  min_quantity: number;
  unit_price: number;
  available_quantity?: number;
}

export default function PartsPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editPart, setEditPart] = useState<Part | null>(null);
  const [form, setForm] = useState({
    sku: "",
    name: "",
    quantity: "",
    min_quantity: "",
    unit_price: "",
  });

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
        if (search) params.set("keyword", search);
        const res = await apiFetch<{ data: Part[]; total: number; total_pages: number }>(
          `/parts?${params}`
        );
        if (!cancelled) {
          setParts(res.data || []);
          setTotal(res.total || 0);
          setTotalPages(res.total_pages || 1);
        }
      } catch (err) {
        if (!cancelled) setError(err as AppError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [page, search, refreshKey]);

  const openCreate = () => {
    setEditPart(null);
    setForm({ sku: "", name: "", quantity: "", min_quantity: "0", unit_price: "" });
    setModal(true);
  };

  const openEdit = (part: Part) => {
    setEditPart(part);
    setForm({
      sku: part.sku,
      name: part.name,
      quantity: String(part.quantity),
      min_quantity: String(part.min_quantity),
      unit_price: String(part.unit_price),
    });
    setModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = {
        sku: form.sku,
        name: form.name,
        quantity: parseInt(form.quantity),
        min_quantity: parseInt(form.min_quantity),
        unit_price: parseFloat(form.unit_price),
      };
      if (editPart) {
        await apiFetch(`/parts/${editPart.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/parts", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setModal(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err as AppError);
    }
  };

  const columns = [
    { key: "sku", title: "SKU", render: (item: Part) => item.sku },
    { key: "name", title: "名称", render: (item: Part) => item.name },
    { key: "quantity", title: "库存", render: (item: Part) => item.quantity },
    { key: "locked_quantity", title: "锁定数", render: (item: Part) => item.locked_quantity },
    {
      key: "available",
      title: "可用数",
      render: (item: Part) => {
        const available = item.available_quantity ?? (item.quantity - item.locked_quantity);
        const isLow = available <= item.min_quantity;
        return <span className={isLow ? "text-red-600 font-medium" : ""}>{available}</span>;
      },
    },
    { key: "min_quantity", title: "最低库存", render: (item: Part) => item.min_quantity },
    { key: "unit_price", title: "单价", render: (item: Part) => `¥${item.unit_price}` },
    {
      key: "actions",
      title: "",
      render: (item: Part) => (
        <RoleGuard allowed={["manager", "consultant"]}>
          <button onClick={() => openEdit(item)} className="text-blue-600 hover:text-blue-800">
            <Edit2 className="w-4 h-4" />
          </button>
        </RoleGuard>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">配件管理</h2>
        <RoleGuard allowed={["manager", "consultant"]}>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            添加配件
          </button>
        </RoleGuard>
      </div>

      <ErrorAlert error={error} onClose={() => setError(null)} />

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="搜索配件名称/SKU"
              className="w-full border rounded pl-9 pr-3 py-1.5 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <DataTable
            columns={columns}
            data={parts}
            total={total}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            onPageChange={setPage}
            rowKey={(item) => item.id}
          />
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 space-y-4">
            <h3 className="font-semibold">{editPart ? "编辑配件" : "添加配件"}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">SKU *</label>
                <input
                  type="text"
                  required
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  disabled={!!editPart}
                  className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">名称 *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">库存 *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">最低库存</label>
                  <input
                    type="number"
                    min="0"
                    value={form.min_quantity}
                    onChange={(e) => setForm({ ...form, min_quantity: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">单价 *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={form.unit_price}
                    onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  {editPart ? "保存" : "创建"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
