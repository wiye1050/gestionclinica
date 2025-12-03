'use client';

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  /** Mensaje cuando no hay datos */
  emptyMessage?: string;
  /** Habilitar paginación (default: true) */
  enablePagination?: boolean;
  /** Tamaño de página inicial (default: 10) */
  initialPageSize?: number;
  /** Opciones de tamaño de página */
  pageSizeOptions?: number[];
  /** Habilitar sorting (default: true) */
  enableSorting?: boolean;
  /** Habilitar filtros (default: false) */
  enableFiltering?: boolean;
  /** Mostrar borde (default: true) */
  showBorder?: boolean;
  /** Clases adicionales para el contenedor */
  className?: string;
}

/**
 * Componente DataTable genérico con TanStack Table
 *
 * @example
 * ```tsx
 * const columns: ColumnDef<User>[] = [
 *   {
 *     accessorKey: 'nombre',
 *     header: 'Nombre',
 *   },
 *   {
 *     accessorKey: 'email',
 *     header: 'Email',
 *   },
 * ];
 *
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   emptyMessage="No hay usuarios"
 * />
 * ```
 */
export default function DataTable<TData>({
  data,
  columns,
  emptyMessage = 'No hay datos disponibles',
  enablePagination = true,
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  enableSorting = true,
  enableFiltering = false,
  showBorder = true,
  className = '',
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
  });

  return (
    <div className={className}>
      <div className={`overflow-hidden ${showBorder ? 'panel-block shadow-sm' : ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-cardHover">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium uppercase text-text-muted"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? 'flex cursor-pointer select-none items-center gap-2 hover:text-text'
                              : 'flex items-center gap-2'
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {enableSorting && header.column.getCanSort() && (
                            <span className="text-text-muted">
                              {{
                                asc: <ChevronUp className="h-4 w-4" />,
                                desc: <ChevronDown className="h-4 w-4" />,
                              }[header.column.getIsSorted() as string] ?? (
                                <ChevronsUpDown className="h-4 w-4" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-sm text-text-muted"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-cardHover">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm text-text">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {enablePagination && data.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Filas por página:</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="rounded-lg border border-border bg-card px-2 py-1 text-sm text-text focus-visible:focus-ring"
            >
              {pageSizeOptions.map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
            <span>
              Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                data.length
              )}{' '}
              de {data.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-cardHover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <span className="text-sm text-text">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-cardHover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
