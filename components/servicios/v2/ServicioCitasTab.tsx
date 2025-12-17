'use client';

import { useMemo } from 'react';
import type { CatalogoServicio } from '@/types';
import type { CatalogoServicioEstadisticas } from '@/lib/server/serviciosStats';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';

interface ServicioCitasTabProps {
  servicio: CatalogoServicio;
  estadisticas: CatalogoServicioEstadisticas | null;
}

export default function ServicioCitasTab({ servicio, estadisticas }: ServicioCitasTabProps) {
  if (!estadisticas) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8 text-center">
        <p className="text-text-subtle">No hay estadísticas disponibles</p>
      </div>
    );
  }

  // Calcular distribución
  const distribucion = useMemo(() => {
    const total = estadisticas.totalCitas;
    return {
      programadas: {
        cantidad: estadisticas.citasProgramadas,
        porcentaje: total > 0 ? (estadisticas.citasProgramadas / total) * 100 : 0,
      },
      confirmadas: {
        cantidad: estadisticas.citasConfirmadas,
        porcentaje: total > 0 ? (estadisticas.citasConfirmadas / total) * 100 : 0,
      },
      realizadas: {
        cantidad: estadisticas.citasRealizadas,
        porcentaje: total > 0 ? (estadisticas.citasRealizadas / total) * 100 : 0,
      },
      canceladas: {
        cantidad: estadisticas.citasCanceladas,
        porcentaje: total > 0 ? (estadisticas.citasCanceladas / total) * 100 : 0,
      },
    };
  }, [estadisticas]);

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-5 w-5 text-brand" />
            <span className="text-sm font-medium text-text-subtle">Total citas</span>
          </div>
          <p className="text-3xl font-bold text-text">{estadisticas.totalCitas}</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <span className="text-sm font-medium text-text-subtle">Realizadas</span>
          </div>
          <p className="text-3xl font-bold text-text">{estadisticas.citasRealizadas}</p>
          <p className="text-sm text-text-subtle mt-1">
            {distribucion.realizadas.porcentaje.toFixed(1)}% del total
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5 text-warn" />
            <span className="text-sm font-medium text-text-subtle">Pendientes</span>
          </div>
          <p className="text-3xl font-bold text-text">
            {estadisticas.citasProgramadas + estadisticas.citasConfirmadas}
          </p>
          <p className="text-sm text-text-subtle mt-1">
            Programadas + Confirmadas
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="h-5 w-5 text-danger" />
            <span className="text-sm font-medium text-text-subtle">Canceladas</span>
          </div>
          <p className="text-3xl font-bold text-text">{estadisticas.citasCanceladas}</p>
          <p className="text-sm text-text-subtle mt-1">
            {estadisticas.tasaCancelacion.toFixed(1)}% del total
          </p>
        </div>
      </div>

      {/* Distribución visual */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-text mb-4">Distribución de citas</h2>

        {/* Barra de progreso combinada */}
        <div className="mb-6">
          <div className="flex h-8 rounded-full overflow-hidden border border-border">
            {distribucion.realizadas.porcentaje > 0 && (
              <div
                className="bg-success flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${distribucion.realizadas.porcentaje}%` }}
              >
                {distribucion.realizadas.porcentaje > 10 && `${distribucion.realizadas.porcentaje.toFixed(0)}%`}
              </div>
            )}
            {distribucion.confirmadas.porcentaje > 0 && (
              <div
                className="bg-brand flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${distribucion.confirmadas.porcentaje}%` }}
              >
                {distribucion.confirmadas.porcentaje > 10 && `${distribucion.confirmadas.porcentaje.toFixed(0)}%`}
              </div>
            )}
            {distribucion.programadas.porcentaje > 0 && (
              <div
                className="bg-warn flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${distribucion.programadas.porcentaje}%` }}
              >
                {distribucion.programadas.porcentaje > 10 && `${distribucion.programadas.porcentaje.toFixed(0)}%`}
              </div>
            )}
            {distribucion.canceladas.porcentaje > 0 && (
              <div
                className="bg-danger flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${distribucion.canceladas.porcentaje}%` }}
              >
                {distribucion.canceladas.porcentaje > 10 && `${distribucion.canceladas.porcentaje.toFixed(0)}%`}
              </div>
            )}
          </div>
        </div>

        {/* Leyenda */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-success rounded-full" />
            <div>
              <p className="text-sm font-medium text-text">Realizadas</p>
              <p className="text-xs text-text-subtle">{estadisticas.citasRealizadas} citas</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-brand rounded-full" />
            <div>
              <p className="text-sm font-medium text-text">Confirmadas</p>
              <p className="text-xs text-text-subtle">{estadisticas.citasConfirmadas} citas</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-warn rounded-full" />
            <div>
              <p className="text-sm font-medium text-text">Programadas</p>
              <p className="text-xs text-text-subtle">{estadisticas.citasProgramadas} citas</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-danger rounded-full" />
            <div>
              <p className="text-sm font-medium text-text">Canceladas</p>
              <p className="text-xs text-text-subtle">{estadisticas.citasCanceladas} citas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Evolución últimas 4 semanas */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand" />
          Evolución últimas 4 semanas
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {estadisticas.citasUltimas4Semanas.map((semana, index) => (
            <div key={semana.semana} className="bg-bg rounded-xl p-4 text-center">
              <p className="text-sm text-text-subtle mb-1">
                Semana {4 - index}
              </p>
              <p className="text-2xl font-bold text-text">{semana.citas}</p>
              <p className="text-xs text-text-subtle mt-1">citas</p>
            </div>
          ))}
        </div>
      </div>

      {/* Distribución por mes (últimos 6 meses) */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-text mb-4">Histórico mensual</h2>
        <div className="space-y-3">
          {estadisticas.citasPorMes.map((mes) => {
            const maxCitas = Math.max(...estadisticas.citasPorMes.map((m) => m.citas));
            const barWidth = maxCitas > 0 ? (mes.citas / maxCitas) * 100 : 0;

            return (
              <div key={mes.mes}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-text">{mes.mes}</span>
                  <span className="text-sm text-text-subtle">{mes.citas} citas</span>
                </div>
                <div className="w-full bg-bg rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-brand h-6 rounded-full transition-all flex items-center justify-between px-3"
                    style={{ width: `${barWidth}%` }}
                  >
                    {barWidth > 20 && (
                      <span className="text-xs text-white font-medium">
                        {mes.citasRealizadas} realizadas
                      </span>
                    )}
                    {barWidth > 40 && mes.citasCanceladas > 0 && (
                      <span className="text-xs text-white/80">
                        {mes.citasCanceladas} canceladas
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerta si tasa de cancelación es alta */}
      {estadisticas.tasaCancelacion > 15 && (
        <div className="bg-warn-bg rounded-2xl border border-warn p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warn flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-warn mb-1">Tasa de cancelación elevada</h3>
              <p className="text-sm text-text">
                El {estadisticas.tasaCancelacion.toFixed(1)}% de las citas han sido canceladas.
                Considera revisar la planificación o comunicación con los pacientes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
