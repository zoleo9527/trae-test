"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiFetch, AppError } from "@/lib/api";
import ErrorAlert from "@/components/ErrorAlert";

export default function NewRepairPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    watch_brand: "",
    watch_model: "",
    serial_number: "",
    issue_description: "",
    estimated_price: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, string | number> = {
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        watch_brand: form.watch_brand,
        watch_model: form.watch_model,
        serial_number: form.serial_number,
        issue_description: form.issue_description,
      };
      if (form.estimated_price) {
        body.estimated_price = parseFloat(form.estimated_price);
      }
      const res = await apiFetch<{ id: number }>("/repairs", {
        method: "POST",
        body: JSON.stringify(body),
      });
      router.push(`/repairs/${res.id}`);
    } catch (err) {
      setError(err as AppError);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">新建寄修工单</h2>
      </div>

      <ErrorAlert error={error} onClose={() => setError(null)} />

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">客户姓名 *</label>
            <input
              type="text"
              required
              value={form.customer_name}
              onChange={(e) => updateField("customer_name", e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系电话 *</label>
            <input
              type="text"
              required
              value={form.customer_phone}
              onChange={(e) => updateField("customer_phone", e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">品牌 *</label>
            <input
              type="text"
              required
              value={form.watch_brand}
              onChange={(e) => updateField("watch_brand", e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">型号 *</label>
            <input
              type="text"
              required
              value={form.watch_model}
              onChange={(e) => updateField("watch_model", e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">序列号</label>
            <input
              type="text"
              value={form.serial_number}
              onChange={(e) => updateField("serial_number", e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">预估价格</label>
            <input
              type="number"
              step="0.01"
              value={form.estimated_price}
              onChange={(e) => updateField("estimated_price", e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">问题描述 *</label>
          <textarea
            required
            rows={4}
            value={form.issue_description}
            onChange={(e) => updateField("issue_description", e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "提交中..." : "提交"}
          </button>
        </div>
      </form>
    </div>
  );
}
