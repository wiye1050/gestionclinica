'use client';

import { useMemo } from 'react';
import { addDays, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AgendaEvent } from './agendaHelpers';
import type { Profesional } from '@/types';

interface AgendaMetricsProps {
  events: AgendaEvent[];
  weekStart: Date;
  profesionales: Profesional[];
}

const TIME_BLOCKS = [
  { id: 'morning', label: 'Mañana', start: 7, end: 11 },
  { id: 'midday', label: 'Mediodía', start: 11, end: 15 },
  { id: 'afternoon', label: 'Tarde', start: 15, end: 19 },
  { id: 'evening', label: 'Noche', start: 19, end: 22 },
];

const TIPO_LABEL: Record<AgendaEvent['tipo'], string> = {
  consulta: 'Consulta',
  seguimiento: 'Seguimiento',
  revision: 'Revisión',
  tratamiento: 'Tratamiento',
  urgencia: 'Urgencia',
  administrativo: 'Administrativo',
};

export default function AgendaMetrics({ events, weekStart, profesionales }: AgendaMetricsProps) {
  const metrics = useMemo(() => {
    const total = events.length;
    const confirmadas = events.filter((e) => e.estado === 'confirmada').length;
    const canceladas = events.filter((e) => e.estado === 'cancelada').length;
    const realizadas = events.filter((e) => e.estado === 'realizada').length;
    const ratioConfirmacion = total > 0 ? Math.round((confirmadas / total) * 100) : 0;
    const ratioCanceladas = total > 0 ? Math.round((canceladas / total) * 100) : 0;
    const ratioRealizadas = total > 0 ? Math.round((realizadas / total) * 100) : 0;

    const eventsByType = events.reduce<Record<string, number>>((acc, event) => {
      const key = event.tipo;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
    const heatmap = weekDays.map((day) => {
      const dayEvents = events.filter((event) => isSameDay(event.fechaInicio, day));
      return TIME_BLOCKS.map((block) => {
        const count = dayEvents.filter((event) => {
          const hour = event.fechaInicio.getHours();
          return hour >= block.start && hour < block.end;
        }).length;
        return {
          ...block,
          count,
          intensity: Math.min(count / 3, 1),
        };
      });
    });

    return {
      total,
      confirmadas,
      canceladas,
      realizadas,
      ratioConfirmacion,
      ratioCanceladas,
      ratioRealizadas,
      eventsByType,
      heatmap,
      weekDays,
    };
  }, [events, weekStart]);

  if (metrics.total === 0) {
    return null;
  }

  return (
    <div className="panel-block p-4 space-y-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <MetricCard label="Citas totales" value={metrics.total} helper={`${profesionales.length} profesionales`} />
        <MetricCard
          label="Confirmadas"
          value={metrics.confirmadas}
          helper={`${metrics.ratioConfirmacion}% de la semana`}
        />
        <MetricCard
          label="Canceladas"
          value={metrics.canceladas}
          helper={`${metrics.ratioCanceladas}% del total`}
          tone="text-red-600"
        />
        <MetricCard
          label="Realizadas"
          value={metrics.realizadas}
          helper={`${metrics.ratioRealizadas}% completadas`}
          tone="text-green-600"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-text">Heatmap semanal</h3>
              <p className="text-xs text-text-muted">Concentración de citas por día/franja</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left text-text-muted font-semibold">Día</th>
                  {TIME_BLOCKS.map((block) => (
                    <th key={block.id} className="p-2 text-center text-text-muted font-semibold">
                      {block.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.weekDays.map((day, index) => (
                  <tr key={day.toISOString()}>
                    <td className="p-2 font-medium text-text">
                      {format(day, 'EEE d', { locale: es })}
                    </td>
                    {metrics.heatmap[index].map((cell) => (
                      <td key={cell.id} className="p-1">
                        <div
                          className="rounded-md h-10 flex items-center justify-center text-xs font-semibold transition-colors"
                          style={{
                            backgroundColor: `rgba(59, 130, 246, ${0.15 + cell.intensity * 0.6})`,
                            color: cell.intensity > 0.6 ? '#fff' : '#1e3a8a',
                          }}
                          title={`${cell.count} cita(s)`}
                        >
                          {cell.count}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-border p-4 flex flex-col gap-4">
          <div>
            <h3 className="text-base font-semibold text-text">Tipos de cita</h3>
            <p className="text-xs text-text-muted">Distribución por servicio</p>
          </div>
          <div className="space-y-3">
            {Object.entries(metrics.eventsByType)
              .sort(([, a], [, b]) => Number(b) - Number(a))
              .map(([tipo, count]) => (
                <div key={tipo} className="space-y-1">
                  <div className="flex items-center justify-between text-sm text-text">
                    <span>{TIPO_LABEL[tipo as AgendaEvent['tipo']] ?? tipo}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-brand"
                      style={{
                        width: `${Math.min((Number(count) / metrics.total) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone = 'text-brand',
}: {
  label: string;
  value: number;
  helper?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-4">
      <p className="text-xs font-semibold uppercase text-text-muted">{label}</p>
      <p className={`text-2xl font-bold ${tone} mt-1`}>{value}</p>
      {helper && <p className="text-xs text-text-muted mt-1">{helper}</p>}
    </div>
  );
}
