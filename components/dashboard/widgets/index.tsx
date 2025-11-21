'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  Package,
  ArrowRight,
  Activity,
  TrendingUp,
  CalendarDays,
  Users,
  FolderKanban,
  ClipboardCheck,
  CheckCircle2,
  Circle,
  Clock,
} from 'lucide-react';
import {
  TodayAppointment,
  UserTask,
  FinanceSummary,
  StockAlerts,
  FollowUpPatient,
  RecentActivity,
  RecentEvaluation,
} from '@/types/dashboard';
import { Proyecto } from '@/types/proyectos';

// Formatter para moneda
const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

// ========== CITAS DE HOY ==========
interface AppointmentsWidgetProps {
  appointments: TodayAppointment[];
  loading: boolean;
}

export function AppointmentsWidget({ appointments, loading }: AppointmentsWidgetProps) {
  const now = new Date();
  const citasCompletadas = appointments.filter((c) => c.completada).length;

  return (
    <div className="surface-card p-4 border-l-2 border-l-brand">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-semibold text-slate-900">Citas de hoy</h3>
        </div>
        <div className="flex items-center gap-2">
          {!loading && (
            <>
              <span className="text-xs text-success font-medium">{citasCompletadas} ✓</span>
              <span className="text-xs text-slate-300">|</span>
              <span className="text-xs text-slate-600 font-medium">{appointments.length} total</span>
            </>
          )}
        </div>
      </div>
      {loading ? (
        <p className="text-xs text-slate-500">Cargando...</p>
      ) : appointments.length === 0 ? (
        <p className="text-xs text-slate-500">Sin citas programadas para hoy</p>
      ) : (
        <div className="space-y-2">
          {appointments
            .filter((c) => !c.completada)
            .slice(0, 5)
            .map((cita) => (
              <div
                key={cita.id}
                className={`rounded-lg px-3 py-2 ${
                  cita.fecha <= now ? 'bg-brand/10 border border-brand/20' : 'bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-900 truncate">{cita.paciente}</p>
                  {cita.fecha <= now && (
                    <span className="text-[9px] font-semibold text-brand uppercase px-1.5 py-0.5 bg-brand/20 rounded">
                      En curso
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {cita.fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  {cita.profesional && ` · ${cita.profesional}`}
                  {cita.servicio && ` · ${cita.servicio}`}
                </p>
              </div>
            ))}
          {citasCompletadas > 0 && (
            <p className="text-[10px] text-success flex items-center gap-1 pt-1">
              <CheckCircle2 className="h-3 w-3" />
              {citasCompletadas} completada{citasCompletadas !== 1 ? 's' : ''} hoy
            </p>
          )}
        </div>
      )}
      <Link
        href="/dashboard/agenda"
        className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand/80"
      >
        Ver agenda completa <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ========== MIS TAREAS ==========
interface TasksWidgetProps {
  tasks: UserTask[];
  loading: boolean;
}

export function TasksWidget({ tasks, loading }: TasksWidgetProps) {
  const now = new Date();

  return (
    <div className="surface-card p-4 border-l-2 border-l-brand bg-sky-50/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-semibold text-slate-900">Mis tareas</h3>
        </div>
        {!loading && tasks.length > 0 && (
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
            {tasks.length} pendiente{tasks.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      {loading ? (
        <p className="text-xs text-slate-500">Cargando...</p>
      ) : tasks.length === 0 ? (
        <p className="text-xs text-success">Sin tareas pendientes</p>
      ) : (
        <div className="space-y-2">
          {tasks.slice(0, 5).map((task) => (
            <div key={task.id} className="flex items-start gap-2 bg-white rounded-lg px-3 py-2">
              <Circle
                className={`h-3 w-3 mt-0.5 shrink-0 ${
                  task.prioridad === 'alta'
                    ? 'text-danger'
                    : task.prioridad === 'media'
                    ? 'text-warn'
                    : 'text-slate-400'
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 truncate">{task.titulo}</p>
                {task.fechaLimite && (
                  <p
                    className={`text-[9px] ${
                      task.fechaLimite < now ? 'text-danger font-medium' : 'text-slate-500'
                    }`}
                  >
                    {task.fechaLimite < now
                      ? '⚠️ Vencida'
                      : `Vence: ${task.fechaLimite.toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                        })}`}
                  </p>
                )}
              </div>
              <span
                className={`text-[8px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                  task.prioridad === 'alta'
                    ? 'bg-danger-bg text-danger'
                    : task.prioridad === 'media'
                    ? 'bg-warn-bg text-warn'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {task.prioridad}
              </span>
            </div>
          ))}
        </div>
      )}
      <Link
        href="/dashboard/proyectos"
        className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand/80"
      >
        Ver proyectos <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ========== SEGUIMIENTOS PENDIENTES ==========
interface FollowUpsWidgetProps {
  patients: FollowUpPatient[];
  loading: boolean;
}

export function FollowUpsWidget({ patients, loading }: FollowUpsWidgetProps) {
  return (
    <div
      className={`surface-card p-3 border-l-2 ${
        patients.length > 0
          ? 'border-l-amber-500 bg-amber-50/30'
          : 'border-l-success bg-emerald-50/20'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Users
            className={`h-3.5 w-3.5 ${patients.length > 0 ? 'text-amber-600' : 'text-success'}`}
          />
          <h3 className="text-xs font-semibold text-slate-900">Seguimientos pendientes</h3>
        </div>
        {!loading && patients.length > 0 && (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
            {patients.length}+
          </span>
        )}
      </div>
      {loading ? (
        <p className="text-xs text-slate-500">Cargando...</p>
      ) : patients.length === 0 ? (
        <p className="text-xs text-success">Todos al día</p>
      ) : (
        <div className="space-y-1">
          {patients.slice(0, 4).map((patient) => (
            <Link
              key={patient.id}
              href={`/dashboard/pacientes/${patient.id}`}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1.5 text-[11px] hover:bg-slate-100"
            >
              <span className="font-medium text-slate-900 truncate">
                {patient.nombre} {patient.apellidos}
              </span>
              <ArrowRight className="h-3 w-3 text-slate-400" />
            </Link>
          ))}
        </div>
      )}
      <Link
        href="/dashboard/pacientes"
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand/80"
      >
        Ver todos <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ========== PROYECTOS EN CURSO ==========
interface ProjectsWidgetProps {
  proyectos: Proyecto[];
  estadisticas?: {
    porEstado: Record<string, number>;
    proyectosAtrasados: number;
  };
  loading: boolean;
}

export function ProjectsWidget({ proyectos, estadisticas, loading }: ProjectsWidgetProps) {
  const enCurso = proyectos.filter((p) => p.estado === 'en-curso');

  return (
    <div className="surface-card p-3 border-l-2 border-l-accent-500 bg-emerald-50/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <FolderKanban className="h-3.5 w-3.5 text-accent-600" />
          <h3 className="text-xs font-semibold text-slate-900">Proyectos en curso</h3>
        </div>
        {!loading && estadisticas && (
          <span className="rounded-full bg-accent-100 px-1.5 py-0.5 text-[9px] font-semibold text-accent-700">
            {estadisticas.porEstado['en-curso']}
          </span>
        )}
      </div>
      {loading ? (
        <p className="text-xs text-slate-500">Cargando...</p>
      ) : enCurso.length === 0 ? (
        <p className="text-xs text-slate-500">Sin proyectos activos</p>
      ) : (
        <div className="space-y-1.5">
          {enCurso.slice(0, 3).map((proyecto) => (
            <div key={proyecto.id} className="rounded-lg bg-slate-50 px-2 py-1.5">
              <p className="text-[11px] font-medium text-slate-900 truncate">{proyecto.nombre}</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-500 rounded-full"
                    style={{ width: `${proyecto.progreso}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-500">{proyecto.progreso}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {estadisticas && estadisticas.proyectosAtrasados > 0 && (
        <p className="mt-1.5 text-[10px] text-danger">
          ⚠️ {estadisticas.proyectosAtrasados} atrasado(s)
        </p>
      )}
      <Link
        href="/dashboard/proyectos"
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand/80"
      >
        Ver todos <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ========== FINANZAS ==========
interface FinanceWidgetProps {
  summary: FinanceSummary;
  loading: boolean;
}

export function FinanceWidget({ summary, loading }: FinanceWidgetProps) {
  return (
    <div className="surface-card p-3 border-l-2 border-l-violet-500 bg-violet-50/30">
      <div className="flex items-center gap-1.5 mb-2">
        <TrendingUp className="h-3.5 w-3.5 text-violet-600" />
        <h3 className="text-xs font-semibold text-slate-900">Finanzas del mes</h3>
      </div>
      {loading ? (
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-3 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500">Facturado</span>
            <span className="font-semibold text-slate-900">
              {currencyFormatter.format(summary.facturadoMes)}
            </span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500">Cobrado</span>
            <span className="font-semibold text-slate-900">
              {currencyFormatter.format(summary.cobradoMes)}
            </span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500">Pendiente</span>
            <span className="font-semibold text-amber-600">
              {currencyFormatter.format(summary.totalPendiente)}
            </span>
          </div>
          {summary.totalVencido > 0 && (
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Vencido</span>
              <span className="font-semibold text-rose-600">
                {currencyFormatter.format(summary.totalVencido)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ========== REPORTES PENDIENTES ==========
interface ReportsWidgetProps {
  pendingCount: number;
}

export function ReportsWidget({ pendingCount }: ReportsWidgetProps) {
  return (
    <div
      className={`surface-card p-3 border-l-2 ${
        pendingCount > 0 ? 'border-l-danger bg-rose-50/30' : 'border-l-slate-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <AlertTriangle
            className={`h-3.5 w-3.5 ${pendingCount > 0 ? 'text-danger' : 'text-slate-400'}`}
          />
          <h3 className="text-xs font-semibold text-slate-900">Reportes pendientes</h3>
        </div>
        {pendingCount > 0 && (
          <span className="rounded-full bg-danger-bg px-1.5 py-0.5 text-[9px] font-semibold text-danger">
            {pendingCount}
          </span>
        )}
      </div>
      {pendingCount === 0 ? (
        <p className="text-xs text-success">Sin reportes pendientes</p>
      ) : (
        <div className="space-y-1.5">
          <p className="text-[11px] text-slate-600">{pendingCount} reporte(s) requieren atención</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-danger rounded-full"
                style={{ width: `${Math.min(pendingCount * 20, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
      <Link
        href="/dashboard/reporte-diario"
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand/80"
      >
        Ver reportes <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ========== STOCK BAJO ==========
interface StockWidgetProps {
  alerts: StockAlerts;
  loading: boolean;
}

export function StockWidget({ alerts, loading }: StockWidgetProps) {
  return (
    <div
      className={`surface-card p-3 border-l-2 ${
        alerts.total > 0 ? 'border-l-warn bg-orange-50/40' : 'border-l-slate-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-warn" />
          <h3 className="text-xs font-semibold text-slate-900">Stock bajo</h3>
        </div>
        {alerts.total > 0 && (
          <span className="rounded-full bg-warn-bg px-1.5 py-0.5 text-[9px] font-semibold text-warn">
            {alerts.total}
          </span>
        )}
      </div>
      {loading ? (
        <p className="text-xs text-slate-500">Cargando...</p>
      ) : alerts.top.length === 0 ? (
        <p className="text-xs text-success">Sin alertas de stock</p>
      ) : (
        <div className="space-y-1">
          {alerts.top.slice(0, 3).map((item) => (
            <div key={item.id} className="flex justify-between text-[11px]">
              <span className="text-slate-600 truncate pr-2">{item.nombre}</span>
              <span className="font-semibold text-slate-800">
                {item.stock}/{item.stockMinimo}
              </span>
            </div>
          ))}
        </div>
      )}
      <Link
        href="/dashboard/inventario"
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand/80"
      >
        Ver inventario <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ========== ACTIVIDAD RECIENTE ==========
interface ActivityWidgetProps {
  activity: RecentActivity[];
  loading: boolean;
}

export function ActivityWidget({ activity, loading }: ActivityWidgetProps) {
  return (
    <div className="surface-card p-3 border-l-2 border-l-brand bg-sky-50/20">
      <div className="flex items-center gap-1.5 mb-2">
        <Activity className="h-3.5 w-3.5 text-brand" />
        <h3 className="text-xs font-semibold text-slate-900">Actividad reciente</h3>
      </div>
      {loading ? (
        <p className="text-xs text-slate-500">Cargando...</p>
      ) : activity.length === 0 ? (
        <p className="text-xs text-slate-500">Sin actividad</p>
      ) : (
        <div className="space-y-1.5">
          {activity.slice(0, 4).map((item) => (
            <div key={item.id} className="border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
              <p className="text-[11px] font-medium text-slate-900 truncate">{item.descripcion}</p>
              <p className="text-[10px] text-slate-500">
                {item.tipo} ·{' '}
                {item.fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
      <Link
        href="/dashboard/auditoria"
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand/80"
      >
        Ver historial <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ========== MÉTRICAS CLAVE ==========
interface MetricsWidgetProps {
  serviciosActivos: number;
  profesionalesActivos: number;
  eventosSemana: number;
}

export function MetricsWidget({
  serviciosActivos,
  profesionalesActivos,
  eventosSemana,
}: MetricsWidgetProps) {
  return (
    <div className="surface-card p-4 border-l-2 border-l-slate-300 bg-slate-50/50">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Métricas clave</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <span className="text-2xl font-bold text-slate-900">{serviciosActivos}</span>
          <p className="text-[10px] uppercase tracking-wide text-slate-500 mt-1">Servicios activos</p>
        </div>
        <div className="text-center">
          <span className="text-2xl font-bold text-slate-900">{profesionalesActivos}</span>
          <p className="text-[10px] uppercase tracking-wide text-slate-500 mt-1">Profesionales</p>
        </div>
        <div className="text-center">
          <span className="text-2xl font-bold text-brand">{eventosSemana}</span>
          <p className="text-[10px] uppercase tracking-wide text-slate-500 mt-1">Eventos/sem</p>
        </div>
      </div>
      <Link
        href="/dashboard/kpis"
        className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand/80"
      >
        Ver todos los KPIs <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ========== SUPERVISIÓN QA ==========
interface EvaluationsWidgetProps {
  evaluations: RecentEvaluation[];
  loading: boolean;
}

export function EvaluationsWidget({ evaluations, loading }: EvaluationsWidgetProps) {
  return (
    <div className="surface-card p-4 border-l-2 border-l-accent-500 bg-emerald-50/30">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardCheck className="h-4 w-4 text-accent-600" />
        <h3 className="text-sm font-semibold text-slate-900">Supervisión QA</h3>
      </div>
      {loading ? (
        <p className="text-xs text-slate-500">Cargando...</p>
      ) : evaluations.length === 0 ? (
        <p className="text-xs text-slate-500">Sin evaluaciones recientes</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {evaluations.slice(0, 4).map((evaluation) => (
            <div key={evaluation.id} className="rounded-lg bg-white px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-900 truncate">
                  {evaluation.profesionalNombre}
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                    evaluation.promedioGeneral >= 4
                      ? 'bg-success-bg text-success'
                      : evaluation.promedioGeneral >= 3
                      ? 'bg-warn-bg text-warn'
                      : 'bg-danger-bg text-danger'
                  }`}
                >
                  {evaluation.promedioGeneral}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate">{evaluation.servicioNombre}</p>
            </div>
          ))}
        </div>
      )}
      <Link
        href="/dashboard/supervision"
        className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand/80"
      >
        Ver supervisión <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
