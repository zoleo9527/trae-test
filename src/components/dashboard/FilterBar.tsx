import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Tag } from '@/components/common/Tag';
import { cn } from '@/lib/utils';

interface FilterOption {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
}

interface FilterBarProps {
  filters: FilterOption[];
  selectedFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function FilterBar({
  filters,
  selectedFilters,
  onFilterChange,
  onClearFilters,
  searchPlaceholder = '搜索...',
  searchValue,
  onSearchChange,
}: FilterBarProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const activeFilterCount = Object.values(selectedFilters).filter(v => v && v !== 'all').length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          {searchValue !== undefined && onSearchChange && (
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchValue}
                onChange={e => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {searchValue && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {filters.map(filter => (
            <div key={filter.key} className="relative">
              <button
                onClick={() => setActiveFilter(activeFilter === filter.key ? null : filter.key)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 border rounded-md text-sm transition-colors',
                  selectedFilters[filter.key] && selectedFilters[filter.key] !== 'all'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                <Filter className="w-4 h-4" />
                <span>{filter.label}</span>
                {selectedFilters[filter.key] && selectedFilters[filter.key] !== 'all' && (
                  <Tag size="sm" variant="primary">
                    {filter.options.find(o => o.value === selectedFilters[filter.key])?.label}
                  </Tag>
                )}
              </button>

              {activeFilter === filter.key && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 animate-fade-in">
                  {filter.options.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onFilterChange(filter.key, option.value);
                        setActiveFilter(null);
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors',
                        selectedFilters[filter.key] === option.value && 'bg-primary-50 text-primary-700'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="w-4 h-4 mr-1" />
            清除筛选 ({activeFilterCount})
          </Button>
        )}
      </div>

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
          {filters.map(filter => {
            const value = selectedFilters[filter.key];
            if (!value || value === 'all') return null;
            const option = filter.options.find(o => o.value === value);
            return (
              <Tag key={filter.key} variant="primary" size="sm" className="flex items-center gap-1">
                {filter.label}：{option?.label}
                <button
                  onClick={() => onFilterChange(filter.key, 'all')}
                  className="hover:text-white ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </Tag>
            );
          })}
        </div>
      )}
    </div>
  );
}
