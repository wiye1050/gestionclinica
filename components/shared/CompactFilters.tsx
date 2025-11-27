'use client';

import { Search, X } from 'lucide-react';
import clsx from 'clsx';

export type SelectFilterOption = {
  value: string;
  label: string;
};

export type SelectFilterConfig = {
  id: string;
  label: string;
  value: string;
  options: SelectFilterOption[];
  onChange: (value: string) => void;
};

export type ActiveFilterChip = {
  id: string;
  label: string;
  value: string;
  onRemove?: () => void;
};

interface CompactFiltersProps {
  search?: {
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
  };
  selects?: SelectFilterConfig[];
  activeFilters?: ActiveFilterChip[];
  onClear?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function CompactFilters({
  search,
  selects,
  activeFilters,
  onClear,
  className,
  children,
}: CompactFiltersProps) {
  const hasActiveFilters = Boolean(activeFilters && activeFilters.length > 0);

  return (
    <div
      className={clsx(
        'rounded-2xl border border-border bg-card p-4 shadow-sm',
        'flex flex-col gap-4',
        className
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        {search && (
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold text-text-muted">Buscar</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={search.value}
                onChange={(event) => search.onChange(event.target.value)}
                placeholder={search.placeholder ?? 'Buscar...'}
                className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-sm text-text focus-visible:focus-ring"
                type="text"
              />
              {search.value && (
                <button
                  type="button"
                  onClick={() => search.onChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-text-muted hover:bg-border"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {selects?.map((filter) => (
          <div key={filter.id} className="w-full lg:w-48">
            <label className="mb-1 block text-xs font-semibold text-text-muted">
              {filter.label}
            </label>
            <select
              value={filter.value}
              onChange={(event) => filter.onChange(event.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-text focus-visible:focus-ring"
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {children}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {activeFilters?.map((chip) => (
            <span
              key={chip.id}
              className="inline-flex items-center gap-1 rounded-full bg-border px-3 py-1 font-medium text-text"
            >
              <span className="text-text-muted">{chip.label}:</span>
              <span>{chip.value}</span>
              {chip.onRemove && (
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="ml-1 rounded-full p-0.5 text-text-muted hover:bg-white"
                  aria-label={`Quitar ${chip.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}

          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="ml-auto text-xs font-semibold text-brand hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
