'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AgendaEventDrawer from '@/components/agenda/v2/AgendaEventDrawer';
import type { AgendaEvent } from '@/components/agenda/v2/agendaHelpers';
import type { Paciente } from '@/types';

export interface Cita {
  id: string;
  fecha: Date;
  profesional: string;
  profesionalId: string;
  tipo: 'consulta' | 'seguimiento' | 'revision' | 'tratamiento' | 'urgencia';
  estado: 'programada' | 'confirmada' | 'realizada' | 'cancelada';
  sala?: string;
  motivo?: string;
  notas?: string;
  evolucion?: string;
  diagnosticos?: string[];
  tratamientoIndicado?: string;
  proximaCitaSugerida?: Date;
  documentos?: Array<{ id: string; nombre: string; url: string }>;
}

interface PatientCitasTabProps {
  citas: Cita[];
  onVerDetalle?: (cita: Cita) => void;
  onNuevaCita?: () => void;
  paciente?: Paciente | null;
  onRequestRefresh?: () => Promise<void> | void;
}

export default function PatientCitasTab({
  citas,
  onVerDetalle,
  onNuevaCita,
  paciente,
  onRequestRefresh,
}: PatientCitasTabProps) {
  const [filtroTipo, setFiltroTipo] = useState<Cita['tipo'] | 'todos'>('todos');
  const [filtroEstado, setFiltroEstado] = useState<Cita['estado'] | 'todos'>('todos');
  const [filtroProfesional, setFiltroProfesional] = useState<string>('todos');
  const [drawerEvent, setDrawerEvent] = useState<AgendaEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filtrar citas
  const citasFiltradas = useMemo(() => {
    return citas.filter((cita) => {
      if (filtroTipo !== 'todos' && cita.tipo !== filtroTipo) return false;
      if (filtroEstado !== 'todos' && cita.estado !== filtroEstado) return false;
      if (filtroProfesional !== 'todos' && cita.profesionalId !== filtroProfesional) return false;
      return true;
    }).sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }, [citas, filtroTipo, filtroEstado, filtroProfesional]);

  // Profesionales únicos para filtro
  const profesionales = useMemo(() => {
    const unique = new Map<string, string>();
    citas.forEach((cita) => {
      if (!unique.has(cita.profesionalId)) {
        unique.set(cita.profesionalId, cita.profesional);
      }
    });
    return Array.from(unique.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [citas]);

  // Agrupar por mes
  const citasPorMes = useMemo(() => {
    const grupos = new Map<string, Cita[]>();
    citasFiltradas.forEach((cita) => {
      const mesKey = format(cita.fecha, 'MMMM yyyy', { locale: es });
      if (!grupos.has(mesKey)) {
        grupos.set(mesKey, []);
      }
      grupos.get(mesKey)!.push(cita);
    });
    return grupos;
  }, [citasFiltradas]);

  const getEstadoIcon = (estado: Cita['estado']) => {
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

  const getEstadoColor = (estado: Cita['estado']) => {
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

  const getTipoColor = (tipo: Cita['tipo']) => {
    switch (tipo) {
      case 'consulta':
        return 'bg-brand-subtle text-brand';
      case 'seguimiento':
        return 'bg-success-bg text-success';
      case 'revision':
        return 'bg-warning-bg text-warning';
      case 'tratamiento':
        return 'bg-accent-bg text-accent';
      case 'urgencia':
        return 'bg-danger-bg text-danger';
    }
  };

  const handleOpenDrawer = (cita: Cita) => {
    if (!paciente) {
      onVerDetalle?.(cita);
      return;
    }
    setDrawerEvent(citaToAgendaEvent(cita, paciente));
    setDrawerOpen(true);
  };

  const handleInlineAction = async (
    event: React.MouseEvent<HTMLButtonElement>,
    action: 'confirm' | 'complete' | 'cancel',
    cita: Cita
  ) => {
    event.stopPropagation();
    const key = `${cita.id}-${action}`;
    try {
      setActionLoading(key);
      await handleQuickAction(cita.id, action);
      await onRequestRefresh?.();
    } finally {
      setActionLoading((prev) => (prev === key ? null : prev));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-text-muted" />
            <h3 className="font-semibold text-text">Filtros</h3>
            {citasFiltradas.length > 0 && (
              <span className="px-2 py-1 bg-brand-subtle text-brand rounded-full text-xs font-medium">
                {citasFiltradas.length} citas
              </span>
            )}
          </div>

          {onNuevaCita && (
            <button
              onClick={onNuevaCita}
              className="inline-flex items-center gap-2 rounded-pill bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90"
            >
              <Calendar className="w-4 h-4" />
              Nueva Cita
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {/* Filtro Tipo */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as Cita['tipo'] | 'todos')}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm focus-visible:focus-ring"
          >
            <option value="todos">Todos los tipos</option>
            <option value="consulta">Consulta</option>
            <option value="seguimiento">Seguimiento</option>
            <option value="revision">Revisión</option>
            <option value="tratamiento">Tratamiento</option>
            <option value="urgencia">Urgencia</option>
          </select>

          {/* Filtro Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as Cita['estado'] | 'todos')}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm focus-visible:focus-ring"
          >
            <option value="todos">Todos los estados</option>
            <option value="programada">Programada</option>
            <option value="confirmada">Confirmada</option>
            <option value="realizada">Realizada</option>
            <option value="cancelada">Cancelada</option>
          </select>

          {/* Filtro Profesional */}
          <select
            value={filtroProfesional}
            onChange={(e) => setFiltroProfesional(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm focus-visible:focus-ring"
          >
            <option value="todos">Todos los profesionales</option>
            {profesionales.map((prof) => (
              <option key={prof.id} value={prof.id}>
                {prof.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline de citas */}
      {citasFiltradas.length === 0 ? (
        <div className="panel-block p-12 text-center shadow-sm">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-text-muted" />
          <p className="text-text-muted">No hay citas que coincidan con los filtros</p>
          {onNuevaCita && (
            <button
              onClick={onNuevaCita}
              className="mt-4 rounded-pill bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90"
            >
              Programar primera cita
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(citasPorMes.entries()).map(([mes, citasDelMes]) => (
            <div key={mes}>
              <h3 className="text-lg font-semibold text-text mb-3 capitalize">{mes}</h3>
              <div className="space-y-3">
                {citasDelMes.map((cita) => {
                  const quickActions =
                    cita.estado === 'programada'
                      ? (['confirm', 'cancel'] as Array<'confirm' | 'cancel'>)
                      : cita.estado === 'confirmada'
                      ? (['complete', 'cancel'] as Array<'complete' | 'cancel'>)
                      : [];

                  return (
                    <div
                      key={cita.id}
                      className="panel-block p-4 transition-shadow hover:shadow-md cursor-pointer"
                      onClick={() => handleOpenDrawer(cita)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Fecha */}
                        <div className="flex-shrink-0 text-center">
                          <div className="w-16 h-16 bg-brand-subtle rounded-2xl flex flex-col items-center justify-center">
                            <p className="text-2xl font-bold text-brand">
                              {format(cita.fecha, 'd')}
                            </p>
                            <p className="text-xs text-brand uppercase">
                              {format(cita.fecha, 'MMM', { locale: es })}
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
                              <Clock className="w-4 h-4 text-text-muted" />
                              <span>{format(cita.fecha, 'HH:mm')}h</span>
                              {cita.sala && (
                                <>
                                  <MapPin className="w-4 h-4 text-text-muted ml-2" />
                                  <span>{cita.sala}</span>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-text">
                              <User className="w-4 h-4 text-text-muted" />
                              <span>{cita.profesional}</span>
                            </div>

                            {cita.motivo && (
                              <p className="text-text-muted mt-2">{cita.motivo}</p>
                            )}

                            {cita.estado === 'realizada' && cita.evolucion && (
                              <div className="mt-3 p-3 bg-success-bg rounded-2xl border border-success/40">
                                <p className="text-sm font-medium text-success mb-1">Evolución</p>
                                <p className="text-sm text-text">{cita.evolucion}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Acción */}
                        <div className="flex flex-col items-end gap-2">
                          {quickActions.length > 0 && (
                            <div className="flex gap-2 flex-wrap justify-end">
                              {quickActions.map((action) => {
                                const key = `${cita.id}-${action}`;
                                return (
                                  <button
                                    key={action}
                                    onClick={(e) => handleInlineAction(e, action, cita)}
                                    disabled={actionLoading === key}
                                    className={`rounded-full px-3 py-1 text-xs font-semibold text-white transition-colors ${
                                      action === 'confirm'
                                        ? 'bg-brand hover:bg-brand/90'
                                        : action === 'complete'
                                        ? 'bg-success hover:bg-success/90'
                                        : 'bg-danger hover:bg-danger/90'
                                    } ${actionLoading === key ? 'opacity-50' : ''}`}
                                  >
                                    {action === 'confirm'
                                      ? 'Confirmar'
                                      : action === 'complete'
                                      ? 'Completar'
                                      : 'Cancelar'}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDrawer(cita);
                            }}
                            className="flex-shrink-0 p-2 text-brand hover:bg-brand-subtle rounded-2xl transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <AgendaEventDrawer
        isOpen={drawerOpen && Boolean(drawerEvent) && Boolean(paciente)}
        event={drawerEvent}
        paciente={paciente ?? null}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerEvent(null);
        }}
        onAction={async (event, action) => {
          await handleQuickAction(event.id, action);
          await onRequestRefresh?.();
        }}
        onEdit={async (event) => {
          await handleEdit(event);
          await onRequestRefresh?.();
        }}
      />
    </div>
  );
}

async function handleQuickAction(eventId: string, action: 'confirm' | 'complete' | 'cancel') {
  const { toast } = await import('sonner');
  const response = await fetch(`/api/agenda/eventos/${eventId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado: actionToEstado(action) }),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    toast.error(data.error ?? 'No se pudo actualizar la cita');
    throw new Error(data.error ?? 'Error quick action');
  }
  toast.success(
    action === 'confirm' ? 'Cita confirmada' : action === 'complete' ? 'Cita completada' : 'Cita cancelada'
  );
}

async function handleEdit(event: AgendaEvent) {
  const { toast } = await import('sonner');
  const payload: Record<string, unknown> = {
    titulo: event.titulo,
    tipo: event.tipo,
    fechaInicio: event.fechaInicio.toISOString(),
    fechaFin: event.fechaFin.toISOString(),
    estado: event.estado,
    notas: event.notas,
    profesionalId: event.profesionalId || null,
    pacienteId: event.pacienteId || null,
    salaId: event.salaId || null,
  };
  const response = await fetch(`/api/agenda/eventos/${event.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    toast.error(data.error ?? 'No se pudo editar la cita');
    throw new Error(data.error ?? 'Error edit event');
  }
  toast.success('Cita actualizada');
}

function actionToEstado(action: 'confirm' | 'complete' | 'cancel'): AgendaEvent['estado'] {
  if (action === 'confirm') return 'confirmada';
  if (action === 'complete') return 'realizada';
  return 'cancelada';
}

function citaToAgendaEvent(cita: Cita, paciente: Paciente): AgendaEvent {
  const duracionMinutos = 60;
  const fechaFin = new Date(cita.fecha.getTime() + duracionMinutos * 60000);
  const fullName = `${paciente.nombre ?? ''} ${paciente.apellidos ?? ''}`.trim();

  return {
    id: cita.id,
    titulo: cita.motivo || `${cita.tipo} · ${cita.profesional}`,
    fechaInicio: cita.fecha,
    fechaFin,
    tipo: cita.tipo,
    estado: cita.estado,
    pacienteId: paciente.id,
    pacienteNombre: fullName || paciente.nombre || 'Paciente',
    profesionalId: cita.profesionalId,
    profesionalNombre: cita.profesional,
    salaId: cita.sala ?? null,
    salaNombre: cita.sala ?? null,
    prioridad: 'media',
    notas: cita.notas ?? '',
  };
}
