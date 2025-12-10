'use client';

import { Suspense, lazy, useMemo } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Stat from '@/components/ui/Stat';
import { Badge } from '@/components/ui/Badge';
import { useProtocolos } from '@/lib/hooks/useQueries';
import { ExportColumn } from '@/lib/utils/export';
import { LoadingTable } from '@/components/ui/Loading';
import type { Protocolo } from '@/types';
import { ModuleErrorBoundary } from '@/components/ui/ErrorBoundary';

const ExportButton = lazy(() => import('@/components/ui/ExportButton').then((m) => ({ default: m.ExportButton })));

const estadoLabels: Record<Protocolo['estado'], string> = {
  borrador: 'Borrador',
  revision: 'En revisión',
  publicado: 'Publicado',
  retirado: 'Retirado'
};

const estadoTone: Record<Protocolo['estado'], 'muted' | 'warn' | 'success' | 'danger'> = {
  borrador: 'muted',
  revision: 'warn',
  publicado: 'success',
  retirado: 'danger'
};

function ProtocolosSkeleton() {
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

function ProtocolosContent() {
  const { data: protocolos = [], isLoading } = useProtocolos();

  const exportColumns: ExportColumn[] = useMemo(
    () => [
      { header: 'Título', key: 'titulo', width: 40 },
      { header: 'Área', key: 'area', width: 20 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Requiere quiz', key: 'requiereQuiz', width: 15 },
      { header: 'Última actualización', key: 'actualizado', width: 22 }
    ],
    []
  );

  const protocolosParaExportar = useMemo(
    () =>
      protocolos.map((p) => ({
        titulo: p.titulo,
        area: p.area,
        estado: estadoLabels[p.estado],
        requiereQuiz: p.requiereQuiz ? 'Sí' : 'No',
        actualizado: p.updatedAt?.toLocaleDateString('es-ES') ?? 'N/A'
      })),
    [protocolos]
  );

  const stats = useMemo(
    () => [
      { label: 'Total protocolos', value: isLoading ? '—' : protocolos.length },
      { label: 'Publicados', value: isLoading ? '—' : protocolos.filter((p) => p.estado === 'publicado').length },
      { label: 'En revisión', value: isLoading ? '—' : protocolos.filter((p) => p.estado === 'revision').length }
    ],
    [isLoading, protocolos]
  );

  return (
    <div className="space-y-6">
      <Card
        title="Protocolos"
        subtitle="Procedimientos clínicos versionados y aprobados"
        action={
          <div className="flex items-center gap-2">
            <Suspense fallback={<div className="h-9 w-32 rounded-pill bg-muted" />}>
              <ExportButton
                data={protocolosParaExportar}
                columns={exportColumns}
                filename={`protocolos-${new Date().toISOString().split('T')[0]}`}
                format="excel"
                disabled={isLoading}
              />
            </Suspense>
            <Link
              href="/dashboard/protocolos/nuevo"
              className="rounded-pill bg-brand px-4 py-2 text-sm font-semibold text-text hover:opacity-90"
            >
              Nuevo protocolo
            </Link>
          </div>
        }
      >
        <p className="text-sm text-text-muted">
          Consulta protocolos vigentes, versiones en revisión y su disponibilidad por área.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Stat key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>

      {isLoading ? (
        <LoadingTable rows={8} />
      ) : protocolos.length === 0 ? (
        <Card>
          <div className="py-8 text-center text-text-muted">
            No hay protocolos registrados.
            <Link href="/dashboard/protocolos/nuevo" className="ml-2 text-brand hover:underline">
              Crear el primer protocolo
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
                    Protocolo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Área
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Quiz
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {protocolos.map((protocolo) => (
                  <tr key={protocolo.id} className="hover:bg-cardHover">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-text">{protocolo.titulo}</div>
                      <div className="text-xs text-text-muted">
                        Creado {protocolo.createdAt?.toLocaleDateString('es-ES') ?? 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">{protocolo.area}</td>
                    <td className="px-6 py-4">
                      <Badge tone={estadoTone[protocolo.estado]}>{estadoLabels[protocolo.estado]}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {protocolo.requiereQuiz ? 'Sí' : 'No'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <Link href={`/dashboard/protocolos/${protocolo.id}`} className="text-brand hover:underline">
                        Ver detalles
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

export default function ProtocolosPage() {
  return (
    <ModuleErrorBoundary moduleName="Protocolos">
      <Suspense fallback={<ProtocolosSkeleton />}>
        <ProtocolosContent />
      </Suspense>
    </ModuleErrorBoundary>
  );
}
