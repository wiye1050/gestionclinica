'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  FileText,
  Pill,
  CheckCircle,
  Clock,
  User,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import { format, isFuture, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AgendaLinkBuilder } from './types';

export type ActivityType =
  | 'cita'
  | 'documento'
  | 'receta'
  | 'tratamiento'
  | 'nota'
  | 'factura'
  | 'pago';

export interface Activity {
  id: string;
  tipo: ActivityType;
  titulo: string;
  descripcion?: string;
  fecha: Date;
  usuario?: string;
  estado?: 'success' | 'warning' | 'error' | 'info';
  agendaContext?: {
    profesionalId?: string;
    date?: Date;
    eventId?: string;
  };
}

export interface ProximaCita {
  id: string;
  fecha: Date;
  profesional: string;
  profesionalId?: string;
  tipo: string;
  estado?: 'programada' | 'confirmada' | 'realizada' | 'cancelada';
}

interface UnifiedTimelineProps {
  actividades: Activity[];
  proximasCitas?: ProximaCita[];
  maxItems?: number;
  showFuture?: boolean;
  agendaLinkBuilder?: AgendaLinkBuilder;
}

type TimelineItem =
  | { type: 'activity'; data: Activity }
  | { type: 'cita'; data: ProximaCita };

export default function UnifiedTimeline({
  actividades,
  proximasCitas = [],
  maxItems = 15,
  showFuture = true,
  agendaLinkBuilder,
}: UnifiedTimelineProps) {
  const unifiedItems = useMemo(() => {
    const items: TimelineItem[] = [];

    // Agregar actividades pasadas
    actividades.forEach((act) => {
      if (isPast(act.fecha)) {
        items.push({ type: 'activity', data: act });
      }
    });

    // Agregar próximas citas si showFuture está habilitado
    if (showFuture) {
      proximasCitas.forEach((cita) => {
        if (isFuture(cita.fecha) || isToday(cita.fecha)) {
          items.push({ type: 'cita', data: cita });
        }
      });
    }

    // Ordenar por fecha (más recientes/próximas primero)
    items.sort((a, b) => {
      const dateA = a.type === 'activity' ? a.data.fecha : a.data.fecha;
      const dateB = b.type === 'activity' ? b.data.fecha : b.data.fecha;

      // Futuras primero, luego pasadas
      const aIsFuture = isFuture(dateA);
      const bIsFuture = isFuture(dateB);

      if (aIsFuture && !bIsFuture) return -1;
      if (!aIsFuture && bIsFuture) return 1;

      // Dentro de futuras: más cercanas primero (ascendente)
      // Dentro de pasadas: más recientes primero (descendente)
      if (aIsFuture && bIsFuture) {
        return dateA.getTime() - dateB.getTime();
      } else {
        return dateB.getTime() - dateA.getTime();
      }
    });

    return items.slice(0, maxItems);
  }, [actividades, proximasCitas, maxItems, showFuture]);

  const getIcon = (item: TimelineItem) => {
    if (item.type === 'cita') {
      return <Calendar className="w-4 h-4" />;
    }

    const tipo = item.data.tipo;
    switch (tipo) {
      case 'cita':
        return <Calendar className="w-4 h-4" />;
      case 'documento':
        return <FileText className="w-4 h-4" />;
      case 'receta':
        return <Pill className="w-4 h-4" />;
      case 'tratamiento':
        return <CheckCircle className="w-4 h-4" />;
      case 'nota':
        return <FileText className="w-4 h-4" />;
      case 'factura':
        return <DollarSign className="w-4 h-4" />;
      case 'pago':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getColor = (item: TimelineItem) => {
    const fecha = item.type === 'activity' ? item.data.fecha : item.data.fecha;
    const esFutura = isFuture(fecha) || isToday(fecha);

    // Para citas futuras
    if (item.type === 'cita') {
      const estado = item.data.estado;
      if (estado === 'confirmada') {
        return 'bg-success-bg text-success border-success/50';
      }
      if (estado === 'programada') {
        return 'bg-brand-subtle text-brand border-brand/50';
      }
      if (estado === 'cancelada') {
        return 'bg-danger-bg text-danger border-danger/50';
      }
      return 'bg-brand-subtle text-brand border-brand/50';
    }

    // Para actividades pasadas
    const estado = item.data.estado;
    if (estado === 'error') return 'bg-danger-bg text-danger border-danger';
    if (estado === 'warning') return 'bg-warn-bg text-warn border-warn';
    if (estado === 'success') return 'bg-success-bg text-success border-success';

    const tipo = item.data.tipo;
    switch (tipo) {
      case 'cita':
        return 'bg-brand-subtle text-brand border-brand/50';
      case 'documento':
        return 'bg-muted text-text border-border';
      case 'receta':
        return 'bg-success-bg text-success border-success/50';
      case 'tratamiento':
        return 'bg-brand-subtle text-brand border-brand/40';
      case 'factura':
      case 'pago':
        return 'bg-success-bg text-success border-success/40';
      default:
        return 'bg-muted text-text-muted border-border';
    }
  };

  const getRelativeTime = (fecha: Date) => {
    const now = new Date();
    const diffMs = fecha.getTime() - now.getTime();
    const diffMins = Math.floor(Math.abs(diffMs) / 60000);
    const diffHours = Math.floor(Math.abs(diffMs) / 3600000);
    const diffDays = Math.floor(Math.abs(diffMs) / 86400000);

    const esFutura = isFuture(fecha);

    if (isToday(fecha)) {
      if (esFutura) {
        if (diffHours === 0) return `En ${diffMins}min`;
        return `Hoy a las ${format(fecha, 'HH:mm')}`;
      } else {
        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins}min`;
        return `Hace ${diffHours}h`;
      }
    }

    if (esFutura) {
      if (diffDays === 0) return 'Hoy';
      if (diffDays === 1) return 'Mañana';
      if (diffDays < 7) return `En ${diffDays}d`;
      return format(fecha, 'd MMM', { locale: es });
    } else {
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `Hace ${diffDays}d`;
      return format(fecha, 'd MMM', { locale: es });
    }
  };

  const getTipoBadgeStyles = (tipo: string) => {
    switch (tipo) {
      case 'consulta':
        return { backgroundColor: '#dbeafe', color: '#1d4ed8' };
      case 'seguimiento':
        return { backgroundColor: '#d1fae5', color: '#047857' };
      case 'urgencia':
        return { backgroundColor: '#fee2e2', color: '#b91c1c' };
      case 'tratamiento':
        return { backgroundColor: '#ede9fe', color: '#6d28d9' };
      default:
        return { backgroundColor: '#e5e7eb', color: '#374151' };
    }
  };

  if (unifiedItems.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="mb-4 text-lg font-semibold text-text">Timeline</h3>
        <div className="py-8 text-center text-sm text-text-muted">
          <Clock className="mx-auto mb-2 h-8 w-8 text-text-muted" />
          No hay actividad reciente ni citas próximas
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="mb-4 text-lg font-semibold text-text">Timeline</h3>

      <div className="relative">
        {/* Línea vertical */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        {/* Items unificados */}
        <div className="space-y-4">
          {unifiedItems.map((item, index) => {
            const esFutura =
              isFuture(item.type === 'activity' ? item.data.fecha : item.data.fecha) ||
              isToday(item.type === 'activity' ? item.data.fecha : item.data.fecha);

            if (item.type === 'cita') {
              const cita = item.data;
              const tipoBadge = getTipoBadgeStyles(cita.tipo);
              const agendaHref = agendaLinkBuilder?.({
                date: cita.fecha,
                profesionalId: cita.profesionalId,
              });

              return (
                <div key={`cita-${cita.id}`} className="relative flex gap-3 pl-10">
                  {/* Icono */}
                  <div
                    className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border ${getColor(
                      item
                    )} ${esFutura ? 'animate-pulse' : ''}`}
                  >
                    {getIcon(item)}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 pb-4">
                    {/* Marcador de futuro */}
                    {esFutura && index === 0 && (
                      <div className="mb-2 flex items-center gap-2">
                        <div className="h-px flex-1 bg-brand" />
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand">
                          Próximas citas
                        </span>
                        <div className="h-px flex-1 bg-brand" />
                      </div>
                    )}

                    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={tipoBadge}
                        >
                          {cita.tipo}
                        </span>
                        <span className="text-xs text-text-muted whitespace-nowrap">
                          {getRelativeTime(cita.fecha)}
                        </span>
                      </div>

                      <p className="mb-1 text-sm font-medium text-text">{cita.profesional}</p>
                      <p className="text-xs text-text-muted">
                        {cita.fecha.toLocaleDateString('es-ES')} ·{' '}
                        {cita.fecha.toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>

                      {cita.estado && (
                        <div className="mt-2">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                              cita.estado === 'confirmada'
                                ? 'bg-success-bg text-success'
                                : cita.estado === 'programada'
                                ? 'bg-brand-subtle text-brand'
                                : cita.estado === 'cancelada'
                                ? 'bg-danger-bg text-danger'
                                : 'bg-muted text-text-muted'
                            }`}
                          >
                            {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                          </span>
                        </div>
                      )}

                      {agendaHref && (
                        <div className="mt-2">
                          <Link
                            href={agendaHref}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                          >
                            Ver en Agenda
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            } else {
              // Activity
              const actividad = item.data;
              const agendaHref =
                actividad.tipo === 'cita'
                  ? agendaLinkBuilder?.({
                      date: actividad.agendaContext?.date ?? actividad.fecha,
                      profesionalId: actividad.agendaContext?.profesionalId,
                    })
                  : undefined;

              // Marcador de transición a pasado
              const prevItem = index > 0 ? unifiedItems[index - 1] : null;
              const prevEsFutura = prevItem
                ? isFuture(
                    prevItem.type === 'activity' ? prevItem.data.fecha : prevItem.data.fecha
                  ) || isToday(prevItem.type === 'activity' ? prevItem.data.fecha : prevItem.data.fecha)
                : false;
              const showPastMarker = prevEsFutura && !esFutura;

              return (
                <div key={`activity-${actividad.id}`} className="relative flex gap-3 pl-10">
                  {/* Icono */}
                  <div
                    className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border ${getColor(
                      item
                    )}`}
                  >
                    {getIcon(item)}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 pb-4">
                    {/* Marcador de pasado */}
                    {showPastMarker && (
                      <div className="mb-2 flex items-center gap-2">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                          Historial
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                    )}

                    <div className="mb-1 flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-text">{actividad.titulo}</p>
                      <span className="text-xs text-text-muted whitespace-nowrap">
                        {getRelativeTime(actividad.fecha)}
                      </span>
                    </div>

                    {actividad.descripcion && (
                      <p className="mb-1 text-sm text-text-muted">{actividad.descripcion}</p>
                    )}

                    {actividad.usuario && (
                      <div className="flex items-center gap-1 text-xs text-text-muted">
                        <User className="w-3 h-3" />
                        <span>{actividad.usuario}</span>
                      </div>
                    )}

                    {agendaHref && (
                      <div className="mt-2">
                        <Link
                          href={agendaHref}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                        >
                          Ver en Agenda
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>

      {(actividades.length + proximasCitas.length) > maxItems && (
        <button className="mt-4 w-full text-sm font-semibold text-brand hover:underline">
          Ver toda la actividad ({actividades.length + proximasCitas.length})
        </button>
      )}
    </div>
  );
}
