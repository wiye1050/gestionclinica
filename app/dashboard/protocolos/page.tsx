'use client';

import { Suspense, lazy, useMemo } from 'react';
import Link from 'next/link';
import { useProtocolos } from '@/lib/hooks/useQueries';
import { ExportColumn } from '@/lib/utils/export';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import { LoadingTable } from '@/components/ui/Loading';

// Lazy loading
const ExportButton = lazy(() => import('@/components/ui/ExportButton').then(m => ({ default: m.ExportButton })));

const estadoColors: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-700',
  revision: 'bg-yellow-100 text-yellow-700',
  aprobado: 'bg-green-100 text-green-700',
  obsoleto: 'bg-red-100 text-red-700'
};

function ProtocolosSkeleton() {
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

function ProtocolosContent() {
  // React Query hook - caché de 10 min (protocolos muy estáticos)
  const { data: protocolos = [], isLoading } = useProtocolos();

  // Columnas para exportar (memoizado)
  const exportColumns: ExportColumn[] = useMemo(() => [
    { header: 'Título', key: 'titulo', width: 40 },
    { header: 'Área', key: 'area', width: 20 },
    { header: 'Estado', key: 'estado', width: 15 },
    { header: 'Requiere Quiz', key: 'requiereQuiz', width: 15 },
    { header: 'Fecha creación', key: 'fechaCreacion', width: 18 },
  ], []);

  // Preparar datos para exportar (memoizado)
  const protocolosParaExportar = useMemo(() => protocolos.map(p => ({
    ...p,
    requiereQuiz: p.requiereQuiz ? 'Sí' : 'No',
    fechaCreacion: p.createdAt?.toLocaleDateString('es-ES') ?? 'N/A'
  })), [protocolos]);

  // Stats (memoizado)
  const stats = useMemo(() => ({
    total: protocolos.length,
    aprobados: protocolos.filter(p => p.estado === 'aprobado').length,
    enRevision: protocolos.filter(p => p.estado === 'revision').length,
  }), [protocolos]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Protocolos</h1>
          <p className="text-gray-600 mt-1">Procedimientos clínicos versionados y aprobados</p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={<div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />}>
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
            className="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <span>Nuevo protocolo</span>
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg bg-white dark:bg-gray-800 p-5 shadow">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Protocolos</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {isLoading ? '—' : stats.total}
          </p>
        </div>

        <div className="rounded-lg bg-white dark:bg-gray-800 p-5 shadow">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Aprobados</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {isLoading ? '—' : stats.aprobados}
          </p>
        </div>

        <div className="rounded-lg bg-white dark:bg-gray-800 p-5 shadow">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">En Revisión</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {isLoading ? '—' : stats.enRevision}
          </p>
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <LoadingTable rows={8} />
      ) : protocolos.length === 0 ? (
        <div className="rounded-lg bg-white dark:bg-gray-800 p-8 text-center shadow">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No hay protocolos registrados.</p>
          <Link 
            href="/dashboard/protocolos/nuevo"
            className="mt-4 inline-flex text-blue-600 hover:underline"
          >
            Crear el primer protocolo
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Protocolo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Área
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Quiz
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {protocolos.map((protocolo) => (
                  <tr key={protocolo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {protocolo.titulo}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Creado: {protocolo.createdAt?.toLocaleDateString('es-ES') ?? 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {protocolo.area}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${estadoColors[protocolo.estado] ?? 'bg-gray-100 text-gray-700'}`}>
                        {protocolo.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {protocolo.requiereQuiz ? (
                        <span className="inline-flex items-center text-xs text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Sí
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <Link 
                        href={`/dashboard/protocolos/${protocolo.id}`} 
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

export default function ProtocolosPage() {
  return (
    <Suspense fallback={<ProtocolosSkeleton />}>
      <ProtocolosContent />
    </Suspense>
  );
}
