'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { TodayAppointment } from '@/types/dashboard';

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
