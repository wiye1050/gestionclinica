'use client';

import { useMemo } from 'react';
import { isSameDay, isToday, isThisWeek } from 'date-fns';
import StatCard from '@/components/shared/StatCard';
import { Calendar, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { AgendaEvent, calculateOccupancyRate } from './agendaHelpers';

interface AgendaKPIsProps {
  events: AgendaEvent[];
  currentDate: Date;
  viewMode: 'day' | 'week' | 'month' | 'resource';
}

export default function AgendaKPIs({ events, currentDate, viewMode }: AgendaKPIsProps) {
  const stats = useMemo(() => {
    let filteredEvents: AgendaEvent[] = [];

    // Filtrar según vista
    if (viewMode === 'day') {
      filteredEvents = events.filter(e => isSameDay(e.fechaInicio, currentDate));
    } else if (viewMode === 'week') {
      filteredEvents = events.filter(e => isThisWeek(e.fechaInicio, { weekStartsOn: 1 }));
    } else {
      filteredEvents = events; // Para month/resource mostrar todos
    }

    // Calcular estadísticas
    const total = filteredEvents.length;
    const today = filteredEvents.filter(e => isToday(e.fechaInicio)).length;
    const confirmed = filteredEvents.filter(e => e.estado === 'confirmada').length;
    const cancelled = filteredEvents.filter(e => e.estado === 'cancelada').length;
    const completed = filteredEvents.filter(e => e.estado === 'realizada').length;

    // Ocupación (solo para día)
    let occupancy = 0;
    if (viewMode === 'day') {
      occupancy = calculateOccupancyRate(filteredEvents, currentDate);
    } else if (viewMode === 'week') {
      // Promedio de la semana
      const daysWithEvents = new Set(filteredEvents.map(e => 
        e.fechaInicio.toDateString()
      ));
      const avgOccupancy = Array.from(daysWithEvents).reduce((sum, dayStr) => {
        const day = new Date(dayStr);
        const dayEvents = filteredEvents.filter(e => isSameDay(e.fechaInicio, day));
        return sum + calculateOccupancyRate(dayEvents, day);
      }, 0);
      occupancy = Math.round(avgOccupancy / Math.max(daysWithEvents.size, 1));
    }

    return {
      total,
      today,
      confirmed,
      cancelled,
      completed,
      occupancy,
      pending: total - confirmed - completed - cancelled,
    };
  }, [events, currentDate, viewMode]);

  const labels = {
    day: { total: 'Hoy', subtitle: 'eventos programados' },
    week: { total: 'Esta Semana', subtitle: 'eventos totales' },
    month: { total: 'Este Mes', subtitle: 'eventos totales' },
    resource: { total: 'Total', subtitle: 'eventos' },
  };

  const currentLabel = labels[viewMode];

  return (
    <>
      <StatCard
        title={currentLabel.total}
        value={viewMode === 'day' ? stats.today : stats.total}
        icon={Calendar}
        color="blue"
        subtitle={currentLabel.subtitle}
      />
      
      <StatCard
        title="Confirmados"
        value={stats.confirmed}
        icon={CheckCircle}
        color="green"
        subtitle={`${Math.round((stats.confirmed / Math.max(stats.total, 1)) * 100)}% del total`}
      />
      
      <StatCard
        title="Cancelados"
        value={stats.cancelled}
        icon={XCircle}
        color="red"
        subtitle={stats.cancelled > 0 ? 'Requieren atención' : 'Sin cancelaciones'}
      />
      
      {(viewMode === 'day' || viewMode === 'week') && (
        <StatCard
          title="Ocupación"
          value={`${stats.occupancy}%`}
          icon={TrendingUp}
          color={stats.occupancy > 80 ? 'red' : stats.occupancy > 60 ? 'yellow' : 'green'}
          subtitle={
            stats.occupancy > 80 ? 'Muy alta' :
            stats.occupancy > 60 ? 'Alta' :
            stats.occupancy > 40 ? 'Media' : 'Baja'
          }
        />
      )}

      {(viewMode === 'month' || viewMode === 'resource') && (
        <StatCard
          title="Completados"
          value={stats.completed}
          icon={CheckCircle}
          color="purple"
          subtitle={`${Math.round((stats.completed / Math.max(stats.total, 1)) * 100)}% finalizados`}
        />
      )}
    </>
  );
}
