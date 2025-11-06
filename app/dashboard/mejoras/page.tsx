'use client';

import { Suspense, lazy, useMemo } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Stat from '@/components/ui/Stat';
import { Badge } from '@/components/ui/Badge';
import { useMejoras } from '@/lib/hooks/useQueries';
import { ExportColumn } from '@/lib/utils/export';
import { LoadingTable } from '@/components/ui/Loading';
import type { Mejora } from '@/types';

const ExportButton = lazy(() => import('@/components/ui/ExportButton').then((m) => ({ default: m.ExportButton })));

const estadoLabels: Record<Mejora['estado'], string> = {
  idea: 'Idea',
  'en-analisis': 'En análisis',
  planificada: 'Planificada',
  'en-progreso': 'En progreso',
  completada: 'Completada'
};

const estadoTone: Record<Mejora['estado'], 'muted' | 'warn' | 'success' | 'danger'> = {
  idea: 'muted',
  'en-analisis': 'warn',
  planificada: 'warn',
  'en-progreso': 'warn',
  completada: 'success'
};

function MejorasSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="card h-20" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[1, 2, 3].map((key) => (
          <div key={key} className="card h-24" />
        ))}
      </div>
      <LoadingTable rows={8} />
    </div>
  );
}

function MejorasContent() {
  const { data: mejoras = [], isLoading } = useMejoras();

  const exportColumns: ExportColumn[] = useMemo(
    () => [
      { header: 'Título', key: 'titulo', width: 35 },
      { header: 'Área', key: 'area', width: 20 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'RICE', key: 'riceScore', width: 12 },
      { header: 'Reach', key: 'riceReach', width: 10 },
      { header: 'Impact', key: 'riceImpact', width: 10 },
      { header: 'Confidence', key: 'riceConfidence', width: 12 },
      { header: 'Effort', key: 'riceEffort', width: 10 },
      { header: 'Responsable', key: 'responsableNombre', width: 25 }
    ],
    []
  );

  const mejorasParaExportar = useMemo(
    () =>
      mejoras.map((mejora) => ({
        titulo: mejora.titulo ?? 'Sin título',
        area: mejora.area,
        estado: estadoLabels[mejora.estado] ?? mejora.estado,
        riceScore: mejora.rice?.score ?? 0,
        riceReach: mejora.rice?.reach ?? 0,
        riceImpact: mejora.rice?.impact ?? 0,
        riceConfidence: mejora.rice?.confidence ?? 0,
        riceEffort: mejora.rice?.effort ?? 0,
        responsableNombre: mejora.responsableNombre ?? 'Sin asignar'
      })),
    [mejoras]
  );

  const stats = useMemo(
    () => [
      { label: 'Total mejoras', value: isLoading ? '—' : mejoras.length },
      { label: 'En progreso', value: isLoading ? '—' : mejoras.filter((m) => m.estado === 'en-progreso').length },
      { label: 'Completadas', value: isLoading ? '—' : mejoras.filter((m) => m.estado === 'completada').length }
    ],
    [isLoading, mejoras]
  );

  return (
    <div className="space-y-6">
      <Card
        title="Mejoras"
        subtitle="Propuestas para optimizar salas, equipos, procedimientos y software"
        action={
          <div className="flex items-center gap-2">
            <Suspense fallback={<div className="h-9 w-32 rounded-pill bg-muted" />}>
              <ExportButton
                data={mejorasParaExportar}
                columns={exportColumns}
                filename={`mejoras-${new Date().toISOString().split('T')[0]}`}
                format="excel"
                disabled={isLoading}
              />
            </Suspense>
            <Link
              href="/dashboard/mejoras/nueva"
              className="rounded-pill bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Nueva mejora
            </Link>
          </div>
        }
      >
        <p className="text-sm text-text-muted">
          Prioriza iniciativas por impacto y esfuerzo para mantener un ciclo de mejora continua.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Stat key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>

      {isLoading ? (
        <LoadingTable rows={8} />
      ) : mejoras.length === 0 ? (
        <Card>
          <div className="py-8 text-center text-text-muted">
            No hay mejoras registradas.
            <Link href="/dashboard/mejoras/nueva" className="ml-2 text-brand hover:underline">
              Crear la primera mejora
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Mejora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Área
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    RICE
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mejoras.map((mejora) => (
                  <tr key={mejora.id} className="hover:bg-cardHover">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-text">{mejora.titulo}</div>
                      <div className="text-xs text-text-muted">
                        Actualizado {mejora.updatedAt?.toLocaleDateString('es-ES') ?? 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">{mejora.area}</td>
                    <td className="px-6 py-4">
                      <Badge tone={estadoTone[mejora.estado]}>{estadoLabels[mejora.estado]}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-text">
                      {mejora.rice?.score?.toFixed(1) ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <Link
                        href={`/dashboard/mejoras/${mejora.id}`}
                        className="text-brand hover:underline"
                      >
                        Ver detalle
                      </Link>
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

export default function MejorasPage() {
  return (
    <Suspense fallback={<MejorasSkeleton />}>
      <MejorasContent />
    </Suspense>
  );
}
