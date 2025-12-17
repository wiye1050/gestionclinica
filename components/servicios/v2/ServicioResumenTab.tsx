'use client';

import type { CatalogoServicio } from '@/types';
import type { CatalogoServicioEstadisticas } from '@/lib/server/serviciosStats';
import {
  Calendar,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  User,
  ActivitySquare,
} from 'lucide-react';

interface ServicioResumenTabProps {
  servicio: CatalogoServicio;
  estadisticas: CatalogoServicioEstadisticas | null;
}

export default function ServicioResumenTab({ servicio, estadisticas }: ServicioResumenTabProps) {
  if (!estadisticas) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8 text-center">
        <p className="text-text-subtle">No hay estadísticas disponibles</p>
      </div>
    );
  }

  const tendenciaCitas = estadisticas.tendenciaCitas;
  const tasaRealizacion =
    estadisticas.totalCitas > 0
      ? (estadisticas.citasRealizadas / estadisticas.totalCitas) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total citas */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-5 w-5 text-brand" />
            <span
              className={`text-sm font-medium ${tendenciaCitas > 0 ? 'text-success' : tendenciaCitas < 0 ? 'text-danger' : 'text-text-subtle'}`}
            >
              {tendenciaCitas > 0 ? '+' : ''}
              {tendenciaCitas.toFixed(1)}%
            </span>
          </div>
          <p className="text-3xl font-bold text-text">{estadisticas.totalCitas}</p>
          <p className="text-sm text-text-subtle mt-1">Citas totales</p>
        </div>

        {/* Pacientes únicos */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 text-purple" />
          </div>
          <p className="text-3xl font-bold text-text">{estadisticas.pacientesUnicos}</p>
          <p className="text-sm text-text-subtle mt-1">Pacientes únicos</p>
        </div>

        {/* Duración promedio */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-warn" />
            {estadisticas.desviacionDuracion !== undefined && (
              <span
                className={`text-sm font-medium ${Math.abs(estadisticas.desviacionDuracion) > 15 ? 'text-warn' : 'text-text-subtle'}`}
              >
                {estadisticas.desviacionDuracion > 0 ? '+' : ''}
                {estadisticas.desviacionDuracion.toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-text">
            {estadisticas.duracionPromedioReal?.toFixed(0) ?? estadisticas.tiempoEstimado}
            <span className="text-lg text-text-subtle ml-1">min</span>
          </p>
          <p className="text-sm text-text-subtle mt-1">
            Duración promedio {estadisticas.duracionPromedioReal ? 'real' : 'estimada'}
          </p>
        </div>

        {/* Tasa de realización */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
          <p className="text-3xl font-bold text-text">{tasaRealizacion.toFixed(1)}%</p>
          <p className="text-sm text-text-subtle mt-1">Tasa de realización</p>
          <div className="w-full bg-bg rounded-full h-1.5 mt-2">
            <div
              className="bg-success h-1.5 rounded-full transition-all"
              style={{ width: `${tasaRealizacion}%` }}
            />
          </div>
        </div>
      </div>

      {/* Alertas */}
      {estadisticas.alertas.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warn" />
            Alertas y notificaciones
          </h2>
          <div className="space-y-2">
            {estadisticas.alertas.map((alerta, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-xl ${
                  alerta.tipo === 'error'
                    ? 'bg-danger-bg border border-danger'
                    : alerta.tipo === 'warning'
                      ? 'bg-warn-bg border border-warn'
                      : 'bg-brand-subtle border border-brand'
                }`}
              >
                <AlertTriangle
                  className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                    alerta.tipo === 'error'
                      ? 'text-danger'
                      : alerta.tipo === 'warning'
                        ? 'text-warn'
                        : 'text-brand'
                  }`}
                />
                <p className="text-sm text-text">{alerta.mensaje}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del servicio */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <ActivitySquare className="h-5 w-5 text-brand" />
            Información del servicio
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-text-subtle">Categoría</label>
              <p className="text-text capitalize">{estadisticas.categoria}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-text-subtle">Tiempo estimado</label>
              <p className="text-text">{estadisticas.tiempoEstimado} minutos</p>
            </div>

            {estadisticas.duracionPromedioReal && (
              <div>
                <label className="text-sm font-medium text-text-subtle">Duración real promedio</label>
                <p className="text-text">{estadisticas.duracionPromedioReal.toFixed(0)} minutos</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-text-subtle">Profesionales habilitados</label>
              <p className="text-text">{estadisticas.totalProfesionalesHabilitados}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-text-subtle">Grupos que lo usan</label>
              <p className="text-text">{estadisticas.gruposQueLoUsan}</p>
            </div>

            {servicio.frecuenciaMensual && (
              <div>
                <label className="text-sm font-medium text-text-subtle">Frecuencia mensual estimada</label>
                <p className="text-text">{servicio.frecuenciaMensual} veces/mes</p>
              </div>
            )}
          </div>
        </div>

        {/* Profesionales que lo ofrecen (top 5) */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-brand" />
            Profesionales destacados
          </h2>
          {estadisticas.profesionalesQueLoOfrecen.length > 0 ? (
            <div className="space-y-3">
              {estadisticas.profesionalesQueLoOfrecen.slice(0, 5).map((prof) => (
                <div key={prof.profesionalId} className="flex items-center justify-between p-3 bg-bg rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-subtle rounded-full flex items-center justify-center text-brand font-medium">
                      {prof.profesionalNombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-text">{prof.profesionalNombre}</p>
                      <p className="text-sm text-text-subtle">
                        {prof.citasRealizadas} citas realizadas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-text">{prof.vecesAsignado}</p>
                    <p className="text-xs text-text-subtle">asignaciones</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-subtle text-center py-4">
              No hay profesionales asignados a este servicio
            </p>
          )}
        </div>
      </div>

      {/* Tendencias del mes */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-text mb-4">Comparativa mensual</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-bg rounded-xl">
            <p className="text-sm text-text-subtle mb-1">Mes actual - Citas</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-text">{estadisticas.mesActual.citas}</p>
              {tendenciaCitas !== 0 && (
                <span
                  className={`flex items-center text-sm font-medium ${tendenciaCitas > 0 ? 'text-success' : 'text-danger'}`}
                >
                  {tendenciaCitas > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {Math.abs(tendenciaCitas).toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          <div className="p-4 bg-bg rounded-xl">
            <p className="text-sm text-text-subtle mb-1">Mes anterior - Citas</p>
            <p className="text-2xl font-bold text-text">{estadisticas.mesAnterior.citas}</p>
          </div>

          <div className="p-4 bg-bg rounded-xl">
            <p className="text-sm text-text-subtle mb-1">Mes actual - Canceladas</p>
            <p className="text-2xl font-bold text-text">{estadisticas.mesActual.citasCanceladas}</p>
          </div>

          <div className="p-4 bg-bg rounded-xl">
            <p className="text-sm text-text-subtle mb-1">Tasa de cancelación</p>
            <p className="text-2xl font-bold text-text">
              {estadisticas.tasaCancelacion.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Estado actual */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm text-center">
          <p className="text-sm text-text-subtle mb-1">Asignaciones activas</p>
          <p className="text-2xl font-bold text-text">{estadisticas.asignacionesActivas}</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm text-center">
          <p className="text-sm text-text-subtle mb-1">Citas programadas</p>
          <p className="text-2xl font-bold text-text">{estadisticas.citasProgramadas}</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm text-center">
          <p className="text-sm text-text-subtle mb-1">Citas confirmadas</p>
          <p className="text-2xl font-bold text-text">{estadisticas.citasConfirmadas}</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm text-center">
          <p className="text-sm text-text-subtle mb-1">Citas realizadas</p>
          <p className="text-2xl font-bold text-text">{estadisticas.citasRealizadas}</p>
        </div>
      </div>
    </div>
  );
}
