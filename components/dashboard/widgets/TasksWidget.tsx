'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { UserTask } from '@/types/dashboard';

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
