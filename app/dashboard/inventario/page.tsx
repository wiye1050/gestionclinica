'use client';

import { Suspense, lazy, useMemo } from "react";
import { useInventario } from "@/lib/hooks/useQueries";
import { ExportColumn } from "@/lib/utils/export";
import { Package, AlertTriangle, CheckCircle } from "lucide-react";
import { LoadingTable } from "@/components/ui/Loading";

// Lazy loading
const ExportButton = lazy(() => import("@/components/ui/ExportButton").then(m => ({ default: m.ExportButton })));

function InventarioSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 bg-gray-200 rounded-lg"></div>
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-200 rounded-lg"></div>)}
      </div>
      <LoadingTable rows={10} />
    </div>
  );
}

function InventarioContent() {
  // React Query hook - caché de 5 min
  const { data, isLoading, error } = useInventario();
  const items = data?.productos ?? [];
  const stockBajo = data?.stockBajo ?? 0;

  // Columnas para exportar (memoizado)
  const exportColumns: ExportColumn[] = useMemo(() => [
    { header: 'Nombre', key: 'nombre', width: 30 },
    { header: 'Categoría', key: 'categoria', width: 20 },
    { header: 'Stock', key: 'stock', width: 12 },
    { header: 'Stock Mínimo', key: 'stockMinimo', width: 15 },
    { header: 'Proveedor', key: 'proveedor', width: 25 },
    { header: 'Precio', key: 'precio', width: 12 },
  ], []);

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">Error al cargar inventario</h3>
            <p className="text-sm text-red-700">{String(error)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600 mt-1">Control de productos y stock</p>
        </div>
        <Suspense fallback={<div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />}>
          <ExportButton
            data={items}
            columns={exportColumns}
            filename={`inventario-${new Date().toISOString().split('T')[0]}`}
            format="excel"
            disabled={isLoading}
          />
        </Suspense>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg bg-white dark:bg-gray-800 p-5 shadow">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Productos</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {isLoading ? '—' : items.length}
          </p>
        </div>

        <div className="rounded-lg bg-white dark:bg-gray-800 p-5 shadow">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Stock Bajo</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {isLoading ? '—' : stockBajo}
          </p>
        </div>

        <div className="rounded-lg bg-white dark:bg-gray-800 p-5 shadow">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Stock Normal</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {isLoading ? '—' : items.length - stockBajo}
          </p>
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <LoadingTable rows={10} />
      ) : items.length === 0 ? (
        <div className="rounded-lg bg-white dark:bg-gray-800 p-8 text-center shadow">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No hay productos registrados en el inventario.</p>
        </div>
      ) : (
        <div className="rounded-lg bg-white dark:bg-gray-800 shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Categoría</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Stock Mín</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Proveedor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Precio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {item.nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {item.categoria || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {item.stock ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {item.stockMinimo ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {item.proveedor || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {item.precio ? `€${item.precio.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {item.alertaStockBajo ? (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                          Stock Bajo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InventarioPage() {
  return (
    <Suspense fallback={<InventarioSkeleton />}>
      <InventarioContent />
    </Suspense>
  );
}
