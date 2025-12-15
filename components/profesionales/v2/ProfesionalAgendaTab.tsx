'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Filter,
  CheckCircle,
  XCircle,
  Circle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Profesional } from '@/types';

export interface CitaProfesional {
  id: string;
  fecha: Date;
  paciente: string;
  pacienteId: string;
  tipo: 'consulta' | 'seguimiento' | 'revision' | 'tratamiento' | 'urgencia';
  estado: 'programada' | 'confirmada' | 'realizada' | 'cancelada';
  sala?: string;
  motivo?: string;
  duracion?: number; // en minutos
}

interface ProfesionalAgendaTabProps {
  profesional: Profesional;
  citas: CitaProfesional[];
  onVerDetalle?: (cita: CitaProfesional) => void;
}

export default function ProfesionalAgendaTab({
  profesional,
  citas,
  onVerDetalle,
}: ProfesionalAgendaTabProps) {
  const [filtroEstado, setFiltroEstado] = useState<CitaProfesional['estado'] | 'todos'>('todos');
  const [filtroTipo, setFiltroTipo] = useState<CitaProfesional['tipo'] | 'todos'>('todos');
  const [vistaActual, setVistaActual] = useState<'todas' | 'proximas' | 'semana'>('proximas');

  // Filtrar citas
  const citasFiltradas = useMemo(() => {
    const ahora = new Date();
    const inicioSemana = startOfWeek(ahora, { locale: es });
    const finSemana = endOfWeek(ahora, { locale: es });

    return citas
      .filter((cita) => {
        // Filtros de estado y tipo
        if (filtroEstado !== 'todos' && cita.estado !== filtroEstado) return false;
        if (filtroTipo !== 'todos' && cita.tipo !== filtroTipo) return false;

        // Filtro de vista temporal
        if (vistaActual === 'proximas') {
          return cita.fecha >= ahora && (cita.estado === 'programada' || cita.estado === 'confirmada');
        }
        if (vistaActual === 'semana') {
          return isWithinInterval(cita.fecha, { start: inicioSemana, end: finSemana });
        }

        return true; // Vista 'todas'
      })
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }, [citas, filtroEstado, filtroTipo, vistaActual]);

  // Agrupar por día
  const citasPorDia = useMemo(() => {
    const grupos = new Map<string, CitaProfesional[]>();
    citasFiltradas.forEach((cita) => {
      const diaKey = format(cita.fecha, 'yyyy-MM-dd');
      if (!grupos.has(diaKey)) {
        grupos.set(diaKey, []);
      }
      grupos.get(diaKey)!.push(cita);
    });
    // Ordenar citas dentro de cada día
    grupos.forEach((citasDelDia) => {
      citasDelDia.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
    });
    return grupos;
  }, [citasFiltradas]);

  // Estadísticas rápidas
  const stats = useMemo(() => {
    const ahora = new Date();
    const proximasCitas = citas.filter(
      (c) => c.fecha >= ahora && (c.estado === 'programada' || c.estado === 'confirmada')
    ).length;
    const citasHoy = citas.filter((c) => {
      const hoy = new Date();
      return (
        c.fecha.getDate() === hoy.getDate() &&
        c.fecha.getMonth() === hoy.getMonth() &&
        c.fecha.getFullYear() === hoy.getFullYear()
      );
    }).length;
    const pacientesUnicos = new Set(citas.map((c) => c.pacienteId)).size;

    return { proximasCitas, citasHoy, pacientesUnicos };
  }, [citas]);

  const getEstadoIcon = (estado: CitaProfesional['estado']) => {
    switch (estado) {
      case 'programada':
        return <Circle className="h-4 w-4 text-warn" />;
      case 'confirmada':
        return <CheckCircle className="w-4 h-4 text-brand" />;
      case 'realizada':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'cancelada':
        return <XCircle className="h-4 w-4 text-danger" />;
    }
  };

  const getEstadoColor = (estado: CitaProfesional['estado']) => {
    switch (estado) {
      case 'programada':
        return 'border border-warn bg-warn-bg text-warn';
      case 'confirmada':
        return 'border border-brand bg-brand-subtle text-brand';
      case 'realizada':
        return 'border border-success bg-success-bg text-success';
      case 'cancelada':
        return 'border border-danger bg-danger-bg text-danger';
    }
  };

  const getTipoColor = (tipo: CitaProfesional['tipo']) => {
    switch (tipo) {
      case 'consulta':
        return 'bg-brand-subtle text-brand';
      case 'seguimiento':
        return 'bg-success-bg text-success';
      case 'revision':
        return 'bg-warn-bg text-warn';
      case 'tratamiento':
        return 'bg-accent-bg text-accent';
      case 'urgencia':
        return 'bg-danger-bg text-danger';
    }
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          label="Citas hoy"
          value={stats.citasHoy}
          tone="brand"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Próximas citas"
          value={stats.proximasCitas}
          tone="success"
        />
        <StatCard
          icon={<User className="h-5 w-5" />}
          label="Pacientes únicos"
          value={stats.pacientesUnicos}
          tone="warn"
        />
      </div>

      {/* Filtros y vista */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-text-muted" />
            <h3 className="font-semibold text-text">Filtros</h3>
            {citasFiltradas.length > 0 && (
              <span className="px-2 py-1 bg-brand-subtle text-brand rounded-full text-xs font-medium">
                {citasFiltradas.length} citas
              </span>
            )}
          </div>

          <Link
            href={`/dashboard/agenda?profesional=${profesional.id}`}
            className="inline-flex items-center gap-2 rounded-pill bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90"
          >
            <Calendar className="w-4 h-4" />
            Ver en Agenda
          </Link>
        </div>

        {/* Tabs de vista temporal */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setVistaActual('proximas')}
            className={`px-4 py-2 rounded-pill text-sm font-medium transition-colors ${
              vistaActual === 'proximas'
                ? 'bg-brand text-white'
                : 'bg-muted text-text hover:bg-muted/80'
            }`}
          >
            Próximas
          </button>
          <button
            onClick={() => setVistaActual('semana')}
            className={`px-4 py-2 rounded-pill text-sm font-medium transition-colors ${
              vistaActual === 'semana'
                ? 'bg-brand text-white'
                : 'bg-muted text-text hover:bg-muted/80'
            }`}
          >
            Esta semana
          </button>
          <button
            onClick={() => setVistaActual('todas')}
            className={`px-4 py-2 rounded-pill text-sm font-medium transition-colors ${
              vistaActual === 'todas'
                ? 'bg-brand text-white'
                : 'bg-muted text-text hover:bg-muted/80'
            }`}
          >
            Todas
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Filtro Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as CitaProfesional['estado'] | 'todos')}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm focus-visible:focus-ring"
          >
            <option value="todos">Todos los estados</option>
            <option value="programada">Programada</option>
            <option value="confirmada">Confirmada</option>
            <option value="realizada">Realizada</option>
            <option value="cancelada">Cancelada</option>
          </select>

          {/* Filtro Tipo */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as CitaProfesional['tipo'] | 'todos')}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm focus-visible:focus-ring"
          >
            <option value="todos">Todos los tipos</option>
            <option value="consulta">Consulta</option>
            <option value="seguimiento">Seguimiento</option>
            <option value="revision">Revisión</option>
            <option value="tratamiento">Tratamiento</option>
            <option value="urgencia">Urgencia</option>
          </select>
        </div>
      </div>

      {/* Timeline de citas */}
      {citasFiltradas.length === 0 ? (
        <div className="panel-block p-12 text-center shadow-sm">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-text-muted" />
          <p className="text-text-muted">No hay citas que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(citasPorDia.entries()).map(([diaKey, citasDelDia]) => {
            const fecha = new Date(diaKey);
            const esHoy =
              fecha.getDate() === new Date().getDate() &&
              fecha.getMonth() === new Date().getMonth() &&
              fecha.getFullYear() === new Date().getFullYear();

            return (
              <div key={diaKey}>
                <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
                  {format(fecha, "EEEE, d 'de' MMMM", { locale: es })}
                  {esHoy && (
                    <span className="px-2 py-1 bg-brand-subtle text-brand rounded-full text-xs font-medium">
                      Hoy
                    </span>
                  )}
                </h3>
                <div className="space-y-3">
                  {citasDelDia.map((cita) => (
                    <div
                      key={cita.id}
                      className="panel-block p-4 transition-shadow hover:shadow-md cursor-pointer"
                      onClick={() => onVerDetalle?.(cita)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Hora */}
                        <div className="flex-shrink-0 text-center">
                          <div className="w-16 h-16 bg-brand-subtle rounded-2xl flex flex-col items-center justify-center">
                            <p className="text-lg font-bold text-brand">
                              {format(cita.fecha, 'HH:mm')}
                            </p>
                            <p className="text-xs text-brand">
                              {cita.duracion ? `${cita.duracion}min` : '60min'}
                            </p>
                          </div>
                        </div>

                        {/* Contenido */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(
                                  cita.tipo
                                )}`}
                              >
                                {cita.tipo}
                              </span>
                              <span
                                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${getEstadoColor(
                                  cita.estado
                                )}`}
                              >
                                {getEstadoIcon(cita.estado)}
                                {cita.estado}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-text">
                              <User className="w-4 h-4 text-text-muted" />
                              <span className="font-medium">{cita.paciente}</span>
                            </div>

                            {cita.sala && (
                              <div className="flex items-center gap-2 text-text">
                                <MapPin className="w-4 h-4 text-text-muted" />
                                <span>{cita.sala}</span>
                              </div>
                            )}

                            {cita.motivo && (
                              <p className="text-text-muted mt-2 line-clamp-2">{cita.motivo}</p>
                            )}
                          </div>
                        </div>

                        {/* Acción */}
                        <div className="flex flex-col items-end gap-2">
                          <Link
                            href={`/dashboard/pacientes/${cita.pacienteId}`}
                            className="rounded-full border border-brand px-3 py-1 text-xs font-semibold text-brand hover:bg-brand-subtle"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Ver paciente
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onVerDetalle?.(cita);
                            }}
                            className="flex-shrink-0 p-2 text-brand hover:bg-brand-subtle rounded-2xl transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone = 'brand',
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: 'brand' | 'success' | 'warn';
}) {
  const toneClasses =
    tone === 'success'
      ? 'bg-success-bg text-success'
      : tone === 'warn'
      ? 'bg-warn-bg text-warn'
      : 'bg-brand-subtle text-brand';

  return (
    <div className={`rounded-2xl px-4 py-3 ${toneClasses}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-text">{value}</p>
    </div>
  );
}
