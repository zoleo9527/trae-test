'use client';

import { Calendar, ChevronDown, Filter, RotateCcw, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface FilterCondition {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'numberRange' | 'multiSelect';
  options?: { label: string; value: string }[];
  placeholder?: string;
}

export interface FilterValues {
  [key: string]: string | string[] | number | undefined;
}

interface MultiConditionFilterProps {
  conditions: FilterCondition[];
  value: FilterValues;
  onChange: (value: FilterValues) => void;
  onSearch: () => void;
  onReset: () => void;
  showAdvanced?: boolean;
}

export default function MultiConditionFilter({
  conditions,
  value,
  onChange,
  onSearch,
  onReset,
  showAdvanced = true,
}: MultiConditionFilterProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [localValues, setLocalValues] = useState<FilterValues>(value);

  useEffect(() => {
    setLocalValues(value);
  }, [value]);

  const handleChange = (key: string, newValue: any) => {
    const updated = { ...localValues, [key]: newValue };
    setLocalValues(updated);
    onChange(updated);
  };

  const handleReset = () => {
    setLocalValues({});
    onReset();
  };

  const renderInput = (condition: FilterCondition) => {
    const currentValue = localValues[condition.key];

    switch (condition.type) {
      case 'text':
        return (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={condition.placeholder || `请输入${condition.label}`}
              value={(currentValue as string) || ''}
              onChange={(e) => handleChange(condition.key, e.target.value)}
              className="input-field pl-9 text-sm"
            />
          </div>
        );

      case 'select':
        return (
          <select
            value={(currentValue as string) || ''}
            onChange={(e) => handleChange(condition.key, e.target.value)}
            className="input-field text-sm"
          >
            <option value="">全部{condition.label}</option>
            {condition.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'multiSelect':
        return (
          <select
            multiple
            value={(currentValue as string[]) || []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
              handleChange(condition.key, selected);
            }}
            className="input-field text-sm min-h-[80px]"
          >
            {condition.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={(currentValue as string) || ''}
              onChange={(e) => handleChange(condition.key, e.target.value)}
              className="input-field pl-9 text-sm"
            />
          </div>
        );

      case 'dateRange':
        return (
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                placeholder="开始日期"
                value={(localValues[`${condition.key}_start`] as string) || ''}
                onChange={(e) => handleChange(`${condition.key}_start`, e.target.value)}
                className="input-field pl-9 text-sm"
              />
            </div>
            <span className="text-gray-400">至</span>
            <div className="relative flex-1">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                placeholder="结束日期"
                value={(localValues[`${condition.key}_end`] as string) || ''}
                onChange={(e) => handleChange(`${condition.key}_end`, e.target.value)}
                className="input-field pl-9 text-sm"
              />
            </div>
          </div>
        );

      case 'numberRange':
        return (
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="最小值"
              value={(localValues[`${condition.key}_min`] as number) || ''}
              onChange={(e) => handleChange(`${condition.key}_min`, e.target.value ? parseFloat(e.target.value) : undefined)}
              className="input-field text-sm flex-1"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              placeholder="最大值"
              value={(localValues[`${condition.key}_max`] as number) || ''}
              onChange={(e) => handleChange(`${condition.key}_max`, e.target.value ? parseFloat(e.target.value) : undefined)}
              className="input-field text-sm flex-1"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const basicConditions = conditions.slice(0, 4);
  const advancedConditions = conditions.slice(4);

  const activeFilterCount = Object.values(localValues).filter(
    (v) => v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0)
  ).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-primary-600" />
          <span className="font-medium text-gray-800">筛选条件</span>
          {activeFilterCount > 0 && (
            <span className="badge bg-primary-100 text-primary-800">已选 {activeFilterCount} 项</span>
          )}
        </div>
        <div className="flex gap-2">
          {showAdvanced && advancedConditions.length > 0 && (
            <button
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="btn-secondary text-sm flex items-center gap-1"
            >
              {isAdvancedOpen ? '收起高级' : '展开高级'}
              <ChevronDown size={16} className={`transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
          <button onClick={handleReset} className="btn-secondary text-sm flex items-center gap-1">
            <RotateCcw size={16} />
            重置
          </button>
          <button onClick={onSearch} className="btn-primary text-sm flex items-center gap-1">
            <Search size={16} />
            查询
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {basicConditions.map((condition) => (
          <div key={condition.key}>
            <label className="label">{condition.label}</label>
            {renderInput(condition)}
          </div>
        ))}
      </div>

      {showAdvanced && isAdvancedOpen && advancedConditions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {advancedConditions.map((condition) => (
              <div key={condition.key}>
                <label className="label">{condition.label}</label>
                {renderInput(condition)}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeFilterCount > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(localValues).map(([key, val]) => {
            if (val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) return null;
            const condition = conditions.find(
              (c) => c.key === key || c.key + '_start' === key || c.key + '_end' === key || c.key + '_min' === key || c.key + '_max' === key
            );
            if (!condition) return null;

            const displayKey = key.endsWith('_start')
              ? `${condition.label}(起)`
              : key.endsWith('_end')
              ? `${condition.label}(止)`
              : key.endsWith('_min')
              ? `${condition.label}(最小)`
              : key.endsWith('_max')
              ? `${condition.label}(最大)`
              : condition.label;

            const displayVal = Array.isArray(val)
              ? val.map((v) => condition.options?.find((o) => o.value === v)?.label || v).join(', ')
              : condition.options?.find((o) => o.value === val)?.label || val;

            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
              >
                {displayKey}: {displayVal}
                <button
                  onClick={() => handleChange(key, undefined)}
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
