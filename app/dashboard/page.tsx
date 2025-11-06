'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
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
  TrendingUp,
  CalendarDays
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
    <div className="space-y-8">
      <section className="rounded-3xl border border-border bg-card px-8 py-7 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-pill border border-border bg-cardHover px-3 py-1 text-[13px] font-medium text-text-muted">
              <span className="h-2 w-2 rounded-full bg-brand"></span>
              Instituto Ordóñez
            </span>
            <div>
              <h1 className="text-3xl font-semibold text-text">Panel Operativo</h1>
              <p className="text-sm text-text-muted">{formattedDate}</p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-text-muted">
              <div className="space-y-1">
                <p className="text-text-muted">Servicios activos</p>
                <p className="text-2xl font-semibold text-text">{stats.serviciosActivos}</p>
              </div>
              <div className="space-y-1">
                <p className="text-text-muted">Eventos esta semana</p>
                <p className="text-2xl font-semibold text-text">{stats.seguimientosPendientes}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-cardHover px-4 py-3">
            <p className="text-sm font-medium text-text">Modo {isDark ? 'oscuro' : 'claro'}</p>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-text transition-colors hover:bg-cardHover focus-visible:focus-ring"
              aria-label="Cambiar tema"
            >
              <ThemeIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <a
          href="https://email.ionos.es/appsuite/#!!&app=io.ox/mail&folder=default0/INBOX"
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-cardHover focus-visible:focus-ring"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-full bg-brand-subtle p-2 text-brand">
              <Mail className="h-4 w-4" />
            </div>
            <ExternalLink className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5" />
          </div>
          <h3 className="text-lg font-semibold text-text">Correo corporativo</h3>
          <p className="mt-1 text-sm text-text-muted">Abrir bandeja de entrada</p>
        </a>

        <a
          href="https://app.clinic-cloud.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-cardHover focus-visible:focus-ring"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-full bg-brand-subtle p-2 text-brand">
              <Activity className="h-4 w-4" />
            </div>
            <ExternalLink className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="rounded-xl border border-border bg-cardHover px-3 py-2">
            <Image src="/cliniccloud-logo.svg" alt="ClinicCloud" width={96} height={28} priority={false} />
          </div>
        </a>

        <Link
          href="/dashboard/kpis"
          className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-cardHover focus-visible:focus-ring"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-full bg-brand-subtle p-2 text-brand">
              <BarChart3 className="h-4 w-4" />
            </div>
            <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5" />
          </div>
          <h3 className="text-lg font-semibold text-text">KPIs y métricas</h3>
          <p className="mt-1 text-sm text-text-muted">Ver estadísticas en tiempo real</p>
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard/servicios?estado=activo')}
          className="rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:bg-cardHover focus-visible:focus-ring"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-subtle text-brand">
            <Wrench className="h-4 w-4" />
          </div>
          <p className="text-sm text-text-muted">Servicios activos</p>
          <p className="mt-2 text-3xl font-semibold text-text">{loadingKPIs ? '—' : stats.serviciosActivos}</p>
        </button>

        <button
          type="button"
          onClick={() => router.push('/dashboard/reporte-diario?tipo=incidencia&prioridad=alta&estado=abierta')}
          className="rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:bg-cardHover focus-visible:focus-ring"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger-bg text-danger">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <p className="text-sm text-text-muted">Reportes pendientes</p>
          <p className="mt-2 text-3xl font-semibold text-text">{loadingKPIs ? '—' : stats.incidenciasPendientes}</p>
        </button>

        <button
          type="button"
          onClick={() => router.push('/dashboard/inventario?critico=true')}
          className="rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:bg-cardHover focus-visible:focus-ring"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-warn-bg text-warn">
            <Package className="h-4 w-4" />
          </div>
          <p className="text-sm text-text-muted">Stock bajo</p>
          <p className="mt-2 text-3xl font-semibold text-text">{loading ? '—' : stats.productosStockBajo}</p>
        </button>

        <button
          type="button"
          onClick={() => router.push('/dashboard/profesionales')}
          className="rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:bg-cardHover focus-visible:focus-ring"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-subtle text-brand">
            <BookOpen className="h-4 w-4" />
          </div>
          <p className="text-sm text-text-muted">Profesionales activos</p>
          <p className="mt-2 text-3xl font-semibold text-text">{loadingKPIs ? '—' : kpisData?.profesionalesActivos ?? 0}</p>
        </button>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text">Alertas prioritarias</h3>
              <span className="rounded-pill bg-danger-bg px-3 py-1 text-xs font-medium text-danger">
                {stats.incidenciasPendientes + stats.productosStockBajo + stats.seguimientosPendientes} pendientes
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {stats.incidenciasPendientes > 0 && (
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-cardHover px-4 py-3 text-sm text-text">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-bg text-danger">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium">Reportes pendientes</p>
                    <p className="text-text-muted">{stats.incidenciasPendientes} en seguimiento</p>
                  </div>
                </div>
              )}
              {stats.productosStockBajo > 0 && (
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-cardHover px-4 py-3 text-sm text-text">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-warn-bg text-warn">
                    <Package className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium">Productos con stock bajo</p>
                    <p className="text-text-muted">{stats.productosStockBajo} referencias críticas</p>
                  </div>
                </div>
              )}
              {stats.seguimientosPendientes > 0 && (
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-cardHover px-4 py-3 text-sm text-text">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-subtle text-brand">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium">Eventos agendados</p>
                    <p className="text-text-muted">{stats.seguimientosPendientes} pendientes esta semana</p>
                  </div>
                </div>
              )}
              {stats.incidenciasPendientes === 0 && stats.productosStockBajo === 0 && stats.seguimientosPendientes === 0 && (
                <div className="rounded-2xl border border-border bg-success-bg px-4 py-3 text-sm text-success">
                  ✅ No hay alertas críticas
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-subtle text-brand">
                <Activity className="h-4 w-4" />
              </span>
              <h3 className="text-lg font-semibold text-text">Última actividad</h3>
            </div>
            {loadingActivity ? (
              <p className="text-sm text-text-muted">Cargando actividad reciente…</p>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-text-muted">No hay actividad registrada.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 border-b border-border pb-3 last:border-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cardHover text-brand">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">{item.descripcion}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                        <span>{item.tipo}</span>
                        <span>•</span>
                        <span>{item.fecha.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/dashboard/auditoria" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand hover:text-brand/80">
              Ver historial completo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-text">Métricas clave</h3>
            <p className="mt-1 text-sm text-text-muted">Resumen rápido del rendimiento operativo.</p>
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Servicios</p>
                <p className="mt-1 text-3xl font-semibold text-text">{stats.serviciosActivos}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Profesionales</p>
                <p className="mt-1 text-3xl font-semibold text-text">{kpisData?.profesionalesActivos ?? 0}</p>
              </div>
              <Link href="/dashboard/kpis" className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:text-brand/80">
                Ver todas las métricas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </aside>
      </section>
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
