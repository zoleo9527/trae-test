"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, UserPlus } from "lucide-react";
import { apiFetch, AppError } from "@/lib/api";
import ErrorAlert from "@/components/ErrorAlert";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
}

interface Technician {
  id: number;
  display_name: string;
}

export default function NewRepairPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "" });
  const [form, setForm] = useState({
    customer_id: "",
    watch_brand: "",
    watch_model: "",
    watch_serial: "",
    issue_description: "",
    assigned_technician_id: "",
    quotation_price: "",
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [customersRes, usersRes] = await Promise.all([
          apiFetch<Customer[]>("/customers"),
          apiFetch<{ id: number; role: string; display_name: string }[]>("/users"),
        ]);
        if (!cancelled) {
          setCustomers(Array.isArray(customersRes) ? customersRes : []);
          const techs = (Array.isArray(usersRes) ? usersRes : []).filter(
            (u) => u.role === "technician"
          );
          setTechnicians(techs.map((t) => ({ id: t.id, display_name: t.display_name })));
        }
      } catch (err) {
        if (!cancelled) setError(err as AppError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) return;
    try {
      const res = await apiFetch<Customer>("/customers", {
        method: "POST",
        body: JSON.stringify(newCustomer),
      });
      setCustomers((prev) => [...prev, res]);
      setForm((prev) => ({ ...prev, customer_id: String(res.id) }));
      setShowNewCustomer(false);
      setNewCustomer({ name: "", phone: "", email: "" });
    } catch (err) {
      setError(err as AppError);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, string | number> = {
        customer_id: parseInt(form.customer_id),
        watch_brand: form.watch_brand,
        watch_model: form.watch_model,
        issue_description: form.issue_description,
      };
      if (form.watch_serial) body.watch_serial = form.watch_serial;
      if (form.assigned_technician_id) body.assigned_technician_id = parseInt(form.assigned_technician_id);
      if (form.quotation_price) body.quotation_price = parseFloat(form.quotation_price);

      const res = await apiFetch<{ id: number }>("/repairs", {
        method: "POST",
        body: JSON.stringify(body),
      });
      router.push(`/repairs/${res.id}`);
    } catch (err) {
      setError(err as AppError);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">客户 *</label>
          {showNewCustomer ? (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="姓名"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="电话"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <input
                type="email"
                placeholder="邮箱（可选）"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer((p) => ({ ...p, email: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateCustomer}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCustomer(false)}
                  className="px-3 py-1.5 border text-sm rounded hover:bg-gray-50"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                required
                value={form.customer_id}
                onChange={(e) => setForm((prev) => ({ ...prev, customer_id: e.target.value }))}
                className="flex-1 border rounded px-3 py-2 text-sm"
              >
                <option value="">请选择客户</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.phone}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewCustomer(true)}
                className="px-3 py-2 border rounded hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">品牌 *</label>
            <input
              type="text"
              required
              value={form.watch_brand}
              onChange={(e) => setForm((prev) => ({ ...prev, watch_brand: e.target.value }))}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">型号 *</label>
            <input
              type="text"
              required
              value={form.watch_model}
              onChange={(e) => setForm((prev) => ({ ...prev, watch_model: e.target.value }))}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">序列号</label>
            <input
              type="text"
              value={form.watch_serial}
              onChange={(e) => setForm((prev) => ({ ...prev, watch_serial: e.target.value }))}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">指派技师</label>
            <select
              value={form.assigned_technician_id}
              onChange={(e) => setForm((prev) => ({ ...prev, assigned_technician_id: e.target.value }))}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">暂不指派</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.display_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">预估价格</label>
            <input
              type="number"
              step="0.01"
              value={form.quotation_price}
              onChange={(e) => setForm((prev) => ({ ...prev, quotation_price: e.target.value }))}
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
            onChange={(e) => setForm((prev) => ({ ...prev, issue_description: e.target.value }))}
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
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "提交中..." : "提交"}
          </button>
        </div>
      </form>
    </div>
  );
}
