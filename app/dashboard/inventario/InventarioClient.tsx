'use client';

import { Suspense, lazy, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useInventario } from '@/lib/hooks/useQueries';
import type { InventarioSnapshot } from '@/lib/server/inventario';
import { LoadingTable } from '@/components/ui/Loading';
import { CompactFilters, type ActiveFilterChip } from '@/components/shared/CompactFilters';
import { KPIGrid } from '@/components/shared/KPIGrid';

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
  const items = data?.productos ?? productos;
  const stockBajoActual = data?.stockBajo ?? stockBajo;
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todos');
  const [estadoFiltro, setEstadoFiltro] = useState<'todos' | 'bajo' | 'normal'>('todos');

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

  const normalizedSearch = busqueda.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.nombre.toLowerCase().includes(normalizedSearch) ||
        (item.proveedor?.toLowerCase().includes(normalizedSearch) ?? false);
      const matchesCategoria = categoriaFiltro === 'todos' || item.categoria === categoriaFiltro;
      const matchesEstado =
        estadoFiltro === 'todos' ||
        (estadoFiltro === 'bajo' && item.alertaStockBajo) ||
        (estadoFiltro === 'normal' && !item.alertaStockBajo);
      return matchesSearch && matchesCategoria && matchesEstado;
    });
  }, [items, normalizedSearch, categoriaFiltro, estadoFiltro]);

  const stats = [
    { label: 'Total productos', value: isLoading ? '—' : items.length },
    { label: 'Stock bajo', value: isLoading ? '—' : stockBajoActual },
    {
      label: 'Stock normal',
      value: isLoading ? '—' : Math.max(items.length - stockBajoActual, 0),
    },
  ];

  const kpiItems = [
    { id: 'total', label: 'Total productos', value: stats[0].value, helper: 'Registrados', accent: 'brand' as const },
    { id: 'bajo', label: 'Stock bajo', value: stats[1].value, helper: 'Con alerta', accent: 'red' as const },
    { id: 'normal', label: 'Stock normal', value: stats[2].value, helper: 'Sin alertas', accent: 'green' as const },
  ];

  const activeFilters: ActiveFilterChip[] = [];
  if (busqueda.trim()) {
    activeFilters.push({ id: 'search', label: 'Búsqueda', value: busqueda, onRemove: () => setBusqueda('') });
  }
  if (categoriaFiltro !== 'todos') {
    activeFilters.push({ id: 'categoria', label: 'Categoría', value: categoriaFiltro, onRemove: () => setCategoriaFiltro('todos') });
  }
  if (estadoFiltro !== 'todos') {
    activeFilters.push({ id: 'estado', label: 'Estado', value: estadoFiltro === 'bajo' ? 'Stock bajo' : 'Normal', onRemove: () => setEstadoFiltro('todos') });
  }

  if (error) {
    return (
      <Card title="Inventario" subtitle="Control de productos y stock">
        <div className="rounded-pill bg-danger-bg px-3 py-2 text-sm text-danger">
          Error al cargar inventario: {String(error)}
        </div>
      </Card>
    );
  }

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

      <KPIGrid items={kpiItems} />

      <CompactFilters
        search={{ value: busqueda, onChange: setBusqueda, placeholder: 'Buscar por nombre o proveedor' }}
        selects={[
          {
            id: 'categoria',
            label: 'Categoría',
            value: categoriaFiltro,
            onChange: setCategoriaFiltro,
            options: [
              { value: 'todos', label: 'Todas' },
              ...Array.from(new Set(items.map((item) => item.categoria ?? 'sin-categoria'))).map((categoria) => ({
                value: categoria,
                label: categoria === 'sin-categoria' ? 'Sin categoría' : categoria,
              })),
            ],
          },
          {
            id: 'estado',
            label: 'Stock',
            value: estadoFiltro,
            onChange: (val) => setEstadoFiltro(val as typeof estadoFiltro),
            options: [
              { value: 'todos', label: 'Todos' },
              { value: 'bajo', label: 'Stock bajo' },
              { value: 'normal', label: 'Stock normal' },
            ],
          },
        ]}
        activeFilters={activeFilters}
        onClear={activeFilters.length ? () => {
          setBusqueda('');
          setCategoriaFiltro('todos');
          setEstadoFiltro('todos');
        } : undefined}
      />

      {isLoading ? (
        <LoadingTable rows={10} />
      ) : filteredItems.length === 0 ? (
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
                {filteredItems.map((item) => (
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
