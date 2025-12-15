'use client';

import type { Proyecto } from '@/types/proyectos';
import type { ProyectoEstadisticas } from '@/lib/server/proyectosStats';
import { GraficoLinea, GraficoBarras, GraficoPie } from '@/components/dashboard/Graficos';
import { BarChart3, TrendingUp, Activity, AlertCircle } from 'lucide-react';

interface ProyectoEstadisticasTabProps {
  proyecto: Proyecto;
  estadisticas?: ProyectoEstadisticas | null;
}

export default function ProyectoEstadisticasTab({
  proyecto,
  estadisticas,
}: ProyectoEstadisticasTabProps) {
  if (!estadisticas) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted">No hay estadísticas disponibles</p>
          <p className="text-sm text-text-muted">
            Las estadísticas se generarán una vez que el proyecto tenga datos suficientes
          </p>
        </div>
      </div>
    );
  }

  // Preparar datos para gráficos
  const dataTareas = [
    { nombre: 'Completadas', valor: estadisticas.tareasCompletadas },
    { nombre: 'En curso', valor: estadisticas.tareasEnCurso },
    { nombre: 'Pendientes', valor: estadisticas.tareasPendientes },
    { nombre: 'Bloqueadas', valor: estadisticas.tareasBloqueadas },
  ];

  const dataHitos = [
    { nombre: 'Completados', valor: estadisticas.hitosCompletados },
    { nombre: 'Pendientes', valor: estadisticas.totalHitos - estadisticas.hitosCompletados },
  ];

  const dataRecursos = [
    { nombre: 'Presupuesto usado', valor: estadisticas.presupuestoGastado },
    { nombre: 'Presupuesto disponible', valor: estadisticas.presupuestoRestante },
  ];

  const dataHoras = [
    { nombre: 'Horas trabajadas', valor: estadisticas.horasReales },
    { nombre: 'Horas restantes', valor: estadisticas.horasRestantes },
  ];

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Activity className="h-5 w-5" />}
          label="Progreso general"
          value={`${proyecto.progreso}%`}
          subtitle={`${estadisticas.progresoEsperado}% esperado`}
          tone={proyecto.progreso >= estadisticas.progresoEsperado ? 'success' : 'warn'}
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Velocity actual"
          value={estadisticas.velocityActual}
          subtitle={`${estadisticas.velocityPromedio.toFixed(1)} promedio`}
          tone="brand"
        />
        <MetricCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Eficiencia horas"
          value={`${estadisticas.eficienciaHoras}%`}
          subtitle={estadisticas.eficienciaHoras > 100 ? 'Sobre estimación' : 'Dentro de lo estimado'}
          tone={estadisticas.eficienciaHoras > 120 ? 'danger' : 'success'}
        />
        <MetricCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Eficiencia presupuesto"
          value={`${estadisticas.eficienciaPresupuesto}%`}
          subtitle={estadisticas.eficienciaPresupuesto > 100 ? 'Sobre presupuesto' : 'Dentro del presupuesto'}
          tone={estadisticas.eficienciaPresupuesto > 110 ? 'danger' : 'success'}
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de tareas */}
        <GraficoPie
          data={dataTareas}
          titulo="Distribución de tareas"
          colores={['#10b981', '#0087cd', '#f59e0b', '#ef4444']}
        />

        {/* Tendencia de velocity */}
        <GraficoBarras
          data={estadisticas.tendenciasTareas.map((t) => ({
            nombre: t.semana,
            valor: t.completadas,
          }))}
          titulo="Tareas completadas (últimas 4 semanas)"
          color="#0087cd"
        />

        {/* Hitos */}
        <GraficoPie
          data={dataHitos}
          titulo="Estado de hitos"
          colores={['#10b981', '#e5e7eb']}
        />

        {/* Tendencia de tareas agregadas vs completadas */}
        <GraficoLinea
          data={estadisticas.tendenciasTareas.map((t, i) => ({
            nombre: t.semana,
            valor: t.completadas - t.agregadas,
          }))}
          titulo="Balance de tareas (completadas - agregadas)"
          color="#10b981"
        />
      </div>

      {/* Recursos */}
      {(estadisticas.presupuestoTotal > 0 || estadisticas.horasEstimadas > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {estadisticas.presupuestoTotal > 0 && (
            <GraficoPie
              data={dataRecursos}
              titulo="Presupuesto"
              colores={['#0087cd', '#e5e7eb']}
            />
          )}

          {estadisticas.horasEstimadas > 0 && (
            <GraficoPie
              data={dataHoras}
              titulo="Horas de trabajo"
              colores={['#10b981', '#e5e7eb']}
            />
          )}
        </div>
      )}

      {/* Detalles estadísticos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen de tareas */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand" />
            Resumen de tareas
          </h2>
          <div className="space-y-3">
            <DetailRow label="Total tareas" value={estadisticas.totalTareas} />
            <DetailRow label="Completadas" value={estadisticas.tareasCompletadas} valueClassName="text-success" />
            <DetailRow label="En curso" value={estadisticas.tareasEnCurso} valueClassName="text-brand" />
            <DetailRow label="Pendientes" value={estadisticas.tareasPendientes} valueClassName="text-warn" />
            <DetailRow label="Bloqueadas" value={estadisticas.tareasBloqueadas} valueClassName="text-danger" />
            <DetailRow label="Sin asignar" value={estadisticas.tareasSinAsignar} />
            <div className="pt-2 mt-2 border-t border-border">
              <DetailRow
                label="Tasa de completitud"
                value={`${estadisticas.tasaCompletitud}%`}
                valueClassName="font-bold text-brand"
              />
            </div>
          </div>
        </div>

        {/* Velocity y progreso */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand" />
            Velocity y progreso
          </h2>
          <div className="space-y-3">
            <DetailRow label="Velocity actual" value={estadisticas.velocityActual} valueClassName="text-brand" />
            <DetailRow label="Velocity promedio" value={estadisticas.velocityPromedio.toFixed(1)} />
            <DetailRow label="Última semana" value={`${estadisticas.tareasCompletadasUltimaSemana} tareas`} />
            <div className="pt-2 mt-2 border-t border-border">
              <DetailRow label="Progreso actual" value={`${estadisticas.progresoActual}%`} />
              <DetailRow label="Progreso esperado" value={`${estadisticas.progresoEsperado}%`} />
              <DetailRow
                label="Desviación"
                value={`${estadisticas.desviacionProgreso >= 0 ? '+' : ''}${estadisticas.desviacionProgreso}%`}
                valueClassName={
                  estadisticas.desviacionProgreso >= 0 ? 'text-success font-semibold' : 'text-danger font-semibold'
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtitle,
  tone = 'brand',
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  tone?: 'brand' | 'success' | 'warn' | 'danger';
}) {
  const toneClasses =
    tone === 'success'
      ? 'bg-success-bg text-success'
      : tone === 'warn'
      ? 'bg-warn-bg text-warn'
      : tone === 'danger'
      ? 'bg-danger-bg text-danger'
      : 'bg-brand-subtle text-brand';

  return (
    <div className={`rounded-2xl px-4 py-3 ${toneClasses}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-text">{value}</p>
      {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-text">{label}</span>
      <span className={`text-sm font-semibold ${valueClassName || 'text-text'}`}>{value}</span>
    </div>
  );
}
