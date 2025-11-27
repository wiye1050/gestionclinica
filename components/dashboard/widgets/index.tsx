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
  Clock,
  Zap,
  Target,
  DollarSign,
  BarChart3,
  Star,
  AlertCircle,
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

// ========== CITAS DE HOY (REDISEÑADO) ==========
interface AppointmentsWidgetProps {
  appointments: TodayAppointment[];
  loading: boolean;
}

export function AppointmentsWidget({ appointments, loading }: AppointmentsWidgetProps) {
  const now = new Date();
  const citasCompletadas = appointments.filter((c) => c.completada).length;
  const progreso = appointments.length > 0 ? (citasCompletadas / appointments.length) * 100 : 0;

  return (
    <div className="h-full flex flex-col rounded-lg border border-blue-200 bg-white p-2 shadow-sm transition-all hover:shadow-md">
      {/* Header compacto */}
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="rounded-lg p-1.5" style={{ background: 'linear-gradient(135deg, #0087cd, #006ba4)' }}>
            <CalendarDays className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Agenda de hoy</h3>
            <p className="text-[9px] text-slate-500">
              {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>
        {!loading && (
          <div className="rounded-lg bg-blue-100 px-2 py-1">
            <span className="text-sm font-bold text-blue-700">{appointments.length}</span>
          </div>
        )}
      </div>

      {/* Progress bar compacto */}
      {!loading && appointments.length > 0 && (
        <div className="mb-1.5">
          <div className="mb-1.5 flex items-center justify-between text-[10px] text-slate-600">
            <span>{citasCompletadas} completadas</span>
            <span>{Math.round(progreso)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progreso}%`, background: 'linear-gradient(90deg, #0087cd, #006ba4)' }}
            />
          </div>
        </div>
      )}

      {/* Content compacto */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-1.5">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto mb-1 h-6 w-6 text-slate-400" />
            <p className="text-xs text-slate-500">Sin citas</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {appointments
              .filter((c) => !c.completada)
              .slice(0, 3)
              .map((cita) => (
                <div
                  key={cita.id}
                  className={`rounded-lg border p-2 transition-all ${
                    cita.fecha <= now
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{cita.paciente}</p>
                      <p className="text-[10px] text-slate-600 truncate">
                        {cita.fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        {cita.profesional && ` · ${cita.profesional}`}
                      </p>
                    </div>
                    {cita.fecha <= now && (
                      <span className="flex items-center gap-0.5 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shrink-0">
                        <Zap className="h-2.5 w-2.5" />
                        Ahora
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <Link
        href="/dashboard/agenda"
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 transition-all hover:gap-2"
      >
        Ir a la agenda
        <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    </div>
  );
}

// ========== MIS TAREAS (REDISEÑADO) ==========
interface TasksWidgetProps {
  tasks: UserTask[];
  loading: boolean;
}

export function TasksWidget({ tasks, loading }: TasksWidgetProps) {
  const now = new Date();
  const tareasUrgentes = tasks.filter((t) => t.prioridad === 'alta').length;

  return (
    <div className="h-full flex flex-col rounded-lg border border-violet-200 bg-white p-2 shadow-sm transition-all hover:shadow-md">
      {/* Header compacto */}
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="rounded-lg p-1.5" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <Clock className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Mis tareas</h3>
            <p className="text-[9px] text-slate-500">Pendientes</p>
          </div>
        </div>
        {!loading && tasks.length > 0 && (
          <div className="flex items-center gap-1.5">
            {tareasUrgentes > 0 && (
              <span className="flex items-center gap-0.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                <AlertCircle className="h-2.5 w-2.5" />
                {tareasUrgentes}
              </span>
            )}
            <div className="rounded-lg bg-violet-100 px-2 py-1">
              <span className="text-sm font-bold text-violet-700">{tasks.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content compacto */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-1.5">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto mb-1 h-6 w-6 text-emerald-500" />
            <p className="text-xs font-medium text-slate-900">¡Todo al día!</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {tasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="group flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2 transition-all hover:border-slate-300 hover:shadow-sm"
              >
                <div
                  className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    task.prioridad === 'alta'
                      ? 'bg-rose-500'
                      : task.prioridad === 'media'
                      ? 'bg-amber-500'
                      : 'bg-slate-300'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-900 truncate">{task.titulo}</p>
                  {task.fechaLimite && (
                    <p
                      className={`text-[10px] ${
                        task.fechaLimite < now
                          ? 'font-medium text-rose-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {task.fechaLimite < now
                        ? '⚠️ Vencida'
                        : task.fechaLimite.toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                          })}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase shrink-0 ${
                    task.prioridad === 'alta'
                      ? 'bg-rose-100 text-rose-700'
                      : task.prioridad === 'media'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {task.prioridad}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <Link
        href="/dashboard/proyectos"
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 transition-all hover:gap-2"
      >
        Ver proyectos
        <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    </div>
  );
}

// ========== SEGUIMIENTOS (REDISEÑADO) ==========
interface FollowUpsWidgetProps {
  patients: FollowUpPatient[];
  loading: boolean;
}

export function FollowUpsWidget({ patients, loading }: FollowUpsWidgetProps) {
  const hasAlerts = patients.length > 0;

  return (
    <div className="h-full flex flex-col rounded-lg border border-amber-200 bg-white p-2 shadow-sm transition-all hover:shadow-md">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="rounded-lg p-1.5" style={{ background: hasAlerts ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Users className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Seguimientos</h3>
            <p className="text-[9px] text-slate-500">Pendientes</p>
          </div>
        </div>
        {!loading && hasAlerts && (
          <div className="rounded-lg bg-amber-100 px-2 py-1">
            <span className="text-sm font-bold text-amber-700">{patients.length}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-1">
          {[1, 2].map((i) => (
            <div key={i} className="h-6 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ) : hasAlerts ? (
        <div className="space-y-1">
          {patients.slice(0, 2).map((patient) => (
            <Link
              key={patient.id}
              href={`/dashboard/pacientes/${patient.id}`}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs transition-all hover:bg-white hover:border-amber-300"
            >
              <span className="font-medium text-slate-900 truncate text-[11px]">
                {patient.nombre} {patient.apellidos}
              </span>
              <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-3 text-center">
          <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-slate-400" />
          <p className="text-[10px] text-slate-500">Todos al día</p>
        </div>
      )}

      <Link
        href="/dashboard/pacientes?filtro=seguimiento"
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-brand-600"
      >
        Ver pacientes
        <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    </div>
  );
}

// ========== PROYECTOS (REDISEÑADO) ==========
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
    <div className="h-full flex flex-col rounded-lg border border-emerald-200 bg-white p-2 transition-all hover:shadow-sm">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="rounded-lg p-1.5" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <FolderKanban className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Proyectos</h3>
            <p className="text-[9px] text-slate-500">En curso</p>
          </div>
        </div>
        {!loading && estadisticas && (
          <div className="rounded-lg bg-emerald-100 px-2 py-1">
            <span className="text-sm font-bold text-emerald-700">
              {estadisticas.porEstado['en-curso'] || 0}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-1.5">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ) : enCurso.length === 0 ? (
        <div className="py-3 text-center">
          <Target className="mx-auto mb-1 h-5 w-5 text-slate-400" />
          <p className="text-[10px] text-slate-500">Sin proyectos activos</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {enCurso.slice(0, 2).map((proyecto) => (
            <div key={proyecto.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <p className="mb-1.5 text-[11px] font-semibold text-slate-900 truncate">
                {proyecto.nombre}
              </p>
              <div className="flex items-center gap-1.5">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${proyecto.progreso}%`, background: 'linear-gradient(90deg, #10b981, #059669)' }}
                  />
                </div>
                <span className="text-[9px] font-semibold text-emerald-700">
                  {proyecto.progreso}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {estadisticas && estadisticas.proyectosAtrasados > 0 && (
        <div className="mt-1.5 flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5">
          <AlertTriangle className="h-2.5 w-2.5 text-rose-600" />
          <p className="text-[9px] font-medium text-rose-700">
            {estadisticas.proyectosAtrasados} atrasado(s)
          </p>
        </div>
      )}

      <Link
        href="/dashboard/proyectos"
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 hover:gap-2 transition-all"
      >
        Ver kanban
        <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    </div>
  );
}

// ========== FINANZAS (REDISEÑADO) ==========
interface FinanceWidgetProps {
  summary: FinanceSummary;
  loading: boolean;
}

export function FinanceWidget({ summary, loading }: FinanceWidgetProps) {
  const tasaCobro =
    summary.facturadoMes > 0 ? (summary.cobradoMes / summary.facturadoMes) * 100 : 0;

  return (
    <div className="h-full flex flex-col rounded-lg border border-purple-200 bg-white p-2 transition-all hover:shadow-sm">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="rounded-lg p-1.5" style={{ background: 'linear-gradient(135deg, #a855f7, #9333ea)' }}>
            <DollarSign className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Finanzas</h3>
            <p className="text-[9px] text-slate-500">Este mes</p>
          </div>
        </div>
        <TrendingUp className="h-3.5 w-3.5 text-purple-600" />
      </div>

      {loading ? (
        <div className="space-y-1.5">
          {[1, 2].map((i) => (
            <div key={i} className="h-3 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[9px] uppercase tracking-wide text-slate-500">
                Facturado
              </span>
              <span className="text-xs font-bold text-slate-900">
                {currencyFormatter.format(summary.facturadoMes)}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[9px] uppercase tracking-wide text-slate-500">Cobrado</span>
              <span className="text-xs font-bold text-emerald-600">
                {currencyFormatter.format(summary.cobradoMes)}
              </span>
            </div>
          </div>

          {/* Tasa de cobro */}
          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[9px] text-slate-500">Tasa de cobro</span>
              <span className="text-[10px] font-semibold text-purple-700">
                {Math.round(tasaCobro)}%
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${tasaCobro}%`, background: 'linear-gradient(90deg, #a855f7, #9333ea)' }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ========== REPORTES (REDISEÑADO) ==========
interface ReportsWidgetProps {
  pendingCount: number;
}

export function ReportsWidget({ pendingCount }: ReportsWidgetProps) {
  const hasReports = pendingCount > 0;

  return (
    <div className="h-full flex flex-col rounded-lg border border-rose-200 bg-white p-2 transition-all hover:shadow-sm">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="rounded-lg p-1.5" style={{ background: hasReports ? 'linear-gradient(135deg, #f43f5e, #e11d48)' : 'linear-gradient(135deg, #94a3b8, #64748b)' }}>
            <AlertTriangle className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Reportes</h3>
            <p className="text-[9px] text-slate-500">Pendientes</p>
          </div>
        </div>
        {hasReports && (
          <div className="rounded-lg bg-rose-100 px-2 py-1">
            <span className="text-sm font-bold text-rose-700">{pendingCount}</span>
          </div>
        )}
      </div>

      {hasReports ? (
        <div>
          <p className="mb-1.5 text-[10px] text-slate-600">{pendingCount} reporte(s) pendientes</p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-1.5">
            <div className="h-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(pendingCount * 15, 100)}%`, background: 'linear-gradient(90deg, #f43f5e, #e11d48)' }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="py-3 text-center">
          <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-slate-400" />
          <p className="text-[10px] text-slate-500">Sin reportes pendientes</p>
        </div>
      )}

      <Link
        href="/dashboard/reporte-diario"
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 hover:gap-2 transition-all"
      >
        Ver reportes
        <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    </div>
  );
}

// ========== STOCK (REDISEÑADO) ==========
interface StockWidgetProps {
  alerts: StockAlerts;
  loading: boolean;
}

export function StockWidget({ alerts, loading }: StockWidgetProps) {
  const hasAlerts = alerts.total > 0;

  return (
    <div className="h-full flex flex-col rounded-lg border border-orange-200 bg-white p-2 transition-all hover:shadow-sm">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="rounded-lg p-1.5" style={{ background: hasAlerts ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'linear-gradient(135deg, #94a3b8, #64748b)' }}>
            <Package className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Inventario</h3>
            <p className="text-[9px] text-slate-500">Stock bajo</p>
          </div>
        </div>
        {hasAlerts && (
          <div className="rounded-lg bg-orange-100 px-2 py-1">
            <span className="text-sm font-bold text-orange-700">{alerts.total}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-1">
          {[1, 2].map((i) => (
            <div key={i} className="h-5 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ) : hasAlerts ? (
        <div className="space-y-1">
          {alerts.top.slice(0, 2).map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
              <span className="text-[11px] text-slate-700 truncate pr-2">{item.nombre}</span>
              <span className="text-[10px] font-bold text-orange-700">
                {item.stock}/{item.stockMinimo}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-3 text-center">
          <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-slate-400" />
          <p className="text-[10px] text-slate-500">Stock normal</p>
        </div>
      )}

      <Link
        href="/dashboard/inventario"
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 hover:gap-2 transition-all"
      >
        Ver inventario
        <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    </div>
  );
}

// ========== ACTIVIDAD (REDISEÑADO) ==========
interface ActivityWidgetProps {
  activity: RecentActivity[];
  loading: boolean;
}

export function ActivityWidget({ activity, loading }: ActivityWidgetProps) {
  return (
    <div className="h-full flex flex-col rounded-lg border border-cyan-200 bg-white p-2 transition-all hover:shadow-sm">
      <div className="mb-1.5 flex items-center gap-1.5">
        <div className="rounded-lg p-1.5" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
          <Activity className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-slate-900">Actividad</h3>
          <p className="text-[9px] text-slate-500">Recientes</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ) : activity.length === 0 ? (
        <div className="py-3 text-center">
          <Activity className="mx-auto mb-1 h-5 w-5 text-slate-400" />
          <p className="text-[10px] text-slate-500">Sin actividad</p>
        </div>
      ) : (
        <div className="space-y-1">
          {activity.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 transition-all hover:bg-white hover:border-cyan-300"
            >
              <p className="text-[11px] font-medium text-slate-900 truncate">{item.descripcion}</p>
              <p className="text-[9px] text-slate-500">
                {item.tipo} ·{' '}
                {item.fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/dashboard/auditoria"
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 hover:gap-2 transition-all"
      >
        Ver auditoría
        <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    </div>
  );
}

// ========== MÉTRICAS (REDISEÑADO) ==========
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
    <div className="h-full flex flex-col rounded-lg border border-indigo-200 bg-white p-2 shadow-sm transition-all hover:shadow-md">
      <div className="mb-1.5 flex items-center gap-1.5">
        <div className="rounded-lg p-1.5" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
          <BarChart3 className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-slate-900">Métricas clave</h3>
          <p className="text-[9px] text-slate-500">Visión general</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="mb-1 rounded-lg border border-blue-200 bg-blue-50 p-2">
            <span className="block text-lg font-bold text-blue-700">{serviciosActivos}</span>
          </div>
          <p className="text-[9px] font-medium uppercase tracking-wide text-slate-600">
            Servicios
          </p>
        </div>
        <div className="text-center">
          <div className="mb-1 rounded-lg border border-purple-200 bg-purple-50 p-2">
            <span className="block text-lg font-bold text-purple-700">
              {profesionalesActivos}
            </span>
          </div>
          <p className="text-[9px] font-medium uppercase tracking-wide text-slate-600">
            Profesionales
          </p>
        </div>
        <div className="text-center">
          <div className="mb-1 rounded-lg border border-emerald-200 bg-emerald-50 p-2">
            <span className="block text-lg font-bold text-emerald-700">{eventosSemana}</span>
          </div>
          <p className="text-[9px] font-medium uppercase tracking-wide text-slate-600">
            Eventos/sem
          </p>
        </div>
      </div>

      <Link
        href="/dashboard/kpis"
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 transition-all hover:gap-2"
      >
        Ver KPIs
        <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    </div>
  );
}

// ========== EVALUACIONES (REDISEÑADO) ==========
interface EvaluationsWidgetProps {
  evaluations: RecentEvaluation[];
  loading: boolean;
}

export function EvaluationsWidget({ evaluations, loading }: EvaluationsWidgetProps) {
  const promedioTotal =
    evaluations.length > 0
      ? evaluations.reduce((acc, e) => acc + e.promedioGeneral, 0) / evaluations.length
      : 0;

  return (
    <div className="h-full flex flex-col rounded-lg border border-teal-200 bg-white p-2 shadow-sm transition-all hover:shadow-md">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="rounded-lg p-1.5" style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}>
            <ClipboardCheck className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Supervisión QA</h3>
            <p className="text-[9px] text-slate-500">Evaluaciones</p>
          </div>
        </div>
        {evaluations.length > 0 && (
          <div className="text-center">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-lg font-bold text-slate-900">
                {promedioTotal.toFixed(1)}
              </span>
            </div>
            <p className="text-[8px] text-slate-500">Promedio</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : evaluations.length === 0 ? (
        <div className="py-4 text-center">
          <ClipboardCheck className="mx-auto mb-1 h-6 w-6 text-slate-400" />
          <p className="text-[10px] text-slate-500">Sin evaluaciones recientes</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {evaluations.slice(0, 4).map((evaluation) => (
            <div
              key={evaluation.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-2 transition-all hover:bg-white hover:shadow-sm"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-900 truncate">
                  {evaluation.profesionalNombre}
                </span>
                <div
                  className={`flex items-center gap-0.5 rounded-full px-1 py-0.5 ${
                    evaluation.promedioGeneral >= 4
                      ? 'bg-emerald-100 text-emerald-700'
                      : evaluation.promedioGeneral >= 3
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <Star className="h-2.5 w-2.5" />
                  <span className="text-[9px] font-bold">{evaluation.promedioGeneral}</span>
                </div>
              </div>
              <p className="text-[9px] text-slate-500 truncate">{evaluation.servicioNombre}</p>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/dashboard/supervision"
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 transition-all hover:gap-2"
      >
        Ver evaluaciones
        <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    </div>
  );
}
