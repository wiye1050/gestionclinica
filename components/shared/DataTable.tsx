'use client';

import { ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T, index: number) => ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  onRowClick?: (item: T, index: number) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  emptyMessage?: string;
  loading?: boolean;
  rowClassName?: (item: T, index: number) => string;
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  sortKey,
  sortDirection = 'asc',
  onSort,
  emptyMessage = 'No hay datos para mostrar',
  loading = false,
  rowClassName
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="surface-card overflow-hidden">
        <div className="animate-pulse space-y-3 p-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="surface-card p-12 text-center">
        <p className="text-text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left font-semibold ${
                    column.sortable && onSort ? 'cursor-pointer select-none hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable && onSort?.(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable && sortKey === column.key && (
                      <span className="text-brand">
                        {sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-900">
            {data.map((item, index) => (
              <tr
                key={keyExtractor(item, index)}
                onClick={() => onRowClick?.(item, index)}
                className={`transition hover:bg-gray-50 ${
                  onRowClick ? 'cursor-pointer' : ''
                } ${rowClassName ? rowClassName(item, index) : ''}`}
              >
                {columns.map((column) => {
                  const defaultValue = (item as Record<string, unknown>)[column.key];
                  return (
                    <td key={column.key} className="px-6 py-4">
                      {column.render ? column.render(item, index) : String(defaultValue ?? '')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
