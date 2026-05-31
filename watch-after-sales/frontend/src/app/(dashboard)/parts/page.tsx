"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit2 } from "lucide-react";
import { apiFetch, AppError } from "@/lib/api";
import RoleGuard from "@/components/RoleGuard";
import ErrorAlert from "@/components/ErrorAlert";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Part {
  id: number;
  sku: string;
  name: string;
  stock_quantity: number;
  locked_quantity: number;
  minimum_stock: number;
  unit_price: number;
}

export default function PartsPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editPart, setEditPart] = useState<Part | null>(null);
  const [form, setForm] = useState({
    sku: "",
    name: "",
    stock_quantity: "",
    minimum_stock: "",
    unit_price: "",
  });

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiFetch<Part[]>("/parts");
        if (!cancelled) setParts(res instanceof Array ? res : []);
      } catch (err) {
        if (!cancelled) setError(err as AppError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const openCreate = () => {
    setEditPart(null);
    setForm({ sku: "", name: "", stock_quantity: "", minimum_stock: "0", unit_price: "" });
    setModal(true);
  };

  const openEdit = (part: Part) => {
    setEditPart(part);
    setForm({
      sku: part.sku,
      name: part.name,
      stock_quantity: String(part.stock_quantity),
      minimum_stock: String(part.minimum_stock),
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
        stock_quantity: parseInt(form.stock_quantity),
        minimum_stock: parseInt(form.minimum_stock),
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

  const filtered = parts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索配件名称/SKU"
              className="w-full border rounded pl-9 pr-3 py-1.5 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">库存</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">锁定数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">可用数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">最低库存</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">单价</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">暂无配件</td>
                </tr>
              ) : (
                filtered.map((part) => {
                  const available = part.stock_quantity - part.locked_quantity;
                  const isLow = available <= part.minimum_stock;
                  return (
                    <tr key={part.id} className={isLow ? "bg-red-50" : ""}>
                      <td className="px-4 py-3 text-sm">{part.sku}</td>
                      <td className="px-4 py-3 text-sm">{part.name}</td>
                      <td className="px-4 py-3 text-sm">{part.stock_quantity}</td>
                      <td className="px-4 py-3 text-sm">{part.locked_quantity}</td>
                      <td className={`px-4 py-3 text-sm font-medium ${isLow ? "text-red-600" : ""}`}>
                        {available}
                      </td>
                      <td className="px-4 py-3 text-sm">{part.minimum_stock}</td>
                      <td className="px-4 py-3 text-sm">¥{part.unit_price}</td>
                      <td className="px-4 py-3">
                        <RoleGuard allowed={["manager", "consultant"]}>
                          <button onClick={() => openEdit(part)} className="text-blue-600 hover:text-blue-800">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </RoleGuard>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
                    value={form.stock_quantity}
                    onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">最低库存</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minimum_stock}
                    onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })}
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
