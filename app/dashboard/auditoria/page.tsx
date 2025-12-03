'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AuditLogEntry } from '@/types';
import { Activity, Filter, RefreshCcw, Search } from 'lucide-react';
import { logger } from '@/lib/utils/logger';

type TimeRange = '24h' | '7d' | '30d' | 'all';

const RANGE_LABELS: Record<TimeRange, string> = {
  '24h': '24h',
  '7d': '7 días',
  '30d': '30 días',
  all: 'Todo'
};

const RANGE_IN_MS: Record<Exclude<TimeRange, 'all'>, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000
};

type AuditLogState = AuditLogEntry;

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLogState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(200));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => {
          const raw = docSnap.data();
          return {
            id: docSnap.id,
            ...raw,
            createdAt: raw.createdAt?.toDate?.() ?? new Date()
          } as AuditLogState;
        });
        setLogs(data);
        setLoading(false);
      },
      (err) => {
        logger.error('Error cargando auditoría', err);
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar auditoría.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const availableModules = useMemo(() => {
    const unique = new Set<string>();
    logs.forEach((log) => unique.add(log.modulo ?? 'desconocido'));
    return Array.from(unique.values()).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const lowerBound =
      timeRange === 'all' ? 0 : now - RANGE_IN_MS[timeRange as Exclude<TimeRange, 'all'>];
    const normalizedSearch = search.trim().toLowerCase();

    return logs.filter((log) => {
      if (selectedModule !== 'all' && log.modulo !== selectedModule) {
        return false;
      }

      if (timeRange !== 'all' && log.createdAt.getTime() < lowerBound) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        log.actorNombre,
        log.actorUid,
        log.accion,
        log.entidadId,
        log.resumen,
        log.entidadTipo,
        log.detalles ? JSON.stringify(log.detalles) : ''
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [logs, selectedModule, timeRange, search]);

  const stats = useMemo(() => {
    const now = Date.now();
    const last24h = logs.filter((log) => now - log.createdAt.getTime() <= RANGE_IN_MS['24h']).length;
    const last7d = logs.filter((log) => now - log.createdAt.getTime() <= RANGE_IN_MS['7d']).length;
    const actors = new Set(logs.map((log) => log.actorUid)).size;
    const modules = new Set(logs.map((log) => log.modulo)).size;

    return { last24h, last7d, actors, modules };
  }, [logs]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Cargando auditoría...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">
        <p className="font-semibold">No se pudo cargar la auditoría.</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">Control</p>
          <h1 className="text-3xl font-bold text-gray-900">Auditoría</h1>
          <p className="text-gray-600 mt-1">
            Últimos 200 eventos registrados en el sistema, en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(Object.keys(RANGE_LABELS) as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  timeRange === range ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {RANGE_LABELS[range]}
              </button>
            ))}
          </div>
          <button
            onClick={() => setTimeRange('24h')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            title="Volver al último día"
          >
            <RefreshCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Eventos (24h)" value={stats.last24h} icon={<Activity className="w-5 h-5" />} />
        <StatCard
          label="Eventos (7d)"
          value={stats.last7d}
          icon={<Activity className="w-5 h-5 text-blue-500" />}
        />
        <StatCard
          label="Usuarios implicados"
          value={stats.actors}
          icon={<Filter className="w-5 h-5 text-emerald-500" />}
        />
        <StatCard
          label="Módulos con actividad"
          value={stats.modules}
          icon={<Filter className="w-5 h-5 text-indigo-500" />}
        />
      </section>

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-gray-700 font-semibold">
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar actor, acción, entidad..."
                className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <select
              value={selectedModule}
              onChange={(event) => setSelectedModule(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Todos los módulos</option>
              {availableModules.map((module) => (
                <option key={module} value={module}>
                  {module}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <Th>Fecha</Th>
                <Th>Módulo</Th>
                <Th>Acción</Th>
                <Th>Actor</Th>
                <Th>Entidad</Th>
                <Th>Contexto</Th>
                <Th>Detalles</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    Sin eventos que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="align-top">
                    <Td>
                      <div className="text-sm font-medium text-gray-900">
                        {log.createdAt.toLocaleDateString('es-ES')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {log.createdAt.toLocaleTimeString('es-ES')}
                      </div>
                    </Td>
                    <Td>
                      <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {log.modulo ?? 'N/A'}
                      </span>
                    </Td>
                    <Td className="text-sm font-semibold text-gray-800">{log.accion}</Td>
                    <Td>
                      <p className="text-sm text-gray-900">{log.actorNombre ?? 'Desconocido'}</p>
                      <p className="text-xs text-gray-500">{log.actorUid}</p>
                    </Td>
                    <Td>
                      <code className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-700">{log.entidadId}</code>
                    </Td>
                    <Td>
                      <p className="text-sm text-gray-900">{log.resumen ?? '—'}</p>
                      {log.entidadTipo && (
                        <p className="text-xs text-gray-500">Tipo: {log.entidadTipo}</p>
                      )}
                      {log.rutaDetalle && (
                        <Link
                          href={log.rutaDetalle}
                          className="mt-1 inline-flex text-xs font-medium text-blue-600 hover:underline"
                        >
                          Ir al módulo
                        </Link>
                      )}
                    </Td>
                    <Td>
                      <button
                        onClick={() => toggleExpand(log.id)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        {expanded === log.id ? 'Ocultar' : 'Ver'} detalles
                      </button>
                      {expanded === log.id && (
                        <pre className="mt-2 max-h-40 overflow-auto rounded bg-gray-50 p-2 text-xs text-gray-600">
                          {log.detalles ? JSON.stringify(log.detalles, null, 2) : 'Sin detalles'}
                        </pre>
                      )}
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <span className="text-gray-400">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
      {children}
    </th>
  );
}

function Td({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-6 py-4 text-sm text-gray-600 ${className ?? ''}`}>{children}</td>;
}
