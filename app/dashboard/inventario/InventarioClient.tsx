'use client';

import { Suspense, lazy, useMemo } from 'react';
import Card from '@/components/ui/Card';
import Stat from '@/components/ui/Stat';
import { Badge } from '@/components/ui/Badge';
import { useInventario } from '@/lib/hooks/useQueries';
import type { InventarioSnapshot } from '@/lib/server/inventario';
import { LoadingTable } from '@/components/ui/Loading';

const ExportButton = lazy(() =>
  import('@/components/ui/ExportButton').then((m) => ({ default: m.ExportButton }))
);

interface Props {
  initialData: InventarioSnapshot;
}

export default function InventarioClient({ initialData }: Props) {
  const { productos, stockBajo, total } = initialData;
  const { data, isLoading, error } = useInventario({
    initialData: { productos, stockBajo, total },
  });
  const items = data?.productos ?? [];
  const stockBajoActual = data?.stockBajo ?? 0;

  const exportColumns = useMemo(
    () => [
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Categoría', key: 'categoria', width: 20 },
      { header: 'Stock', key: 'stock', width: 12 },
      { header: 'Stock mínimo', key: 'stockMinimo', width: 15 },
      { header: 'Proveedor', key: 'proveedor', width: 25 },
      { header: 'Precio', key: 'precio', width: 12 },
    ],
    []
  );

  if (error) {
    return (
      <Card title="Inventario" subtitle="Control de productos y stock">
        <div className="rounded-pill bg-danger-bg px-3 py-2 text-sm text-danger">
          Error al cargar inventario: {String(error)}
        </div>
      </Card>
    );
  }

  const stats = [
    { label: 'Total productos', value: isLoading ? '—' : items.length },
    { label: 'Stock bajo', value: isLoading ? '—' : stockBajoActual },
    { label: 'Stock normal', value: isLoading ? '—' : Math.max(items.length - stockBajoActual, 0) },
  ];

  return (
    <div className="space-y-6">
      <Card
        title="Inventario"
        subtitle="Gestiona existencias, proveedores y alertas de stock"
        action={
          <Suspense fallback={<div className="h-9 w-32 rounded-pill bg-muted" />}>
            <ExportButton
              data={items}
              columns={exportColumns}
              filename={`inventario-${new Date().toISOString().split('T')[0]}`}
              format="excel"
              disabled={isLoading}
            />
          </Suspense>
        }
      >
        <p className="text-sm text-text-muted">
          Mantén al día los niveles de stock y detecta incidencias antes de quedarte sin material.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Stat key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>

      {isLoading ? (
        <LoadingTable rows={10} />
      ) : items.length === 0 ? (
        <Card>
          <div className="py-8 text-center text-text-muted">
            No hay productos registrados en el inventario.
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Stock mín.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Precio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-cardHover">
                    <td className="px-4 py-3 text-sm font-semibold text-text">{item.nombre}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">{item.categoria ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">{item.stock ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">{item.stockMinimo ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">{item.proveedor ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {typeof item.precio === 'number' ? `€${item.precio.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {item.alertaStockBajo ? (
                        <Badge tone="warn">Stock bajo</Badge>
                      ) : (
                        <Badge tone="success">Normal</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
