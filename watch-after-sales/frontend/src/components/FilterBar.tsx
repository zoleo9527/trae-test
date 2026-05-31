"use client";

import { Search } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterField {
  key: string;
  label: string;
  type: "select" | "text" | "date" | "date-range";
  options?: FilterOption[];
  placeholder?: string;
}

interface FilterBarProps {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  onSearch?: () => void;
}

export default function FilterBar({ fields, values, onChange, onSearch }: FilterBarProps) {
  const handleChange = (key: string, val: string) => {
    onChange({ ...values, [key]: val });
  };

  return (
    <div className="flex flex-wrap gap-3 items-end p-4 bg-white border rounded-lg">
      {fields.map((field) => {
        if (field.type === "select") {
          return (
            <div key={field.key} className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">{field.label}</label>
              <select
                value={values[field.key] || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="border rounded px-3 py-1.5 text-sm min-w-[120px]"
              >
                <option value="">全部</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (field.type === "text") {
          return (
            <div key={field.key} className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">{field.label}</label>
              <input
                type="text"
                value={values[field.key] || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="border rounded px-3 py-1.5 text-sm min-w-[160px]"
                onKeyDown={(e) => e.key === "Enter" && onSearch?.()}
              />
            </div>
          );
        }

        if (field.type === "date" || field.type === "date-range") {
          return (
            <div key={field.key} className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">{field.label}</label>
              <input
                type="date"
                value={values[field.key] || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="border rounded px-3 py-1.5 text-sm"
              />
            </div>
          );
        }

        return null;
      })}
      <button
        onClick={onSearch}
        className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
      >
        <Search className="w-4 h-4" />
        搜索
      </button>
      <button
        onClick={() => {
          const reset: Record<string, string> = {};
          fields.forEach((f) => (reset[f.key] = ""));
          onChange(reset);
        }}
        className="px-4 py-1.5 border text-sm rounded hover:bg-gray-50"
      >
        重置
      </button>
    </div>
  );
}
