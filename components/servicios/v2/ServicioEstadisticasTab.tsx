'use client';

import type { CatalogoServicio } from '@/types';
import type { CatalogoServicioEstadisticas } from '@/lib/server/serviciosStats';
import { TrendingUp, Clock, Users, CheckCircle } from 'lucide-react';
import { GraficoBarras, GraficoPie, GraficoLinea } from '@/components/dashboard/Graficos';

interface ServicioEstadisticasTabProps {
  servicio: CatalogoServicio;
  estadisticas: CatalogoServicioEstadisticas | null;
}

export default function ServicioEstadisticasTab({
  servicio,
  estadisticas,
}: ServicioEstadisticasTabProps) {
  if (!estadisticas) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8 text-center">
        <p className="text-text-subtle">No hay estadísticas disponibles</p>
      </div>
    );
  }

  // Preparar datos para gráficos
  const dataCitasPorEstado = [
    { nombre: 'Realizadas', valor: estadisticas.citasRealizadas },
    { nombre: 'Programadas', valor: estadisticas.citasProgramadas },
    { nombre: 'Confirmadas', valor: estadisticas.citasConfirmadas },
    { nombre: 'Canceladas', valor: estadisticas.citasCanceladas },
  ];

  const dataCitasPorMes = estadisticas.citasPorMes.map((mes) => ({
    nombre: mes.mes,
    valor: mes.citas,
  }));

  const dataProfesionales = estadisticas.profesionalesQueLoOfrecen
    .slice(0, 5)
    .map((prof) => ({
      nombre: prof.profesionalNombre.split(' ')[0], // Solo primer nombre
      valor: prof.citasRealizadas,
    }));

  const dataUltimas4Semanas = estadisticas.citasUltimas4Semanas.map((semana, index) => ({
    nombre: `S${4 - index}`,
    valor: semana.citas,
  }));

  const tasaRealizacion =
    estadisticas.totalCitas > 0
      ? (estadisticas.citasRealizadas / estadisticas.totalCitas) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-brand" />
            <span className="text-sm font-medium text-text-subtle">Tendencia</span>
          </div>
          <p className="text-3xl font-bold text-text">
            {estadisticas.tendenciaCitas > 0 ? '+' : ''}
            {estadisticas.tendenciaCitas.toFixed(1)}%
          </p>
          <p className="text-sm text-text-subtle mt-1">vs mes anterior</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <span className="text-sm font-medium text-text-subtle">Tasa realización</span>
          </div>
          <p className="text-3xl font-bold text-text">{tasaRealizacion.toFixed(1)}%</p>
          <div className="w-full bg-bg rounded-full h-1.5 mt-2">
            <div
              className="bg-success h-1.5 rounded-full transition-all"
              style={{ width: `${tasaRealizacion}%` }}
            />
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5 text-warn" />
            <span className="text-sm font-medium text-text-subtle">Duración promedio</span>
          </div>
          <p className="text-3xl font-bold text-text">
            {estadisticas.duracionPromedioReal?.toFixed(0) ?? estadisticas.tiempoEstimado}
            <span className="text-lg text-text-subtle ml-1">min</span>
          </p>
          {estadisticas.desviacionDuracion !== undefined && (
            <p className="text-sm text-text-subtle mt-1">
              {estadisticas.desviacionDuracion > 0 ? '+' : ''}
              {estadisticas.desviacionDuracion.toFixed(1)}% vs estimado
            </p>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-purple" />
            <span className="text-sm font-medium text-text-subtle">Pacientes únicos</span>
          </div>
          <p className="text-3xl font-bold text-text">{estadisticas.pacientesUnicos}</p>
        </div>
      </div>

      {/* Gráficos - Primera fila */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de citas por estado */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <GraficoPie
            data={dataCitasPorEstado}
            titulo="Distribución por estado"
            colores={['#10b981', '#f59e0b', '#0087cd', '#ef4444']}
          />
        </div>

        {/* Citas por profesional (top 5) */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          {dataProfesionales.length > 0 ? (
            <GraficoPie
              data={dataProfesionales}
              titulo="Citas por profesional (Top 5)"
              colores={['#0087cd', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-text-subtle">No hay datos de profesionales</p>
            </div>
          )}
        </div>
      </div>

      {/* Gráficos - Segunda fila */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolución mensual */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <GraficoBarras
            data={dataCitasPorMes}
            titulo="Evolución mensual (Total citas)"
            color="#0087cd"
          />
        </div>

        {/* Últimas 4 semanas */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <GraficoLinea
            data={dataUltimas4Semanas}
            titulo="Últimas 4 semanas"
            color="#0087cd"
          />
        </div>
      </div>

      {/* Resumen detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen de citas */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-4">Resumen de citas</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-bg rounded-xl">
              <span className="text-text-subtle">Total de citas</span>
              <span className="font-bold text-text">{estadisticas.totalCitas}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-success-bg rounded-xl">
              <span className="text-success">Realizadas</span>
              <span className="font-bold text-success">
                {estadisticas.citasRealizadas} (
                {((estadisticas.citasRealizadas / estadisticas.totalCitas) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-brand-subtle rounded-xl">
              <span className="text-brand">Confirmadas</span>
              <span className="font-bold text-brand">
                {estadisticas.citasConfirmadas} (
                {((estadisticas.citasConfirmadas / estadisticas.totalCitas) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-warn-bg rounded-xl">
              <span className="text-warn">Programadas</span>
              <span className="font-bold text-warn">
                {estadisticas.citasProgramadas} (
                {((estadisticas.citasProgramadas / estadisticas.totalCitas) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-danger-bg rounded-xl">
              <span className="text-danger">Canceladas</span>
              <span className="font-bold text-danger">
                {estadisticas.citasCanceladas} ({estadisticas.tasaCancelacion.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Resumen de asignaciones y duración */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-4">Detalles adicionales</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-bg rounded-xl">
              <span className="text-text-subtle">Total asignaciones</span>
              <span className="font-bold text-text">{estadisticas.totalAsignaciones}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-bg rounded-xl">
              <span className="text-text-subtle">Asignaciones activas</span>
              <span className="font-bold text-text">{estadisticas.asignacionesActivas}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-bg rounded-xl">
              <span className="text-text-subtle">Grupos que lo usan</span>
              <span className="font-bold text-text">{estadisticas.gruposQueLoUsan}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-bg rounded-xl">
              <span className="text-text-subtle">Tiempo estimado</span>
              <span className="font-bold text-text">{estadisticas.tiempoEstimado} min</span>
            </div>
            {estadisticas.duracionPromedioReal && (
              <div className="flex justify-between items-center p-3 bg-bg rounded-xl">
                <span className="text-text-subtle">Duración real promedio</span>
                <span className="font-bold text-text">
                  {estadisticas.duracionPromedioReal.toFixed(0)} min
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparativa mes actual vs anterior */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-text mb-4">Comparativa mensual</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-bg rounded-xl text-center">
            <p className="text-sm text-text-subtle mb-1">Mes actual</p>
            <p className="text-2xl font-bold text-text">{estadisticas.mesActual.citas}</p>
            <p className="text-xs text-text-subtle mt-1">citas totales</p>
          </div>

          <div className="p-4 bg-bg rounded-xl text-center">
            <p className="text-sm text-text-subtle mb-1">Mes anterior</p>
            <p className="text-2xl font-bold text-text">{estadisticas.mesAnterior.citas}</p>
            <p className="text-xs text-text-subtle mt-1">citas totales</p>
          </div>

          <div className="p-4 bg-bg rounded-xl text-center">
            <p className="text-sm text-text-subtle mb-1">Realizadas actual</p>
            <p className="text-2xl font-bold text-success">
              {estadisticas.mesActual.citasRealizadas}
            </p>
          </div>

          <div className="p-4 bg-bg rounded-xl text-center">
            <p className="text-sm text-text-subtle mb-1">Canceladas actual</p>
            <p className="text-2xl font-bold text-danger">
              {estadisticas.mesActual.citasCanceladas}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
