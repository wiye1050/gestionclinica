'use client';

import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useKPIs } from '@/lib/hooks/useQueries';
import {
  Mail,
  BarChart3,
  Wrench,
  AlertTriangle,
  Package,
  ExternalLink,
  ArrowRight,
  BookOpen,
  Sun,
  Moon,
  Activity,
  TrendingUp
} from 'lucide-react';

// Skeleton para loading
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-48 bg-gray-200 rounded-2xl"></div>
      <div className="grid grid-cols-3 gap-5">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  
  // React Query hook - caché de 2 min
  const { data: kpisData, isLoading: loadingKPIs } = useKPIs();
  
  const [recentActivity, setRecentActivity] = useState<Array<{id: string; tipo: string; descripcion: string; fecha: Date}>>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [isDark, setIsDark] = useState(false);

  // Stats desde React Query o valores por defecto
  const stats = useMemo(() => ({
    serviciosActivos: kpisData?.serviciosActivos ?? 0,
    incidenciasPendientes: kpisData?.reportesPendientes ?? 0,
    productosStockBajo: 0, // Se puede agregar al hook useKPIs si es necesario
    cumplimientoProtocolos: 0, // Se puede agregar al hook useKPIs si es necesario
    seguimientosPendientes: kpisData?.eventosSemana ?? 0
  }), [kpisData]);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = stored ? stored === 'dark' : prefersDark;
    setIsDark(shouldUseDark);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', shouldUseDark);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
    }
  };

  useEffect(() => {
    let active = true;

    const fetchActivity = async () => {
      try {
        const activitySnap = await getDocs(
          query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(5))
        );
        
        if (!active) return;

        setRecentActivity(
          activitySnap.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              tipo: data.modulo || 'general',
              descripcion: data.resumen || data.accion || 'Sin descripción',
              fecha: data.createdAt?.toDate?.() ?? new Date()
            };
          })
        );
      } catch (error) {
        console.error('Error cargando actividad', error);
      } finally {
        if (active) setLoadingActivity(false);
      }
    };

    fetchActivity();
    return () => {
      active = false;
    };
  }, []);

  const now = useMemo(() => new Date(), []);
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(now);

  const ThemeIcon = isDark ? Sun : Moon;
  const loading = loadingKPIs || loadingActivity;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-8 text-white shadow-xl">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Bienvenido a Instituto Ordóñez</h1>
            <p className="mt-2 text-lg text-blue-100">{formattedDate}</p>
            <div className="mt-4 flex gap-6 text-sm">
              <div>
                <span className="font-semibold">{stats.serviciosActivos}</span> servicios activos
              </div>
              <div>
                <span className="font-semibold">{stats.seguimientosPendientes}</span> eventos esta semana
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full bg-white/20 p-3 backdrop-blur-sm transition-all hover:bg-white/30"
            aria-label="Cambiar tema"
          >
            <ThemeIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <a
          href="https://email.ionos.es/appsuite/#!!&app=io.ox/mail&folder=default0/INBOX"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <Mail className="w-5 h-5" />
            <ExternalLink className="w-4 h-4 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <h3 className="text-xl font-semibold">Correo Corporativo</h3>
          <p className="mt-1 text-sm text-blue-100">Acceder al email</p>
        </a>

        <a
          href="https://app.clinic-cloud.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 p-6 text-white shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="rounded-lg bg-white/90 px-2 py-1">
              <Image src="/cliniccloud-logo.svg" alt="ClinicCloud" width={90} height={28} priority={false} />
            </div>
            <ExternalLink className="w-4 h-4 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </a>

        <Link
          href="/dashboard/kpis"
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <BarChart3 className="w-5 h-5" />
            <ArrowRight className="w-4 h-4 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <h3 className="text-xl font-semibold">KPIs y Métricas</h3>
          <p className="mt-1 text-sm text-emerald-100">Ver estadísticas</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => router.push('/dashboard/servicios?estado=activo')}
          className="cursor-pointer rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-5 shadow transition-transform hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Servicios Activos</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{loadingKPIs ? '—' : stats.serviciosActivos}</p>
        </div>

        <div
          onClick={() => router.push('/dashboard/reporte-diario?tipo=incidencia&prioridad=alta&estado=abierta')}
          className="cursor-pointer rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-5 shadow transition-transform hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Reportes Pendientes</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{loadingKPIs ? '—' : stats.incidenciasPendientes}</p>
        </div>

        <div
          onClick={() => router.push('/dashboard/inventario?critico=true')}
          className="cursor-pointer rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-5 shadow transition-transform hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Stock Bajo</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{loading ? '—' : stats.productosStockBajo}</p>
        </div>

        <div
          onClick={() => router.push('/dashboard/profesionales')}
          className="cursor-pointer rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-5 shadow transition-transform hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Profesionales Activos</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{loadingKPIs ? '—' : kpisData?.profesionalesActivos ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Alertas */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-6 text-white shadow-lg">
            <h3 className="text-lg font-bold mb-4">Alertas Prioritarias</h3>
            <div className="space-y-3">
              {stats.incidenciasPendientes > 0 && (
                <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 text-sm">
                  ⚠️ {stats.incidenciasPendientes} reporte{stats.incidenciasPendientes > 1 ? 's' : ''} pendiente{stats.incidenciasPendientes > 1 ? 's' : ''}
                </div>
              )}
              {stats.productosStockBajo > 0 && (
                <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 text-sm">
                  ⚠️ {stats.productosStockBajo} producto{stats.productosStockBajo > 1 ? 's' : ''} con stock bajo
                </div>
              )}
              {stats.seguimientosPendientes > 0 && (
                <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 text-sm">
                  📅 {stats.seguimientosPendientes} evento{stats.seguimientosPendientes > 1 ? 's' : ''} esta semana
                </div>
              )}
              {stats.incidenciasPendientes === 0 && stats.productosStockBajo === 0 && stats.seguimientosPendientes === 0 && (
                <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 text-sm">
                  ✅ No hay alertas críticas
                </div>
              )}
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Última actividad</h3>
            </div>
            {loadingActivity ? (
              <p className="text-sm text-gray-500">Cargando...</p>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500">No hay actividad reciente</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                      <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.descripcion}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{item.tipo}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{item.fecha.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/dashboard/auditoria" className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
              Ver historial completo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Sidebar derecho - Métricas */}
        <div className="space-y-5">
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Métricas clave</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Servicios activos</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.serviciosActivos}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Profesionales activos</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpisData?.profesionalesActivos ?? 0}</p>
              </div>
              <Link href="/dashboard/kpis" className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
                Ver todas las métricas
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
