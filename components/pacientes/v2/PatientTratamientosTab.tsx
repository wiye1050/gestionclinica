'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Calendar,
  User,
  FileText,
  AlertCircle,
} from 'lucide-react';

export interface Tratamiento {
  id: string;
  nombre: string;
  descripcion?: string;
  profesionalId: string;
  profesionalNombre: string;
  servicioId?: string;
  servicioNombre?: string;
  fechaInicio: Date;
  fechaFin?: Date;
  estado: 'planificado' | 'en-curso' | 'completado' | 'suspendido' | 'cancelado';
  objetivo?: string;
  progreso: number; // 0-100
  sesionesTotales?: number;
  sesionesCompletadas?: number;
  proximaSesion?: Date;
  notas?: string;
  resultados?: string;
  motivoSuspension?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PatientTratamientosTabProps {
  tratamientos: Tratamiento[];
  onAddTratamiento?: () => void;
  onEditTratamiento?: (id: string) => void;
  onDeleteTratamiento?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export default function PatientTratamientosTab({
  tratamientos,
  onAddTratamiento,
  onEditTratamiento,
  onDeleteTratamiento,
  onViewDetails,
}: PatientTratamientosTabProps) {
  const [filterEstado, setFilterEstado] = useState<string>('all');

  const tratamientosFiltrados =
    filterEstado === 'all'
      ? tratamientos
      : tratamientos.filter((t) => t.estado === filterEstado);

  const tratamientosActivos = tratamientos.filter(
    (t) => t.estado === 'en-curso' || t.estado === 'planificado'
  );
  const tratamientosCompletados = tratamientos.filter((t) => t.estado === 'completado');

  const getEstadoBadge = (estado: Tratamiento['estado']) => {
    switch (estado) {
      case 'planificado':
        return { text: 'Planificado', className: 'bg-brand-subtle text-brand border-brand/30' };
      case 'en-curso':
        return {
          text: 'En curso',
          className: 'bg-success-bg text-success border-success/30',
        };
      case 'completado':
        return {
          text: 'Completado',
          className: 'bg-muted text-text-muted border-border',
        };
      case 'suspendido':
        return {
          text: 'Suspendido',
          className: 'bg-warn-bg text-warn border-warn/30',
        };
      case 'cancelado':
        return {
          text: 'Cancelado',
          className: 'bg-danger-bg text-danger border-danger/30',
        };
      default:
        return { text: estado, className: 'bg-muted text-text-muted border-border' };
    }
  };

  const getProgressColor = (progreso: number) => {
    if (progreso >= 80) return 'bg-success';
    if (progreso >= 50) return 'bg-brand';
    if (progreso >= 25) return 'bg-warn';
    return 'bg-muted';
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-5 w-5 text-brand" />
            <p className="text-sm font-medium text-text-muted">Tratamientos activos</p>
          </div>
          <p className="text-3xl font-bold text-text">{tratamientosActivos.length}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <p className="text-sm font-medium text-text-muted">Completados</p>
          </div>
          <p className="text-3xl font-bold text-text">{tratamientosCompletados.length}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-text-muted" />
            <p className="text-sm font-medium text-text-muted">Total</p>
          </div>
          <p className="text-3xl font-bold text-text">{tratamientos.length}</p>
        </div>
      </div>

      {/* Filtros y acciones */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'planificado', 'en-curso', 'completado', 'suspendido'].map((estado) => (
            <button
              key={estado}
              onClick={() => setFilterEstado(estado)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filterEstado === estado
                  ? 'bg-brand text-white'
                  : 'bg-muted text-text-muted hover:bg-cardHover'
              }`}
            >
              {estado === 'all' ? 'Todos' : estado === 'en-curso' ? 'En curso' : estado.charAt(0).toUpperCase() + estado.slice(1)}
            </button>
          ))}
        </div>

        {onAddTratamiento && (
          <button
            onClick={onAddTratamiento}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand/90"
          >
            <Plus className="h-4 w-4" />
            Nuevo tratamiento
          </button>
        )}
      </div>

      {/* Lista de tratamientos */}
      {tratamientosFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Activity className="mx-auto mb-4 h-12 w-12 text-text-muted" />
          <p className="text-lg font-medium text-text">
            {filterEstado === 'all'
              ? 'No hay tratamientos registrados'
              : `No hay tratamientos ${filterEstado === 'en-curso' ? 'en curso' : filterEstado + 's'}`}
          </p>
          <p className="mt-2 text-sm text-text-muted">
            {onAddTratamiento && filterEstado === 'all'
              ? 'Haz clic en "Nuevo tratamiento" para comenzar'
              : 'Prueba con otro filtro'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tratamientosFiltrados.map((tratamiento) => {
            const badge = getEstadoBadge(tratamiento.estado);
            const progressColor = getProgressColor(tratamiento.progreso);

            return (
              <article
                key={tratamiento.id}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Header */}
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-text">{tratamiento.nombre}</h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${badge.className}`}
                      >
                        {badge.text}
                      </span>
                    </div>
                    {tratamiento.descripcion && (
                      <p className="text-sm text-text-muted">{tratamiento.descripcion}</p>
                    )}
                  </div>

                  <div className="flex gap-1">
                    {onEditTratamiento && tratamiento.estado !== 'completado' && (
                      <button
                        onClick={() => onEditTratamiento(tratamiento.id)}
                        className="rounded-lg p-2 text-text-muted transition-colors hover:bg-cardHover hover:text-brand"
                        aria-label="Editar tratamiento"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {onDeleteTratamiento && (
                      <button
                        onClick={() => onDeleteTratamiento(tratamiento.id)}
                        className="rounded-lg p-2 text-text-muted transition-colors hover:bg-danger-bg hover:text-danger"
                        aria-label="Eliminar tratamiento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Detalles */}
                <div className="mb-4 grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-text-muted" />
                    <span className="text-text-muted">Profesional:</span>
                    <span className="font-medium text-text">{tratamiento.profesionalNombre}</span>
                  </div>

                  {tratamiento.servicioNombre && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-text-muted" />
                      <span className="text-text-muted">Servicio:</span>
                      <span className="font-medium text-text">{tratamiento.servicioNombre}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-text-muted" />
                    <span className="text-text-muted">Inicio:</span>
                    <span className="font-medium text-text">
                      {tratamiento.fechaInicio.toLocaleDateString('es-ES')}
                    </span>
                  </div>

                  {tratamiento.fechaFin && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-text-muted" />
                      <span className="text-text-muted">Fin:</span>
                      <span className="font-medium text-text">
                        {tratamiento.fechaFin.toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  )}

                  {tratamiento.sesionesTotales !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="h-4 w-4 text-text-muted" />
                      <span className="text-text-muted">Sesiones:</span>
                      <span className="font-medium text-text">
                        {tratamiento.sesionesCompletadas || 0} / {tratamiento.sesionesTotales}
                      </span>
                    </div>
                  )}

                  {tratamiento.proximaSesion && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-brand" />
                      <span className="text-text-muted">Próxima sesión:</span>
                      <span className="font-medium text-brand">
                        {tratamiento.proximaSesion.toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progreso */}
                <div className="mb-4">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-text-muted">Progreso</span>
                    <span className="font-semibold text-text">{tratamiento.progreso}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full transition-all ${progressColor}`}
                      style={{ width: `${tratamiento.progreso}%` }}
                    />
                  </div>
                </div>

                {/* Objetivo */}
                {tratamiento.objetivo && (
                  <div className="mb-4 rounded-lg bg-brand-subtle p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">
                      Objetivo
                    </p>
                    <p className="text-sm text-text">{tratamiento.objetivo}</p>
                  </div>
                )}

                {/* Resultados */}
                {tratamiento.resultados && (
                  <div className="mb-4 rounded-lg bg-success-bg p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-success">
                      Resultados
                    </p>
                    <p className="text-sm text-text">{tratamiento.resultados}</p>
                  </div>
                )}

                {/* Motivo de suspensión */}
                {tratamiento.estado === 'suspendido' && tratamiento.motivoSuspension && (
                  <div className="mb-4 rounded-lg bg-warn-bg p-3">
                    <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-warn">
                      <AlertCircle className="h-3 w-3" />
                      Motivo de suspensión
                    </p>
                    <p className="text-sm text-text">{tratamiento.motivoSuspension}</p>
                  </div>
                )}

                {/* Notas */}
                {tratamiento.notas && (
                  <div className="mb-4 rounded-lg bg-cardHover p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Notas
                    </p>
                    <p className="text-sm text-text">{tratamiento.notas}</p>
                  </div>
                )}

                {/* Footer con acciones */}
                {onViewDetails && (
                  <div className="flex justify-end border-t border-border pt-3">
                    <button
                      onClick={() => onViewDetails(tratamiento.id)}
                      className="text-sm font-semibold text-brand hover:underline"
                    >
                      Ver detalles completos →
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
