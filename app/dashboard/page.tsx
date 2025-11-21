'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useKPIs } from '@/lib/hooks/useQueries';
import { useProyectos } from '@/lib/hooks/useProyectos';
import {
  useRecentActivity,
  useTodayAppointments,
  useUserTasks,
  useFinanceSummary,
  useStockAlerts,
  useFollowUpPatients,
  useRecentEvaluations,
} from '@/lib/hooks/useDashboard';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  AppointmentsWidget,
  TasksWidget,
  FollowUpsWidget,
  ProjectsWidget,
  FinanceWidget,
  ReportsWidget,
  StockWidget,
  ActivityWidget,
  MetricsWidget,
  EvaluationsWidget,
} from '@/components/dashboard/widgets';

// Skeleton para loading
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-48 bg-gray-200 rounded-2xl"></div>
      <div className="grid grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
    </div>
  );
}

function DashboardContent() {
  // Auth para saludo personalizado
  const { user } = useAuth();

  // React Query hooks
  const { data: kpisData } = useKPIs();
  const { proyectos, estadisticas: proyectosStats, isLoading: loadingProyectos } = useProyectos();

  // Custom hooks para data fetching
  const { data: recentActivity, loading: loadingActivity } = useRecentActivity();
  const { data: todayAppointments, loading: loadingAppointments } = useTodayAppointments();
  const { data: userTasks, loading: loadingTasks } = useUserTasks();
  const { data: financeSummary, loading: loadingFinance } = useFinanceSummary();
  const { data: stockAlerts, loading: loadingStock } = useStockAlerts();
  const { data: followUpPatients, loading: loadingFollowUps } = useFollowUpPatients();
  const { data: recentEvaluations, loading: loadingEvaluations } = useRecentEvaluations();

  // Fecha y saludo
  const now = useMemo(() => new Date(), []);
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);

  const greeting = useMemo(() => {
    const hour = now.getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 20) return 'Buenas tardes';
    return 'Buenas noches';
  }, [now]);

  const userName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuario';

  // Quick actions
  const quickActions = [
    { label: 'Nueva cita', href: '/dashboard/agenda/nuevo' },
    { label: 'Registrar paciente', href: '/dashboard/pacientes/nuevo' },
    { label: 'Crear reporte', href: '/dashboard/reporte-diario' },
  ];

  return (
    <div className="space-y-4">
      {/* Header con saludo y acciones rápidas */}
      <section className="surface-card px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {greeting}, {userName}
            </p>
            <p className="text-xs text-slate-500 capitalize">{formattedDate}</p>
          </div>
          <div className="flex items-center gap-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Fila Hero - Citas de hoy + Mis tareas */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <AppointmentsWidget appointments={todayAppointments} loading={loadingAppointments} />
        <TasksWidget tasks={userTasks} loading={loadingTasks} />
      </section>

      {/* Grid 3x2 - Widgets operativos */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <FollowUpsWidget patients={followUpPatients} loading={loadingFollowUps} />
        <ProjectsWidget
          proyectos={proyectos}
          estadisticas={proyectosStats}
          loading={loadingProyectos}
        />
        <FinanceWidget summary={financeSummary} loading={loadingFinance} />
        <ReportsWidget pendingCount={kpisData?.reportesPendientes ?? 0} />
        <StockWidget alerts={stockAlerts} loading={loadingStock} />
        <ActivityWidget activity={recentActivity} loading={loadingActivity} />
      </section>

      {/* Fila inferior - Métricas y QA */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <MetricsWidget
          serviciosActivos={kpisData?.serviciosActivos ?? 0}
          profesionalesActivos={kpisData?.profesionalesActivos ?? 0}
          eventosSemana={kpisData?.eventosSemana ?? 0}
        />
        <EvaluationsWidget evaluations={recentEvaluations} loading={loadingEvaluations} />
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
