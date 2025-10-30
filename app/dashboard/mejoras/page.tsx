'use client';

import { Suspense, lazy, useMemo } from 'react';
import Link from 'next/link';
import { useMejoras } from '@/lib/hooks/useQueries';
import { ExportColumn } from '@/lib/utils/export';
import { Lightbulb, TrendingUp, Clock } from 'lucide-react';
import { LoadingTable } from '@/components/ui/Loading';

// Lazy loading
const ExportButton = lazy(() => import('@/components/ui/ExportButton').then(m => ({ default: m.ExportButton })));

const estadoLabels: Record<string, string> = {
  idea: 'Idea',
  'en-analisis': 'En análisis',
  planificada: 'Planificada',
  'en-progreso': 'En progreso',
  completada: 'Completada'
};

const estadoColors: Record<string, string> = {
  idea: 'bg-gray-100 text-gray-700',
  'en-analisis': 'bg-blue-100 text-blue-700',
  planificada: 'bg-yellow-100 text-yellow-700',
  'en-progreso': 'bg-purple-100 text-purple-700',
  completada: 'bg-green-100 text-green-700'
};

function MejorasSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 bg-gray-200 rounded-lg"></div>
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>)}
      </div>
      <LoadingTable rows={8} />
    </div>
  );
}

function MejorasContent() {
  // React Query hook - caché de 3 min
  const { data: mejoras = [], isLoading } = useMejoras();

  // Columnas para exportar (memoizado)
  const exportColumns: ExportColumn[] = useMemo(() => [
    { header: 'Título', key: 'titulo', width: 35 },
    { header: 'Área', key: 'area', width: 20 },
    { header: 'Estado', key: 'estado', width: 15 },
    { header: 'RICE Score', key: 'riceScore', width: 12 },
    { header: 'Reach', key: 'riceReach', width: 10 },
    { header: 'Impact', key: 'riceImpact', width: 10 },
    { header: 'Confidence', key: 'riceConfidence', width: 12 },
    { header: 'Effort', key: 'riceEffort', width: 10 },
    { header: 'Responsable', key: 'responsableNombre', width: 25 },
  ], []);

  // Preparar datos para exportar (memoizado)
  const mejorasParaExportar = useMemo(() => mejoras.map(m => ({
    ...m,
    estado: estadoLabels[m.estado] ?? m.estado,
    riceScore: m.rice?.score?.toFixed(1) ?? 'N/A',
    riceReach: m.rice?.reach ?? 0,
    riceImpact: m.rice?.impact ?? 0,
    riceConfidence: m.rice?.confidence ?? 0,
    riceEffort: m.rice?.effort ?? 0
  })), [mejoras]);

  // Stats (memoizado)
  const stats = useMemo(() => ({
    total: mejoras.length,
    enProgreso: mejoras.filter(m => m.estado === 'en-progreso').length,
    completadas: mejoras.filter(m => m.estado === 'completada').length,
  }), [mejoras]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mejoras</h1>
          <p className="text-gray-600 mt-1">
            Propuestas de mejora para salas, equipos, procedimientos y software
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={<div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />}>
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
            className="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <span>Nueva mejora</span>
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg bg-white dark:bg-gray-800 p-5 shadow">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Mejoras</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {isLoading ? '—' : stats.total}
          </p>
        </div>

        <div className="rounded-lg bg-white dark:bg-gray-800 p-5 shadow">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">En Progreso</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {isLoading ? '—' : stats.enProgreso}
          </p>
        </div>

        <div className="rounded-lg bg-white dark:bg-gray-800 p-5 shadow">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Completadas</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {isLoading ? '—' : stats.completadas}
          </p>
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <LoadingTable rows={8} />
      ) : mejoras.length === 0 ? (
        <div className="rounded-lg bg-white dark:bg-gray-800 p-8 text-center shadow">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No hay mejoras registradas.</p>
          <Link 
            href="/dashboard/mejoras/nueva"
            className="mt-4 inline-flex text-blue-600 hover:underline"
          >
            Crear la primera mejora
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Mejora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Área
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    RICE Score
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {mejoras.map((mejora) => (
                  <tr key={mejora.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {mejora.titulo}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Actualizado {mejora.updatedAt?.toLocaleDateString('es-ES') ?? 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {mejora.area}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${estadoColors[mejora.estado] ?? 'bg-gray-100 text-gray-700'}`}>
                        {estadoLabels[mejora.estado] ?? mejora.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {mejora.rice?.score?.toFixed(1) ?? 'N/A'}
                        </span>
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <Link 
                        href={`/dashboard/mejoras/${mejora.id}`} 
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        Ver detalles
                      </Link>
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

export default function MejorasPage() {
  return (
    <Suspense fallback={<MejorasSkeleton />}>
      <MejorasContent />
    </Suspense>
  );
}
