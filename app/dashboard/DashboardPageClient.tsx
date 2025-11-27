'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
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
import { useDashboardPreferences, type WidgetId } from '@/lib/hooks/useDashboardPreferences';
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
import { LazyWidget } from '@/components/dashboard/LazyWidget';
import {
  AppointmentsSkeleton,
  TasksSkeleton,
  CompactWidgetSkeleton,
  FinanceSkeleton,
  ActivitySkeleton,
  MetricsSkeleton,
  EvaluationsSkeleton,
} from '@/components/dashboard/WidgetSkeletons';
import { WidgetSettings } from '@/components/dashboard/WidgetSettings';
import { DraggableWidget } from '@/components/dashboard/DraggableWidget';
import { Calendar, UserPlus, FileText, Sparkles, Settings } from 'lucide-react';
import type { KPIResponse } from '@/lib/server/kpis';

interface DashboardPageClientProps {
  initialKPIs: KPIResponse;
}

// Skeleton para loading
function DashboardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-32 bg-gradient-to-r from-slate-200 to-slate-100 rounded-xl"></div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 bg-slate-100 rounded-xl"></div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}

function DashboardContent({ initialKPIs }: DashboardPageClientProps) {
  // Auth para saludo personalizado
  const { user } = useAuth();

  // Dashboard preferences
  const { isWidgetHidden, compactMode, widgetOrder, updateWidgetOrder } = useDashboardPreferences();
  const [showSettings, setShowSettings] = useState(false);

  // Handler para cuando termina el drag & drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgetOrder.indexOf(active.id as WidgetId);
      const newIndex = widgetOrder.indexOf(over.id as WidgetId);

      const newOrder = arrayMove(widgetOrder, oldIndex, newIndex);
      updateWidgetOrder(newOrder);
    }
  };

  // React Query hooks
  const kpisData = initialKPIs;
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

  // Quick actions con iconos
  const quickActions = [
    {
      label: 'Nueva cita',
      href: '/dashboard/agenda',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Nuevo paciente',
      href: '/dashboard/pacientes/nuevo',
      icon: UserPlus,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      label: 'Crear reporte',
      href: '/dashboard/reporte-diario',
      icon: FileText,
      color: 'from-violet-500 to-violet-600',
    },
  ];

  // Clases de espaciado basadas en modo compacto
  const spacing = compactMode ? 'space-y-0.5' : 'space-y-1';
  const gapX = compactMode ? 'gap-x-0.5' : 'gap-x-1';
  const gapY = 'gap-y-0';
  const padding = compactMode ? 'p-2 sm:p-3' : 'p-3 sm:p-4';

  // Función para renderizar un widget por ID
  const renderWidget = (widgetId: WidgetId, index: number) => {
    if (isWidgetHidden(widgetId)) return null;

    const delay = index * 50 + 50;

    switch (widgetId) {
      case 'appointments':
        return (
          <DraggableWidget key={widgetId} id={widgetId}>
            <LazyWidget delay={delay} skeleton={<AppointmentsSkeleton />}>
              <div className="animate-fade-in h-full" style={{ animationDelay: `${delay}ms` }}>
                <AppointmentsWidget appointments={todayAppointments} loading={loadingAppointments} />
              </div>
            </LazyWidget>
          </DraggableWidget>
        );

      case 'tasks':
        return (
          <DraggableWidget key={widgetId} id={widgetId}>
            <LazyWidget delay={delay} skeleton={<TasksSkeleton />}>
              <div className="animate-fade-in h-full" style={{ animationDelay: `${delay}ms` }}>
                <TasksWidget tasks={userTasks} loading={loadingTasks} />
              </div>
            </LazyWidget>
          </DraggableWidget>
        );

      case 'followUps':
        return (
          <DraggableWidget key={widgetId} id={widgetId}>
            <LazyWidget delay={delay} skeleton={<CompactWidgetSkeleton borderColor="border-amber-200" iconBg="bg-amber-200" />}>
              <div className="animate-fade-in h-full" style={{ animationDelay: `${delay}ms` }}>
                <FollowUpsWidget patients={followUpPatients} loading={loadingFollowUps} />
              </div>
            </LazyWidget>
          </DraggableWidget>
        );

      case 'projects':
        return (
          <DraggableWidget key={widgetId} id={widgetId}>
            <LazyWidget delay={delay} skeleton={<CompactWidgetSkeleton borderColor="border-emerald-200" iconBg="bg-emerald-200" />}>
              <div className="animate-fade-in h-full" style={{ animationDelay: `${delay}ms` }}>
                <ProjectsWidget proyectos={proyectos} estadisticas={proyectosStats} loading={loadingProyectos} />
              </div>
            </LazyWidget>
          </DraggableWidget>
        );

      case 'finance':
        return (
          <DraggableWidget key={widgetId} id={widgetId}>
            <LazyWidget delay={delay} skeleton={<FinanceSkeleton />}>
              <div className="animate-fade-in h-full" style={{ animationDelay: `${delay}ms` }}>
                <FinanceWidget summary={financeSummary} loading={loadingFinance} />
              </div>
            </LazyWidget>
          </DraggableWidget>
        );

      case 'reports':
        return (
          <DraggableWidget key={widgetId} id={widgetId}>
            <LazyWidget delay={delay} skeleton={<CompactWidgetSkeleton borderColor="border-rose-200" iconBg="bg-rose-200" />}>
              <div className="animate-fade-in h-full" style={{ animationDelay: `${delay}ms` }}>
                <ReportsWidget pendingCount={kpisData?.reportesPendientes ?? 0} />
              </div>
            </LazyWidget>
          </DraggableWidget>
        );

      case 'stock':
        return (
          <DraggableWidget key={widgetId} id={widgetId}>
            <LazyWidget delay={delay} skeleton={<CompactWidgetSkeleton borderColor="border-orange-200" iconBg="bg-orange-200" />}>
              <div className="animate-fade-in h-full" style={{ animationDelay: `${delay}ms` }}>
                <StockWidget alerts={stockAlerts} loading={loadingStock} />
              </div>
            </LazyWidget>
          </DraggableWidget>
        );

      case 'activity':
        return (
          <DraggableWidget key={widgetId} id={widgetId}>
            <LazyWidget delay={delay} skeleton={<ActivitySkeleton />}>
              <div className="animate-fade-in h-full" style={{ animationDelay: `${delay}ms` }}>
                <ActivityWidget activity={recentActivity} loading={loadingActivity} />
              </div>
            </LazyWidget>
          </DraggableWidget>
        );

      case 'metrics':
        return (
          <DraggableWidget key={widgetId} id={widgetId}>
            <LazyWidget delay={delay} skeleton={<MetricsSkeleton />}>
              <div className="animate-fade-in h-full" style={{ animationDelay: `${delay}ms` }}>
                <MetricsWidget
                  serviciosActivos={kpisData?.serviciosActivos ?? 0}
                  profesionalesActivos={kpisData?.profesionalesActivos ?? 0}
                  eventosSemana={kpisData?.eventosSemana ?? 0}
                />
              </div>
            </LazyWidget>
          </DraggableWidget>
        );

      case 'evaluations':
        return (
          <DraggableWidget key={widgetId} id={widgetId}>
            <LazyWidget delay={delay} skeleton={<EvaluationsSkeleton />}>
              <div className="animate-fade-in h-full" style={{ animationDelay: `${delay}ms` }}>
                <EvaluationsWidget evaluations={recentEvaluations} loading={loadingEvaluations} />
              </div>
            </LazyWidget>
          </DraggableWidget>
        );

      default:
        return null;
    }
  };

  // Filtrar solo los widgets visibles y en el orden correcto
  const visibleWidgets = widgetOrder.filter((id) => !isWidgetHidden(id));

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className={spacing}>
      {/* HERO SECTION COMPACTO - Adaptativo para móvil */}
      <section
        className={`relative overflow-hidden rounded-xl ${padding} shadow-lg animate-fade-in-scale`}
        style={{ background: 'linear-gradient(135deg, #0087cd 0%, #006ba4 50%, #00507b 100%)' }}
      >
        {/* Decoración de fondo */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />

        <div className="relative">
          {/* Header compacto - Stack en móvil, inline en desktop */}
          <div className={`mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`}>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-white/80" />
                <h1 className="text-base font-bold text-white sm:text-lg">
                  {greeting}, {userName}
                </h1>
              </div>
              <p className="text-xs capitalize text-white/70">{formattedDate}</p>
            </div>

            {/* Quick Actions + Settings Button */}
            <div className="flex flex-wrap items-center gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={`group flex items-center gap-1.5 rounded-lg bg-gradient-to-r ${action.color} px-3 py-1.5 shadow-md transition-all hover:scale-105 hover:shadow-lg`}
                  >
                    <Icon className="h-3.5 w-3.5 text-white" />
                    <span className="text-xs font-semibold text-white">{action.label}</span>
                  </Link>
                );
              })}
              {/* Settings button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="group flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 shadow-md backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-105"
                aria-label="Configurar dashboard"
              >
                <Settings className="h-3.5 w-3.5 text-white" />
                <span className="hidden text-xs font-semibold text-white sm:inline">
                  Configurar
                </span>
              </button>
            </div>
          </div>

          {/* Quick Stats - 2 cols móvil, 4 cols tablet+ */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg bg-white/10 p-2 backdrop-blur-sm">
              <p className="text-[10px] font-medium text-white/80">Citas hoy</p>
              <p className="text-xl font-bold text-white">{todayAppointments?.length || 0}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-2 backdrop-blur-sm">
              <p className="text-[10px] font-medium text-white/80">Seguimientos</p>
              <p className="text-xl font-bold text-white">{followUpPatients?.length || 0}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-2 backdrop-blur-sm">
              <p className="text-[10px] font-medium text-white/80">Servicios</p>
              <p className="text-xl font-bold text-white">{kpisData?.serviciosActivos || 0}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-2 backdrop-blur-sm">
              <p className="text-[10px] font-medium text-white/80">Eventos/sem</p>
              <p className="text-xl font-bold text-white">{kpisData?.eventosSemana || 0}</p>
            </div>
          </div>
        </div>
      </section>

      {/* WIDGETS GRID - Orden personalizable con drag & drop */}
      <SortableContext items={visibleWidgets}>
        <section
          className={`grid grid-cols-1 ${gapX} ${gapY} sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}
          style={{
            gridAutoRows: compactMode ? '160px' : '200px'
          }}
        >
          {visibleWidgets.map((widgetId, index) => renderWidget(widgetId, index))}
        </section>
      </SortableContext>

      {/* MODAL DE CONFIGURACIÓN */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md animate-fade-in-scale">
            <WidgetSettings onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}
      </div>
    </DndContext>
  );
}

export default function DashboardPageClient({ initialKPIs }: DashboardPageClientProps) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent initialKPIs={initialKPIs} />
    </Suspense>
  );
}
