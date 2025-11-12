'use client';

import { ReactNode } from 'react';
import { Search, X } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface CompactFiltersProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: {
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  activeFiltersCount?: number;
  onClearAll?: () => void;
  children?: ReactNode;
}

export default function CompactFilters({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters = [],
  activeFiltersCount = 0,
  onClearAll,
  children
}: CompactFiltersProps) {
  return (
    <div className="surface-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Búsqueda */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        )}

        {/* Filtros dropdown */}
        {filters.map((filter, idx) => (
          <select
            key={idx}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">{filter.label}</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}

        {/* Children adicionales */}
        {children}

        {/* Limpiar filtros */}
        {activeFiltersCount > 0 && onClearAll && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
            <span>Limpiar ({activeFiltersCount})</span>
          </button>
        )}
      </div>
    </div>
  );
}
